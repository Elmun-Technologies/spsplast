/**
 * Yengil in-memory rate limiter (sliding window).
 *
 * Zayafka formasini spam-botlardan himoya qiladi. Serverless (Vercel) muhitida
 * har bir instansiya o'z xotirasiga ega, shuning uchun bu **to'liq** himoya
 * emas: bir nechta instansiya bir vaqtda ishlayotganda limit instansiya
 * bo'yicha qo'llanadi. Amalda bu Telegram'ni to'ldirib yuborishning oldini
 * olish uchun yetarli; qo'shimcha chora — formadagi honeypot maydoni va
 * telefon raqamining validatsiyasi.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const tracker = new Map<string, RateLimitRecord>();

/** Xotira cheksiz o'smasligi uchun eskirgan yozuvlarni vaqti-vaqti bilan tozalaymiz. */
const MAX_TRACKED_KEYS = 5000;

function pruneExpired(now: number) {
  if (tracker.size < MAX_TRACKED_KEYS) return;
  for (const [key, record] of tracker) {
    if (now > record.resetAt) tracker.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000
): { allowed: boolean; remaining: number; resetTimeMs: number } {
  const now = Date.now();
  pruneExpired(now);

  const record = tracker.get(key);

  if (!record || now > record.resetAt) {
    tracker.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTimeMs: windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTimeMs: record.resetAt - now };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count, resetTimeMs: record.resetAt - now };
}

/** Testlar uchun: holatni nolga qaytaradi. */
export function resetRateLimit(): void {
  tracker.clear();
}
