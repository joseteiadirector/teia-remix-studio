// LLM Providers configuration and utilities

export const LLM_PROVIDERS = ["chatgpt", "gemini", "claude", "perplexity"] as const;
export type LLMProvider = typeof LLM_PROVIDERS[number];

export interface ProviderConfig {
  name: string;
  enabled: boolean;
  weight: number;
}

export function getAvailableProviders(): LLMProvider[] {
  // All providers use Lovable AI Gateway, so all are available
  return [...LLM_PROVIDERS];
}

export function generateContextualQueries(
  baseQuery: string,
  brandName: string,
  keywords: string[] = []
): string[] {
  const queries: string[] = [baseQuery];
  
  // Add brand-specific context
  if (!baseQuery.toLowerCase().includes(brandName.toLowerCase())) {
    queries.push(`${baseQuery} considering ${brandName}`);
  }
  
  // Add keyword-enriched queries
  if (keywords.length > 0) {
    const topKeywords = keywords.slice(0, 3).join(", ");
    queries.push(`${baseQuery} in the context of ${topKeywords}`);
  }
  
  return queries.slice(0, 3); // Max 3 queries per collection
}

export function getProviderWeight(provider: LLMProvider): number {
  const weights: Record<LLMProvider, number> = {
    chatgpt: 0.30,
    gemini: 0.25,
    claude: 0.25,
    perplexity: 0.20,
  };
  return weights[provider] || 0.25;
}

export function isValidProvider(provider: string): provider is LLMProvider {
  return LLM_PROVIDERS.includes(provider as LLMProvider);
}
