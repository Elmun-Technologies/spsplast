import { and, asc, eq, sql } from 'drizzle-orm';
import type { Db } from './db/client.ts';
import { CONTENT_LANGS, type ContentLang, redirects, seoPages, siteSettings } from './db/schema.ts';
import { cleanCopy, copyError } from './copyRules.ts';
import { indexablePaths } from '../lib/sitePaths.ts';

/**
 * Admin → SEO: sahifa meta-ma'lumotlari (`seo_pages`) va 301 yo'naltirishlar (`redirects`).
 * Saytga "Nashr qilish" (build snapshot) bilan chiqadi: `src/lib/seoOverrides.ts`,
 * `src/data/redirects.generated.json` → next.config.js.
 */

export const SEO_LIMITS = { title: 70, description: 300, h1: 120, intro: 1200 } as const;
/** SERP tavsiyasi: title (+ " · SPS Plast" suffiksi) ≤ 65, description 50–170. */
export const SEO_HINTS = { titleMax: 53, descriptionMin: 50, descriptionMax: 170 } as const;
/** H1/kirish matni faqat shu turdagi sahifalarda chiqadi (boshqalarida maket matni). */
export const H1_KINDS = ['section', 'tag', 'export'] as const;

export type SeoFields = { title: string; description: string; h1: string; intro: string };
export type SeoInput = Record<ContentLang, SeoFields>;

export function knownPath(path: string) {
  return indexablePaths().find((p) => p.path === path) ?? null;
}

export async function listSeoPages(db: Db) {
  return db.select().from(seoPages).orderBy(asc(seoPages.path), asc(seoPages.lang));
}

export async function getSeoPage(db: Db, path: string) {
  return db.select().from(seoPages).where(eq(seoPages.path, path));
}

/** O'chirish ham "saytga chiqmagan o'zgarish" bo'lishi uchun (pendingChanges vaqt bo'yicha sanaydi). */
export async function touchRevision(db: Db, userId: number, scope: string) {
  const key = `_rev_${scope}`;
  const value = new Date().toISOString();
  await db
    .insert(siteSettings)
    .values({ key, value, updatedBy: userId, updatedAt: new Date() })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedBy: userId, updatedAt: new Date() } });
}

/**
 * Sahifa SEO'sini saqlaydi. Hamma maydon bo'sh va noindex o'chiq bo'lsa — yozuv o'chadi
 * (standart matnga qaytadi). Xatolar: `{ 'ru.title': 'juda uzun …' }`.
 */
export async function saveSeoPage(
  db: Db,
  userId: number,
  path: string,
  input: SeoInput,
  noindex: boolean,
): Promise<{ ok: true } | { ok: false; errors: Record<string, string> }> {
  const page = knownPath(path);
  if (!page) return { ok: false, errors: { path: "Bunday sahifa yo'q (sitemap ro'yxatida emas)" } };
  const errors: Record<string, string> = {};
  const rows: { lang: ContentLang; title: string | null; description: string | null; h1: string | null; intro: string | null }[] = [];
  for (const lang of CONTENT_LANGS) {
    const f = input[lang] ?? { title: '', description: '', h1: '', intro: '' };
    const v = {
      title: cleanCopy(f.title ?? ''),
      description: cleanCopy(f.description ?? ''),
      h1: cleanCopy(f.h1 ?? ''),
      intro: cleanCopy(f.intro ?? '', true),
    };
    for (const k of ['title', 'description', 'h1', 'intro'] as const) {
      if (!v[k]) continue;
      const e = copyError(v[k], lang, SEO_LIMITS[k]);
      if (e) errors[`${lang}.${k}`] = e;
    }
    if ((v.h1 || v.intro) && !(H1_KINDS as readonly string[]).includes(page.kind)) {
      errors[`${lang}.h1`] = "H1 va kirish matni faqat bo'lim, teg va eksport sahifalarida almashtiriladi";
    }
    rows.push({ lang, title: v.title || null, description: v.description || null, h1: v.h1 || null, intro: v.intro || null });
  }
  if (Object.keys(errors).length) return { ok: false, errors };

  const empty = rows.every((r) => !r.title && !r.description && !r.h1 && !r.intro) && !noindex;
  await db.delete(seoPages).where(eq(seoPages.path, path));
  if (!empty) {
    const now = new Date();
    await db.insert(seoPages).values(rows.map((r) => ({ path, ...r, noindex, updatedBy: userId, updatedAt: now })));
  } else {
    await touchRevision(db, userId, 'seo');
  }
  return { ok: true };
}

// --- 301 yo'naltirishlar ---------------------------------------------------------

/** Saytning o'z yo'llari: bularni yo'naltirib bo'lmaydi (admin, API, statik fayllar). */
const RESERVED = /^\/(admin|api|_next|media|fonts|images|icons|catalog\/2027|catalog\/pdf|sitemap|robots|indexnow-key)(\/|\.|$)/;
const PATH_CHARS = /^\/[A-Za-z0-9\-._~/%+!$&'()*,;=:@]*$/;

export function normalizeRedirectPath(input: string): string {
  let p = input.trim();
  try {
    // To'liq URL kiritilsa (https://sps.uz/ru/old) faqat yo'l olinadi.
    if (/^https?:\/\//i.test(p)) p = new URL(p).pathname;
  } catch {
    /* pastdagi tekshiruv ushlaydi */
  }
  p = p.replace(/[?#].*$/, '');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p;
}

/**
 * Manba: aniq yo'l (`/ru/old-page`) yoki oxirida `*` (`/ru/blog/*` → ichidagi hammasi).
 * Manzil: sayt ichidagi yo'l (`/ru/catalog`) yoki `https://` URL.
 */
export function validateRedirect(
  sourceRaw: string,
  destinationRaw: string,
  existing: { source: string; destination: string }[],
): { ok: true; source: string; destination: string } | { ok: false; error: string } {
  const wildcard = /\/\*$/.test(sourceRaw.trim());
  const base = normalizeRedirectPath(sourceRaw.trim().replace(/\/\*$/, ''));
  const source = wildcard ? `${base === '/' ? '' : base}/:path*` : base;
  const destination = /^https:\/\//i.test(destinationRaw.trim()) ? destinationRaw.trim() : normalizeRedirectPath(destinationRaw);
  if (!base.startsWith('/') || base.startsWith('//')) return { ok: false, error: "Manba / bilan boshlanishi kerak (masalan /ru/eski-sahifa)" };
  if (base === '/' && !wildcard) return { ok: false, error: "Bosh sahifani (/) yo'naltirib bo'lmaydi" };
  if (!PATH_CHARS.test(base) || base.length > 300) return { ok: false, error: "Manbada ruxsat etilmagan belgi bor" };
  if (/:/.test(base)) return { ok: false, error: "Manbada ':' bo'lmasin (hamma ichki sahifalar uchun oxiriga /* qo'ying)" };
  if (RESERVED.test(base)) return { ok: false, error: "Saytning tizim yo'lini (admin, api, rasmlar) yo'naltirib bo'lmaydi" };
  if (destination.startsWith('https://')) {
    try {
      new URL(destination);
    } catch {
      return { ok: false, error: "Manzil URL noto'g'ri" };
    }
    if (/[<>"\s]/.test(destination)) return { ok: false, error: "Manzil URL noto'g'ri" };
  } else if (!destination.startsWith('/') || destination.startsWith('//') || !PATH_CHARS.test(destination)) {
    return { ok: false, error: "Manzil /ru/catalog kabi yo'l yoki https:// bilan boshlanuvchi URL bo'lsin" };
  }
  if (destination === base || destination === source) return { ok: false, error: "Manba va manzil bir xil — cheksiz aylanish bo'ladi" };
  const others = existing.filter((r) => r.source !== source);
  if (others.some((r) => r.source === destination)) {
    return { ok: false, error: "Manzil o'zi boshqa yo'naltirishning manbai — zanjir bo'ladi; to'g'ridan-to'g'ri oxirgi sahifani yozing" };
  }
  if (others.some((r) => r.destination === source)) {
    return { ok: false, error: "Boshqa yo'naltirish shu manbaga olib keladi — zanjir bo'ladi; avval o'shani tahrirlang" };
  }
  return { ok: true, source, destination };
}

export async function listRedirects(db: Db) {
  return db.select().from(redirects).orderBy(asc(redirects.source));
}

export async function addRedirect(db: Db, userId: number, source: string, destination: string, note: string) {
  const existing = await db.select({ source: redirects.source, destination: redirects.destination }).from(redirects);
  const v = validateRedirect(source, destination, existing);
  if (!v.ok) return v;
  const now = new Date();
  await db
    .insert(redirects)
    .values({ source: v.source, destination: v.destination, note: note.trim().slice(0, 200) || null, createdBy: userId, updatedAt: now })
    .onConflictDoUpdate({ target: redirects.source, set: { destination: v.destination, note: note.trim().slice(0, 200) || null, updatedAt: now } });
  return v;
}

export async function deleteRedirect(db: Db, userId: number, id: number) {
  await db.delete(redirects).where(eq(redirects.id, id));
  await touchRevision(db, userId, 'redirects');
}

/** Snapshot formati (next.config.js `redirects()`). */
export function redirectsForConfig(rows: { source: string; destination: string }[]) {
  return rows.map((r) => ({ source: r.source, destination: r.destination, statusCode: 301 as const }));
}

export async function seoCounts(db: Db) {
  const [[p], [r]] = await Promise.all([
    db.select({ n: sql<number>`count(distinct ${seoPages.path})::int`, noindex: sql<number>`count(distinct ${seoPages.path}) filter (where ${seoPages.noindex})::int` }).from(seoPages),
    db.select({ n: sql<number>`count(*)::int` }).from(redirects),
  ]);
  return { pages: p.n, noindex: p.noindex, redirects: r.n };
}

export async function deleteSeoPage(db: Db, userId: number, path: string, lang?: ContentLang) {
  await db.delete(seoPages).where(lang ? and(eq(seoPages.path, path), eq(seoPages.lang, lang)) : eq(seoPages.path, path));
  await touchRevision(db, userId, 'seo');
}
