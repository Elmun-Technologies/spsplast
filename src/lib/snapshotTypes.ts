/** Admin (baza) → build paytida sayt "surati" (scripts/export-snapshot.mjs). */
export type SnapshotLocalized = { uz: string | null; ru: string | null; en: string | null };

export type SnapshotSection = { key: string; slug: string; name: SnapshotLocalized; sort: number };

/** Admin → SEO → Sahifalar (`seo_pages`). */
export type SnapshotSeoPage = {
  path: string;
  lang: 'uz' | 'ru' | 'en';
  title: string | null;
  description: string | null;
  h1: string | null;
  intro: string | null;
  noindex: boolean;
};

export type SiteSnapshot = {
  generatedAt: string;
  /** Integratsiya sozlamalari (kalit → qiymat), `src/lib/integrations.ts`. */
  settings: Record<string, string>;
  /** `null` — katalog bazaga hali import qilinmagan, statik katalog ishlatiladi. */
  sections: SnapshotSection[] | null;
  models: unknown[] | null;
  /** Sahifa SEO'si (eski snapshot'larda yo'q). */
  seo?: SnapshotSeoPage[];
  /** Matnlar (CMS): til → `pages.home.h1` kabi kalit → matn. */
  texts?: Partial<Record<'uz' | 'ru' | 'en', Record<string, string>>>;
};
