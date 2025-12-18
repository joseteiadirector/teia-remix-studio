import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HallucinationAnalysis {
  llm: string;
  hallucinationRisk: number;
  divergenceScore: number;
  factualInconsistencies: string[];
  consensusAlignment: number;
}

// Extract words from text (normalized)
function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\sáéíóúàèìòùâêîôûãõäëïöüç]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 3);
}

// Calculate lexical divergence between a response and others
function calculateDivergence(response: string, otherResponses: string[]): number {
  const words = extractWords(response);
  if (words.length === 0) return 0;

  const otherWordsSet = new Set(
    otherResponses.flatMap(r => extractWords(r))
  );

  const uniqueWords = words.filter(w => !otherWordsSet.has(w));
  return (uniqueWords.length / words.length) * 100;
}

// Calculate consensus alignment for a response
function calculateConsensus(response: string, allResponses: string[]): number {
  const words = extractWords(response);
  if (words.length === 0) return 0;

  const otherResponses = allResponses.filter(r => r !== response);
  const otherWordsSet = new Set(
    otherResponses.flatMap(r => extractWords(r))
  );

  const matchingWords = words.filter(w => otherWordsSet.has(w));
  return (matchingWords.length / words.length) * 100;
}

// Extract numbers from text
function extractNumbers(text: string): number[] {
  const matches = text.match(/\d+(?:[.,]\d+)?/g) || [];
  return matches.map(n => parseFloat(n.replace(",", ".")));
}

// Extract proper nouns (capitalized words)
function extractProperNouns(text: string): string[] {
  const matches = text.match(/[A-Z][a-záéíóúàèìòùâêîôûãõäëïöüç]+(?:\s[A-Z][a-záéíóúàèìòùâêîôûãõäëïöüç]+)*/g) || [];
  return matches.filter(m => m.length > 2);
}

// Check factual consistency
function checkFactualConsistency(response: string, allResponses: string[]): string[] {
  const inconsistencies: string[] = [];
  const otherResponses = allResponses.filter(r => r !== response);

  // Check number divergence (>10% difference)
  const numbers = extractNumbers(response);
  const otherNumbers = new Set(otherResponses.flatMap(r => extractNumbers(r)));

  numbers.forEach(num => {
    let found = false;
    otherNumbers.forEach(otherNum => {
      if (Math.abs(num - otherNum) / Math.max(num, otherNum) < 0.1) {
        found = true;
      }
    });
    if (!found && num > 0) {
      inconsistencies.push(`Number ${num} not confirmed by other LLMs`);
    }
  });

  // Check proper nouns not confirmed
  const properNouns = extractProperNouns(response);
  const otherProperNouns = new Set(
    otherResponses.flatMap(r => extractProperNouns(r).map(n => n.toLowerCase()))
  );

  properNouns.forEach(noun => {
    if (!otherProperNouns.has(noun.toLowerCase())) {
      inconsistencies.push(`Name "${noun}" not confirmed by other LLMs`);
    }
  });

  return inconsistencies.slice(0, 5); // Max 5 inconsistencies
}

// Calculate hallucination risk score
function calculateHallucinationRisk(
  divergence: number,
  consensus: number,
  inconsistencies: number,
  confidence: number | null
): number {
  let risk = 0;

  // 40% weight: Lexical divergence
  risk += divergence * 0.4;

  // High confidence penalty (overconfident = suspicious)
  if (confidence !== null && confidence > 0.8) {
    risk += 20;
  }

  // 30% weight: Lack of consensus
  risk += (100 - consensus) * 0.3;

  // +10 per inconsistency (max 30)
  risk += Math.min(30, inconsistencies * 10);

  return Math.min(100, Math.max(0, risk));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { executionId, brandId } = await req.json();

    if (!executionId && !brandId) {
      return new Response(
        JSON.stringify({ error: "executionId or brandId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let executions: any[] = [];

    if (executionId) {
      // Get specific execution
      const { data, error } = await supabase
        .from("nucleus_executions")
        .select("*, nucleus_queries!inner(brand_id, query)")
        .eq("id", executionId);

      if (error) throw error;
      executions = data || [];
    } else if (brandId) {
      // Get recent executions for brand
      const { data, error } = await supabase
        .from("nucleus_executions")
        .select("*, nucleus_queries!inner(brand_id, query)")
        .eq("nucleus_queries.brand_id", brandId)
        .order("executed_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      executions = data || [];
    }

    if (executions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No executions found for analysis",
          analyses: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group executions by query_id for multi-LLM comparison
    const executionsByQuery = new Map<string, typeof executions>();
    executions.forEach(exec => {
      const queryId = exec.query_id;
      if (!executionsByQuery.has(queryId)) {
        executionsByQuery.set(queryId, []);
      }
      executionsByQuery.get(queryId)!.push(exec);
    });

    console.log(`[detect-hallucinations] Analyzing ${executions.length} executions across ${executionsByQuery.size} queries`);

    const allAnalyses: HallucinationAnalysis[] = [];
    const detections: any[] = [];

    // Analyze each query group
    for (const [queryId, queryExecutions] of executionsByQuery) {
      if (queryExecutions.length < 2) {
        console.log(`[Query ${queryId}] Skipping - need at least 2 LLM responses for comparison`);
        continue;
      }

      const responses = queryExecutions
        .filter(e => e.response)
        .map(e => e.response as string);

      if (responses.length < 2) continue;

      // Analyze each LLM response
      for (const exec of queryExecutions) {
        if (!exec.response) continue;

        const otherResponses = queryExecutions
          .filter(e => e.id !== exec.id && e.response)
          .map(e => e.response as string);

        const divergence = calculateDivergence(exec.response, otherResponses);
        const consensus = calculateConsensus(exec.response, responses);
        const inconsistencies = checkFactualConsistency(exec.response, responses);
        const risk = calculateHallucinationRisk(
          divergence,
          consensus,
          inconsistencies.length,
          null // confidence not available in execution
        );

        const analysis: HallucinationAnalysis = {
          llm: exec.provider,
          hallucinationRisk: Math.round(risk * 100) / 100,
          divergenceScore: Math.round(divergence * 100) / 100,
          factualInconsistencies: inconsistencies,
          consensusAlignment: Math.round(consensus * 100) / 100,
        };

        allAnalyses.push(analysis);

        // Save detection if risk is significant
        if (risk > 30) {
          const detection = {
            brand_id: exec.nucleus_queries?.brand_id || brandId,
            execution_id: exec.id,
            detected: risk > 50,
            confidence: 1 - (risk / 100),
            details: JSON.stringify({
              provider: exec.provider,
              risk,
              divergence,
              consensus,
              inconsistencies,
            }),
          };
          detections.push(detection);
        }
      }
    }

    // Save detections to database
    if (detections.length > 0) {
      const { error: insertError } = await supabase
        .from("hallucination_detections")
        .insert(detections);

      if (insertError) {
        console.error("Error saving hallucination detections:", insertError);
      }
    }

    // Calculate summary statistics
    const criticalCount = allAnalyses.filter(a => a.hallucinationRisk > 70).length;
    const highCount = allAnalyses.filter(a => a.hallucinationRisk > 50 && a.hallucinationRisk <= 70).length;
    const avgRisk = allAnalyses.length > 0
      ? allAnalyses.reduce((sum, a) => sum + a.hallucinationRisk, 0) / allAnalyses.length
      : 0;

    console.log(`[detect-hallucinations] Complete:`);
    console.log(`  Total analyses: ${allAnalyses.length}`);
    console.log(`  Critical (>70): ${criticalCount}`);
    console.log(`  High (51-70): ${highCount}`);
    console.log(`  Avg risk: ${avgRisk.toFixed(2)}%`);

    return new Response(
      JSON.stringify({
        success: true,
        analyses: allAnalyses,
        summary: {
          totalAnalyses: allAnalyses.length,
          criticalCount,
          highCount,
          moderateCount: allAnalyses.filter(a => a.hallucinationRisk > 30 && a.hallucinationRisk <= 50).length,
          lowCount: allAnalyses.filter(a => a.hallucinationRisk <= 30).length,
          avgRiskScore: Math.round(avgRisk * 100) / 100,
        },
        riskLevels: {
          low: "0-30: Reliable response",
          moderate: "31-50: Verify sources",
          high: "51-70: Manual review needed",
          critical: "71-100: Possible hallucination",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[detect-hallucinations] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
