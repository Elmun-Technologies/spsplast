import { siteSnapshot } from '../data/site.generated.ts';
import type { SnapshotSeoPage } from './snapshotTypes.ts';

/**
 * Admin → SEO → "Sahifalar": sahifa title/description/H1/kirish matni va `noindex`
 * (`seo_pages` jadvali → build snapshot). Bo'sh maydon — lug'atdagi standart matn.
 *
 * `noindex` sahifa darajasida (uch tilga birdan): sahifa `robots: noindex, follow`
 * oladi va sitemap'dan chiqariladi — aks holda hreflang to'plami yarim qolardi.
 */
export type SeoOverride = { title?: string; description?: string; h1?: string; intro?: string; noindex: boolean };

type Lang = 'uz' | 'ru' | 'en';

/** Sof funksiya (testlar uchun): berilgan ro'yxatdan (path, lang) bo'yicha qiymat. */
export function seoOverrideFrom(rows: SnapshotSeoPage[] | null | undefined, lang: Lang, path: string): SeoOverride | null {
  if (!rows?.length) return null;
  const forPath = rows.filter((r) => r.path === path);
  if (!forPath.length) return null;
  const row = forPath.find((r) => r.lang === lang);
  const pick = (v: string | null | undefined) => (v && v.trim() ? v.trim() : undefined);
  return {
    title: pick(row?.title),
    description: pick(row?.description),
    h1: pick(row?.h1),
    intro: pick(row?.intro),
    noindex: forPath.some((r) => r.noindex),
  };
}

export function seoOverride(lang: Lang, path: string): SeoOverride | null {
  return seoOverrideFrom(siteSnapshot?.seo, lang, path);
}

/** `noindex` belgilangan sahifalar (til prefiksisiz yo'l) — sitemap ularni chiqarmaydi. */
export function noindexPathsFrom(rows: SnapshotSeoPage[] | null | undefined): Set<string> {
  return new Set((rows ?? []).filter((r) => r.noindex).map((r) => r.path));
}

export function noindexPaths(): Set<string> {
  return noindexPathsFrom(siteSnapshot?.seo);
}
