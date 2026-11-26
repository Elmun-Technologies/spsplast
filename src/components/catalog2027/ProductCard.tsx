'use client';

import Image from 'next/image';
import { type Model, isPhotoImage, isReadySection, modelPath, modelSetSize, modelName, sectionLabel } from '@/lib/catalogCore';
import { type Locale } from '@/lib/i18n';
import { formatNumber } from '@/lib/i18n';
import { useUi } from '@/components/site/UiProvider';
import { useCompareList, useRequestList } from '@/lib/store/spsLists';
import { Icon } from '@/components/site/icons';

/** Asosiy rasm (qolip / mahsulot) va yon oyna (natija) o'lchamlari — retina'da ham tiniq chiqishi uchun. */
const STAGE_SIZES = '(max-width: 760px) 50vw, (max-width: 1100px) 34vw, 320px';
const PANE_SIZES = '(max-width: 760px) 50vw, (max-width: 1100px) 20vw, 200px';

export function productHref(lang: Locale, m: Model): string {
  return `/${lang}${modelPath(m)}`;
}

export function ProductCard({
  model,
  lang,
  onRequest,
  onQuick,
  load = 'lazy',
}: {
  model: Model;
  lang: Locale;
  onRequest: (m: Model) => void;
  onQuick: (m: Model) => void;
  /**
   * Rasm yuklanishi (Lighthouse LCP): birinchi ekrandagi kartochka `lazy` bo'lsa, brauzer
   * uni layout'dan keyin so'raydi (~0.5 s kechikish). `priority` — HTML'da preload +
   * fetchpriority=high (LCP rasmi, 1–2 ta); `eager` — darhol, lekin oddiy ustuvorlik.
   */
  load?: 'priority' | 'eager' | 'lazy';
}) {
  const ui = useUi();
  const t = ui.catalog;
  const compare = useCompareList();
  const request = useRequestList();
  const inList = request.has(model.slug);
  const inCompare = compare.has(model.slug);

  const size = model.tiles[0]?.size || model.molds[0]?.size;
  const depth = model.molds[0]?.depth;
  const per = model.tiles[0]?.per;
  const set = modelSetSize(model);
  const cutout = model.images.molds.A || Object.values(model.images.molds)[0] || model.images.tiles.A || Object.values(model.images.tiles)[0] || null;
  // Tayyor mahsulot (beton, qolip emas): material "PP / ABS" emas; 1 m² dagi soni yoki og'irligi, bo'lmasa ustun yo'q.
  const ready = isReadySection(model.section);
  const third: { dt: string; dd: string } | null = ready
    ? per
      ? { dt: t.mPer, dd: `${formatNumber(lang, per)} ${t.dona}` }
      : model.kg
        ? { dt: t.mWeight, dd: `${model.kg} kg` }
        : null
    : {
        dt: set > 1 ? t.mSet : per ? t.mPer : t.mMaterial,
        dd: set > 1 ? `${set} ${t.molds}` : per ? `${formatNumber(lang, per)} ${t.dona}` : model.section === 'trotuar' ? 'PP' : 'PP / ABS',
      };
  const href = productHref(lang, model);
  const main = load === 'priority' ? ({ priority: true, fetchPriority: 'high' } as const) : ({ loading: load } as const);
  const inset = { loading: load === 'lazy' ? 'lazy' : 'eager' } as const;
  const mold = model.images.molds.A || null;
  const scene = (model.images.sceneSm || model.images.scene || null) as string | null;
  // Studiya sahnasi (2026-11-24): chapda asosiy buyum — qolip yoki tayyor mahsulot (fonsiz, studiya fonida),
  // o'ngda (mobilda pastda) natija surati: terilgan ko'rinish / obyektdagi ko'rinish. Ikkalasi ham yirik va aniq.
  const stage = ready ? scene : mold;
  const stageCover = ready ? isPhotoImage(scene) : false;
  const pane = ready ? (stage && !stageCover ? model.images.tiles.A || null : null) : mold ? scene : null;
  const fallback = !stage ? (ready ? cutout : scene) : null;

  return (
    <article className={`sps-card${ready ? ' sps-card--ready' : ''}`}>
      <div className={`sps-card__media${pane ? ' sps-card__media--duo' : ''}`}>
        {stage ? (
          <a href={href} tabIndex={-1} aria-hidden="true" className={stageCover ? 'sps-card__photo' : 'sps-card__cutout'}>
            <Image src={stage} alt="" fill sizes={STAGE_SIZES} style={{ objectFit: stageCover ? 'cover' : 'contain' }} {...main} />
          </a>
        ) : fallback ? (
          <a href={href} tabIndex={-1} aria-hidden="true" className="sps-card__photo">
            <Image src={fallback} alt="" fill sizes={STAGE_SIZES} style={{ objectFit: 'cover' }} {...main} />
          </a>
        ) : cutout ? (
          // Sahna va qolip rasmi yo'q — mahsulot suratining o'zi (fonsiz) asosiy rasm bo'ladi.
          <a href={href} tabIndex={-1} aria-hidden="true" className="sps-card__cutout">
            <Image src={cutout} alt="" fill sizes={STAGE_SIZES} style={{ objectFit: 'contain' }} {...main} />
          </a>
        ) : (
          <a href={href} tabIndex={-1} aria-hidden="true" className="sps-card__nophoto">
            <Icon.grid width={28} height={28} strokeWidth={1.25} aria-hidden="true" />
            <span>{t.photoSoon}</span>
          </a>
        )}
        {pane ? (
          <a href={href} tabIndex={-1} className="sps-card__pane">
            <Image src={pane} alt={`${modelName(model, lang)} — ${ready ? t.cardOnSite : ui.alt.scene}`} fill sizes={PANE_SIZES} style={{ objectFit: 'cover' }} {...inset} />
            <span className="sps-card__panechip" aria-hidden="true">
              {ready ? t.cardOnSite : t.cardResult}
            </span>
          </a>
        ) : null}
        {model.code ? (
          <span className="sps-card__no" aria-hidden="true">
            № {model.code}
          </span>
        ) : null}
        {/* Solishtirish va tez ko'rish — qolip xususiyatlari (qolip soni, qalinlik, 1 m²) uchun; tayyor mahsulotda yo'q. */}
        {ready ? null : (
        <button
          type="button"
          className={`sps-card__cmp sps-iconbtn${inCompare ? ' sps-iconbtn--on' : ''}`}
          aria-label={t.cardCompare}
          title={t.cardCompare}
          aria-pressed={inCompare}
          onClick={() => compare.toggle(model.slug)}
        >
          <Icon.compare width={18} height={18} strokeWidth={1.5} aria-hidden="true" />
          <span className="hide-m" style={{ marginLeft: 6, font: '500 13px/18px var(--font-sans)' }}>
            {t.cardCompare}
          </span>
        </button>
        )}
        {ready ? null : (
          <button type="button" className="sps-card__quick sps-btn sps-btn--dark sps-btn--sm" onClick={() => onQuick(model)}>
            {t.cardQuick}
          </button>
        )}
      </div>
      <div className="sps-card__body">
        <span className="sps-card__code">
          {model.code ? <span className="sr-only">{`№ ${model.code} · `}</span> : null}
          {sectionLabel(model.section, lang)}
        </span>
        <h2 className="sps-card__name">
          <a href={href}>{modelName(model, lang)}</a>
        </h2>
        {/* Noma'lum qiymat "—" bo'lib chiqmaydi — ustun umuman ko'rsatilmaydi. */}
        <dl className="sps-card__spec">
          {size ? (
            <div>
              <dt>{t.mSize}</dt>
              <dd>{size}</dd>
            </div>
          ) : null}
          {depth && !(size && size.split('×').length >= 3) ? (
            <div className="hide-m">
              <dt>{t.mThickness}</dt>
              <dd>{`${depth} ${t.mm}`}</dd>
            </div>
          ) : null}
          {third ? (
            <div>
              <dt>{third.dt}</dt>
              <dd>{third.dd}</dd>
            </div>
          ) : null}
        </dl>
      </div>
      <div className="sps-card__foot">
        {/* Kartochka CTA'si grafit: qizil — sahifadagi bitta asosiy CTA uchun (Redesign 2028). */}
        <button type="button" className="sps-btn sps-btn--dark sps-card__cta" onClick={() => onRequest(model)}>
          {t.cardRequest}
        </button>
        <button
          type="button"
          className={`sps-iconbtn${inList ? ' sps-iconbtn--on' : ''}`}
          aria-label={inList ? t.cardInList : t.cardAdd}
          aria-pressed={inList}
          onClick={() => {
            if (inList) request.remove(model.slug);
            else
              request.add({
                slug: model.slug,
                code: model.code,
                name: modelName(model, lang),
              });
          }}
        >
          <Icon.list width={18} height={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
