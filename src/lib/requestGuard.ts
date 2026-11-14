/**
 * Yozuvchi API'lar (`/api/leads`, `/api/track`) uchun umumiy himoya (audit 2026-11-02,
 * 3-bosqich: xavfsizlik). Ikkala muammo ham begona saytdan oddiy `fetch`/`<form>` orqali,
 * CORS preflight'siz amalga oshirilishi mumkin edi.
 */

/**
 * Cross-site so'rov: `Origin` sarlavhasi bor va u so'ralgan `Host` bilan mos kelmaydi.
 *
 * `Origin` yo'qligi (ba'zi eski brauzerlar bir xil manzil so'rovida yubormasligi mumkin)
 * bloklanmaydi — faqat BEGONA Origin rad etiladi. Qattiq ro'yxat (`SITE_URL`) o'rniga
 * `Host` bilan solishtiramiz: shu bilan Vercel Preview (`*.vercel.app`) va lokal
 * `localhost` ham hech narsa domen ro'yxatini yangilamasdan ishlayveradi.
 */
export function isCrossOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host !== req.headers.get('host');
  } catch {
    return true; // noto'g'ri Origin qiymati — ishonilmaydi
  }
}

/**
 * So'rov tanasini belgilangan baytgacha o'qiydi. `Content-Length` sarlavhasiga
 * tayanmaydi (yolg'on yoki yo'q bo'lishi mumkin) — oqimni o'zi hisoblab, limitdan
 * oshsa darhol to'xtatadi (`null`). Node runtime'da `Request.body` Web Stream.
 */
export async function readLimitedText(req: Request, maxBytes: number): Promise<string | null> {
  const body = req.body;
  if (!body) return '';
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8');
}
