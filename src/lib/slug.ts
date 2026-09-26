/**
 * URL slug generation for a bilingual (uz/ru) catalog.
 *
 * The previous implementation was `title.toLowerCase().replace(/[^a-z0-9]+/g,'-')`,
 * which throws away every non-ASCII character. That is most of the catalog:
 *
 *   - Russian titles ("Форма для брусчатки") collapsed to an empty slug, so the
 *     second product of the day hit the `@@unique([locale, slug])` constraint and
 *     the admin "create product" call failed with a 500.
 *   - Uzbek titles with `o‘` / `g‘` (U+2018) lost the letter entirely
 *     ("Bruschatka o‘lchami" -> "bruschatka-lchami").
 *
 * This module transliterates Cyrillic and normalizes the Uzbek modifier letters
 * before stripping, and guarantees a non-empty, unique-ish slug.
 */

const CYRILLIC_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  // Ukrainian/Belarusian extras, cheap to include
  і: 'i', ї: 'yi', є: 'ye', ў: 'u', ґ: 'g',
};

/** Uzbek Latin modifier letters and typographic quotes/dashes. */
const LATIN_MAP: Record<string, string> = {
  '\u2018': '', // ‘  (o‘ / g‘)
  '\u2019': '', // ’  (tutuq belgisi)
  '\u02BB': '', // ʻ
  '\u02BC': '', // ʼ
  '\u2013': '-', // –
  '\u2014': '-', // —
  '\u2010': '-',
  '\u00AD': '', // soft hyphen
  ı: 'i',
  İ: 'i',
  ơ: 'o',
  ư: 'u',
  ə: 'a',
  ç: 'c',
  ş: 's',
  ğ: 'g',
  ń: 'n',
  ó: 'o',
  ú: 'u',
  ñ: 'n',
  ä: 'a',
  ö: 'o',
  ü: 'u',
  ß: 'ss',
  æ: 'ae',
  ø: 'o',
  å: 'a',
  é: 'e',
  è: 'e',
  ê: 'e',
  à: 'a',
  á: 'a',
  â: 'a',
  î: 'i',
  ï: 'i',
  ô: 'o',
  û: 'u',
  ù: 'u',
  ý: 'y',
};

function transliterate(input: string): string {
  let out = '';
  for (const ch of input) {
    const lower = ch.toLowerCase();
    if (CYRILLIC_MAP[lower] !== undefined) {
      out += CYRILLIC_MAP[lower];
    } else if (LATIN_MAP[ch] !== undefined) {
      out += LATIN_MAP[ch];
    } else if (LATIN_MAP[lower] !== undefined) {
      out += LATIN_MAP[lower];
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Turns any product/category title into a URL-safe slug.
 * Always returns at least `fallback` (or 'item') so callers never write an
 * empty slug into a unique column.
 */
export function slugify(input: string | null | undefined, fallback = 'item'): string {
  if (!input) return fallback;

  const slug = transliterate(String(input))
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');

  return slug || fallback;
}

/** Short deterministic suffix used to resolve slug collisions. */
export function slugSuffix(seed: string, length = 5): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36).slice(0, length).padStart(length, '0');
}
