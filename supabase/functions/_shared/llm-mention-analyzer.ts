// AI-powered mention analysis

import { apiCallWithRetry } from "./retry-helper.ts";

export interface MentionAnalysis {
  mentioned: boolean;
  confidence: number;
  sentiment: "positive" | "negative" | "neutral";
  context: "relevant" | "irrelevant" | "partial";
  position: number | null;
  excerpt: string;
}

export async function analyzeMentionWithAI(
  response: string,
  brandName: string,
  query: string,
  apiKey: string
): Promise<MentionAnalysis> {
  const prompt = `Analyze this LLM response for mentions of the brand "${brandName}".

Query asked: "${query}"

Response to analyze:
"${response.substring(0, 2000)}"

Respond in JSON format:
{
  "mentioned": boolean (true if brand is explicitly mentioned),
  "confidence": number (0-1, how confident the mention is about the brand),
  "sentiment": "positive" | "negative" | "neutral" (tone toward the brand),
  "context": "relevant" | "irrelevant" | "partial" (how relevant the mention is),
  "position": number | null (character position of first mention, null if not mentioned),
  "excerpt": string (the sentence containing the mention, max 200 chars)
}`;

  try {
    const aiResponse = await apiCallWithRetry(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are an expert at analyzing brand mentions in text. Always respond with valid JSON." },
            { role: "user", content: prompt }
          ],
          max_tokens: 500,
        }),
      },
      { maxRetries: 2, timeout: 15000 }
    );

    const data = await aiResponse.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        mentioned: Boolean(parsed.mentioned),
        confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
        sentiment: ["positive", "negative", "neutral"].includes(parsed.sentiment) 
          ? parsed.sentiment 
          : "neutral",
        context: ["relevant", "irrelevant", "partial"].includes(parsed.context)
          ? parsed.context
          : "partial",
        position: typeof parsed.position === "number" ? parsed.position : null,
        excerpt: String(parsed.excerpt || "").substring(0, 200),
      };
    }
  } catch (error) {
    console.error("AI analysis error:", error);
  }

  // Fallback: simple string matching
  const responseLower = response.toLowerCase();
  const brandLower = brandName.toLowerCase();
  const mentioned = responseLower.includes(brandLower);
  const position = mentioned ? responseLower.indexOf(brandLower) : null;

  return {
    mentioned,
    confidence: mentioned ? 0.5 : 0,
    sentiment: "neutral",
    context: mentioned ? "partial" : "irrelevant",
    position,
    excerpt: mentioned 
      ? response.substring(Math.max(0, position! - 50), position! + 150)
      : "",
  };
}
