import { asc, eq } from 'drizzle-orm';
import type { Db } from './db/client.ts';
import { testimonials, type LocalizedText } from './db/schema.ts';

/**
 * Mijoz sharhlari admini (audit 2026-11-02, 3-bosqich: "ishonch dalillari",
 * texnik tayyorgarlik — `scripts/export-snapshot.mjs` faqat `visible` qatorlarni
 * saytga chiqaradi, jadval bo'sh bo'lsa sayt hech narsa ko'rsatmaydi).
 */

export async function listTestimonials(db: Db) {
  return db.select().from(testimonials).orderBy(asc(testimonials.sort), asc(testimonials.id));
}

export type TestimonialInput = {
  authorName: LocalizedText;
  authorRole: LocalizedText | null;
  text: LocalizedText;
  rating: number | null;
  sort: number;
  visible: boolean;
};

export async function saveTestimonial(db: Db, id: number | null, input: TestimonialInput): Promise<string | null> {
  if (!input.authorName.uz?.trim()) return "Mijoz ismi (UZ) majburiy.";
  if (!input.text.uz?.trim()) return "Sharh matni (UZ) majburiy.";
  if (input.rating !== null && (input.rating < 1 || input.rating > 5)) return 'Baho 1 dan 5 gacha bo\'lishi kerak.';
  const values = { ...input, updatedAt: new Date() };
  if (id === null) await db.insert(testimonials).values(values);
  else await db.update(testimonials).set(values).where(eq(testimonials.id, id));
  return null;
}

export async function deleteTestimonial(db: Db, id: number): Promise<void> {
  await db.delete(testimonials).where(eq(testimonials.id, id));
}
