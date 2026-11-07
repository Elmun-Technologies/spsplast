import { siteSnapshot } from '../data/site.generated.ts';
import type { SnapshotTestimonial } from './snapshotTypes.ts';
import type { Locale } from './i18n.ts';

/**
 * Mijoz sharhlari (audit 2026-11-02, 3-bosqich: "ishonch dalillari", texnik
 * tayyorgarlik). Admin hali haqiqiy sharh kiritmagan bo'lsa — bo'sh massiv,
 * sayt hech narsa ko'rsatmaydi (soxta sharh yozilmaydi).
 */
export function getTestimonials(): SnapshotTestimonial[] {
  return siteSnapshot?.testimonials ?? [];
}

/** `lang` bo'yicha matn, bo'lmasa o'zbekchaga tushadi (boshqa lug'atlar kabi). */
export function testimonialText(t: SnapshotTestimonial, lang: Locale): string {
  return t.text[lang] || t.text.uz || '';
}

export function testimonialAuthorName(t: SnapshotTestimonial, lang: Locale): string {
  return t.authorName[lang] || t.authorName.uz || '';
}

export function testimonialAuthorRole(t: SnapshotTestimonial, lang: Locale): string | null {
  if (!t.authorRole) return null;
  return t.authorRole[lang] || t.authorRole.uz || null;
}

/** JSON-LD AggregateRating uchun: baho qo'ygan sharhlarning o'rtachasi, umuman bo'lmasa `null`. */
export function aggregateRating(items: SnapshotTestimonial[]): { ratingValue: string; reviewCount: number } | null {
  const rated = items.filter((t): t is SnapshotTestimonial & { rating: number } => t.rating !== null);
  if (!rated.length) return null;
  const avg = rated.reduce((sum, t) => sum + t.rating, 0) / rated.length;
  return { ratingValue: avg.toFixed(1), reviewCount: rated.length };
}
