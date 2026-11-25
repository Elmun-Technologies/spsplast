import type { Locale } from '@/lib/i18n';

/**
 * Saytdagi PDF kataloglar (2026-11-16): yotiq, har modeli alohida sahifada, ruscha. Trotuar — 2026-11-23
 * bosma katalog (A5, 129 bet — 2026-11-25: 15 ta "natija" rasmi qolipning 3D modelidan qayta render qilindi, takror Kaliforniya beti olib tashlandi, Томир/Бодом/Шерша raqamlandi; rasmlar 1100 px gacha siqilgan veb nusxa; asl nusxa repoga kirmaydi).
 * Fayllar `public/catalog/pdf/`, varaqlagich — `/{lang}/catalog/flip` (pdf.js + page-flip).
 * Trotuar fayli eski nom bilan qoldi — tashqi havolalar uzilmasin.
 */
export const CATALOG_PDFS = [
  { key: 'trotuar', file: '/catalog/pdf/sps-qoliplar-katalogi-2026.pdf?v=20261125d' },
  { key: 'fasad', file: '/catalog/pdf/sps-katalog-fasad.pdf?v=20261124' },
  // Tayyor fasad mahsulotlari (bosma "FASAD MAHSULOT" 2027, 108 bet) — faqat /ready sahifalarida
  { key: 'fasad-mahsulot', file: '/catalog/pdf/sps-katalog-fasad-mahsulot.pdf?v=20261124' },
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

/** Tayyor mahsulot bo'limi → katalog: fasad elementlari — "FASAD MAHSULOT", skameyka/zabor — umumiy katalog. */
export function readyCatalogKey(section?: string): CatalogKey {
  return section === 'tayyor_skameyka' || section === 'tayyor_zabor' ? 'skameyka' : 'fasad-mahsulot';
}

export const flipHref = (lang: Locale, key?: CatalogKey) => `/${lang}/catalog/flip${key ? `?c=${key}` : ''}`;
