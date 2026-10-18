/** Admin (baza) → build paytida sayt "surati" (scripts/export-snapshot.mjs). */
export type SnapshotLocalized = { uz: string | null; ru: string | null; en: string | null };

export type SnapshotSection = { key: string; slug: string; name: SnapshotLocalized; sort: number };

export type SiteSnapshot = {
  generatedAt: string;
  /** Integratsiya sozlamalari (kalit → qiymat), `src/lib/integrations.ts`. */
  settings: Record<string, string>;
  /** `null` — katalog bazaga hali import qilinmagan, statik katalog ishlatiladi. */
  sections: SnapshotSection[] | null;
  models: unknown[] | null;
};
