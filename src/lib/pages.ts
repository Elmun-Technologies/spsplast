import { pagesEn } from '../dictionaries/pages/en.ts';
import { pagesRu } from '../dictionaries/pages/ru.ts';
import { pagesUz, type PagesDictionary } from '../dictionaries/pages/uz.ts';
import type { Locale } from './i18n';
import { applyStatsDeep } from './siteContent.ts';

const raw: Record<Locale, PagesDictionary> = { uz: pagesUz, ru: pagesRu, en: pagesEn };
const cache: Partial<Record<Locale, PagesDictionary>> = {};

/**
 * Sahifa matnlari (uz/ru/en) — bitta manba, komponentda tilga qarab.
 * `{years}`, `{countries}` … tokenlari admin'dagi raqamlar bilan almashtiriladi.
 */
export function getPages(lang: Locale): PagesDictionary {
  const l = raw[lang] ? lang : 'uz';
  return (cache[l] ??= applyStatsDeep(raw[l], l));
}

export type { PagesDictionary };
