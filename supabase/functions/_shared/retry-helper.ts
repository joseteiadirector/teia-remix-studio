// Retry helper with exponential backoff

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  timeout: number;
}

const defaultOptions: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  timeout: 30000,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new Error("Request timeout"));
          });
        }),
      ]);

      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`Attempt ${attempt + 1} failed: ${lastError.message}`);

      if (attempt < opts.maxRetries) {
        const delay = Math.min(
          opts.baseDelay * Math.pow(2, attempt),
          opts.maxDelay
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

export async function apiCallWithRetry(
  url: string,
  options: RequestInit,
  retryOptions: Partial<RetryOptions> = {}
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, options);
    
    // Retry on rate limit or server errors
    if (response.status === 429 || response.status >= 500) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  }, retryOptions);
}
