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
 * - `patch`  → mavjud mahsulotning nomi/o'lchami ustidan yozadi (name, subtitle, note, kg, molds, tiles, sizeEstimated) —
 *   egasi tasdiqlagan tuzatishlar; slug va rasmlar o'zgarmaydi.
 * - `moldPer` → qolipning 1 m² dagi soni (slug → "5,5"), faqat bo'sh bo'lsa.
 * - `archive` → D01–D18 dekor panellar arxivga (eski katalogda yo'q, biznes qarori 2026-11-15).
 * Keyin admin → "Nashr qilish" (yoki Coolify Redeploy) — sayt yangi snapshot bilan qayta yig'iladi.
 *
 * `--pending` (deploy'da, `db:migrate:deploy` dan keyin): barcha `scripts/catalog-add-*.json` nom tartibida; bazadagi
 * `catalog_sync_log` da shu fayl shu sha bilan bo'lsa — o'tkaziladi, aks holda qo'llanadi va yoziladi. Shunday qilib
 * har yangi to'plam birinchi deploy'da bazaga tushadi, keyingilarida admin o'zgarishlari ustidan yozilmaydi.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { and, eq, inArray, like, max, min, sql } from 'drizzle-orm';
import { getDb } from '../src/server/db/client.ts';
import { catalogSyncLog, products } from '../src/server/db/schema.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
type Db = NonNullable<ReturnType<typeof getDb>>;
type SyncData = any;

async function syncFile(db: Db, data: SyncData): Promise<string> {
  const [{ m, lo }] = await db
    .select({ m: max(products.sort), lo: min(products.sort) })
    .from(products)
    .where(eq(products.section, 'trotuar'));
  let sort = (m ?? 1000) + 10;
  // Novinkalar trotuar boshida: hali bazada yo'qlari soniga mavjud trotuar tartibi suriladi (tartib manfiy
  // bo'lmaydi — admin formasi sort >= 0 talab qiladi). Takror ishga tushirishda yangi novinka yo'q → surilmaydi.
  const novSlugs = ((data.add ?? []) as { slug: string; section?: string; novinka?: boolean }[])
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
      const [{ hi }] = await db.select({ hi: max(products.sort) }).from(products).where(eq(products.section, section));
      otherSort.set(section, (hi ?? 0) + 10);
    }
    const v = otherSort.get(section)!;
    otherSort.set(section, v + 10);
    return v;
  }
  for (const x of data.add ?? []) {
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

  // `patch` — egasi tasdiqlagan nom/o'lcham tuzatishlari: ko'rsatilgan maydonlar USTIDAN yoziladi (fayl sha'si
  // o'zgarmaguncha bir marta). Faqat ruxsat etilgan maydonlar; slug (URL) va rasmlar bu yerda o'zgarmaydi.
  let patched = 0;
  const PATCHABLE = ['name', 'subtitle', 'note', 'kg', 'molds', 'tiles', 'sizeEstimated'] as const;
  for (const [slug, raw] of Object.entries((data.patch ?? {}) as Record<string, Record<string, unknown>>)) {
    const set: Record<string, unknown> = {};
    for (const k of PATCHABLE) if (k in raw) set[k] = raw[k];
    if (!Object.keys(set).length) continue;
    const res = await db
      .update(products)
      .set({ ...(set as object), updatedAt: new Date() })
      .where(eq(products.slug, slug))
      .returning({ id: products.id });
    patched += res.length;
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
  return `Qo'shildi: ${added} / ${(data.add ?? []).length}; rasm qo'yildi: ${imaged}; rasm yangilandi: ${refreshed}; ruscha nom: ${named}; tuzatildi: ${patched}; 1 m²: ${perFilled}; arxivga: ${archived}.`;
}

async function pending(db: Db): Promise<void> {
  const files = fs
    .readdirSync(path.join(ROOT, 'scripts'))
    .filter((f) => /^catalog-add-.*\.json$/.test(f))
    .sort();
  const done = new Map((await db.select().from(catalogSyncLog)).map((r) => [r.file, r.sha]));
  for (const f of files) {
    const raw = fs.readFileSync(path.join(ROOT, 'scripts', f), 'utf8');
    const sha = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
    if (done.get(f) === sha) continue;
    const result = await syncFile(db, JSON.parse(raw));
    await db
      .insert(catalogSyncLog)
      .values({ file: f, sha, result })
      .onConflictDoUpdate({ target: catalogSyncLog.file, set: { sha, result, appliedAt: new Date() } });
    console.log(`[catalog-sync] ${f}: ${result}`);
  }
}

const db = getDb();
if (!db) {
  if (process.argv.includes('--pending')) {
    console.log("[catalog-sync] DATABASE_URL yo'q — o'tkazib yuborildi.");
    process.exit(0);
  }
  console.error('DATABASE_URL berilmagan.');
  process.exit(1);
}
if (process.argv.includes('--pending')) {
  const env = process.env.VERCEL_ENV;
  if (env && env !== 'production' && process.env.MIGRATE_PREVIEW !== '1') {
    console.log(`[catalog-sync] ${env} build — o'tkazib yuborildi.`);
    process.exit(0);
  }
  try {
    await pending(db);
  } catch (error) {
    // Deploy to'xtamasin: sayt eski katalog bilan chiqadi, keyingi deploy qayta urinadi (fayl jurnalga yozilmagan).
    console.error('[catalog-sync] XATO — katalog bazaga yuklanmadi:', error);
  }
} else {
  const file = process.argv[2] ?? 'scripts/catalog-add-2026-11-16.json';
  console.log(await syncFile(db, JSON.parse(fs.readFileSync(path.resolve(ROOT, file), 'utf8'))));
}
process.exit(0);
