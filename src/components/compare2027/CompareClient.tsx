'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  type Model,
  SECTION_SLUGS,
  getModelBySlug,
  modelImage,
  modelName,
  modelPerM2,
  modelThickness,
  moldLetters,
  modelSetSize,
} from '@/lib/catalog2027';
import type { Locale } from '@/lib/i18n';
import { getUi, formatNumber } from '@/lib/ui';
import { getPages } from '@/lib/pages';
import { useCompareList, useRequestList } from '@/lib/store/spsLists';

/**
 * Solishtirish (HANDOFF 4.3): ustunlar = modellar, qatorlar = 8 ta ko'rsatkich.
 * Farq qiladigan qatorlar #fff7e6; "Faqat farqlarni ko'rsatish" filtri.
 */
export function CompareClient({ lang }: { lang: Locale }) {
  const t = getUi(lang);
  const p = getPages(lang);
  const compare = useCompareList();
  const request = useRequestList();
  const [onlyDiff, setOnlyDiff] = useState(false);

  const models: Model[] = compare.slugs.flatMap((s) => {
    const m = getModelBySlug(s);
    return m ? [m] : [];
  });

  const value = (m: Model, row: string): string => {
    switch (row) {
      case 'tile':
        return m.tiles[0]?.size || p.compare.dash;
      case 'thickness': {
        const th = modelThickness(m);
        return th === null ? p.compare.dash : `${th} mm`;
      }
      case 'moldsCount':
        return p.compare.setValue(modelSetSize(m), m.molds.length > 1 ? moldLetters(m) : '');
      case 'per': {
        const per = modelPerM2(m);
        return per ? `${formatNumber(lang, per)} ${p.model.keyPerUnit}` : p.compare.dash;
      }
      case 'moldWeight':
        return m.molds[0]?.g ? `${m.molds[0].g} ${p.model.keyGram}` : p.compare.dash;
      case 'kgM2':
        return m.kg ? `${formatNumber(lang, m.kg)} ${p.model.keyKg}` : p.compare.dash;
      case 'use': {
        const use = m.section === 'trotuar' ? (modelThickness(m) ?? 0) : null;
        if (m.section !== 'trotuar') return t.sections[m.section];
        if (use === null) return p.compare.dash;
        if (use <= 30) return p.compare.useWalk;
        if (use <= 40) return p.compare.useYard;
        return p.compare.useCar;
      }
      default:
        return p.model.materialTag;
    }
  };

  const rowKeys = ['tile', 'thickness', 'moldsCount', 'per', 'moldWeight', 'kgM2', 'use', 'material'] as const;
  const rows = rowKeys
    .map((k) => {
      const vals = models.map((m) => value(m, k));
      return { key: k, label: p.compare.rows[k], vals, diff: new Set(vals).size > 1 };
    })
    .filter((r) => (onlyDiff ? r.diff : true));

  const addAll = () => {
    for (const m of models) {
      if (!request.has(m.slug)) request.add({ slug: m.slug, code: m.code, name: modelName(m, lang) });
    }
    window.location.href = `/${lang}/request`;
  };

  if (!models.length) {
    return (
      <div className="wrap sec" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <h1 className="disp-l">{p.compare.title}</h1>
        <div className="ph" style={{ borderRadius: 'var(--radius-card)', padding: 'var(--space-8)', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p className="h3">{p.compare.emptyTitle}</p>
          <p className="body muted" style={{ maxWidth: '52ch', textAlign: 'center' }}>
            {p.compare.emptyText}
          </p>
          <a className="sps-btn sps-btn--primary" href={`/${lang}/catalog`}>
            {p.compare.toCatalog}
          </a>
        </div>
      </div>
    );
  }

  return (
    <section style={{ paddingBlock: '28px var(--space-9)' }}>
      <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <nav className="crumbs" aria-label="breadcrumb">
          <a href={`/${lang}`}>{p.model.breadcrumbHome}</a>
          <span>/</span>
          <a href={`/${lang}/catalog`}>{t.header.catalog}</a>
          <span>/</span>
          <span>{p.compare.title}</span>
        </nav>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h1 className="disp-l">{p.compare.title}</h1>
            <p className="body muted">{p.compare.subtitle(models.length, true)}</p>
          </div>
          <label className="check" style={{ fontSize: 15 }}>
            <input type="checkbox" checked={onlyDiff} onChange={(e) => setOnlyDiff(e.target.checked)} />
            {p.compare.onlyDiff}
          </label>
        </div>

        <div className="cmp-scroll">
          <table className="ct">
            <thead>
              <tr>
                <th />
                {models.map((m) => (
                  <th key={m.slug}>
                    <div className="mc">
                      {modelImage(m) ? (
                        <Image src={modelImage(m) as string} alt={modelName(m, lang)} width={300} height={225} />
                      ) : (
                        <div className="ph" style={{ aspectRatio: '4 / 3' }}>
                          {m.code || modelName(m, lang)}
                        </div>
                      )}
                      <span className="mono" style={{ fontSize: 12, color: 'var(--ink-muted)', fontWeight: 500 }}>
                        {m.code ? `№ ${m.code} · ` : ''}
                        {t.sections[m.section]}
                      </span>
                      <a href={`/${lang}/catalog/${SECTION_SLUGS[m.section]}/${m.slug}`}>{modelName(m, lang)}</a>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <a className="sps-btn sps-btn--primary sps-btn--sm" href={`/${lang}/request`} style={{ flex: 1 }}>
                          {t.catalog.cardRequest}
                        </a>
                        <button
                          type="button"
                          className="sps-btn sps-btn--outline sps-btn--sm"
                          aria-label={`${p.compare.removeA11y}: ${modelName(m, lang)}`}
                          onClick={() => compare.toggle(m.slug)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className={r.diff ? 'diff' : ''}>
                  <th scope="row">{r.label}</th>
                  {r.vals.map((v, i) => (
                    <td key={`${r.key}-${i}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cmp-act">
          <a className="sps-btn sps-btn--outline sps-btn--lg" href={`/${lang}/catalog`}>
            {p.compare.addModel}
          </a>
          <button type="button" className="sps-btn sps-btn--primary sps-btn--lg" onClick={addAll}>
            {p.compare.addAll}
          </button>
        </div>
      </div>
    </section>
  );
}
