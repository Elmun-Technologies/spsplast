import { models2027 } from '../data/models2027.ts';
import { siteSnapshot } from '../data/site.generated.ts';
import type { Locale } from '@/lib/i18n';

/**
 * Katalog 2027. Manba — `src/data/models2027.ts`:
 *  1) admin panel (baza) bilan build — scripts/export-snapshot.mjs nashrdagi mahsulotlarni
 *     shu faylga yozadi ("Nashr qilish"); bo'limlar `src/data/site.generated.ts` da;
 *  2) bazasiz — git'dagi statik nusxa (`data/models-2027.json`, scripts/extract/build_models_2027.py).
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

function hasAnyImage(m: Model): boolean {
  return !!(m.images.scene || m.images.sceneSm || Object.keys(m.images.molds).length || Object.keys(m.images.tiles).length);
}

/**
 * Tartib: "ko'p so'raladigan" (manba tartibi), lekin rasmli modellar oldinda —
 * katalog va bosh sahifa rasmsiz kartochka bilan boshlanmasin (UI audit P0-1/P0-2).
 */
const models = (models2027 as unknown as Model[])
  .map((m, i) => ({ m, i, img: hasAnyImage(m) ? 0 : 1 }))
  .sort((a, b) => a.img - b.img || a.i - b.i)
  .map((x) => x.m);

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
  // Kamida bitta rasmli modeli bor bo'lim: 1 ta rasmsiz model bilan bo'lim "soxta" ko'rinadi.
  return SECTIONS.filter((x) => models.some((m) => m.section === x && hasAnyImage(m)));
}

export function getModelsBySection(section: Section): Model[] {
  return models.filter((m) => m.section === section);
}

export function getModelBySlug(slug: string): Model | undefined {
  return models.find((m) => m.slug === slug);
}

/**
 * Nom: so'ralgan til; bo'lmasa uz nomidan avtomatik — RU kirill harflarida
 * (CLAUDE.md qoida 5), EN da tavsif so'zlari tarjima qilinadi. Admin'da kiritilgan
 * haqiqiy tarjima har doim ustun.
 */
export function modelName(m: Model, lang: Locale): string {
  const own = m.name[lang];
  if (own) return own;
  const uz = m.name.uz || m.slug;
  if (lang === 'ru') return uzToCyrillic(translateWords(uz, UZ_RU_WORDS));
  if (lang === 'en') return uzToEnglishName(uz);
  return uz;
}

const UZ_EN_WORDS: Record<string, string> = {
  naqshli: 'patterned', gladkiy: 'smooth', gladkoe: 'smooth', shershaviy: 'textured', shershavoe: 'textured',
  "to'plam": 'set', "toʻplam": 'set', bilan: 'with', kubik: 'cube', aylana: 'circle', okrujnost: 'circle',
  "yog'och": 'wood', "yogʻoch": 'wood', yaltiroq: 'glossy', toshli: 'stone', "sakkiz": 'eight', qirra: 'edge',
  forma: 'forms', uzor: 'pattern', gul: 'flower', "g'isht": 'brick', "gʻisht": 'brick', kirpich: 'brick',
};

const UZ_RU_WORDS: Record<string, string> = {
  naqshli: 'узорчатый', gladkiy: 'гладкий', gladkoe: 'гладкое', shershaviy: 'шершавый', shershavoe: 'шершавое',
  "to'plam": 'набор', "toʻplam": 'набор', bilan: 'с', aylana: 'круг', "yog'och": 'дерево', "yogʻoch": 'дерево',
  yaltiroq: 'глянцевый', toshli: 'каменный', sakkiz: 'восемь', qirra: 'граней', uzor: 'узор', gul: 'цветок',
  "g'isht": 'кирпич', "gʻisht": 'кирпич', kubik: 'кубик', forma: 'формы',
};

function translateWords(text: string, dict: Record<string, string>): string {
  return text
    .split(/(\s+|[(),])/)
    .map((w) => dict[w.toLowerCase()] ?? w)
    .join('');
}

function uzToEnglishName(uz: string): string {
  return translateWords(uz, UZ_EN_WORDS);
}

/** O'zbek lotin → rus kirill (nomlar uchun yetarli soddalashtirilgan qoidalar). */
export function uzToCyrillic(text: string): string {
  const pairs: [RegExp, string][] = [
    [/sh/gi, 'ш'], [/ch/gi, 'ч'], [/ya/gi, 'я'], [/yu/gi, 'ю'], [/yo/gi, 'ё'], [/ts/gi, 'ц'],
    [/o['ʻ‘’]/gi, 'у'], [/g['ʻ‘’]/gi, 'г'], [/ye/gi, 'е'],
  ];
  const single: Record<string, string> = {
    a: 'а', b: 'б', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и', j: 'ж', k: 'к', l: 'л', m: 'м', n: 'н',
    o: 'о', p: 'п', q: 'к', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', x: 'х', y: 'й', z: 'з', c: 'к', w: 'в',
  };
  let out = text;
  for (const [re, rep] of pairs) {
    out = out.replace(re, (mt) => (mt[0] === mt[0].toUpperCase() && mt[0] !== mt[0].toLowerCase() ? rep.toUpperCase() : rep));
  }
  out = out.replace(/[a-z]/gi, (ch) => {
    const r = single[ch.toLowerCase()];
    if (!r) return ch;
    return ch === ch.toUpperCase() ? r.toUpperCase() : r;
  });
  // Rus imlosi: so'z oxiridagi "-ий" qattiq undoshdan keyin "-ый"; apostroflar olib tashlanadi.
  return out.replace(/([бвдзлмнпрстф])ий\b/giu, '$1ый').replace(/['ʻ‘’]/g, '');
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
 * Bo'lim muqovasi: shu bo'limdagi model sahnasi; bo'lmasa fonsiz qolip surati
 * (`contain` bilan ko'rsatiladi). Port/zavod kabi mahsulotga aloqasiz rasm
 * ishlatilmaydi (UI audit P0-4).
 */
export function sectionCoverImage(section: Section): { src: string; fit: 'cover' | 'contain' } {
  const inSection = models.filter((m) => m.section === section);
  const scene = inSection.find((m) => m.images.scene || m.images.sceneSm);
  if (scene) return { src: (scene.images.scene || scene.images.sceneSm) as string, fit: 'cover' };
  const cut = inSection.find((m) => m.images.molds.A || m.images.tiles.A);
  if (cut) return { src: (cut.images.molds.A || cut.images.tiles.A) as string, fit: 'contain' };
  return { src: '/images/site/factory.webp', fit: 'cover' };
}

/** @deprecated `sectionCoverImage` — faqat src kerak bo'lgan joylar uchun. */
export function sectionCover(section: Section): string {
  return sectionCoverImage(section).src;
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
