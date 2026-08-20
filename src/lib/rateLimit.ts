interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const tracker = new Map<string, RateLimitRecord>();

/**
 * Lightweight sliding-window rate limiter.
 * @param key Unique key (e.g. IP address + route)
 * @param maxRequests Maximum allowed attempts within window
 * @param windowMs Time window in milliseconds (default: 15 minutes)
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remaining: number; resetTimeMs: number } {
  const now = Date.now();
  const record = tracker.get(key);

  if (!record || now > record.resetAt) {
    tracker.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTimeMs: windowMs };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTimeMs: record.resetAt - now,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTimeMs: record.resetAt - now,
  };
}
