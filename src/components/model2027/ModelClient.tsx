'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  type Model,
  SECTION_SLUGS,
  calcMolds,
  calcWeight,
  moldLetters,
  modelImage,
  modelName,
  modelPerM2,
  modelThickness,
  localizedText,
} from '@/lib/catalog2027';
import type { Locale } from '@/lib/i18n';
import { getUi, formatNumber } from '@/lib/ui';
import { getPages } from '@/lib/pages';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import { useCompareList, useRequestList } from '@/lib/store/spsLists';
import { QuickRequestModal } from '@/components/catalog2027/QuickRequestModal';
import { Icon } from '@/components/site/icons';
import { trackEvent } from '@/lib/analytics';

type GalleryItem = { src: string; label: string; cover: boolean };

const num = (lang: Locale, n: number) =>
  new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'ru-RU', { maximumFractionDigits: 1 }).format(n);

/**
 * Model sahifasi (HANDOFF 4.2): galereya + 4 ta asosiy raqam + kalkulyator +
 * tablar + CTA. Mobil pastda sticky panel (qo'ng'iroq · ro'yxat · zayafka).
 */
export function ModelClient({
  lang,
  model,
  related,
}: {
  lang: Locale;
  model: Model;
  related: Model[];
}) {
  const t = getUi(lang);
  const p = getPages(lang);
  const request = useRequestList();
  const compare = useCompareList();
  const [leadOpen, setLeadOpen] = useState(false);
  const [tab, setTab] = useState<'spec' | 'use' | 'delivery' | 'faq'>('spec');
  const [m2, setM2] = useState('100');

  const gallery = useMemo<GalleryItem[]>(() => {
    const out: GalleryItem[] = [];
    if (model.images.scene) out.push({ src: model.images.scene, label: p.model.gallery.scene, cover: true });
    const mold = model.images.molds.A;
    if (mold) out.push({ src: mold, label: p.model.gallery.mold, cover: false });
    const tile = model.images.tiles.A;
    if (tile) out.push({ src: tile, label: p.model.gallery.tile, cover: false });
    if (model.images.sceneSm && model.images.sceneSm !== model.images.scene) {
      out.push({ src: model.images.sceneSm, label: p.model.gallery.zoom, cover: true });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.slug]);

  // Analitika: model sahifasi ko'rildi (GA4 `view_item`)
  useEffect(() => {
    trackEvent('view_item', {
      item_id: model.slug,
      item_code: model.code ?? '',
      item_name: modelName(model, lang),
      item_category: model.section,
      lang,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.slug]);

  const [shot, setShot] = useState(0);
  const current = gallery[shot] ?? gallery[0];
  const hero = current ?? (modelImage(model) ? { src: modelImage(model) as string, label: '', cover: true } : null);

  const volume = Math.max(0, Number(String(m2).replace(',', '.')) || 0);
  const molds = calcMolds(model, volume);
  const weight = calcWeight(model, volume);
  const per = modelPerM2(model);
  const thickness = modelThickness(model);
  const inList = request.has(model.slug);
  const inCompare = compare.has(model.slug);

  const specRows: { k: string; v: string }[] = model.specs.length
    ? model.specs.map((s) => ({
        k: localizedText(s.k, lang) ?? '—',
        v: localizedText(s.v, lang) ?? '—',
      }))
    : [
        { k: p.model.spec.code, v: model.code ? `№ ${model.code}` : '—' },
        ...model.molds.map((m, i) => ({
          k: model.molds.length > 1 ? `${p.model.spec.mold} ${m.l}` : p.model.spec.moldSize,
          v: `${m.size || '—'}${m.depth ? ` × ${m.depth} mm` : ''}${model.molds.length > 1 && i >= 0 ? '' : ''}`,
        })),
        { k: p.model.spec.tile, v: model.tiles.map((x) => x.size).filter(Boolean).join(', ') || '—' },
        { k: p.model.spec.per, v: per ? `${formatNumber(lang, per)} ${p.model.keyPerUnit}` : '—' },
        {
          k: p.model.spec.moldWeight,
          v: model.molds.some((m) => m.g)
            ? model.molds.map((m) => (m.g ? `${m.g} ${p.model.keyGram}` : '')).filter(Boolean).join(' · ')
            : '—',
        },
        { k: p.model.spec.kgM2, v: model.kg ? `${formatNumber(lang, model.kg)} ${p.model.keyKg}` : '—' },
        { k: p.model.spec.material, v: p.model.spec.materialValue },
      ];

  const useText =
    model.section === 'trotuar'
      ? thickness === null
        ? p.model.use.walk
        : thickness <= 30
          ? p.model.use.walk
          : thickness <= 40
            ? p.model.use.yard
            : p.model.use.car
      : model.section === 'fasad'
        ? p.model.use.facade
        : model.section === 'dekor'
          ? p.model.use.decor
          : model.section === 'skameyka'
            ? p.model.use.bench
            : p.model.use.fence;

  const subtitle = localizedText(model.subtitle, lang) || localizedText(model.note, lang);

  const toggleList = () => {
    if (inList) request.remove(model.slug);
    else
      request.add({
        slug: model.slug,
        code: model.code,
        name: modelName(model, lang),
        m2: volume || undefined,
      });
  };

  return (
    <>
      <section className="pd-sec">
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <nav className="crumbs" aria-label="breadcrumb">
            <a href={`/${lang}`}>{p.model.breadcrumbHome}</a>
            <span>/</span>
            <a href={`/${lang}/catalog`}>{t.header.catalog}</a>
            <span>/</span>
            <a href={`/${lang}/catalog/${SECTION_SLUGS[model.section]}`}>{t.sections[model.section]}</a>
            <span>/</span>
            <span>
              {model.code ? `№ ${model.code} ` : ''}
              {modelName(model, lang)}
            </span>
          </nav>

          <div className="pdp">
            <div className="th">
              {gallery.map((g, i) => (
                <button
                  key={g.src}
                  type="button"
                  className={`${i === shot ? 'on' : ''} ${g.cover ? '' : 'contain'}`}
                  onClick={() => setShot(i)}
                  aria-label={`${p.model.gallery.thumbA11y}: ${g.label}`}
                  aria-pressed={i === shot}
                >
                  <Image src={g.src} alt="" width={96} height={96} />
                </button>
              ))}
            </div>

            <div className="stage">
              {hero ? (
                <Image
                  src={hero.src}
                  alt={`${modelName(model, lang)} — ${hero.label}`}
                  fill
                  sizes="(max-width: 1100px) 100vw, 640px"
                  priority
                  style={{ objectFit: hero.cover ? 'cover' : 'contain', maxWidth: hero.cover ? undefined : '70%', maxHeight: hero.cover ? undefined : '80%', width: hero.cover ? undefined : 'auto', height: hero.cover ? undefined : 'auto' }}
                />
              ) : (
                <div className="ph" style={{ position: 'absolute', inset: 0 }}>
                  {model.code || modelName(model, lang)}
                </div>
              )}
              {hero?.label ? <span className="sps-tag">{hero.label}</span> : null}
            </div>

            <div className="side-sticky">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span className="mono" style={{ fontSize: 14, color: 'var(--ink-muted)' }}>
                    {model.code ? `№ ${model.code} · ` : ''}
                    {t.sections[model.section]}
                  </span>
                  <span className="sps-tag">{p.model.materialTag}</span>
                </div>
                <h1 className="disp-l">{modelName(model, lang)}</h1>
                {subtitle ? <p className="body muted">{subtitle}</p> : null}
              </div>

              <div className="key">
                <div>
                  <span>{p.model.keyTile}</span>
                  <b>
                    {model.tiles[0]?.size || '—'}
                    {model.sizeEstimated ? ' *' : ''}
                  </b>
                </div>
                <div>
                  <span>{p.model.keyPer}</span>
                  <b>{per ? `${formatNumber(lang, per)} ${p.model.keyPerUnit}` : '—'}</b>
                </div>
                <div>
                  <span>{p.model.keyMoldWeight}</span>
                  <b>{model.molds[0]?.g ? `${model.molds[0].g} ${p.model.keyGram}` : '—'}</b>
                </div>
                <div>
                  <span>{p.model.keyKgM2}</span>
                  <b>{model.kg ? `${formatNumber(lang, model.kg)} ${p.model.keyKg}` : '—'}</b>
                </div>
              </div>
              {model.sizeEstimated ? (
                <p className="small muted" style={{ marginTop: -12 }}>
                  {p.model.spec.estimated}
                </p>
              ) : null}

              <div className="calc">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <b style={{ font: '600 16px/22px var(--font-sans)' }}>{p.model.calcTitle}</b>
                  <span className="small muted">{p.model.calcTurn}</span>
                </div>
                <div className="calc-row">
                  <div className="sps-field">
                    <label className="sps-label" htmlFor="calc-m2">
                      {p.model.calcVolume}
                    </label>
                    <input
                      className="sps-input mono"
                      id="calc-m2"
                      inputMode="decimal"
                      value={m2}
                      onChange={(e) => setM2(e.target.value.replace(/[^\d.,]/g, ''))}
                      style={{ fontSize: 18 }}
                    />
                  </div>
                  <div className="calc-out">
                    <span className="sps-label">{p.model.calcMolds}</span>
                    <b className="mono">{molds === null ? '—' : num(lang, molds)}</b>
                  </div>
                  <div className="calc-out">
                    <span className="sps-label">{p.model.calcKg}</span>
                    <b className="mono">{weight === null ? '—' : `${num(lang, weight)} ${p.model.keyKg}`}</b>
                  </div>
                </div>
                {molds === null ? <p className="small muted" style={{ margin: 0 }}>{p.model.calcSetNote}</p> : null}
              </div>

              <div className="desk-cta">
                <button type="button" className="sps-btn sps-btn--primary sps-btn--lg" onClick={() => setLeadOpen(true)}>
                  {p.model.ctaLead}
                </button>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className={`sps-btn ${inList ? 'sps-btn--dark' : 'sps-btn--outline'}`}
                    onClick={toggleList}
                    style={{ flex: 1 }}
                  >
                    {inList ? p.model.ctaListOn : p.model.ctaList}
                  </button>
                  <button
                    type="button"
                    className={`sps-btn ${inCompare ? 'sps-btn--dark' : 'sps-btn--outline'}`}
                    onClick={() => compare.toggle(model.slug)}
                    style={{ flex: 1 }}
                  >
                    {inCompare ? p.model.ctaCompareOn : p.model.ctaCompare}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', paddingTop: 4, fontSize: 14 }}>
                <a className="mono" style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', textDecoration: 'none' }} href={`tel:${CONTACTS_2027.mainPhoneRaw}`}>
                  {CONTACTS_2027.mainPhone}
                </a>
                <a href={CONTACTS_2027.telegramUrl} target="_blank" rel="noopener noreferrer">
                  Telegram
                </a>
                <a href={CONTACTS_2027.whatsappUrl} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
                <span className="muted">{t.header.hours}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tablar */}
      <section style={{ paddingBottom: 'var(--space-9)' }}>
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="tabs" role="tablist">
            {(['spec', 'use', 'delivery', 'faq'] as const).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                id={`tab-${k}`}
                aria-selected={tab === k}
                aria-controls={`panel-${k}`}
                className={tab === k ? 'on' : ''}
                onClick={() => setTab(k)}
              >
                {p.model.tabs[k]}
              </button>
            ))}
          </div>

          {tab === 'spec' ? (
            <div className="spec-split" id="panel-spec" role="tabpanel" aria-labelledby="tab-spec">
              <table className="sps-spec">
                <tbody>
                  {specRows.map((r) => (
                    <tr key={r.k + r.v}>
                      <th>{r.k}</th>
                      <td>{r.v}</td>
                    </tr>
                  ))}
                  {model.molds.length > 1 ? (
                    <tr>
                      <th>{p.model.spec.setNote}</th>
                      <td>
                        {model.molds.length} · {moldLetters(model)}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
              {model.images.tiles.A || model.images.scene ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: 'var(--surface-alt)', aspectRatio: '4 / 3', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                    <Image
                      src={(model.images.tiles.A || model.images.scene) as string}
                      alt={`${modelName(model, lang)} — ${p.model.spec.tile}`}
                      fill
                      sizes="(max-width: 1100px) 100vw, 420px"
                      style={{ objectFit: 'contain', padding: 16 }}
                      loading="lazy"
                    />
                  </div>
                  <p className="small muted" style={{ margin: 0 }}>
                    {p.model.spec.tileNote}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === 'use' ? (
            <div className="g2" id="panel-use" role="tabpanel" aria-labelledby="tab-use" style={{ gap: 'var(--space-6)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 className="h3">{p.model.use.title}</h3>
                <p className="body muted">{useText}</p>
                <h3 className="h3">{p.model.use.title2}</h3>
                <p className="body muted">{p.model.use.laying}</p>
              </div>
              {model.images.scene ? (
                <div style={{ aspectRatio: '4 / 3', overflow: 'hidden', position: 'relative', borderRadius: 'var(--radius-card)' }}>
                  <Image src={model.images.scene} alt="" fill sizes="(max-width: 1100px) 100vw, 520px" style={{ objectFit: 'cover' }} loading="lazy" />
                </div>
              ) : (
                <div className="ph" style={{ aspectRatio: '4 / 3' }}>
                  {model.code || modelName(model, lang)}
                </div>
              )}
            </div>
          ) : null}

          {tab === 'delivery' ? (
            <table className="sps-spec" id="panel-delivery" role="tabpanel" aria-labelledby="tab-delivery" style={{ maxWidth: 760 }}>
              <tbody>
                <tr>
                  <th>{p.model.delivery.price}</th>
                  <td>{p.model.delivery.priceValue}</td>
                </tr>
                <tr>
                  <th>{p.model.delivery.uz}</th>
                  <td>{p.model.delivery.uzValue}</td>
                </tr>
                <tr>
                  <th>{p.model.delivery.export}</th>
                  <td>{p.model.delivery.exportValue}</td>
                </tr>
                <tr>
                  <th>{p.model.delivery.docs}</th>
                  <td>{p.model.delivery.docsValue}</td>
                </tr>
                <tr>
                  <th>{p.model.delivery.minVolume}</th>
                  <td className="ph-in">[MIN. HAJM]</td>
                </tr>
              </tbody>
            </table>
          ) : null}

          {tab === 'faq' ? (
            <div id="panel-faq" role="tabpanel" aria-labelledby="tab-faq" style={{ maxWidth: 860 }}>
              {p.model.faq.map((f, i) => (
                <div className="faq" key={f.q} style={i === p.model.faq.length - 1 ? { borderBottom: '1px solid var(--line)' } : undefined}>
                  <h3 className="h3">{f.q}</h3>
                  <p className="body muted">{f.a}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* O'xshash modellar */}
      {related.length ? (
        <section className="sec-alt" style={{ paddingBlock: 'var(--space-8)' }}>
          <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
              <h2 className="h1">
                {model.tiles[0]?.size || t.sections[model.section]} — {p.model.related}
              </h2>
              <a className="sps-btn sps-btn--link" href={`/${lang}/catalog/${SECTION_SLUGS[model.section]}`}>
                {p.model.relatedAll}
              </a>
            </div>
            <div className="rel">
              {related.map((r) => (
                <a className="rc" key={r.slug} href={`/${lang}/catalog/${SECTION_SLUGS[r.section]}/${r.slug}`}>
                  {modelImage(r) ? (
                    <Image src={modelImage(r) as string} alt={modelName(r, lang)} width={400} height={300} loading="lazy" />
                  ) : (
                    <div className="ph" style={{ aspectRatio: '4 / 3' }}>
                      {r.code || modelName(r, lang)}
                    </div>
                  )}
                  <div>
                    <span className="mono">{r.code ? `№ ${r.code}` : t.sections[r.section]}</span>
                    <b>{modelName(r, lang)}</b>
                    <span className="mono">
                      {[r.tiles[0]?.size, modelThickness(r) ? `${modelThickness(r)} mm` : null, modelPerM2(r) ? `${formatNumber(lang, modelPerM2(r))} ${p.model.keyPerUnit}/m²` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Mobil sticky panel */}
      <div className="mbar">
        <a
          className="sps-btn sps-btn--outline"
          href={`tel:${CONTACTS_2027.mainPhoneRaw}`}
          aria-label={p.model.callA11y}
          style={{ width: 52, padding: 0, justifyContent: 'center' }}
        >
          <Icon.phone size={20} aria-hidden="true" />
        </a>
        <button type="button" className={`sps-btn ${inList ? 'sps-btn--dark' : 'sps-btn--outline'}`} onClick={toggleList} style={{ flex: 1 }}>
          {inList ? p.model.ctaListOn : p.model.ctaListShort}
        </button>
        <button type="button" className="sps-btn sps-btn--primary" onClick={() => setLeadOpen(true)} style={{ flex: 1.4 }}>
          {t.catalog.cardRequest}
        </button>
      </div>

      <QuickRequestModal key={model.slug} model={leadOpen ? model : null} lang={lang} onClose={() => setLeadOpen(false)} />
    </>
  );
}
