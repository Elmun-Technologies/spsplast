/**
 * Admin → "Matnlar" (CMS): lug'atdagi istalgan matnni uch tilda almashtirish.
 * Kalit — lug'at ichidagi yo'l, oldida nom maydoni: `pages.home.h1`,
 * `pages.partners.faq.0.a`, `ui.header.cta`.
 *
 * Ikki xil matn:
 *  - oddiy satr — to'g'ridan-to'g'ri almashtiriladi;
 *  - shablon (lug'atdagi funksiya, masalan `h1: (n) => \`… ${n} model\``) — admin'da
 *    `{1}`, `{2}` … bilan ko'rinadi (1-, 2-argument o'rni: model soni, davlat nomi …).
 *    Faqat satr qaytaradigan funksiyalar; ro'yxat/obyekt qaytaradiganlari (FAQ shablonlari) — kod.
 *
 * Almashtirilgan matn ham `{years}`, `{countries}` … tokenlari bilan ishlaydi:
 * override avval qo'yiladi, keyin tokenlar almashtiriladi (`applyStatsDeep`).
 */
export type TextOverrides = Record<string, string>;

const ARG = /\{([1-9])\}/g;

/** `{1}` → 1-argument. Argument yo'q bo'lsa token o'zi qoladi. */
export function fillTemplate(template: string, args: unknown[]): string {
  return template.replace(ARG, (m, i: string) => (args[Number(i) - 1] !== undefined ? String(args[Number(i) - 1]) : m));
}

/** Lug'atni chuqur nusxalab, `overrides` dagi kalitlar bo'yicha satr/shablonlarni almashtiradi. */
export function applyTextOverrides<T>(node: T, overrides: TextOverrides | null | undefined, prefix: string): T {
  if (!overrides || !Object.keys(overrides).some((k) => k.startsWith(`${prefix}.`))) return node;
  const walk = (value: unknown, key: string): unknown => {
    const o = overrides[key];
    const has = typeof o === 'string' && o.trim() !== '';
    if (typeof value === 'string') return has ? o : value;
    if (typeof value === 'function') return has ? (...args: unknown[]) => fillTemplate(o!, args) : value;
    if (Array.isArray(value)) return value.map((v, i) => walk(v, `${key}.${i}`));
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v, `${key}.${k}`)]));
    }
    return value;
  };
  return walk(node, prefix) as T;
}

/** Funksiyani `{1}`, `{2}` … bilan chaqirib shablonini oladi; satr qaytarmasa — `null`. */
export function templateOf(fn: (...a: unknown[]) => unknown): string | null {
  try {
    const args = Array.from({ length: Math.max(fn.length, 1) }, (_, i) => `{${i + 1}}`);
    const out = fn(...args);
    return typeof out === 'string' ? out : null;
  } catch {
    return null;
  }
}

/** Tahrirlanadigan matnlar ro'yxati (admin uchun): `[kalit, qiymat, shablonmi]`. */
export function flattenStrings(node: unknown, prefix: string, out: [string, string, boolean][] = []): [string, string, boolean][] {
  if (typeof node === 'string') out.push([prefix, node, false]);
  else if (typeof node === 'function') {
    const t = templateOf(node as (...a: unknown[]) => unknown);
    if (t !== null) out.push([prefix, t, true]);
  } else if (Array.isArray(node)) node.forEach((v, i) => flattenStrings(v, `${prefix}.${i}`, out));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) flattenStrings(v, `${prefix}.${k}`, out);
  }
  return out;
}
