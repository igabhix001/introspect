/**
 * Production-grade in-memory cache with TTL support
 * For SaaS applications, this can be replaced with Redis/Upstash for distributed caching
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  staleAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every 60 seconds
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
  }

  /**
   * Get cached data with stale-while-revalidate support
   * @param key Cache key
   * @returns { data, isStale } or null if not found/expired
   */
  get<T>(key: string): { data: T; isStale: boolean } | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const now = Date.now();
    
    // Completely expired - remove and return null
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Return data with stale indicator
    return {
      data: entry.data,
      isStale: now > entry.staleAt,
    };
  }

  /**
   * Set cached data with TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttlSeconds Time to live in seconds
   * @param staleSeconds Time until data is considered stale (for stale-while-revalidate)
   */
  set<T>(key: string, data: T, ttlSeconds: number, staleSeconds?: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      expiresAt: now + ttlSeconds * 1000,
      staleAt: now + (staleSeconds ?? ttlSeconds) * 1000,
    });
  }

  /**
   * Delete a specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Destroy the cache instance
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Singleton instance
export const cache = new MemoryCache();

/**
 * Cache wrapper with automatic fetch and caching
 * Implements stale-while-revalidate pattern
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttlSeconds: number;
    staleSeconds?: number;
    forceRefresh?: boolean;
  }
): Promise<T> {
  const { ttlSeconds, staleSeconds, forceRefresh } = options;

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = cache.get<T>(key);
    if (cached) {
      // If stale, trigger background refresh but return cached data
      if (cached.isStale) {
        // Fire and forget background refresh
        fetcher()
          .then((data) => cache.set(key, data, ttlSeconds, staleSeconds))
          .catch(console.error);
      }
      return cached.data;
    }
  }

  // Fetch fresh data
  const data = await fetcher();
  cache.set(key, data, ttlSeconds, staleSeconds);
  return data;
}

/**
 * Generate cache key from request parameters
 */
export function generateCacheKey(prefix: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return `${prefix}:${sortedParams}`;
}

/**
 * HTTP Cache-Control header generator
 */
export function getCacheHeaders(options: {
  maxAge: number;
  staleWhileRevalidate?: number;
  private?: boolean;
}): Record<string, string> {
  const directives: string[] = [];
  
  if (options.private) {
    directives.push("private");
  } else {
    directives.push("public");
  }
  
  directives.push(`max-age=${options.maxAge}`);
  
  if (options.staleWhileRevalidate) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }

  return {
    "Cache-Control": directives.join(", "),
  };
}
