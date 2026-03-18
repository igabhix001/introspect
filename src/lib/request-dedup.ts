/**
 * Request deduplication for SaaS applications
 * Prevents duplicate API calls when multiple components request the same data
 */

type PendingRequest<T> = {
  promise: Promise<T>;
  timestamp: number;
};

const pendingRequests = new Map<string, PendingRequest<unknown>>();
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Deduplicate concurrent requests for the same resource
 * If a request is already in flight, return the existing promise
 */
export async function deduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Clean up old pending requests
  const now = Date.now();
  for (const [k, v] of pendingRequests.entries()) {
    if (now - v.timestamp > REQUEST_TIMEOUT_MS) {
      pendingRequests.delete(k);
    }
  }

  // Check if request is already in flight
  const existing = pendingRequests.get(key) as PendingRequest<T> | undefined;
  if (existing) {
    return existing.promise;
  }

  // Create new request
  const promise = fetcher().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, { promise, timestamp: now });
  return promise;
}

/**
 * Batch multiple requests into a single operation
 * Useful for reducing database round trips
 */
export class RequestBatcher<K, V> {
  private batch: Map<K, { resolve: (v: V) => void; reject: (e: Error) => void }[]> = new Map();
  private timeout: NodeJS.Timeout | null = null;
  private readonly batchFn: (keys: K[]) => Promise<Map<K, V>>;
  private readonly delayMs: number;

  constructor(batchFn: (keys: K[]) => Promise<Map<K, V>>, delayMs = 10) {
    this.batchFn = batchFn;
    this.delayMs = delayMs;
  }

  async load(key: K): Promise<V> {
    return new Promise((resolve, reject) => {
      const existing = this.batch.get(key);
      if (existing) {
        existing.push({ resolve, reject });
      } else {
        this.batch.set(key, [{ resolve, reject }]);
      }

      if (!this.timeout) {
        this.timeout = setTimeout(() => this.executeBatch(), this.delayMs);
      }
    });
  }

  private async executeBatch(): Promise<void> {
    this.timeout = null;
    const currentBatch = this.batch;
    this.batch = new Map();

    const keys = Array.from(currentBatch.keys());
    if (keys.length === 0) return;

    try {
      const results = await this.batchFn(keys);
      for (const [key, callbacks] of currentBatch.entries()) {
        const value = results.get(key);
        if (value !== undefined) {
          callbacks.forEach((cb) => cb.resolve(value));
        } else {
          callbacks.forEach((cb) => cb.reject(new Error(`No result for key: ${key}`)));
        }
      }
    } catch (error) {
      for (const callbacks of currentBatch.values()) {
        callbacks.forEach((cb) => cb.reject(error as Error));
      }
    }
  }
}

/**
 * Retry failed requests with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }
      const delay = Math.min(initialDelayMs * Math.pow(2, attempt), maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}
