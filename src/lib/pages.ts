import { pagesEn } from '../dictionaries/pages/en.ts';
import { pagesRu } from '../dictionaries/pages/ru.ts';
import { pagesUz, type PagesDictionary } from '../dictionaries/pages/uz.ts';
import type { Locale } from './i18n';
import { applyStatsDeep } from './siteContent.ts';
import { applyTextOverrides } from './textOverrides.ts';
import { siteSnapshot } from '../data/site.generated.ts';

const raw: Record<Locale, PagesDictionary> = { uz: pagesUz, ru: pagesRu, en: pagesEn };
const cache: Partial<Record<Locale, PagesDictionary>> = {};

/**
 * Sahifa matnlari (uz/ru/en) — bitta manba, komponentda tilga qarab.
 * Admin → "Matnlar" dagi almashtirishlar (`pages.*` kalitlari) avval qo'yiladi, keyin
 * `{years}`, `{countries}` … tokenlari admin'dagi raqamlar bilan almashtiriladi.
 */
export function getPages(lang: Locale): PagesDictionary {
  const l = raw[lang] ? lang : 'uz';
  return (cache[l] ??= applyStatsDeep(applyTextOverrides(raw[l], siteSnapshot?.texts?.[l], 'pages'), l));
}

export type { PagesDictionary };
