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

    // Get brand info
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("name, keywords")
      .eq("id", brandId)
      .single();

    if (brandError || !brand) {
      return new Response(
        JSON.stringify({ error: "Brand not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const results = [];

    // Simulate querying each LLM provider
    for (const provider of PROVIDERS) {
      console.log(`Querying ${provider} for: ${query}`);

      const systemPrompt = `You are simulating responses from ${provider}. 
      The user will ask a question. Respond naturally as if you were ${provider}.
      If the brand "${brand.name}" is relevant to the question, mention it naturally in your response.
      Keywords associated with this brand: ${brand.keywords?.join(", ") || "none"}.
      Keep responses concise (2-3 sentences).`;

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

      if (!response.ok) {
        console.error(`Error from ${provider}:`, await response.text());
        continue;
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content || "";
      
      // Check if brand is mentioned
      const brandNameLower = brand.name.toLowerCase();
      const answerLower = answer.toLowerCase();
      const mentioned = answerLower.includes(brandNameLower);
      
      // Calculate confidence based on mention context
      let confidence = 0;
      if (mentioned) {
        // Higher confidence if brand appears early in response
        const position = answerLower.indexOf(brandNameLower);
        confidence = Math.max(0.5, 1 - (position / answerLower.length));
      }

      const mentionData = {
        brand_id: brandId,
        provider,
        query,
        mentioned,
        confidence: mentioned ? confidence : null,
        answer_excerpt: answer.substring(0, 500),
        full_response: answer,
        position: mentioned ? answerLower.indexOf(brandNameLower) : null,
        collected_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from("mentions_llm")
        .insert(mentionData);

      if (insertError) {
        console.error(`Error inserting mention for ${provider}:`, insertError);
      } else {
        results.push({ provider, mentioned, confidence });
      }
    }

    console.log("Collection complete:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in collect-llm-mentions:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
