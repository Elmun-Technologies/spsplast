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
