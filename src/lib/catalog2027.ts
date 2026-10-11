import { models2027 } from '../data/models2027.ts';
import type { Locale } from '@/lib/i18n';

/**
 * Katalog 2027 — yagona statik manba (`data/models-2027.json`, generator:
 * scripts/extract/build_models_2027.py). Ma'lumotlar bazasi yo'q.
 * Sxema: docs/design-handoff/HANDOFF.md 5-bo'lim.
 */
export type Section = 'trotuar' | 'fasad' | 'zabor' | 'dekor' | 'skameyka';

export type Localized = { uz: string | null; ru: string | null; en: string | null };

export type Mold = { l: string; size: string | null; depth: string | null; g: number | null };
export type Tile = { l: string; size: string | null; per: string | null };

export type Model = {
  key: string;
  code: string | null;
  slug: string;
  section: Section;
  name: Localized;
  subtitle: Localized;
  note?: Localized | null;
  kg: string | null;
  molds: Mold[];
  tiles: Tile[];
  specs: { k: Localized; v: Localized }[];
  sizeEstimated: boolean;
  images: {
    scene: string | null;
    sceneSm: string | null;
    molds: Record<string, string>;
    tiles: Record<string, string>;
  };
};

export const SECTIONS: Section[] = ['trotuar', 'fasad', 'zabor', 'dekor', 'skameyka'];

/** Marshrut slug'lari (HANDOFF 4): /{lang}/catalog/{slug}. */
export const SECTION_SLUGS: Record<Section, string> = {
  trotuar: 'paving',
  fasad: 'facade',
  zabor: 'fence',
  dekor: 'decor',
  skameyka: 'bench',
};

export function sectionFromSlug(slug: string): Section | undefined {
  return SECTIONS.find((s) => SECTION_SLUGS[s] === slug);
}

const models = models2027 as unknown as Model[];

export function getModels(): Model[] {
  return models;
}

export function getTotalCount(): number {
  return models.length;
}

export function getSectionCounts(): Record<Section, number> {
  const counts = { trotuar: 0, fasad: 0, zabor: 0, dekor: 0, skameyka: 0 } as Record<Section, number>;
  for (const m of models) counts[m.section] += 1;
  return counts;
}

export function getModelsBySection(section: Section): Model[] {
  return models.filter((m) => m.section === section);
}

export function getModelBySlug(slug: string): Model | undefined {
  return models.find((m) => m.slug === slug);
}

/** Nom: so'ralgan til, bo'lmasa uz (ru/en nomlar biznesdan kutilmoqda). */
export function modelName(m: Model, lang: Locale): string {
  return m.name[lang] || m.name.uz || m.slug;
}

export function localizedText(value: Localized | null | undefined, lang: Locale): string | null {
  if (!value) return null;
  return value[lang] || value.uz;
}

/* --- Filtr uchun hosila maydonlar (HANDOFF 5) ------------------------------- */

export type UseGroup = 'walk' | 'yard' | 'car';

export function modelThickness(m: Model): number | null {
  const depth = m.molds[0]?.depth;
  if (!depth) return null;
  const v = Number(depth);
  return Number.isFinite(v) ? v : null;
}

export function modelUse(m: Model): UseGroup | null {
  if (m.section !== 'trotuar') return null;
  const t = modelThickness(m);
  if (t === null) return null;
  if (t <= 30) return 'walk';
  if (t <= 40) return 'yard';
  return 'car';
}

export type SizeGroup = '300' | '400' | '200' | 'other';

export function modelSizeGroup(m: Model): SizeGroup {
  const size = m.tiles[0]?.size || m.molds[0]?.size || '';
  if (size.startsWith('300×300')) return '300';
  if (size.startsWith('400×400')) return '400';
  if (size.startsWith('200×200')) return '200';
  return 'other';
}

export function modelSetSize(m: Model): 1 | 2 | 3 {
  const n = m.molds.length;
  return n >= 3 ? 3 : n === 2 ? 2 : 1;
}

/** Kalkulyator: qolip soni = ceil(m² × dona_1m²); vazn = m² × kg. */
export function calcMolds(m: Model, m2: number): number | null {
  const per = Number(String(m.tiles[0]?.per ?? '').replace(',', '.'));
  if (!Number.isFinite(per) || per <= 0) return null;
  return Math.ceil(m2 * per);
}

export function calcWeight(m: Model, m2: number): number | null {
  const kg = Number(String(m.kg ?? '').replace(',', '.'));
  if (!Number.isFinite(kg) || kg <= 0) return null;
  return Math.round(m2 * kg * 100) / 100;
}

/* --- Sahifalar uchun yordamchilar (bosqich 3) -------------------------------- */

/** Bosh sahifa bloki: JSON tartibi = "ko'p so'raladigan" (POPULARITY). */
export function getPopular(limit = 12): Model[] {
  return models.slice(0, limit);
}

/** Kartochka/galereya uchun birinchi mavjud rasm. */
export function modelImage(m: Model): string | null {
  return (
    m.images.scene ||
    m.images.sceneSm ||
    m.images.tiles.A ||
    Object.values(m.images.molds)[0] ||
    Object.values(m.images.tiles)[0] ||
    null
  );
}

/**
 * Bo'lim muqova rasmi. Model rasmi bo'lmasa sayt rasmi ishlatiladi
 * (fasad/zabor/dekor/skameyka bo'yicha 2027 rasmlar yo'q — data-questions).
 */
const SECTION_FALLBACK: Record<Section, string> = {
  trotuar: '/images/site/master-laying.webp',
  fasad: '/images/site/qurilish-obyekti.webp',
  zabor: '/images/site/factory.webp',
  dekor: '/images/site/master-pouring.webp',
  skameyka: '/images/site/containers.webp',
};

export function sectionCover(section: Section): string {
  for (const m of models) {
    if (m.section !== section) continue;
    const img = m.images.scene || m.images.sceneSm || m.images.tiles.A || m.images.molds.A;
    if (img) return img;
  }
  return SECTION_FALLBACK[section];
}

/** "300 × 300 mm — boshqa modellar": avval o'lcham+bo'lim, keyin bo'lim. */
export function relatedModels(m: Model, limit = 4): Model[] {
  const same = models.filter((x) => x.slug !== m.slug && x.section === m.section);
  const bySize = same.filter((x) => modelSizeGroup(x) === modelSizeGroup(m) && modelImage(x));
  const rest = same.filter((x) => !bySize.includes(x) && modelImage(x));
  const out = [...bySize, ...rest];
  if (out.length >= limit) return out.slice(0, limit);
  return [...out, ...same.filter((x) => !out.includes(x))].slice(0, limit);
}

export function modelTileSize(m: Model): string | null {
  return m.tiles[0]?.size || null;
}

export function modelMoldSize(m: Model): string | null {
  return m.molds[0]?.size || null;
}

export function modelPerM2(m: Model): string | null {
  return m.tiles[0]?.per || null;
}

/** Qolip harfi (A/B/C) — to'plam izohida: "2 (A + B)". */
export function moldLetters(m: Model): string {
  return m.molds.map((x) => x.l).filter(Boolean).join(' + ');
}
