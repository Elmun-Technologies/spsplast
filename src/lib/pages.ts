import { pagesEn } from '../dictionaries/pages/en.ts';
import { pagesRu } from '../dictionaries/pages/ru.ts';
import { pagesUz, type PagesDictionary } from '../dictionaries/pages/uz.ts';
import type { Locale } from './i18n';

const pages: Record<Locale, PagesDictionary> = { uz: pagesUz, ru: pagesRu, en: pagesEn };

/** Sahifa matnlari (uz/ru/en) — bitta manba, komponentda tilga qarab. */
export function getPages(lang: Locale): PagesDictionary {
  return pages[lang] ?? pagesUz;
}

export type { PagesDictionary };
