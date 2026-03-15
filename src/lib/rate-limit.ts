/**
 * Simple in-memory rate limiter
 * For production, use Redis-backed rate limiting (e.g., upstash/ratelimit)
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every minute
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 60000);

export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed in the time window
   */
  max: number;
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  /**
   * Custom message for rate limit exceeded
   */
  message?: string;
}

export function rateLimit(options: RateLimitOptions) {
  const { max, windowMs, message = "Too many requests, please try again later." } = options;

  return async (identifier: string): Promise<{ success: boolean; remaining: number; reset: number; message?: string }> => {
    const now = Date.now();
    const record = store[identifier];

    if (!record || record.resetTime < now) {
      // Create new record
      store[identifier] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return {
        success: true,
        remaining: max - 1,
        reset: store[identifier].resetTime,
      };
    }

    if (record.count < max) {
      // Increment count
      record.count++;
      return {
        success: true,
        remaining: max - record.count,
        reset: record.resetTime,
      };
    }

    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      reset: record.resetTime,
      message,
    };
  };
}

// Preset rate limiters
export const apiRateLimit = rateLimit({
  max: 100, // 100 requests
  windowMs: 15 * 60 * 1000, // per 15 minutes
});

export const authRateLimit = rateLimit({
  max: 5, // 5 attempts
  windowMs: 15 * 60 * 1000, // per 15 minutes
  message: "Too many login attempts. Please try again in 15 minutes.",
});

export const tradeRateLimit = rateLimit({
  max: 20, // 20 trades
  windowMs: 60 * 1000, // per minute (prevents spam)
});

/**
 * Get rate limit identifier from request
 * Uses IP address or user ID
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  
  // Get IP from various headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0] || realIp || "unknown";
  
  return `ip:${ip}`;
}
