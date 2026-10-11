import {
  type Model,
  type SizeGroup,
  type UseGroup,
  modelSizeGroup,
  modelThickness,
  modelUse,
  modelSetSize,
} from './catalog2027.ts';

/** Katalog holati (URL searchParams bilan sinxron, HANDOFF 3-bo'lim). */
export type Filters = {
  q: string;
  use: UseGroup | null;
  size: SizeGroup | null;
  set: 1 | 2 | 3 | null;
  sort: 'pop' | 'code' | 'thick' | 'size';
  view: 'grid' | 'list';
};

export const DEFAULT_FILTERS: Filters = { q: '', use: null, size: null, set: null, sort: 'pop', view: 'grid' };

export const USE_VALUES: UseGroup[] = ['walk', 'yard', 'car'];
export const SIZE_VALUES: SizeGroup[] = ['300', '400', '200', 'other'];
export const SET_VALUES: (1 | 2 | 3)[] = [1, 2, 3];

export function parseFilters(sp: URLSearchParams): Filters {
  const use = sp.get('use') as UseGroup | null;
  const size = sp.get('size') as SizeGroup | null;
  const set = Number(sp.get('set') || 0) as 1 | 2 | 3;
  const sort = sp.get('sort') as Filters['sort'];
  const view = sp.get('view') as Filters['view'];
  return {
    q: sp.get('q') || '',
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
  if (f.use) sp.set('use', f.use);
  if (f.size) sp.set('size', f.size);
  if (f.set) sp.set('set', String(f.set));
  if (f.sort !== 'pop') sp.set('sort', f.sort);
  if (f.view !== 'grid') sp.set('view', f.view);
  return sp;
}

export function activeFilterCount(f: Filters): number {
  return [f.use, f.size, f.set].filter(Boolean).length;
}

/** "№" va bo'sh joylar e'tiborsiz: kod yoki nom (uch tilda) bo'yicha qidiruv. */
function matchesQuery(m: Model, q: string): boolean {
  const query = q.toLowerCase().replace(/№/g, '').trim();
  if (!query) return true;
  const code = (m.code || '').toLowerCase();
  if (code && code.includes(query)) return true;
  return [m.name.uz, m.name.ru, m.name.en].some((n) => n && n.toLowerCase().includes(query));
}

function matchesExcept(m: Model, f: Filters, skip: 'use' | 'size' | 'set' | null): boolean {
  if (!matchesQuery(m, f.q)) return false;
  if (skip !== 'use' && f.use && modelUse(m) !== f.use) return false;
  if (skip !== 'size' && f.size && modelSizeGroup(m) !== f.size) return false;
  if (skip !== 'set' && f.set && modelSetSize(m) !== f.set) return false;
  return true;
}

export function filterModels(models: Model[], f: Filters): Model[] {
  const list = models.filter((m) => matchesExcept(m, f, null));
  return sortModels(list, f.sort);
}

/** Facet sonlari: har guruh o'z filtrisiz, qolganlari bilan hisoblanadi. */
export function facetCounts(models: Model[], f: Filters) {
  const count = (skip: 'use' | 'size' | 'set', test: (m: Model) => boolean) =>
    models.filter((m) => matchesExcept(m, f, skip) && test(m)).length;
  return {
    use: Object.fromEntries(USE_VALUES.map((v) => [v, count('use', (m) => modelUse(m) === v)])) as Record<UseGroup, number>,
    size: Object.fromEntries(SIZE_VALUES.map((v) => [v, count('size', (m) => modelSizeGroup(m) === v)])) as Record<SizeGroup, number>,
    set: Object.fromEntries(SET_VALUES.map((v) => [v, count('set', (m) => modelSetSize(m) === v)])) as Record<1 | 2 | 3, number>,
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
