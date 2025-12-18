import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Statistical helper: Standard Deviation
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brandId } = await req.json();

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

    // Get recent mentions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: mentions, error: mentionsError } = await supabase
      .from("mentions_llm")
      .select("*")
      .eq("brand_id", brandId)
      .gte("collected_at", thirtyDaysAgo.toISOString())
      .order("collected_at", { ascending: false });

    if (mentionsError) {
      throw mentionsError;
    }

    if (!mentions || mentions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No mentions found for calculation",
          score: 0,
          cpi: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[calculate-geo-metrics] Processing ${mentions.length} mentions`);

    // =====================================================
    // GEO SCORE - 5 PILLARS (Scientific Formula)
    // Based on: Montgomery et al. (2012), Teia Research (2024)
    // =====================================================

    const totalMentions = mentions.length;
    const positiveMentions = mentions.filter(m => m.mentioned).length;
    const mentionRate = positiveMentions / totalMentions;

    // Get unique queries and providers
    const uniqueQueries = [...new Set(mentions.map(m => m.query))];
    const providers = [...new Set(mentions.map(m => m.provider))];
    const mentionedProviders = [...new Set(mentions.filter(m => m.mentioned).map(m => m.provider))];

    // Calculate average confidence
    const confidenceValues = mentions
      .filter(m => m.confidence !== null && m.confidence !== undefined)
      .map(m => m.confidence as number);
    const avgConfidence = confidenceValues.length > 0
      ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
      : 0;

    // =====================================================
    // PILLAR 1: BASE TÉCNICA (20%)
    // Measures fundamental mention frequency
    // =====================================================
    const volumeBonus = Math.min(20, totalMentions / 5);
    const baseTecnica = Math.min(100, (mentionRate * 80) + volumeBonus);

    // =====================================================
    // PILLAR 2: ESTRUTURA SEMÂNTICA (15%)
    // Measures topic diversity and coverage
    // =====================================================
    const uniqueTopics = uniqueQueries.length;
    const estruturaSemantica = Math.min(100, (uniqueTopics / 20) * 100);

    // =====================================================
    // PILLAR 3: RELEVÂNCIA CONVERSACIONAL (25%)
    // Measures prominence in top positions
    // =====================================================
    const mentionsWithPosition = mentions.filter(m => m.mentioned && m.position !== null);
    const top3Mentions = mentionsWithPosition.filter(m => (m.position || 0) < 200).length;
    const relevanciaConversacional = totalMentions > 0
      ? Math.min(100, (top3Mentions / Math.max(positiveMentions, 1)) * 100)
      : 0;

    // =====================================================
    // PILLAR 4: AUTORIDADE COGNITIVA (25%)
    // Based on confidence scores from AI analysis
    // =====================================================
    const autoridadeCognitiva = avgConfidence * 100;

    // =====================================================
    // PILLAR 5: INTELIGÊNCIA ESTRATÉGICA (15%)
    // Measures consistency and evolution over time
    // Montgomery et al. (2012) formula for consistency
    // =====================================================
    
    // Calculate per-provider mention rates
    const providerRates = providers.map(provider => {
      const providerMentions = mentions.filter(m => m.provider === provider);
      const providerPositive = providerMentions.filter(m => m.mentioned).length;
      return providerPositive / Math.max(providerMentions.length, 1);
    });
    
    const stdDevProviders = calculateStdDev(providerRates);
    const consistency = Math.max(0, 100 - (stdDevProviders * 150)); // Montgomery scaling

    // Calculate evolution (trend over time)
    const sortedMentions = [...mentions].sort(
      (a, b) => new Date(a.collected_at).getTime() - new Date(b.collected_at).getTime()
    );
    const halfPoint = Math.floor(sortedMentions.length / 2);
    const firstHalf = sortedMentions.slice(0, halfPoint);
    const secondHalf = sortedMentions.slice(halfPoint);
    
    const firstHalfRate = firstHalf.filter(m => m.mentioned).length / Math.max(firstHalf.length, 1);
    const secondHalfRate = secondHalf.filter(m => m.mentioned).length / Math.max(secondHalf.length, 1);
    const evolution = Math.min(100, Math.max(0, 50 + (secondHalfRate - firstHalfRate) * 100));

    const inteligenciaEstrategica = (consistency * 0.6) + (evolution * 0.4);

    // =====================================================
    // GEO SCORE FINAL (Weighted Average)
    // =====================================================
    const geoScore = (
      baseTecnica * 0.20 +
      estruturaSemantica * 0.15 +
      relevanciaConversacional * 0.25 +
      autoridadeCognitiva * 0.25 +
      inteligenciaEstrategica * 0.15
    );

    // =====================================================
    // CPI SCORE (Cognitive Predictive Index)
    // Measures consistency BETWEEN different LLMs
    // =====================================================
    const providerConfidences = providers.map(provider => {
      const providerMentions = mentions.filter(m => m.provider === provider && m.confidence);
      if (providerMentions.length === 0) return 0;
      return providerMentions.reduce((sum, m) => sum + (m.confidence || 0), 0) / providerMentions.length;
    });
    
    const interProviderStdDev = calculateStdDev(providerConfidences);
    const cpiScore = Math.max(0, Math.min(100, 100 - (interProviderStdDev * 200)));

    // Build detailed breakdown
    const breakdown = {
      // Raw pillars
      baseTecnica: Math.round(baseTecnica * 100) / 100,
      estruturaSemantica: Math.round(estruturaSemantica * 100) / 100,
      relevanciaConversacional: Math.round(relevanciaConversacional * 100) / 100,
      autoridadeCognitiva: Math.round(autoridadeCognitiva * 100) / 100,
      inteligenciaEstrategica: Math.round(inteligenciaEstrategica * 100) / 100,
      
      // Legacy pillars (for backwards compatibility)
      visibility: Math.round(baseTecnica * 100) / 100,
      authority: Math.round(autoridadeCognitiva * 100) / 100,
      sentiment: Math.round(relevanciaConversacional * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      
      // Stats
      totalMentions,
      positiveMentions,
      mentionRate: Math.round(mentionRate * 10000) / 100,
      uniqueQueries: uniqueTopics,
      providers: providers.length,
      mentionedProviders: mentionedProviders.length,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      evolution: Math.round(evolution * 100) / 100,
    };

    // Save GEO score
    const { error: scoreError } = await supabase
      .from("geo_scores")
      .insert({
        brand_id: brandId,
        score: Math.round(geoScore * 100) / 100,
        cpi: Math.round(cpiScore * 100) / 100,
        breakdown,
      });

    if (scoreError) {
      console.error("Error saving geo score:", scoreError);
    }

    // Save monthly pillars
    const currentMonth = new Date().toISOString().substring(0, 7) + "-01";
    const { error: pillarsError } = await supabase
      .from("geo_pillars_monthly")
      .upsert({
        brand_id: brandId,
        month: currentMonth,
        visibility: Math.round(baseTecnica * 100) / 100,
        authority: Math.round(autoridadeCognitiva * 100) / 100,
        sentiment: Math.round(relevanciaConversacional * 100) / 100,
        consistency: Math.round(consistency * 100) / 100,
      }, {
        onConflict: "brand_id,month"
      });

    if (pillarsError) {
      console.error("Error saving pillars:", pillarsError);
    }

    console.log("[calculate-geo-metrics] Calculation complete:");
    console.log(`  GEO Score: ${geoScore.toFixed(2)}`);
    console.log(`  CPI Score: ${cpiScore.toFixed(2)}`);
    console.log(`  Pillars: BT=${baseTecnica.toFixed(1)} ES=${estruturaSemantica.toFixed(1)} RC=${relevanciaConversacional.toFixed(1)} AC=${autoridadeCognitiva.toFixed(1)} IE=${inteligenciaEstrategica.toFixed(1)}`);

    return new Response(
      JSON.stringify({
        success: true,
        score: Math.round(geoScore * 100) / 100,
        cpi: Math.round(cpiScore * 100) / 100,
        breakdown,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in calculate-geo-metrics:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
