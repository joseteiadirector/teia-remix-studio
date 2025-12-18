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
    const { brandId, type } = await req.json();

    if (!brandId || !type) {
      return new Response(
        JSON.stringify({ error: "brandId and type are required" }),
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

    // Get latest metrics
    const { data: geoScore } = await supabase
      .from("geo_scores")
      .select("score, cpi, breakdown")
      .eq("brand_id", brandId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const { data: mentions } = await supabase
      .from("mentions_llm")
      .select("*")
      .eq("brand_id", brandId)
      .order("collected_at", { ascending: false })
      .limit(10);

    // Generate report data
    const reportData = {
      brand: brand?.name || "Unknown",
      generated_at: new Date().toISOString(),
      type,
      metrics: {
        geo_score: geoScore?.score || 0,
        cpi: geoScore?.cpi || 0,
        breakdown: geoScore?.breakdown || {},
      },
      mentions_summary: {
        total: mentions?.length || 0,
        positive: mentions?.filter(m => m.mentioned).length || 0,
      },
    };

    const title = `Relatório ${type.charAt(0).toUpperCase() + type.slice(1)} - ${brand?.name} - ${new Date().toLocaleDateString("pt-BR")}`;

    // Save report
    const { data: report, error } = await supabase
      .from("generated_reports")
      .insert({
        brand_id: brandId,
        type,
        title,
        data: reportData,
      })
      .select()
      .single();

    if (error) throw error;

    console.log("Report generated:", report.id);

    return new Response(
      JSON.stringify({ success: true, report }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating report:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
