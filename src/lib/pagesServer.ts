import { pagesServerEn } from '../dictionaries/pagesServer/en.ts';
import { pagesServerRu } from '../dictionaries/pagesServer/ru.ts';
import { pagesServerUz, type PagesServerDictionary } from '../dictionaries/pagesServer/uz.ts';
import type { Locale } from './i18n';
import { getPages, type PagesDictionary } from './pages.ts';
import { applyStatsDeep } from './siteContent.ts';
import { applyTextOverrides } from './textOverrides.ts';
import { siteSnapshot } from '../data/site.generated.ts';

const raw: Record<Locale, PagesServerDictionary> = { uz: pagesServerUz, ru: pagesServerRu, en: pagesServerEn };
const cache: Partial<Record<Locale, PagesDictionary & PagesServerDictionary>> = {};

/**
 * Server komponentlar uchun to'liq sahifa matnlari: `getPages()` + SEO landing (`seo`) va
 * maxfiylik (`privacy`). Bu ikki bo'lim mijoz bundle'iga tushmasligi uchun alohida modulda
 * (audit 2026-11-02, tezlik). Admin → "Matnlar" kalitlari avvalgidek `pages.seo.*`, `pages.privacy.*`.
 * Mijoz komponentida (`'use client'`) ishlatilmaydi — u yerda `getPages()`.
 */
export function getSitePages(lang: Locale): PagesDictionary & PagesServerDictionary {
  const l = raw[lang] ? lang : 'uz';
  return (cache[l] ??= {
    ...getPages(l),
    ...applyStatsDeep(applyTextOverrides(raw[l], siteSnapshot?.texts?.[l], 'pages'), l),
  });
}

export type { PagesServerDictionary };
