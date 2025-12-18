import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROVIDERS = ["chatgpt", "gemini", "claude", "perplexity"];
const RATE_LIMIT_DELAY = 1000; // 1 second between queries

interface MentionResult {
  provider: string;
  mentioned: boolean;
  confidence: number | null;
  sentiment: string;
  context: string;
}

// UUID validation
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
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

// AI-powered mention analysis
async function analyzeMention(
  response: string,
  brandName: string,
  query: string,
  apiKey: string
): Promise<{ mentioned: boolean; confidence: number; sentiment: string; context: string; position: number | null; excerpt: string }> {
  const responseLower = response.toLowerCase();
  const brandLower = brandName.toLowerCase();
  const mentioned = responseLower.includes(brandLower);
  
  if (!mentioned) {
    return {
      mentioned: false,
      confidence: 0,
      sentiment: "neutral",
      context: "irrelevant",
      position: null,
      excerpt: "",
    };
  }

  const position = responseLower.indexOf(brandLower);
  
  // Try AI analysis for better insights
  try {
    const prompt = `Analyze this response about "${brandName}":
"${response.substring(0, 1500)}"

JSON response:
{"sentiment": "positive|negative|neutral", "context": "relevant|partial|irrelevant", "confidence": 0.0-1.0}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Respond only with valid JSON." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (aiResponse.ok) {
      const data = await aiResponse.json();
      const content = data.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          mentioned: true,
          confidence: Math.max(0.3, Math.min(1, Number(parsed.confidence) || 0.5)),
          sentiment: ["positive", "negative", "neutral"].includes(parsed.sentiment) ? parsed.sentiment : "neutral",
          context: ["relevant", "irrelevant", "partial"].includes(parsed.context) ? parsed.context : "partial",
          position,
          excerpt: response.substring(Math.max(0, position - 50), position + 200),
        };
      }
    }
  } catch (e) {
    console.log("AI analysis fallback:", e);
  }

  // Fallback analysis
  return {
    mentioned: true,
    confidence: 0.5 + (position < 200 ? 0.3 : 0),
    sentiment: "neutral",
    context: "partial",
    position,
    excerpt: response.substring(Math.max(0, position - 50), position + 200),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const { brandId, query, providers: requestedProviders } = await req.json();

    // Input validation
    if (!brandId || !query) {
      return new Response(
        JSON.stringify({ error: "brandId and query are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidUUID(brandId)) {
      return new Response(
        JSON.stringify({ error: "Invalid brandId format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (query.length < 3 || query.length > 500) {
      return new Response(
        JSON.stringify({ error: "Query must be between 3 and 500 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter valid providers
    const activeProviders = requestedProviders?.length > 0
      ? requestedProviders.filter((p: string) => PROVIDERS.includes(p))
      : PROVIDERS;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify brand exists and get info
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id, name, keywords, user_id")
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

    console.log(`[collect-llm-mentions] Starting collection for brand: ${brand.name}`);
    console.log(`[collect-llm-mentions] Query: ${query}`);
    console.log(`[collect-llm-mentions] Providers: ${activeProviders.join(", ")}`);

    const results: MentionResult[] = [];

    // Query each provider with rate limiting
    for (let i = 0; i < activeProviders.length; i++) {
      const provider = activeProviders[i];
      
      // Rate limiting between queries
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }

      console.log(`[${provider}] Querying...`);

      try {
        const systemPrompt = `You are simulating responses from ${provider}. 
The user will ask a question. Respond naturally and helpfully.
If the brand "${brand.name}" is relevant to the question, mention it naturally.
Keywords: ${brand.keywords?.join(", ") || "none"}.
Keep responses detailed but focused (3-5 sentences).`;

        const response = await withRetry(async () => {
          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
          
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res;
        });

        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content || "";
        
        console.log(`[${provider}] Response length: ${answer.length}`);

        // Analyze the mention
        const analysis = await analyzeMention(answer, brand.name, query, LOVABLE_API_KEY);

        const mentionData = {
          brand_id: brandId,
          provider,
          query,
          mentioned: analysis.mentioned,
          confidence: analysis.mentioned ? analysis.confidence : null,
          answer_excerpt: analysis.excerpt || answer.substring(0, 500),
          full_response: answer,
          position: analysis.position,
          collected_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from("mentions_llm")
          .insert(mentionData);

        if (insertError) {
          console.error(`[${provider}] Insert error:`, insertError);
        } else {
          results.push({
            provider,
            mentioned: analysis.mentioned,
            confidence: analysis.confidence,
            sentiment: analysis.sentiment,
            context: analysis.context,
          });
          console.log(`[${provider}] ✓ Saved - mentioned: ${analysis.mentioned}, confidence: ${analysis.confidence}`);
        }
      } catch (error) {
        console.error(`[${provider}] Error:`, error);
        results.push({
          provider,
          mentioned: false,
          confidence: null,
          sentiment: "neutral",
          context: "error",
        });
      }
    }

    const duration = Date.now() - startTime;
    const mentionedCount = results.filter(r => r.mentioned).length;
    const avgConfidence = results
      .filter(r => r.confidence !== null)
      .reduce((sum, r) => sum + (r.confidence || 0), 0) / (mentionedCount || 1);

    console.log(`[collect-llm-mentions] Complete in ${duration}ms`);
    console.log(`[collect-llm-mentions] Results: ${mentionedCount}/${results.length} mentioned`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: {
          totalProviders: results.length,
          mentionedCount,
          avgConfidence: Math.round(avgConfidence * 100) / 100,
          durationMs: duration,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[collect-llm-mentions] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
