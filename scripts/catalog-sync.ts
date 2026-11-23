/**
 * Bazadagi katalogni `scripts/catalog-add-*.json` fayli bilan tenglashtirish (takror ishga tushirish xavfsiz).
 *
 *   DATABASE_URL=postgres://... npm run catalog:sync -- scripts/catalog-add-2026-11-23.json
 *   (fayl berilmasa — scripts/catalog-add-2026-11-16.json, `catalog:sync-2026-11-16` bilan bir xil)
 *
 * - `add`    → saytda yo'q mahsulotlar (nashrda). `section` berilmasa — trotuar; `novinka: true` — trotuar boshida
 *   (fayldagi tartibda), qolganlari oxirida. Boshqa bo'lim (masalan `tayyor_fasad`) — o'z bo'limining oxiriga.
 *   Mavjud slug'lar o'zgartirilmaydi.
 * - `images` → rasmsiz turgan modellarga rasm (faqat rasmi bo'sh bo'lsa).
 * - `moldPer` → qolipning 1 m² dagi soni (slug → "5,5"), faqat bo'sh bo'lsa.
 * - `archive` → D01–D18 dekor panellar arxivga (eski katalogda yo'q, biznes qarori 2026-11-15).
 * Keyin admin → "Nashr qilish" (yoki Coolify Redeploy) — sayt yangi snapshot bilan qayta yig'iladi.
 */
import fs from 'node:fs';
import path from 'node:path';
import { and, eq, inArray, like, max, min, sql } from 'drizzle-orm';
import { getDb } from '../src/server/db/client.ts';
import { products } from '../src/server/db/schema.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const db = getDb();
if (!db) {
  console.error('DATABASE_URL berilmagan.');
  process.exit(1);
}
const file = process.argv[2] ?? 'scripts/catalog-add-2026-11-16.json';
const data = JSON.parse(fs.readFileSync(path.resolve(ROOT, file), 'utf8'));

const [{ m, lo }] = await db
  .select({ m: max(products.sort), lo: min(products.sort) })
  .from(products)
  .where(eq(products.section, 'trotuar'));
let sort = (m ?? 1000) + 10;
// Novinkalar trotuar boshida: hali bazada yo'qlari soniga mavjud trotuar tartibi suriladi (tartib manfiy
// bo'lmaydi — admin formasi sort >= 0 talab qiladi). Takror ishga tushirishda yangi novinka yo'q → surilmaydi.
const novSlugs = (data.add as { slug: string; section?: string; novinka?: boolean }[])
  .filter((x) => x.novinka && (x.section ?? 'trotuar') === 'trotuar')
  .map((x) => x.slug);
const existing = novSlugs.length
  ? await db.select({ slug: products.slug }).from(products).where(inArray(products.slug, novSlugs))
  : [];
const missingNov = novSlugs.length - existing.length;
let first = Math.max(lo ?? 0, 0);
if (missingNov > 0) {
  await db
    .update(products)
    .set({ sort: sql`${products.sort} + ${missingNov * 10}` })
    .where(eq(products.section, 'trotuar'));
  sort += missingNov * 10;
}
let added = 0;
// Boshqa bo'limlar (masalan tayyor mahsulotlar: tayyor_fasad, tayyor_skameyka …) — o'z bo'limining oxiriga.
const otherSort = new Map<string, number>();
async function nextSort(section: string): Promise<number> {
  if (!otherSort.has(section)) {
    const [{ hi }] = await db!.select({ hi: max(products.sort) }).from(products).where(eq(products.section, section));
    otherSort.set(section, (hi ?? 0) + 10);
  }
  const v = otherSort.get(section)!;
  otherSort.set(section, v + 10);
  return v;
}
for (const x of data.add) {
  const section: string = x.section ?? 'trotuar';
  const isPaving = section === 'trotuar';
  const at = !isPaving ? await nextSort(section) : x.novinka ? first : sort;
  const res = await db
    .insert(products)
    .values({
      slug: x.slug,
      key: x.key ?? x.slug,
      code: x.code,
      section,
      status: 'published',
      sort: at,
      name: x.name,
      subtitle: x.subtitle,
      note: x.note ?? null,
      kg: x.kg ?? null,
      molds: x.molds ?? [],
      tiles: x.tiles ?? [],
      specs: x.specs ?? [],
      sizeEstimated: Boolean(x.sizeEstimated),
      images: x.images,
    })
    .onConflictDoNothing({ target: products.slug })
    .returning({ id: products.id });
  if (res.length) added += 1;
  if (!isPaving) continue;
  if (x.novinka) first += 10;
  else sort += 10;
}

let imaged = 0;
for (const [slug, images] of Object.entries((data.images ?? {}) as Record<string, unknown>)) {
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

// Qolipning "1 m² da nechta" qiymati bosma qolip katalogidan — faqat bo'sh bo'lsa (birinchi plitka qatori).
let perFilled = 0;
for (const [slug, per] of Object.entries((data.moldPer ?? {}) as Record<string, string>)) {
  const res = await db
    .update(products)
    .set({ tiles: sql`jsonb_set(${products.tiles}, '{0,per}', ${JSON.stringify(per)}::jsonb)`, updatedAt: new Date() })
    .where(
      and(
        eq(products.slug, slug),
        sql`jsonb_array_length(${products.tiles}) > 0`,
        sql`coalesce(${products.tiles}->0->>'per', '') = ''`,
      ),
    )
    .returning({ id: products.id });
  perFilled += res.length;
}

let archived = 0;
for (const code of (data.archive ?? []) as string[]) {
  const res = await db
    .update(products)
    .set({ status: 'archived', updatedAt: new Date() })
    .where(and(eq(products.section, 'dekor'), like(products.slug, `${code}-%`)))
    .returning({ id: products.id });
  archived += res.length;
}

console.log(
  `Qo'shildi: ${added} / ${data.add.length}; rasm qo'yildi: ${imaged}; rasm yangilandi: ${refreshed}; ruscha nom: ${named}; 1 m²: ${perFilled}; arxivga: ${archived}.`,
);
process.exit(0);
