// LLM Query Cache helpers

export interface CacheEntry {
  provider: string;
  query: string;
  query_hash: string;
  response: string;
  expires_at: string;
}

export async function getCachedResponse(
  supabase: any,
  provider: string,
  queryHash: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("llm_query_cache")
      .select("response")
      .eq("provider", provider)
      .eq("query_hash", queryHash)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) return null;
    return (data as { response: string }).response;
  } catch {
    return null;
  }
}

export async function cacheResponse(
  supabase: any,
  provider: string,
  query: string,
  queryHash: string,
  response: string,
  ttlHours: number = 24
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    await supabase.from("llm_query_cache").upsert({
      provider,
      query,
      query_hash: queryHash,
      response,
      expires_at: expiresAt.toISOString(),
    } as CacheEntry);
  } catch (error) {
    console.error("Cache write error:", error);
  }
}

export function generateQueryHash(query: string, provider: string): string {
  const input = `${provider}:${query.toLowerCase().trim()}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
