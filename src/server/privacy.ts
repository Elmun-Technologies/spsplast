import { createHmac } from 'node:crypto';

/**
 * Rate limit kaliti uchun IP manzilning qaytarib bo'lmaydigan xeshi (audit 2026-11-02, maxfiylik:
 * `rate_hits` jadvalida IP ochiq matnda saqlanardi, maxfiylik sahifasi esa "IP saqlanmaydi" der edi).
 * HMAC kaliti — `IP_HASH_SECRET` (tavsiya) yoki boshqa server siri; IPv4 maydoni kichik bo'lgani uchun
 * oddiy sha256 emas, kalitli HMAC. Qatorlar 1 sutkadan keyin o'chiriladi (`hitRateLimit`).
 */
export function ipKey(prefix: string, ip: string, env: Record<string, string | undefined> = process.env): string {
  const secret = env.IP_HASH_SECRET || env.DATABASE_URL || env.TELEGRAM_BOT_TOKEN || 'sps-plast';
  return `${prefix}_${createHmac('sha256', secret).update(ip).digest('hex').slice(0, 24)}`;
}
