import {
  type Model,
  type Section,
  getModelsBySection,
  modelSetSize,
  modelSizeGroup,
  modelUse,
} from './catalog2027.ts';

/**
 * SEO landing sahifalari (docs/SEO-2028-RU.md 2-bo'lim) — faqat mantiq va ma'lumot;
 * matnlar `getPages(lang).seo` da (uz/ru/en, tuzilma bir xil).
 *
 *  - Teg sahifalari: `/{lang}/catalog/{section}/tag/{tag}` — bo'lim ichidagi saralangan
 *    to'plam (qalinlik/qo'llanish, o'lcham, to'plam). Har biri o'z URL, H1, matni va
 *    canonical'iga ega; filtr kombinatsiyalari (?use=…&size=…) esa indekslanmaydi.
 *  - Eksport (geo) sahifalari: `/{lang}/export/{country}` — SPS eksport xaritasidagi
 *    8 davlat (admin "export_countries" ro'yxati bilan bir xil).
 */

export type SeoTag = 'walk-25-30' | 'yard-35-40' | 'parking-45-50' | '300x300' | '200x200' | 'figured' | 'sets';

type TagDef = { tag: SeoTag; section: Section; match: (m: Model) => boolean };

/**
 * Teg ta'riflari. Hozircha faqat trotuar plitkasi (asosiy so'rov — "формы для тротуарной
 * плитки"); boshqa bo'limlarda model kam, alohida sahifa yupqa kontent bo'lardi.
 */
const TAG_DEFS: TagDef[] = [
  { tag: 'walk-25-30', section: 'trotuar', match: (m) => modelUse(m) === 'walk' },
  { tag: 'yard-35-40', section: 'trotuar', match: (m) => modelUse(m) === 'yard' },
  { tag: 'parking-45-50', section: 'trotuar', match: (m) => modelUse(m) === 'car' },
  { tag: '300x300', section: 'trotuar', match: (m) => modelSizeGroup(m) === '300' },
  { tag: '200x200', section: 'trotuar', match: (m) => modelSizeGroup(m) === '200' },
  { tag: 'figured', section: 'trotuar', match: (m) => modelSizeGroup(m) === 'other' },
  { tag: 'sets', section: 'trotuar', match: (m) => modelSetSize(m) > 1 },
];

/**
 * Teg sahifasi uchun eng kam model soni. Undan kam bo'lsa sahifa yaratilmaydi
 * (yupqa kontent — masalan 400×400 da hozir 3 model): ma'lumot ko'paysa o'zi paydo bo'ladi.
 */
export const MIN_TAG_MODELS = 6;

export function tagModels(section: Section, tag: SeoTag): Model[] {
  const def = TAG_DEFS.find((d) => d.section === section && d.tag === tag);
  return def ? getModelsBySection(section).filter(def.match) : [];
}

/** Sahifasi bor teglar (yetarli model bilan), tartib — TAG_DEFS bo'yicha. */
export function getSeoTags(section?: Section): { section: Section; tag: SeoTag; count: number }[] {
  return TAG_DEFS.filter((d) => !section || d.section === section)
    .map((d) => ({ section: d.section, tag: d.tag, count: tagModels(d.section, d.tag).length }))
    .filter((t) => t.count >= MIN_TAG_MODELS);
}

export function isSeoTag(section: Section, tag: string): tag is SeoTag {
  return getSeoTags(section).some((t) => t.tag === tag);
}

/** Eksport davlatlari (SPS eksport xaritasi). `phone` — forma telefon maskasi uchun. */
export const EXPORT_COUNTRIES = [
  { key: 'russia', phone: '+7' },
  { key: 'kazakhstan', phone: '+7' },
  { key: 'belarus', phone: '+375' },
  { key: 'kyrgyzstan', phone: '+996' },
  { key: 'tajikistan', phone: '+992' },
  { key: 'azerbaijan', phone: '+994' },
  { key: 'armenia', phone: '+374' },
  { key: 'georgia', phone: '+995' },
] as const;

export type ExportCountry = (typeof EXPORT_COUNTRIES)[number]['key'];

export function isExportCountry(key: string): key is ExportCountry {
  return EXPORT_COUNTRIES.some((c) => c.key === key);
}
