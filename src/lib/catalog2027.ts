import { models2027 } from '../data/models2027.ts';
import { siteSnapshot } from '../data/site.generated.ts';
import type { Locale } from '@/lib/i18n';

/**
 * Katalog 2027. Manba:
 *  1) admin panel (baza) — build paytida `src/data/site.generated.ts` ga yoziladi
 *     (scripts/export-snapshot.mjs, "Nashr qilish");
 *  2) bo'lmasa statik `data/models-2027.json` (generator: scripts/extract/build_models_2027.py).
 * API sinxron qoladi — sahifalar statik prerender bo'ladi.
 * Sxema: docs/design-handoff/HANDOFF.md 5-bo'lim.
 */
/** Bo'lim kaliti: trotuar, fasad, zabor, dekor, skameyka (+ admin qo'shgan, masalan termopanel). */
export type Section = string;

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

type SectionMeta = { key: Section; slug: string; name: Localized };

/** Standart bo'limlar (admin snapshot bo'lmaganda). Nomlar — HANDOFF atamalari. */
const DEFAULT_SECTIONS: SectionMeta[] = [
  { key: 'trotuar', slug: 'paving', name: { uz: 'Trotuar plitkasi', ru: 'Тротуарная плитка', en: 'Paving tiles' } },
  { key: 'fasad', slug: 'facade', name: { uz: 'Fasad', ru: 'Фасад', en: 'Facade' } },
  { key: 'zabor', slug: 'fence', name: { uz: 'Zabor panellari', ru: 'Заборные панели', en: 'Fence panels' } },
  { key: 'dekor', slug: 'decor', name: { uz: 'Dekor panellar', ru: 'Декор-панели', en: 'Decor panels' } },
  { key: 'skameyka', slug: 'bench', name: { uz: 'Skameyka oyoqlari', ru: 'Ножки скамеек', en: 'Bench legs' } },
];

const SECTION_META: SectionMeta[] = siteSnapshot?.sections?.length
  ? siteSnapshot.sections.map((x) => ({ key: x.key, slug: x.slug, name: x.name }))
  : DEFAULT_SECTIONS;

/** Barcha bo'limlar (marshrutlar shular uchun yaratiladi, 0 modelli ham). */
export const SECTIONS: Section[] = SECTION_META.map((x) => x.key);

/** Marshrut slug'lari (HANDOFF 4): /{lang}/catalog/{slug}. */
export const SECTION_SLUGS: Record<Section, string> = Object.fromEntries(SECTION_META.map((x) => [x.key, x.slug]));

/** Bo'lim nomi: admin'dagi nom → uz → kalit. */
export function sectionLabel(section: Section, lang: Locale): string {
  const meta = SECTION_META.find((x) => x.key === section) ?? DEFAULT_SECTIONS.find((x) => x.key === section);
  return meta?.name[lang] || meta?.name.uz || section;
}

export function sectionFromSlug(slug: string): Section | undefined {
  return SECTIONS.find((s) => SECTION_SLUGS[s] === slug);
}

const models = (siteSnapshot?.models ?? models2027) as unknown as Model[];

export function getModels(): Model[] {
  return models;
}

export function getTotalCount(): number {
  return models.length;
}

export function getSectionCounts(): Record<Section, number> {
  const counts: Record<Section, number> = Object.fromEntries(SECTIONS.map((x) => [x, 0]));
  for (const m of models) counts[m.section] = (counts[m.section] ?? 0) + 1;
  return counts;
}

/**
 * Navigatsiyada ko'rinadigan bo'limlar: faqat modeli borlari ("0 model" bo'limi
 * foydalanuvchiga ko'rsatilmaydi — sahifasi esa ishlaydi, ma'lumot kelsa o'zi qo'shiladi).
 */
export function getActiveSections(): Section[] {
  const counts = getSectionCounts();
  return SECTIONS.filter((x) => counts[x] > 0);
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
const SECTION_FALLBACK: Record<string, string> = {
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
  return SECTION_FALLBACK[section] ?? '/images/site/factory.webp';
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
