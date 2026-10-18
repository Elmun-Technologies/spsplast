import { and, asc, count, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import type { Db } from './db/client.ts';
import {
  catalogSections,
  products,
  PRODUCT_STATUSES,
  type LocalizedText,
  type ProductImages,
  type ProductMold,
  type ProductSpec,
  type ProductStatus,
  type ProductTile,
} from './db/schema.ts';

/**
 * Katalog admini (Bosqich 9). Saytga faqat `status = 'published'` va ko'rinadigan
 * bo'limdagi mahsulotlar chiqadi (scripts/export-snapshot.mjs, "Nashr qilish").
 */

export const EMPTY_IMAGES: ProductImages = { scene: null, sceneSm: null, molds: {}, tiles: {} };

export const DEFAULT_SECTIONS = [
  { key: 'trotuar', slug: 'paving', name: { uz: 'Trotuar plitkasi', ru: 'Тротуарная плитка', en: 'Paving tiles' }, sort: 10 },
  { key: 'fasad', slug: 'facade', name: { uz: 'Fasad', ru: 'Фасад', en: 'Facade' }, sort: 20 },
  { key: 'termopanel', slug: 'thermal-panels', name: { uz: 'Fasad termopanellari', ru: 'Фасадные термопанели', en: 'Facade thermal panels' }, sort: 30 },
  { key: 'fasad_dekor', slug: 'facade-decor', name: { uz: 'Fasad dekor elementlari', ru: 'Фасадный декор', en: 'Facade decor elements' }, sort: 40 },
  { key: 'zabor', slug: 'fence', name: { uz: 'Zabor panellari', ru: 'Заборные панели', en: 'Fence panels' }, sort: 50 },
  { key: 'dekor', slug: 'decor', name: { uz: 'Dekor panellar', ru: 'Декор-панели', en: 'Decor panels' }, sort: 60 },
  { key: 'skameyka', slug: 'bench', name: { uz: 'Skameyka oyoqlari', ru: 'Ножки скамеек', en: 'Bench legs' }, sort: 70 },
];

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(input: string): string {
  const map: Record<string, string> = { '№': '', "'": '', 'ʻ': '', 'ʼ': '', '’': '', '‘': '', '×': 'x' };
  const cyr: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
    н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh',
    ъ: '', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
  };
  return input
    .toLowerCase()
    .split('')
    .map((c) => map[c] ?? cyr[c] ?? c)
    .join('')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// --- Bo'limlar ------------------------------------------------------------------

export async function listSections(db: Db) {
  const rows = await db.select().from(catalogSections).orderBy(asc(catalogSections.sort), asc(catalogSections.key));
  const counts = await db
    .select({
      section: products.section,
      total: count(),
      published: sql<number>`count(*) filter (where ${products.status} = 'published')::int`,
    })
    .from(products)
    .groupBy(products.section);
  const by = new Map(counts.map((c) => [c.section, c]));
  return rows.map((r) => ({ ...r, total: by.get(r.key)?.total ?? 0, published: by.get(r.key)?.published ?? 0 }));
}

export async function saveSection(
  db: Db,
  input: { key: string; slug: string; name: LocalizedText; sort: number; visible: boolean },
  isNew: boolean,
): Promise<string | null> {
  if (!/^[a-z][a-z0-9_]{1,30}$/.test(input.key)) return "Kalit: lotin kichik harflar, raqam, '_' (masalan termopanel).";
  if (!SLUG_RE.test(input.slug)) return "URL slug: lotin kichik harflar, raqam va '-' (masalan thermal-panels).";
  if (!input.name.uz?.trim()) return "O'zbekcha nom majburiy.";
  const values = { slug: input.slug, name: input.name, sort: input.sort, visible: input.visible, updatedAt: new Date() };
  try {
    if (isNew) await db.insert(catalogSections).values({ key: input.key, ...values });
    else await db.update(catalogSections).set(values).where(eq(catalogSections.key, input.key));
  } catch (error) {
    if (isUnique(error)) return 'Bu kalit yoki slug band.';
    throw error;
  }
  return null;
}

export async function deleteSection(db: Db, key: string): Promise<string | null> {
  const [{ n }] = await db.select({ n: count() }).from(products).where(eq(products.section, key));
  if (n > 0) return `Bo'limda ${n} ta mahsulot bor — avval ularni boshqa bo'limga o'tkazing yoki o'chiring.`;
  await db.delete(catalogSections).where(eq(catalogSections.key, key));
  return null;
}

// --- Mahsulotlar -----------------------------------------------------------------

export type ProductInput = {
  slug: string;
  code: string | null;
  section: string;
  status: ProductStatus;
  sort: number;
  name: LocalizedText;
  subtitle: LocalizedText;
  note: LocalizedText | null;
  kg: string | null;
  molds: ProductMold[];
  tiles: ProductTile[];
  specs: ProductSpec[];
  sizeEstimated: boolean;
  images: ProductImages;
};

/** Saytda "soxta" ko'rinmasligi uchun nashrdan oldingi tekshiruv. */
export function completeness(p: Pick<ProductInput, 'name' | 'images' | 'molds' | 'tiles' | 'specs' | 'kg'> & { section: string }) {
  const hasImage = !!(p.images.scene || p.images.sceneSm || Object.keys(p.images.molds).length || Object.keys(p.images.tiles).length);
  const isMold = p.molds.length > 0;
  const checks = [
    { key: 'image', label: 'Rasm', ok: hasImage, critical: true },
    { key: 'ru', label: 'Ruscha nom', ok: !!p.name.ru?.trim(), critical: false },
    { key: 'en', label: 'Inglizcha nom', ok: !!p.name.en?.trim(), critical: false },
    {
      key: 'data',
      label: isMold ? "Qolip o'lchami" : 'Texnik jadval',
      ok: isMold ? !!p.molds[0]?.size : p.specs.length > 0 || p.tiles.length > 0,
      critical: false,
    },
  ];
  if (isMold && (p.section === 'trotuar' || p.tiles.length)) {
    checks.push({ key: 'per', label: '1 m² ga dona', ok: !!p.tiles[0]?.per, critical: false });
    checks.push({ key: 'kg', label: '1 m² vazni', ok: !!p.kg, critical: false });
  }
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return { checks, score, publishable: checks.every((c) => !c.critical || c.ok) };
}

export type ProductFilters = { q?: string; section?: string; status?: ProductStatus; missing?: 'image' | 'ru' | 'en' };

export async function listProducts(db: Db, f: ProductFilters = {}) {
  const cond = [];
  if (f.section) cond.push(eq(products.section, f.section));
  if (f.status) cond.push(eq(products.status, f.status));
  const q = f.q?.trim();
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`).replace(/^№\s*/, '')}%`;
    cond.push(or(ilike(products.code, like), ilike(products.slug, like), sql`${products.name}::text ilike ${like}`));
  }
  if (f.missing === 'image')
    cond.push(sql`${products.images}->>'scene' is null and ${products.images}->>'sceneSm' is null and ${products.images}->'molds' = '{}'::jsonb and ${products.images}->'tiles' = '{}'::jsonb`);
  if (f.missing === 'ru') cond.push(sql`coalesce(${products.name}->>'ru', '') = ''`);
  if (f.missing === 'en') cond.push(sql`coalesce(${products.name}->>'en', '') = ''`);
  return db
    .select()
    .from(products)
    .where(cond.length ? and(...cond) : undefined)
    .orderBy(asc(products.sort), asc(products.id));
}

export async function productStatusCounts(db: Db) {
  const rows = await db.select({ status: products.status, n: count() }).from(products).groupBy(products.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Partial<Record<ProductStatus, number>>;
}

export async function getProduct(db: Db, id: number) {
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return row ?? null;
}

function isUnique(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === '23505' || e?.cause?.code === '23505';
}

/** Saqlash. Xato bo'lsa matn qaytadi (forma ostida ko'rsatiladi). */
export async function saveProduct(db: Db, id: number | null, input: ProductInput): Promise<{ id?: number; error?: string }> {
  if (!SLUG_RE.test(input.slug)) return { error: "URL slug: lotin kichik harflar, raqam va '-'." };
  if (!input.name.uz?.trim()) return { error: "O'zbekcha nom majburiy." };
  if (!PRODUCT_STATUSES.includes(input.status)) return { error: "Holat noto'g'ri." };
  if (/yarat/i.test(JSON.stringify([input.name.uz, input.subtitle.uz, input.note?.uz, input.specs.map((s) => s.v.uz)]))) {
    return { error: '"yaratish" so\'zi o\'zbek matnida ishlatilmaydi — "ishlab chiqarilgan" deb yozing.' };
  }
  const [section] = await db.select({ key: catalogSections.key }).from(catalogSections).where(eq(catalogSections.key, input.section)).limit(1);
  if (!section) return { error: "Bo'lim tanlanmagan." };
  const values = { ...input, key: input.code ? `${input.section.slice(0, 1)}${input.code}`.toLowerCase() : input.slug, updatedAt: new Date() };
  try {
    if (id) {
      await db.update(products).set(values).where(eq(products.id, id));
      return { id };
    }
    const [row] = await db.insert(products).values(values).returning({ id: products.id });
    return { id: row.id };
  } catch (error) {
    if (isUnique(error)) return { error: 'Bu URL slug boshqa mahsulotda bor.' };
    throw error;
  }
}

export async function setProductsStatus(db: Db, ids: number[], status: ProductStatus): Promise<{ changed: number; skipped: number }> {
  if (!ids.length) return { changed: 0, skipped: 0 };
  const rows = await db.select().from(products).where(inArray(products.id, ids));
  const ok = rows;
  if (ok.length) {
    await db
      .update(products)
      .set({ status, updatedAt: new Date() })
      .where(inArray(
        products.id,
        ok.map((r) => r.id),
      ));
  }
  return { changed: ok.length, skipped: rows.length - ok.length };
}

export async function deleteProduct(db: Db, id: number): Promise<void> {
  await db.delete(products).where(eq(products.id, id));
}

// --- Import (statik katalog / Excel → baza) --------------------------------------

type StaticModel = Omit<ProductInput, 'status' | 'sort'> & { key?: string };

/**
 * `data/models-2027.json` (nashr qilingan) + `data/termopanel-2027.json` (qoralama).
 * Mavjud slug'lar qayta yozilmaydi (admin'dagi tahrirlar saqlanadi) — faqat yangilari qo'shiladi.
 */
export async function importCatalog(
  db: Db,
  models: StaticModel[],
  extras: { code: string; slug: string; section: string; name: LocalizedText; subtitle: LocalizedText; specs: ProductSpec[] }[] = [],
): Promise<{ sections: number; added: number; skipped: number }> {
  let sections = 0;
  for (const s of DEFAULT_SECTIONS) {
    const res = await db.insert(catalogSections).values(s).onConflictDoNothing().returning({ key: catalogSections.key });
    sections += res.length;
  }
  let added = 0;
  let skipped = 0;
  const rows = [
    ...models.map((m, i) => ({
      slug: m.slug,
      key: m.key ?? m.slug,
      code: m.code,
      section: m.section,
      // Hozirgi saytdagi holat saqlanadi (rasmsizlar ham nashrda) — admin'da "Rasmsiz" filtri bilan ko'rinadi.
      status: 'published' as ProductStatus,
      sort: (i + 1) * 10,
      name: m.name,
      subtitle: m.subtitle,
      note: m.note ?? null,
      kg: m.kg,
      molds: m.molds,
      tiles: m.tiles,
      specs: m.specs,
      sizeEstimated: m.sizeEstimated,
      images: m.images ?? EMPTY_IMAGES,
    })),
    ...extras.map((e, i) => ({
      slug: e.slug,
      key: e.slug,
      code: e.code,
      section: e.section,
      status: 'draft' as ProductStatus,
      sort: 5000 + i * 10,
      name: e.name,
      subtitle: e.subtitle,
      note: null,
      kg: null,
      molds: [],
      tiles: [],
      specs: e.specs,
      sizeEstimated: false,
      images: EMPTY_IMAGES,
    })),
  ];
  for (const r of rows) {
    const res = await db.insert(products).values(r).onConflictDoNothing({ target: products.slug }).returning({ id: products.id });
    if (res.length) added += 1;
    else skipped += 1;
  }
  return { sections, added, skipped };
}
