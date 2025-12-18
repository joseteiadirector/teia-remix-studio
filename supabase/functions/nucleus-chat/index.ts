import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROVIDERS = ["chatgpt", "gemini", "claude", "perplexity"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brandId, query } = await req.json();

    if (!brandId || !query) {
      return new Response(
        JSON.stringify({ error: "brandId and query are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Get brand info
    const { data: brand } = await supabase
      .from("brands")
      .select("name")
      .eq("id", brandId)
      .single();

    // Create nucleus query record
    const { data: queryRecord } = await supabase
      .from("nucleus_queries")
      .insert({ brand_id: brandId, query, query_type: "multi_llm" })
      .select()
      .single();

    const executions = [];

    for (const provider of PROVIDERS) {
      const startTime = Date.now();
      
      const systemPrompt = `You are ${provider}. Respond naturally and helpfully. Brand context: ${brand?.name || "Unknown"}`;

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: query }
            ],
          }),
        });

        const latencyMs = Date.now() - startTime;

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error from ${provider}:`, errorText);
          
          executions.push({
            provider,
            response: `Erro: ${response.status}`,
            latency_ms: latencyMs,
            success: false,
          });
          continue;
        }

        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content || "Sem resposta";

        // Save execution
        if (queryRecord) {
          await supabase.from("nucleus_executions").insert({
            query_id: queryRecord.id,
            provider,
            response: answer,
            latency_ms: latencyMs,
            success: true,
          });
        }

        executions.push({
          provider,
          response: answer,
          latency_ms: latencyMs,
          success: true,
        });

      } catch (error) {
        console.error(`Error with ${provider}:`, error);
        executions.push({
          provider,
          response: "Erro de conexão",
          latency_ms: Date.now() - startTime,
          success: false,
        });
      }
    }

    console.log("Nucleus execution complete:", executions.length, "providers");

    return new Response(
      JSON.stringify({ success: true, executions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in nucleus-chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
