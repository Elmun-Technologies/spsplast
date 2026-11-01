import type { Fetch } from './http.ts';

/**
 * IndexNow (Yandex, Bing, Seznam, Naver …): yangi/yangilangan sahifalar haqida qidiruv
 * tizimlariga darhol xabar. Kalit admin → Sozlamalar (`indexnow_key`); kalit fayli saytda
 * `/indexnow-key.txt` (src/app/indexnow-key.txt/route.ts) — `keyLocation` shu manzil.
 */
export const INDEXNOW_ENDPOINTS = ['https://yandex.com/indexnow', 'https://api.indexnow.org/indexnow'];

export function indexNowPayload(siteUrl: string, key: string, urls: string[]) {
  const host = new URL(siteUrl).host;
  return {
    host,
    key,
    keyLocation: `${siteUrl.replace(/\/$/, '')}/indexnow-key.txt`,
    // Protokol bo'yicha 10 000 tagacha; faqat shu hostdagi manzillar.
    urlList: urls.filter((u) => {
      try {
        return new URL(u).host === host;
      } catch {
        return false;
      }
    }).slice(0, 10000),
  };
}

export async function submitIndexNow(siteUrl: string, key: string, urls: string[], f: Fetch = fetch) {
  const body = JSON.stringify(indexNowPayload(siteUrl, key, urls));
  return Promise.all(
    INDEXNOW_ENDPOINTS.map(async (endpoint) => {
      try {
        const res = await f(endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json; charset=utf-8' },
          body,
          signal: AbortSignal.timeout(15000),
        });
        // 200 — qabul qilindi, 202 — kalit tekshirilmoqda.
        return { endpoint, ok: res.status === 200 || res.status === 202, status: res.status };
      } catch (error) {
        return { endpoint, ok: false, status: 0, error: error instanceof Error ? error.message : String(error) };
      }
    }),
  );
}
