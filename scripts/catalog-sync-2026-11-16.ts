/**
 * 2026-11-16: saytdagi katalogni eski SPS trotuar katalogi bilan tenglashtirish (bir martalik, takror ishga tushirish xavfsiz).
 *
 *   DATABASE_URL=postgres://... npm run catalog:sync-2026-11-16
 *
 * - scripts/catalog-add-2026-11-16.json `add`    → saytda yo'q bo'lgan trotuar modellari (nashrda, trotuar oxirida).
 *   Mavjud slug'lar o'zgartirilmaydi.
 * - `images` → rasmsiz turgan modellarga rasm (faqat rasmi bo'sh bo'lsa).
 * - `archive` → D01–D18 dekor panellar arxivga (eski katalogda yo'q, biznes qarori 2026-11-15).
 * Keyin admin → "Nashr qilish" (yoki Coolify Redeploy) — sayt yangi snapshot bilan qayta yig'iladi.
 */
import fs from 'node:fs';
import path from 'node:path';
import { and, eq, like, max, sql } from 'drizzle-orm';
import { getDb } from '../src/server/db/client.ts';
import { products } from '../src/server/db/schema.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const db = getDb();
if (!db) {
  console.error('DATABASE_URL berilmagan.');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/catalog-add-2026-11-16.json'), 'utf8'));

const [{ m }] = await db.select({ m: max(products.sort) }).from(products).where(eq(products.section, 'trotuar'));
let sort = (m ?? 1000) + 10;
let added = 0;
for (const x of data.add) {
  const res = await db
    .insert(products)
    .values({
      slug: x.slug,
      key: x.key,
      code: x.code,
      section: 'trotuar',
      status: 'published',
      sort,
      name: x.name,
      subtitle: x.subtitle,
      note: null,
      kg: x.kg,
      molds: x.molds,
      tiles: x.tiles,
      specs: x.specs,
      sizeEstimated: false,
      images: x.images,
    })
    .onConflictDoNothing({ target: products.slug })
    .returning({ id: products.id });
  if (res.length) added += 1;
  sort += 10;
}

let imaged = 0;
for (const [slug, images] of Object.entries(data.images)) {
  const res = await db
    .update(products)
    .set({ images: images as never, updatedAt: new Date() })
    .where(and(eq(products.slug, slug), sql`coalesce(${products.images}->>'scene','') = ''`))
    .returning({ id: products.id });
  imaged += res.length;
}

// Trotuar rasmlari: bosma katalogdagi aniq qolip surati + 3D sahna (eski 2026 studiya rasmlari xira edi).
// Admin yuklagan rasm (/media/...) bo'lsa — tegilmaydi.
let refreshed = 0;
for (const [slug, images] of Object.entries((data.refresh ?? {}) as Record<string, unknown>)) {
  const res = await db
    .update(products)
    .set({ images: images as never, updatedAt: new Date() })
    .where(and(eq(products.slug, slug), sql`${products.images}::text not like '%/media/%'`))
    .returning({ id: products.id });
  refreshed += res.length;
}

// Ruscha nomlar bosma katalogdan — faqat bo'sh bo'lsa (admin yozgan nom saqlanadi).
let named = 0;
for (const [slug, ru] of Object.entries((data.ruNames ?? {}) as Record<string, string>)) {
  const res = await db
    .update(products)
    .set({ name: sql`jsonb_set(${products.name}, '{ru}', ${JSON.stringify(ru)}::jsonb)`, updatedAt: new Date() })
    .where(and(eq(products.slug, slug), sql`coalesce(${products.name}->>'ru', '') = ''`))
    .returning({ id: products.id });
  named += res.length;
}

let archived = 0;
for (const code of data.archive as string[]) {
  const res = await db
    .update(products)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(and(eq(products.section, 'dekor'), like(products.slug, `${code}-%`)))
    .returning({ id: products.id });
  archived += res.length;
}

console.log(`Qo'shildi: ${added} / ${data.add.length}; rasm qo'yildi: ${imaged}; rasm yangilandi: ${refreshed}; ruscha nom: ${named}; arxivga: ${archived}.`);
process.exit(0);
