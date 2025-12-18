import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProviderConfig {
  name: string;
  apiKey: string | undefined;
  endpoint: string;
  model: string;
  formatRequest: (systemPrompt: string, query: string) => object;
  parseResponse: (data: any) => string;
}

function getProviders(): ProviderConfig[] {
  return [
    {
      name: "chatgpt",
      apiKey: Deno.env.get("OPENAI_API_KEY"),
      endpoint: "https://api.openai.com/v1/chat/completions",
      model: "gpt-4o-mini",
      formatRequest: (systemPrompt: string, query: string) => ({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        max_tokens: 1000,
      }),
      parseResponse: (data: any) => data.choices?.[0]?.message?.content || "Sem resposta",
    },
    {
      name: "claude",
      apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
      endpoint: "https://api.anthropic.com/v1/messages",
      model: "claude-sonnet-4-20250514",
      formatRequest: (systemPrompt: string, query: string) => ({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          { role: "user", content: query }
        ],
      }),
      parseResponse: (data: any) => data.content?.[0]?.text || "Sem resposta",
    },
    {
      name: "gemini",
      apiKey: Deno.env.get("GOOGLE_AI_API_KEY"),
      endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      model: "gemini-2.0-flash",
      formatRequest: (systemPrompt: string, query: string) => ({
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\nUser: ${query}` }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 1000,
        }
      }),
      parseResponse: (data: any) => data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta",
    },
    {
      name: "perplexity",
      apiKey: Deno.env.get("PERPLEXITY_API_KEY"),
      endpoint: "https://api.perplexity.ai/chat/completions",
      model: "sonar",
      formatRequest: (systemPrompt: string, query: string) => ({
        model: "sonar",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        max_tokens: 1000,
      }),
      parseResponse: (data: any) => data.choices?.[0]?.message?.content || "Sem resposta",
    },
  ];
}

async function callProvider(provider: ProviderConfig, systemPrompt: string, query: string): Promise<{ response: string; latencyMs: number; success: boolean }> {
  const startTime = Date.now();

  if (!provider.apiKey) {
    return {
      response: `API key não configurada para ${provider.name}`,
      latencyMs: Date.now() - startTime,
      success: false,
    };
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Set auth header based on provider
    if (provider.name === "claude") {
      headers["x-api-key"] = provider.apiKey;
      headers["anthropic-version"] = "2023-06-01";
    } else if (provider.name === "gemini") {
      // Gemini uses API key in URL
    } else {
      headers["Authorization"] = `Bearer ${provider.apiKey}`;
    }

    let endpoint = provider.endpoint;
    if (provider.name === "gemini") {
      endpoint = `${provider.endpoint}?key=${provider.apiKey}`;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(provider.formatRequest(systemPrompt, query)),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from ${provider.name}:`, response.status, errorText);
      return {
        response: `Erro ${response.status}: ${errorText.substring(0, 100)}`,
        latencyMs,
        success: false,
      };
    }

    const data = await response.json();
    const answer = provider.parseResponse(data);

    return {
      response: answer,
      latencyMs,
      success: true,
    };
  } catch (error) {
    console.error(`Error with ${provider.name}:`, error);
    return {
      response: `Erro de conexão: ${error instanceof Error ? error.message : "Unknown error"}`,
      latencyMs: Date.now() - startTime,
      success: false,
    };
  }
}

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

    const systemPrompt = `Você é um assistente especializado em análise de marcas e SEO. 
Contexto da marca: ${brand?.name || "Marca não identificada"}
Responda de forma clara, objetiva e útil.`;

    const providers = getProviders();
    const executions = [];

    // Call all providers in parallel
    const results = await Promise.all(
      providers.map(provider => callProvider(provider, systemPrompt, query))
    );

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const result = results[i];

      // Save execution
      if (queryRecord) {
        await supabase.from("nucleus_executions").insert({
          query_id: queryRecord.id,
          provider: provider.name,
          response: result.response,
          latency_ms: result.latencyMs,
          success: result.success,
        });
      }

      executions.push({
        provider: provider.name,
        response: result.response,
        latency_ms: result.latencyMs,
        success: result.success,
      });
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
