/**
 * Admin'dan kiritiladigan sayt matnlari uchun umumiy qoidalar (CLAUDE.md "Business Rules"):
 * narx yo'q, o'zbekchada "yaratish" yo'q, `[...]` placeholder yo'q, HTML yo'q, faqat
 * ma'lum tokenlar. SEO sahifalari va "Matnlar" (CMS) shu funksiyadan o'tadi.
 */
export type CopyLang = 'uz' | 'ru' | 'en';

const TOKENS = new Set(['years', 'capacity', 'objects', 'countries', 'countryList', 'contactLine', 'addressLine', 'address']);

const PRICE = [
  /so['ʻ’`]?m\b/i, // so'm
  /(^|[^a-zа-яё])сум([^a-zа-яё]|$)/i,
  /\$\s?\d|\d\s?\$/,
  /₽|€/,
  /(^|[^a-zа-яё])руб(\.|л|$|\s)/i,
  /\d\s?(usd|eur|uzs|rub)\b/i,
  /\bnarxi?\s*[:=]?\s*\d/i,
  /цена\s*[:=]?\s*\d/i,
  /\bprice\s*[:=]?\s*\d/i,
];

/** Xato matni yoki `null`. `max` — belgi chegarasi. */
export function copyError(text: string, lang: CopyLang, max: number): string | null {
  if (text.length > max) return `juda uzun (${text.length} > ${max} belgi)`;
  if (/[<>]/.test(text)) return 'HTML belgilari (< >) mumkin emas';
  if (lang === 'uz' && /yarat/i.test(text)) return '"yaratish" so\'zi taqiqlangan — "ishlab chiqarilgan" deb yozing';
  if (PRICE.some((re) => re.test(text))) return 'narx/valyuta ko\'rsatilmaydi — "Menejer bilan kelishiladi" deb yozing';
  if (/\[[^\]]*\]/.test(text)) return '[...] placeholder ko\'rsatilmaydi';
  for (const m of text.matchAll(/\{([^}]*)\}/g)) {
    if (!TOKENS.has(m[1])) return `noma'lum token {${m[1]}} — ruxsat: ${[...TOKENS].map((t) => `{${t}}`).join(', ')}`;
  }
  return null;
}

/** Bo'sh joylarni tartibga soladi (qator boshi/oxiri, ketma-ket bo'shliqlar). */
export function cleanCopy(text: string, multiline = false): string {
  const t = text.replace(/\r\n/g, '\n').trim();
  return multiline ? t.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n') : t.replace(/\s+/g, ' ');
}
