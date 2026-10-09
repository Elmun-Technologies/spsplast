'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getTotalCount, type Model } from '@/lib/catalog2027';
import {
  activeFilterCount,
  DEFAULT_FILTERS,
  facetCounts,
  filterModels,
  filtersToParams,
  parseFilters,
  SET_VALUES,
  SIZE_VALUES,
  USE_VALUES,
  type Filters,
} from '@/lib/catalogFilters';
import { type Locale } from '@/lib/i18n';
import { getUi, pluralModels } from '@/lib/ui';
import { ProductCard } from '@/components/catalog2027/ProductCard';
import { QuickRequestModal } from '@/components/catalog2027/QuickRequestModal';
import { QuickViewModal } from '@/components/catalog2027/QuickViewModal';
import { trackEvent } from '@/lib/analytics';
import { useModalShell } from '@/components/site/useModalShell';
import { Icon } from '@/components/site/icons';

function FilterGroups({
  filters,
  facets,
  lang,
  onToggle,
}: {
  filters: Filters;
  facets: ReturnType<typeof facetCounts>;
  lang: Locale;
  onToggle: (patch: Partial<Filters>) => void;
}) {
  const t = getUi(lang).catalog;
  const groups: { title: string; items: { key: string; label: string; note?: string; on: boolean; count: number; patch: Partial<Filters> }[] }[] = [];

  if (USE_VALUES.some((v) => facets.use[v] > 0)) {
    groups.push({
      title: t.groupUse,
      items: USE_VALUES.map((v) => ({
        key: v,
        label: v === 'walk' ? t.useWalk : v === 'yard' ? t.useYard : t.useCar,
        note: v === 'walk' ? t.useWalkNote : v === 'yard' ? t.useYardNote : t.useCarNote,
        on: filters.use === v,
        count: facets.use[v],
        patch: { use: filters.use === v ? null : v },
      })),
    });
  }
  groups.push({
    title: t.groupSize,
    items: SIZE_VALUES.map((v) => ({
      key: v,
      label: v === '300' ? t.size300 : v === '400' ? t.size400 : v === '200' ? t.size200 : t.sizeOther,
      on: filters.size === v,
      count: facets.size[v],
      patch: { size: filters.size === v ? null : v },
    })),
  });
  groups.push({
    title: t.groupSet,
    items: SET_VALUES.map((v) => ({
      key: String(v),
      label: v === 1 ? t.set1 : v === 2 ? t.set2 : t.set3,
      on: filters.set === v,
      count: facets.set[v],
      patch: { set: filters.set === v ? null : v },
    })),
  });

  return (
    <>
      {groups.map((g) => (
        <div className="fgroup" key={g.title}>
          <h3>{g.title}</h3>
          {g.items
            .filter((i) => i.count > 0 || i.on)
            .map((i) => (
              <button key={i.key} type="button" className="fitem" aria-pressed={i.on} onClick={() => onToggle(i.patch)}>
                <span className="dot" aria-hidden="true" />
                <span>
                  {i.label}
                  {i.note ? <small>{i.note}</small> : null}
                </span>
                <b>{i.count}</b>
              </button>
            ))}
        </div>
      ))}
    </>
  );
}

export function CatalogClient({
  lang,
  models,
  initialQuery,
  variant,
}: {
  lang: Locale;
  models: Model[];
  initialQuery?: string;
  variant: 'home' | 'catalog';
}) {
  const t = getUi(lang).catalog;
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<Filters>(() => parseFilters(new URLSearchParams(initialQuery ?? '')));

  // Bo'lim sahifalari statik (searchParams o'qilmaydi) — filtrlar mijozda
  // URL'dan o'qiladi, shunda bo'lishilgan havolalar ham ishlaydi.
  useEffect(() => {
    if (initialQuery !== undefined) return;
    const fromUrl = parseFilters(new URLSearchParams(window.location.search));
    setFilters((prev) => (JSON.stringify(prev) === JSON.stringify(fromUrl) ? prev : fromUrl));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [limit, setLimit] = useState(variant === 'home' ? 12 : 24);
  const [requestModel, setRequestModel] = useState<Model | null>(null);
  const [quickModel, setQuickModel] = useState<Model | null>(null);
  const sheetRef = useModalShell(sheetOpen, () => setSheetOpen(false));

  const filtered = useMemo(() => filterModels(models, filters), [models, filters]);

  // Analitika: ro'yxat ko'rildi (GA4 `view_item_list`) — faqat montajda bir marta.
  useEffect(() => {
    trackEvent('view_item_list', {
      item_list_name: variant === 'home' ? 'home-popular' : pathname,
      item_count: models.length,
      lang,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Analitika: qidiruv (debounce 600 ms, bir xil so'z takrorlanmaydi).
  const searchedRef = useRef('');
  useEffect(() => {
    const q = filters.q.trim();
    if (q.length < 3 || searchedRef.current === q) return;
    const id = window.setTimeout(() => {
      searchedRef.current = q;
      trackEvent('search', { search_term: q, result_count: filtered.length, lang });
    }, 600);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.q, filtered.length]);
  const facets = useMemo(() => facetCounts(models, filters), [models, filters]);
  const total = getTotalCount();
  const active = activeFilterCount(filters);

  const update = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    setLimit(variant === 'home' ? 12 : 24);
    const params = filtersToParams(next).toString();
    router.replace(params ? `${pathname}?${params}` : pathname, { scroll: false });
  };

  const resetAll = () => update({ ...DEFAULT_FILTERS, sort: filters.sort, view: filters.view });

  const tags: { label: string; patch: Partial<Filters> }[] = [];
  if (filters.use)
    tags.push({
      label: filters.use === 'walk' ? t.useWalk : filters.use === 'yard' ? t.useYard : t.useCar,
      patch: { use: null },
    });
  if (filters.size)
    tags.push({
      label: filters.size === 'other' ? t.sizeOther : filters.size === '300' ? t.size300 : filters.size === '400' ? t.size400 : t.size200,
      patch: { size: null },
    });
  if (filters.set) tags.push({ label: filters.set === 1 ? t.set1 : filters.set === 2 ? t.set2 : t.set3, patch: { set: null } });

  const visible = filtered.slice(0, limit);

  return (
    <>
      <div className="cat">
        <aside className="cat-side" aria-label={t.filters}>
          <FilterGroups filters={filters} facets={facets} lang={lang} onToggle={update} />
        </aside>

        <div>
          <div className="cat-tools">
            <label className={`cat-search${variant === 'home' ? ' hide-m' : ''}`}>
              <Icon.search width={18} height={18} strokeWidth={1.5} aria-hidden="true" />
              <input
                type="search"
                value={filters.q}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
                onChange={(e) => update({ q: e.target.value })}
              />
            </label>
            <button type="button" className="sps-btn sps-btn--outline hide-1100" onClick={() => setSheetOpen(true)}>
              <Icon.grid width={18} height={18} strokeWidth={1.5} aria-hidden="true" />
              {t.filters}
              {active > 0 ? ` · ${active}` : ''}
            </button>
            <select
              className="sps-select cat-sort"
              value={filters.sort}
              aria-label={t.sort}
              onChange={(e) => update({ sort: e.target.value as Filters['sort'] })}
            >
              <option value="pop">{t.sortPopular}</option>
              <option value="code">{t.sortCode}</option>
              <option value="thick">{t.sortThickness}</option>
              <option value="size">{t.sortSize}</option>
            </select>
            <div className="sps-seg" role="group" aria-label={t.viewGrid}>
              <label>
                <input type="radio" name="view" checked={filters.view === 'grid'} onChange={() => update({ view: 'grid' })} />
                <span>{t.viewGrid}</span>
              </label>
              <label>
                <input type="radio" name="view" checked={filters.view === 'list'} onChange={() => update({ view: 'list' })} />
                <span>{t.viewList}</span>
              </label>
            </div>
            <span className="cat-count">
              <b>{filtered.length}</b> {t.found} · {t.inCatalog} {total}
            </span>
            {tags.length > 0 ? (
              <div className="cat-tags">
                {tags.map((tag) => (
                  <button key={tag.label} type="button" className="chip chip-on" onClick={() => update(tag.patch)}>
                    {tag.label}
                    <span className="chip-x" aria-hidden="true">
                      ×
                    </span>
                  </button>
                ))}
                <button type="button" className="sps-btn sps-btn--link" onClick={resetAll}>
                  {t.clear}
                </button>
              </div>
            ) : null}
          </div>

          {filtered.length === 0 ? (
            <div className="ph" style={{ borderRadius: 'var(--radius-card)', padding: 'var(--space-8)', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p className="h3">{t.empty}</p>
              <div className="row cta-row" style={{ justifyContent: 'center' }}>
                <button type="button" className="sps-btn sps-btn--outline" onClick={resetAll}>
                  {t.emptyReset}
                </button>
                <a className="sps-btn sps-btn--primary" href={`/${lang}/request`}>
                  {getUi(lang).header.cta}
                </a>
              </div>
            </div>
          ) : (
            <div className={`cat-grid${filters.view === 'list' ? ' cat-grid--list' : ''}`}>
              {visible.map((m) => (
                <ProductCard key={m.slug} model={m} lang={lang} onRequest={setRequestModel} onQuick={setQuickModel} />
              ))}
            </div>
          )}

          <div className="cat-more">
            {limit < filtered.length ? (
              <button type="button" className="sps-btn sps-btn--outline" onClick={() => setLimit(limit + 12)}>
                {t.more} (+12)
              </button>
            ) : null}
            {variant === 'home' ? (
              <a className="sps-btn sps-btn--link" href={`/${lang}/catalog`}>
                {t.allCatalog} · {total} {pluralModels(lang, total)} →
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="fsheet" hidden={!sheetOpen} role="dialog" aria-modal="true" aria-label={t.filters} ref={sheetRef}>
        <div className="fsheet__head">
          <span className="h3">{t.filters}</span>
          <button type="button" className="sps-iconbtn" aria-label={getUi(lang).a11y.close} onClick={() => setSheetOpen(false)}>
            <Icon.close width={18} height={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <div className="fsheet__body">
          <FilterGroups filters={filters} facets={facets} lang={lang} onToggle={update} />
        </div>
        <div className="fsheet__foot">
          <button type="button" className="sps-btn sps-btn--outline" onClick={resetAll}>
            {t.clear}
          </button>
          <button type="button" className="sps-btn sps-btn--primary" onClick={() => setSheetOpen(false)}>
            {filtered.length} {t.show}
          </button>
        </div>
      </div>

      <QuickRequestModal key={requestModel?.slug || 'none'} model={requestModel} lang={lang} onClose={() => setRequestModel(null)} />
      <QuickViewModal
        key={`q-${quickModel?.slug || 'none'}`}
        model={quickModel}
        lang={lang}
        onClose={() => setQuickModel(null)}
        onRequest={(m) => {
          setQuickModel(null);
          setRequestModel(m);
        }}
      />
    </>
  );
}
