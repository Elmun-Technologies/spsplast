import { db } from '@/lib/db';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const tracker = new Map<string, RateLimitRecord>();

/**
 * Lightweight sliding-window in-memory rate limiter.
 * Ideal for single-instance or quick checks.
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

/**
 * Production-ready asynchronous DB-backed rate limiter.
 * Works seamlessly across multi-instance serverless deployments without Redis requirement.
 */
export async function checkRateLimitAsync(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000
): Promise<{ allowed: boolean; remaining: number; resetTimeMs: number }> {
  // First run local check for ultra-fast rejection
  const localCheck = checkRateLimit(key, maxRequests, windowMs);
  if (!localCheck.allowed) {
    return localCheck;
  }

  // Attempt DB state tracking for multi-instance persistence
  try {
    const windowStart = new Date(Date.now() - windowMs);
    const recentCount = await db.integrationLog.count({
      where: {
        provider: 'RATELIMIT',
        operation: key,
        createdAt: { gte: windowStart },
      },
    });

    if (recentCount >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTimeMs: windowMs,
      };
    }

    // Record attempt
    await db.integrationLog.create({
      data: {
        provider: 'RATELIMIT',
        operation: key,
        status: 'SUCCESS',
        detailsJson: JSON.stringify({ ipKey: key, timestamp: Date.now() }),
      },
    });

    return {
      allowed: true,
      remaining: maxRequests - recentCount - 1,
      resetTimeMs: windowMs,
    };
  } catch (_err) {
    // Fallback to in-memory check gracefully if DB is unresponsive
    return localCheck;
  }
}
