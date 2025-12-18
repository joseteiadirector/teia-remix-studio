// Cache configuration for React Query and data fetching

export const CACHE_CONFIG = {
  // Stale times (how long data is considered fresh)
  staleTime: {
    short: 1 * 60 * 1000,      // 1 minute
    medium: 5 * 60 * 1000,     // 5 minutes
    long: 15 * 60 * 1000,      // 15 minutes
    veryLong: 60 * 60 * 1000,  // 1 hour
  },

  // GC times (how long to keep data in cache after it becomes stale)
  gcTime: {
    short: 5 * 60 * 1000,      // 5 minutes
    medium: 15 * 60 * 1000,    // 15 minutes
    long: 30 * 60 * 1000,      // 30 minutes
    veryLong: 60 * 60 * 1000,  // 1 hour
  },

  // Refetch intervals for real-time data
  refetchInterval: {
    realtime: 10 * 1000,       // 10 seconds
    frequent: 30 * 1000,       // 30 seconds
    normal: 60 * 1000,         // 1 minute
    infrequent: 5 * 60 * 1000, // 5 minutes
  },

  // Retry configuration
  retry: {
    count: 3,
    delay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
};

// Query key factory for consistent cache keys
export const queryKeys = {
  // Brands
  brands: {
    all: ['brands'] as const,
    list: (userId: string) => ['brands', 'list', userId] as const,
    detail: (brandId: string) => ['brands', 'detail', brandId] as const,
  },

  // Metrics
  metrics: {
    geo: (brandId: string) => ['metrics', 'geo', brandId] as const,
    seo: (brandId: string) => ['metrics', 'seo', brandId] as const,
    igo: (brandId: string) => ['metrics', 'igo', brandId] as const,
    igoHistory: (brandId: string) => ['metrics', 'igo-history', brandId] as const,
  },

  // Mentions
  mentions: {
    all: (brandId: string) => ['mentions', brandId] as const,
    byProvider: (brandId: string, provider: string) => ['mentions', brandId, provider] as const,
    recent: (brandId: string) => ['mentions', 'recent', brandId] as const,
  },

  // Alerts
  alerts: {
    all: (brandId: string) => ['alerts', brandId] as const,
    unread: (brandId: string) => ['alerts', 'unread', brandId] as const,
    configs: (brandId: string) => ['alerts', 'configs', brandId] as const,
  },

  // Reports
  reports: {
    all: (brandId: string) => ['reports', brandId] as const,
    detail: (reportId: string) => ['reports', 'detail', reportId] as const,
  },

  // Widgets
  widgets: {
    score: (brandId: string) => ['widgets', 'score', brandId] as const,
    mentions: (brandId: string) => ['widgets', 'mentions', brandId] as const,
    alerts: (brandId: string) => ['widgets', 'alerts', brandId] as const,
  },
};

// Default query options
export const defaultQueryOptions = {
  staleTime: CACHE_CONFIG.staleTime.medium,
  gcTime: CACHE_CONFIG.gcTime.medium,
  retry: CACHE_CONFIG.retry.count,
  retryDelay: CACHE_CONFIG.retry.delay,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
};
