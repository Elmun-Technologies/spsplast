import type { Locale } from '@/lib/i18n';

/**
 * Saytdagi PDF kataloglar (2026-11-16): A4 yotiq, har modeli alohida sahifada, ruscha.
 * Fayllar `public/catalog/pdf/`, varaqlagich — `/{lang}/catalog/flip` (pdf.js + page-flip).
 * Trotuar fayli eski nom bilan qoldi — tashqi havolalar uzilmasin.
 */
export const CATALOG_PDFS = [
  { key: 'trotuar', file: '/catalog/pdf/sps-qoliplar-katalogi-2026.pdf?v=20261116' },
  { key: 'fasad', file: '/catalog/pdf/sps-katalog-fasad.pdf?v=20261116b' },
  { key: 'skameyka', file: '/catalog/pdf/sps-katalog-skameyka.pdf?v=20261116' },
] as const;

export type CatalogKey = (typeof CATALOG_PDFS)[number]['key'];

export const isCatalogKey = (v: string | undefined | null): v is CatalogKey => CATALOG_PDFS.some((c) => c.key === v);

/** Bo'lim (data nomi) → qaysi katalog PDF'i unga mos. */
export function catalogKeyForSection(section: string): CatalogKey {
  if (section === 'trotuar') return 'trotuar';
  if (section === 'zabor' || section === 'skameyka') return 'skameyka';
  return 'fasad';
}

export const flipHref = (lang: Locale, key?: CatalogKey) => `/${lang}/catalog/flip${key ? `?c=${key}` : ''}`;
