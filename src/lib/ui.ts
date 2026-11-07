import { en } from '@/dictionaries/ui/en';
import { ru } from '@/dictionaries/ui/ru';
import { uz, type UiDictionary } from '@/dictionaries/ui/uz';
import { pluralCategory, type Locale } from '@/lib/i18n';
import { applyTextOverrides } from '@/lib/textOverrides';
import { siteSnapshot } from '@/data/site.generated';

const ui: Record<Locale, UiDictionary> = { uz, ru, en };

const cache: Partial<Record<Locale, UiDictionary>> = {};

/** Yangi sayt qatlami uchun UI lug'ati (uz/ru/en); admin → "Matnlar" (`ui.*`) qo'llanadi. */
export function getUi(lang: Locale): UiDictionary {
  const l: Locale = ui[lang] ? lang : 'uz';
  return (cache[l] ??= applyTextOverrides(ui[l], siteSnapshot?.texts?.[l], 'ui'));
}

export type { UiDictionary };

/**
 * Ko'plik shakli (HANDOFF 4.10): RU — 1 модель / 2–4 модели / 5+ моделей,
 * EN — 1 model / N models. `Intl.PluralRules` kategoriyasiga tayanamiz.
 */
export function pluralModels(lang: Locale, n: number): string {
  return pluralCategory(lang, n, getUi(lang).models);
}

/** Raqamni tilga qarab formatlash: uz/ru vergul, en nuqta (ds/README). */
export function formatNumber(lang: Locale, value: string | number | null): string {
  if (value === null || value === undefined || value === '') return '—';
  const text = String(value);
  return lang === 'en' ? text.replace(',', '.') : text.replace('.', ',');
}
