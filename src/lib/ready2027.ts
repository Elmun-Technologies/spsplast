import type { Locale } from './i18n.ts';

/**
 * Tayyor mahsulotlar (fasad elementlari, termopanellar) — QOLIP EMAS. Faqat zayafka, narx yo'q.
 * Mahsulot va rasmlarni biznes beradi (qaror 2026-11-17): rasm faylini `public/ready/<slug>.webp` ga
 * qo'ying va shu ro'yxatga qator qo'shing. Ro'yxat bo'sh bo'lsa `/ready` halol "tez orada" holatini ko'rsatadi.
 * Qo'shilgach: `ready/layout.tsx` dagi noindex'ni olib tashlang (u yerdagi izohga qarang).
 */
export type ReadySection = 'fasad' | 'termopanel';

export interface ReadyProduct {
  slug: string;
  section: ReadySection;
  name: Record<Locale, string>;
  /** Mahsulot o'lchami, masalan "30×60 sm" (ixtiyoriy). */
  size?: string;
  /** `/ready/<slug>.webp` */
  image: string;
}

export const READY_PRODUCTS: ReadyProduct[] = [];
