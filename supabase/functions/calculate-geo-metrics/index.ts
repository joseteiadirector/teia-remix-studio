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
      .gte("collected_at", thirtyDaysAgo.toISOString());

    if (mentionsError) {
      throw mentionsError;
    }

    if (!mentions || mentions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No mentions found for calculation",
          score: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate GEO metrics
    const totalMentions = mentions.length;
    const positiveMentions = mentions.filter(m => m.mentioned).length;
    const avgConfidence = mentions
      .filter(m => m.confidence)
      .reduce((sum, m) => sum + (m.confidence || 0), 0) / (mentions.filter(m => m.confidence).length || 1);

    // Calculate pillars
    // Visibility: % of queries where brand was mentioned
    const visibility = (positiveMentions / totalMentions) * 100;

    // Authority: based on position (earlier = better) and confidence
    const mentionedWithPosition = mentions.filter(m => m.mentioned && m.position !== null);
    const avgPosition = mentionedWithPosition.length > 0
      ? mentionedWithPosition.reduce((sum, m) => sum + (m.position || 0), 0) / mentionedWithPosition.length
      : 500;
    const authority = Math.max(0, Math.min(100, 100 - (avgPosition / 10)));

    // Sentiment: simplified - based on confidence scores
    const sentiment = avgConfidence * 100;

    // Consistency: based on spread across providers
    const providers = [...new Set(mentions.map(m => m.provider))];
    const mentionedProviders = [...new Set(mentions.filter(m => m.mentioned).map(m => m.provider))];
    const consistency = (mentionedProviders.length / Math.max(providers.length, 1)) * 100;

    // Calculate overall GEO score (weighted average)
    const geoScore = (
      visibility * 0.35 +
      authority * 0.25 +
      sentiment * 0.20 +
      consistency * 0.20
    );

    // Calculate CPI (Cognitive Performance Index)
    const cpi = (geoScore + avgConfidence * 50 + (mentionedProviders.length / 4) * 25) / 1.75;

    const breakdown = {
      visibility: Math.round(visibility * 100) / 100,
      authority: Math.round(authority * 100) / 100,
      sentiment: Math.round(sentiment * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      totalMentions,
      positiveMentions,
      providers: providers.length,
      mentionedProviders: mentionedProviders.length,
    };

    // Save GEO score
    const { error: scoreError } = await supabase
      .from("geo_scores")
      .insert({
        brand_id: brandId,
        score: Math.round(geoScore * 100) / 100,
        cpi: Math.round(cpi * 100) / 100,
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
        visibility: Math.round(visibility * 100) / 100,
        authority: Math.round(authority * 100) / 100,
        sentiment: Math.round(sentiment * 100) / 100,
        consistency: Math.round(consistency * 100) / 100,
      }, {
        onConflict: "brand_id,month"
      });

    if (pillarsError) {
      console.error("Error saving pillars:", pillarsError);
    }

    console.log("GEO metrics calculated:", { geoScore, cpi, breakdown });

    return new Response(
      JSON.stringify({
        success: true,
        score: Math.round(geoScore * 100) / 100,
        cpi: Math.round(cpi * 100) / 100,
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
