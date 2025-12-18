import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyticsInsight {
  type: 'trend' | 'alert' | 'recommendation' | 'opportunity';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  metric?: string;
  value?: number;
  change?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brandId, analysisType = 'comprehensive' } = await req.json();

    if (!brandId) {
      return new Response(
        JSON.stringify({ error: "brandId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`[ai-analytics] Starting ${analysisType} analysis for brand: ${brandId}`);

    // Fetch brand data
    const { data: brand } = await supabase
      .from("brands")
      .select("name, domain, keywords, competitors")
      .eq("id", brandId)
      .single();

    // Fetch latest GEO scores
    const { data: geoScores } = await supabase
      .from("geo_scores")
      .select("score, cpi, breakdown, calculated_at")
      .eq("brand_id", brandId)
      .order("calculated_at", { ascending: false })
      .limit(5);

    // Fetch recent mentions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: mentions } = await supabase
      .from("mentions_llm")
      .select("provider, mentioned, confidence, collected_at")
      .eq("brand_id", brandId)
      .gte("collected_at", thirtyDaysAgo.toISOString());

    // Fetch IGO metrics
    const { data: igoMetrics } = await supabase
      .from("igo_metrics_history")
      .select("ice, gap, cpi, stability, recorded_at")
      .eq("brand_id", brandId)
      .order("recorded_at", { ascending: false })
      .limit(10);

    // Generate insights
    const insights: AnalyticsInsight[] = [];

    // Analyze GEO Score trend
    if (geoScores && geoScores.length >= 2) {
      const latest = geoScores[0];
      const previous = geoScores[1];
      const change = latest.score - previous.score;

      if (Math.abs(change) >= 5) {
        insights.push({
          type: change > 0 ? 'trend' : 'alert',
          title: change > 0 ? 'GEO Score em ascensão' : 'Queda no GEO Score',
          description: `Variação de ${change > 0 ? '+' : ''}${change.toFixed(1)} pontos desde a última medição`,
          priority: Math.abs(change) >= 10 ? 'high' : 'medium',
          metric: 'geo_score',
          value: latest.score,
          change,
        });
      }
    }

    // Analyze mention distribution
    if (mentions && mentions.length > 0) {
      const mentionedCount = mentions.filter(m => m.mentioned).length;
      const mentionRate = (mentionedCount / mentions.length) * 100;

      if (mentionRate < 30) {
        insights.push({
          type: 'alert',
          title: 'Baixa taxa de menções',
          description: `Apenas ${mentionRate.toFixed(1)}% das queries resultam em menções. Considere otimizar keywords.`,
          priority: 'high',
          metric: 'mention_rate',
          value: mentionRate,
        });
      } else if (mentionRate >= 70) {
        insights.push({
          type: 'opportunity',
          title: 'Excelente visibilidade',
          description: `Taxa de menção de ${mentionRate.toFixed(1)}%. Mantenha a estratégia atual.`,
          priority: 'low',
          metric: 'mention_rate',
          value: mentionRate,
        });
      }

      // Provider distribution
      const providers = [...new Set(mentions.map(m => m.provider))];
      const providerStats = providers.map(p => ({
        provider: p,
        total: mentions.filter(m => m.provider === p).length,
        mentioned: mentions.filter(m => m.provider === p && m.mentioned).length,
      }));

      const weakProviders = providerStats.filter(p => 
        p.total > 0 && (p.mentioned / p.total) < 0.3
      );

      if (weakProviders.length > 0) {
        insights.push({
          type: 'recommendation',
          title: `Otimizar presença em ${weakProviders.map(p => p.provider).join(', ')}`,
          description: 'Alguns LLMs têm baixa taxa de menção. Revise o conteúdo para melhorar a descoberta.',
          priority: 'medium',
        });
      }
    }

    // Analyze IGO metrics
    if (igoMetrics && igoMetrics.length > 0) {
      const latest = igoMetrics[0];

      if (latest.stability && latest.stability < 50) {
        insights.push({
          type: 'alert',
          title: 'Estabilidade cognitiva baixa',
          description: 'As respostas dos LLMs variam muito. Isso pode indicar conteúdo inconsistente.',
          priority: 'medium',
          metric: 'stability',
          value: latest.stability,
        });
      }

      if (latest.ice && latest.ice >= 80) {
        insights.push({
          type: 'opportunity',
          title: 'Alta eficiência cognitiva',
          description: `ICE de ${latest.ice.toFixed(1)}% indica excelente processamento da marca pelos LLMs.`,
          priority: 'low',
          metric: 'ice',
          value: latest.ice,
        });
      }
    }

    // Use AI to generate personalized recommendation
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let aiRecommendation = null;

    if (LOVABLE_API_KEY && brand) {
      try {
        const context = `
Marca: ${brand.name}
Domínio: ${brand.domain || 'Não informado'}
Keywords: ${brand.keywords?.join(', ') || 'Nenhuma'}
Concorrentes: ${brand.competitors?.join(', ') || 'Nenhum'}
GEO Score atual: ${geoScores?.[0]?.score || 'N/A'}
Taxa de menção: ${mentions ? ((mentions.filter(m => m.mentioned).length / mentions.length) * 100).toFixed(1) : 'N/A'}%
`;

        const prompt = `Baseado nos dados da marca abaixo, forneça 1-2 recomendações práticas e específicas para melhorar a visibilidade em LLMs (GEO - Generative Engine Optimization). Seja direto e acionável.

${context}

Formato da resposta: JSON com array de objetos contendo "title" e "description".`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "Você é um especialista em GEO (Generative Engine Optimization). Responda apenas com JSON válido." },
              { role: "user", content: prompt }
            ],
          }),
        });

        if (aiResponse.ok) {
          const data = await aiResponse.json();
          const content = data.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          
          if (jsonMatch) {
            const recommendations = JSON.parse(jsonMatch[0]);
            recommendations.forEach((rec: { title: string; description: string }) => {
              insights.push({
                type: 'recommendation',
                title: rec.title,
                description: rec.description,
                priority: 'medium',
              });
            });
          }
        }
      } catch (e) {
        console.log("[ai-analytics] AI recommendation failed:", e);
      }
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    console.log(`[ai-analytics] Generated ${insights.length} insights`);

    return new Response(
      JSON.stringify({
        success: true,
        brandName: brand?.name,
        analysisType,
        insights,
        summary: {
          totalInsights: insights.length,
          highPriority: insights.filter(i => i.priority === 'high').length,
          mediumPriority: insights.filter(i => i.priority === 'medium').length,
          lowPriority: insights.filter(i => i.priority === 'low').length,
          alerts: insights.filter(i => i.type === 'alert').length,
          recommendations: insights.filter(i => i.type === 'recommendation').length,
          opportunities: insights.filter(i => i.type === 'opportunity').length,
        },
        generatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ai-analytics] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
