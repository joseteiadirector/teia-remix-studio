import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Analyzing URL:", formattedUrl);

    // Use AI to analyze the URL
    const prompt = `Analise a seguinte URL para SEO e GEO (Generative Engine Optimization): ${formattedUrl}

Você é um especialista em SEO e GEO. Analise a URL fornecida e retorne uma análise detalhada.

IMPORTANTE: Responda APENAS com um JSON válido, sem texto adicional antes ou depois. Use o seguinte formato exato:

{
  "seo_score": <número de 0 a 100>,
  "geo_score": <número de 0 a 100>,
  "checklist": [
    {
      "title": "Título do item",
      "description": "Descrição detalhada",
      "status": "pass" | "fail" | "warning",
      "category": "SEO" | "GEO" | "UX" | "Performance"
    }
  ]
}

Considere os seguintes critérios:

Para SEO (0-100):
- Estrutura de URL (amigável, sem parâmetros desnecessários)
- Uso de HTTPS
- Domínio memorável
- Palavras-chave na URL

Para GEO (0-100):
- Potencial de ser citado por LLMs
- Autoridade do domínio
- Tipo de conteúdo (informativo, comercial)
- Estrutura que facilita extração por IA

Inclua de 6 a 10 itens no checklist, cobrindo ambas as categorias.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Você é um especialista em SEO e GEO (Generative Engine Optimization). Sempre responda apenas com JSON válido, sem markdown ou texto adicional.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI Response:", content);

    // Parse the AI response
    let analysis;
    try {
      // Try to extract JSON from the response (in case it has markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return a fallback analysis
      analysis = {
        seo_score: 65,
        geo_score: 50,
        checklist: [
          {
            title: "Análise em andamento",
            description: "A análise completa requer mais dados. Tente novamente em alguns instantes.",
            status: "warning",
            category: "SEO",
          },
        ],
      };
    }

    // Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: savedAnalysis, error: dbError } = await supabase
      .from("url_analyses")
      .insert({
        url: formattedUrl,
        seo_score: analysis.seo_score,
        geo_score: analysis.geo_score,
        checklist: analysis.checklist,
        metadata: { analyzed_at: new Date().toISOString() },
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
    }

    const result = {
      success: true,
      url: formattedUrl,
      seo_score: analysis.seo_score,
      geo_score: analysis.geo_score,
      checklist: analysis.checklist,
      id: savedAnalysis?.id,
      analyzed_at: new Date().toISOString(),
    };

    console.log("Analysis complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error analyzing URL:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
