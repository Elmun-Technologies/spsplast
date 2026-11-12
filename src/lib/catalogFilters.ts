import {
  type Model,
  type SizeGroup,
  type UseGroup,
  modelSizeGroup,
  modelThickness,
  modelUse,
  modelSetSize,
  modelName,
} from './catalog2027.ts';

/** Katalog holati (URL searchParams bilan sinxron, HANDOFF 3-bo'lim). */
export type Filters = {
  q: string;
  /** Mahsulot turi (`subtitle.uz` slug'i: karniz, pilyastra, kapitel-baza...) — trotuar bo'lmagan bo'limlar uchun. */
  kind: string | null;
  use: UseGroup | null;
  size: SizeGroup | null;
  set: 1 | 2 | 3 | null;
  sort: 'pop' | 'code' | 'thick' | 'size';
  view: 'grid' | 'list';
};

export const DEFAULT_FILTERS: Filters = { q: '', kind: null, use: null, size: null, set: null, sort: 'pop', view: 'grid' };

export const USE_VALUES: UseGroup[] = ['walk', 'yard', 'car'];
export const SIZE_VALUES: SizeGroup[] = ['300', '400', '200', 'other'];
export const SET_VALUES: (1 | 2 | 3)[] = [1, 2, 3];

export function parseFilters(sp: URLSearchParams): Filters {
  const use = sp.get('use') as UseGroup | null;
  const size = sp.get('size') as SizeGroup | null;
  const set = Number(sp.get('set') || 0) as 1 | 2 | 3;
  const sort = sp.get('sort') as Filters['sort'];
  const view = sp.get('view') as Filters['view'];
  const kind = (sp.get('kind') || '').toLowerCase();
  return {
    q: sp.get('q') || '',
    kind: /^[a-z0-9-]{1,40}$/.test(kind) ? kind : null,
    use: USE_VALUES.includes(use as UseGroup) ? (use as UseGroup) : null,
    size: SIZE_VALUES.includes(size as SizeGroup) ? (size as SizeGroup) : null,
    set: SET_VALUES.includes(set) ? set : null,
    sort: ['pop', 'code', 'thick', 'size'].includes(sort) ? sort : 'pop',
    view: view === 'list' ? 'list' : 'grid',
  };
}

export function filtersToParams(f: Filters): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.kind) sp.set('kind', f.kind);
  if (f.use) sp.set('use', f.use);
  if (f.size) sp.set('size', f.size);
  if (f.set) sp.set('set', String(f.set));
  if (f.sort !== 'pop') sp.set('sort', f.sort);
  if (f.view !== 'grid') sp.set('view', f.view);
  return sp;
}

export function activeFilterCount(f: Filters): number {
  return [f.kind, f.use, f.size, f.set].filter(Boolean).length;
}

/** Qidiruv uchun normallashtirish: kichik harf, ё→е, apostrof turlari bitta, "№" va ortiqcha bo'sh joy yo'q. */
function norm(v: string): string {
  return v
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[‘’ʻʼ`´]/g, "'")
    .replace(/№/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const searchCache = new WeakMap<Model, string[]>();

/**
 * Model qidiriladigan nomlar: bazadagi uz/ru/en va saytda **ko'rsatiladigan** nomlar
 * (ru/en bo'sh bo'lsa `modelName` transliteratsiyasi — "Монако"). Aks holda `/ru/catalog?q=монако`
 * hech narsa topmasdi, holbuki kartochkada aynan shu yozuv turibdi (audit 2026-11-02).
 */
function searchNames(m: Model): string[] {
  let names = searchCache.get(m);
  if (!names) {
    names = [...new Set([m.name.uz, m.name.ru, m.name.en, modelName(m, 'ru'), modelName(m, 'en')].filter(Boolean).map((n) => norm(n as string)))];
    searchCache.set(m, names);
  }
  return names;
}

/** "№" va bo'sh joylar e'tiborsiz: kod yoki nom (uch tilda + ko'rsatilgan nom) bo'yicha qidiruv. */
function matchesQuery(m: Model, q: string): boolean {
  const query = norm(q);
  if (!query) return true;
  const code = (m.code || '').toLowerCase();
  if (code && code.includes(query)) return true;
  return searchNames(m).some((n) => n.includes(query));
}

/**
 * Plitka o'lchami va qolip to'plami — trotuar plitkasiga xos belgilar. Boshqa bo'limlar (fasad,
 * karniz, zabor...) ularda sanalmaydi: aks holda umumiy katalogda "Figurali/boshqa 178" kabi
 * yolg'on sonlar chiqardi (2026-11-12, 3D katalog qo'shilganda).
 */
/** Mahsulot turi kaliti: `subtitle.uz` ("Kapitel baza" -> "kapitel-baza"); turi yo'q -> null. */
export function modelKind(m: Model): string | null {
  const uz = m.subtitle?.uz;
  if (!uz) return null;
  const key = uz.toLowerCase().replace(/[‘’ʻʼ`']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return key || null;
}

const pavingSize = (m: Model) => (m.section === 'trotuar' ? modelSizeGroup(m) : null);
const pavingSet = (m: Model) => (m.section === 'trotuar' ? modelSetSize(m) : null);

function matchesExcept(m: Model, f: Filters, skip: 'kind' | 'use' | 'size' | 'set' | null): boolean {
  if (!matchesQuery(m, f.q)) return false;
  if (skip !== 'kind' && f.kind && modelKind(m) !== f.kind) return false;
  if (skip !== 'use' && f.use && modelUse(m) !== f.use) return false;
  if (skip !== 'size' && f.size && pavingSize(m) !== f.size) return false;
  if (skip !== 'set' && f.set && pavingSet(m) !== f.set) return false;
  return true;
}

export function filterModels(models: Model[], f: Filters): Model[] {
  const list = models.filter((m) => matchesExcept(m, f, null));
  return sortModels(list, f.sort);
}

/** Facet sonlari: har guruh o'z filtrisiz, qolganlari bilan hisoblanadi. */
export function facetCounts(models: Model[], f: Filters) {
  const count = (skip: 'kind' | 'use' | 'size' | 'set', test: (m: Model) => boolean) =>
    models.filter((m) => matchesExcept(m, f, skip) && test(m)).length;
  // Turlar katalog tartibida (birinchi uchragan model nomi bilan — tarjima uchun namuna).
  const kinds: { key: string; sample: Model; count: number }[] = [];
  for (const m of models) {
    const key = modelKind(m);
    if (!key || kinds.some((k) => k.key === key)) continue;
    kinds.push({ key, sample: m, count: count('kind', (x) => modelKind(x) === key) });
  }
  return {
    kind: kinds,
    use: Object.fromEntries(USE_VALUES.map((v) => [v, count('use', (m) => modelUse(m) === v)])) as Record<UseGroup, number>,
    size: Object.fromEntries(SIZE_VALUES.map((v) => [v, count('size', (m) => pavingSize(m) === v)])) as Record<SizeGroup, number>,
    set: Object.fromEntries(SET_VALUES.map((v) => [v, count('set', (m) => pavingSet(m) === v)])) as Record<1 | 2 | 3, number>,
  };
}

function sizeFirst(m: Model): number {
  const s = m.tiles[0]?.size || m.molds[0]?.size || '';
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : 9999;
}

function codeKey(m: Model): string {
  if (!m.code) return 'zzz' + m.slug;
  return /^\d+$/.test(m.code) ? m.code.padStart(3, '0') : m.code;
}

export function sortModels(models: Model[], sort: Filters['sort']): Model[] {
  const list = [...models];
  if (sort === 'code') list.sort((a, b) => codeKey(a).localeCompare(codeKey(b)));
  if (sort === 'thick') list.sort((a, b) => (modelThickness(a) ?? 999) - (modelThickness(b) ?? 999));
  if (sort === 'size') list.sort((a, b) => sizeFirst(a) - sizeFirst(b));
  // 'pop' — extractor tartibi (HANDOFF 5: popularity ro'yxati)
  return list;
}
