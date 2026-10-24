/**
 * In-memory cache with TTL and in-flight Promise deduplication.
 * Prevents multiple identical requests from hitting the network simultaneously,
 * and serves cached data within TTL for instantaneous rendering.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

export interface CacheOptions {
  /** Time to live in milliseconds. Defaults to 5 minutes (300,000 ms) */
  ttlMs?: number;
  /** Force refetch bypassing cache */
  force?: boolean;
}

/**
 * Runs fetcher with in-flight deduplication and memory caching.
 */
export async function cachedRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttlMs = 5 * 60 * 1000, force = false } = options;
  const now = Date.now();

  // 1. Return fresh cached data if valid and not forced
  if (!force) {
    const cached = memoryCache.get(key);
    if (cached && cached.expiresAt > now) {
      return cached.data;
    }
  }

  // 2. In-flight request deduplication: reuse ongoing promise
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)!;
  }

  // 3. Execute fetcher and register in-flight promise
  const promise = (async () => {
    try {
      const data = await fetcher();
      if (data !== undefined && data !== null) {
        memoryCache.set(key, {
          data,
          expiresAt: Date.now() + ttlMs
        });
      }
      return data;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

/**
 * Invalidate cached items by prefix or clear all cache.
 */
export function invalidateCache(keyPrefix?: string): void {
  if (!keyPrefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      memoryCache.delete(key);
    }
  }
}
