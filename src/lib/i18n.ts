/**
 * Til qatlami (HANDOFF 3): uz — asosiy, ru va en — ikkinchi/uchinchi.
 *
 * Bu fayl ataylab kichik: faqat til ro'yxati, standart til va `lang`
 * segmentini tekshirish. Matnlar `src/dictionaries/ui/*` (interfeys) va
 * `src/dictionaries/pages/*` (sahifa kontenti) da; ularni `getUi(lang)` va
 * `getPages(lang)` orqali olish kerak.
 *
 * Eski (2026) `uz.json`/`ru.json` lug'atlari va `getDictionary()` o'chirildi:
 * ular eski sahifa qatlami bilan birga ketdi.
 */

export type Locale = 'uz' | 'ru' | 'en';

export const locales: Locale[] = ['uz', 'ru', 'en'];

export const defaultLocale: Locale = 'uz';

/** `[lang]` segmenti haqiqiy tilmi? (404 ga tushmaslik uchun tekshiruv) */
export function isValidLocale(lang: string): lang is Locale {
  return (locales as string[]).includes(lang);
}

/**
 * `{one, few, many}` shakllaridan birini tanlaydi (`Intl.PluralRules`, 'zero'/'two' holatlari
 * 'many'ga tushadi — `getUi(lang).models`dagi uchta shaklga mos). `pluralModels` (`lib/ui.ts`)
 * bilan bir xil mantiq, lekin lug'atga (`getUi`) bog'liq emas — klient komponent `p.*.subtitleForms`
 * kabi allaqachon uzatilgan, bitta tilga tegishli ma'lumotni ishlatganda shu funksiya kerak
 * bo'ladi (audit 2026-11-02, 3.4-band: uch tilning HAM lug'ati klient bundle'iga tushmasin).
 */
export function pluralCategory<T extends string>(lang: Locale, n: number, forms: { one: T; few: T; many: T }): T {
  const category = new Intl.PluralRules(lang === 'uz' ? 'uz' : lang).select(n);
  if (category === 'one') return forms.one;
  if (category === 'few') return forms.few;
  return forms.many;
}
