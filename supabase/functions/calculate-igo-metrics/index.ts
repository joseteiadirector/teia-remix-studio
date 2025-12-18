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

// Retry helper with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`Attempt ${attempt + 1} failed: ${lastError.message}`);
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("All retry attempts failed");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

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

    // Get brand info for ownership verification
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, user_id")
      .eq("id", brandId)
      .single();

    if (brandError || !brand) {
      return new Response(
        JSON.stringify({ error: "Brand not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get recent mentions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: mentions, error: mentionsError } = await supabase
      .from("mentions_llm")
      .select("*")
      .eq("brand_id", brandId)
      .gte("collected_at", thirtyDaysAgo.toISOString())
      .order("collected_at", { ascending: true });

    if (mentionsError) {
      throw mentionsError;
    }

    if (!mentions || mentions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No mentions found for IGO calculation",
          ice: 0,
          gap: 0,
          cpi: 0,
          stability: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[calculate-igo-metrics] Processing ${mentions.length} mentions for brand: ${brand.name}`);

    // =====================================================
    // IGO METRICS - Based on Scientific Article (Chapter 3)
    // =====================================================

    const totalMentions = mentions.length;
    const correctMentions = mentions.filter(m => m.mentioned).length;
    const providers = [...new Set(mentions.map(m => m.provider))];

    // Get confidence values for statistical analysis
    const confidenceValues = mentions
      .filter(m => m.confidence !== null && m.confidence !== undefined)
      .map(m => m.confidence as number);

    // =====================================================
    // 1. ICE (Índice de Eficiência Cognitiva)
    // Formula: ICE = (Mₐ / Mₜ) × 100
    // Based on: Ross (2014); Russell & Norvig (2020)
    // =====================================================
    const ice = totalMentions > 0 
      ? (correctMentions / totalMentions) * 100 
      : 0;

    // =====================================================
    // 2. GAP (Precisão de Alinhamento de Observabilidade)
    // Formula: GAP = (Pₐ / Pₜ) × 100 × C
    // Based on: Landis & Koch (1977); Mikolov et al. (2013)
    // =====================================================
    
    // Calculate aligned providers (providers with > 50% positive mentions)
    const providerMentionRates = providers.map(provider => {
      const providerMentions = mentions.filter(m => m.provider === provider);
      const positive = providerMentions.filter(m => m.mentioned).length;
      return {
        provider,
        rate: positive / providerMentions.length,
        total: providerMentions.length,
      };
    });
    
    const alignedProviders = providerMentionRates.filter(p => p.rate > 0.5).length;
    
    // Consensus factor: based on how similar the mention rates are
    const rates = providerMentionRates.map(p => p.rate);
    const rateStdDev = calculateStdDev(rates);
    const consensusFactor = Math.max(0.5, 1 - rateStdDev); // 0.5 to 1.0
    
    const gap = providers.length > 0
      ? (alignedProviders / providers.length) * 100 * consensusFactor
      : 0;

    // =====================================================
    // 3. CPI (Índice de Previsibilidade Cognitiva)
    // Formula: CPI = max(0, 100 - (σ_temporal × 2))
    // Based on: Montgomery (2012)
    // =====================================================
    
    // Group mentions by week for temporal analysis
    const weeklyRates: number[] = [];
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const startDate = new Date(mentions[0].collected_at).getTime();
    const endDate = new Date(mentions[mentions.length - 1].collected_at).getTime();
    
    for (let weekStart = startDate; weekStart < endDate; weekStart += weekMs) {
      const weekEnd = weekStart + weekMs;
      const weekMentions = mentions.filter(m => {
        const time = new Date(m.collected_at).getTime();
        return time >= weekStart && time < weekEnd;
      });
      
      if (weekMentions.length > 0) {
        const weekPositive = weekMentions.filter(m => m.mentioned).length;
        weeklyRates.push(weekPositive / weekMentions.length);
      }
    }
    
    const temporalStdDev = calculateStdDev(weeklyRates) * 100; // Normalize to 0-100 scale
    const cpi = Math.max(0, Math.min(100, 100 - (temporalStdDev * 2)));

    // =====================================================
    // 4. ESTABILIDADE COGNITIVA
    // Formula: Estabilidade = max(0, 100 - (σ × 1.5))
    // Equivalent to article: max(0, 100 - (σ_normalizado × 150))
    // =====================================================
    
    const confidenceStdDev = calculateStdDev(confidenceValues) * 100; // Normalize
    const stability = Math.max(0, Math.min(100, 100 - (confidenceStdDev * 1.5)));

    // Build metadata for analysis
    const metadata = {
      totalMentions,
      correctMentions,
      providers: providers.length,
      alignedProviders,
      consensusFactor: Math.round(consensusFactor * 100) / 100,
      temporalStdDev: Math.round(temporalStdDev * 100) / 100,
      confidenceStdDev: Math.round(confidenceStdDev * 100) / 100,
      weeklyDataPoints: weeklyRates.length,
      providerBreakdown: providerMentionRates.map(p => ({
        provider: p.provider,
        mentionRate: Math.round(p.rate * 100),
        mentions: p.total,
      })),
    };

    // =====================================================
    // Save to igo_metrics_history
    // =====================================================
    const { error: historyError } = await supabase
      .from("igo_metrics_history")
      .insert({
        brand_id: brandId,
        ice: Math.round(ice * 100) / 100,
        gap: Math.round(gap * 100) / 100,
        cpi: Math.round(cpi * 100) / 100,
        stability: Math.round(stability * 100) / 100,
        recorded_at: new Date().toISOString(),
      });

    if (historyError) {
      console.error("Error saving IGO metrics:", historyError);
    }

    const duration = Date.now() - startTime;

    console.log(`[calculate-igo-metrics] Calculation complete in ${duration}ms:`);
    console.log(`  ICE: ${ice.toFixed(2)}% (Cognitive Efficiency)`);
    console.log(`  GAP: ${gap.toFixed(2)}% (Observability Alignment)`);
    console.log(`  CPI: ${cpi.toFixed(2)}% (Cognitive Predictability)`);
    console.log(`  Stability: ${stability.toFixed(2)}%`);

    return new Response(
      JSON.stringify({
        success: true,
        ice: Math.round(ice * 100) / 100,
        gap: Math.round(gap * 100) / 100,
        cpi: Math.round(cpi * 100) / 100,
        stability: Math.round(stability * 100) / 100,
        metadata,
        durationMs: duration,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[calculate-igo-metrics] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
