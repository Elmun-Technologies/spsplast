/**
 * Hisobot API'lari uchun umumiy yordamchi: vaqt chegarasi, xatoni tushunarli matnga
 * aylantirish va 15 daqiqalik xotira keshi (API kvotasi tejaladi, admin sahifasi tez).
 */
export type Fetch = typeof fetch;
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function fetchJson<T>(f: Fetch, url: string, init: RequestInit = {}, timeoutMs = 12000): Promise<T> {
  const res = await f(url, { ...init, signal: AbortSignal.timeout(timeoutMs), cache: 'no-store' });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const b = body as { error?: { message?: string } | string; message?: string; error_description?: string } | null;
    const msg =
      (typeof b?.error === 'object' && b?.error?.message) ||
      b?.error_description ||
      b?.message ||
      (typeof b?.error === 'string' ? b.error : '') ||
      (typeof body === 'string' ? body.slice(0, 200) : '');
    throw new Error(`HTTP ${res.status}${msg ? `: ${msg}` : ''}`);
  }
  return body as T;
}

const g = globalThis as unknown as { __spsReportCache?: Map<string, { at: number; value: unknown }> };
const cache = (g.__spsReportCache ??= new Map());
export const CACHE_MS = 15 * 60 * 1000;

export async function cached<T>(key: string, fn: () => Promise<T>, ttl = CACHE_MS): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value as T;
  const value = await fn();
  cache.set(key, { at: Date.now(), value });
  return value;
}

export function clearReportCache() {
  cache.clear();
}

export async function safe<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** `YYYY-MM-DD` (UTC). */
export function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function dayRange(days: number, lagDays = 0, now = new Date()) {
  const end = new Date(now.getTime() - lagDays * 86400000);
  const start = new Date(end.getTime() - (days - 1) * 86400000);
  return { start: isoDay(start), end: isoDay(end) };
}
