'use client';

import Image from 'next/image';
import { SECTION_SLUGS, type Model, modelSetSize, modelName, sectionLabel } from '@/lib/catalog2027';
import { type Locale } from '@/lib/i18n';
import { formatNumber, getUi } from '@/lib/ui';
import { useCompareList, useRequestList } from '@/lib/store/spsLists';
import { Icon } from '@/components/site/icons';

export function productHref(lang: Locale, m: Model): string {
  return `/${lang}/catalog/${SECTION_SLUGS[m.section]}/${m.slug}`;
}

export function ProductCard({
  model,
  lang,
  onRequest,
  onQuick,
}: {
  model: Model;
  lang: Locale;
  onRequest: (m: Model) => void;
  onQuick: (m: Model) => void;
}) {
  const t = getUi(lang).catalog;
  const compare = useCompareList();
  const request = useRequestList();
  const inList = request.has(model.slug);
  const inCompare = compare.has(model.slug);

  const size = model.tiles[0]?.size || model.molds[0]?.size;
  const depth = model.molds[0]?.depth;
  const per = model.tiles[0]?.per;
  const set = modelSetSize(model);
  const cutout = model.images.molds.A || Object.values(model.images.molds)[0] || model.images.tiles.A || Object.values(model.images.tiles)[0] || null;
  const third = set > 1 ? `${set} ${t.molds}` : per ? `${formatNumber(lang, per)} ${t.dona}` : 'PP / ABS';
  const href = productHref(lang, model);

  return (
    <article className={`sps-card${model.images.scene && model.images.molds.A ? ' sps-card--inset' : ''}`}>
      <div className="sps-card__media">
        {model.images.scene ? (
          <a href={href} tabIndex={-1} aria-hidden="true">
            <Image src={(model.images.sceneSm || model.images.scene) as string} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw" style={{ objectFit: 'cover' }} loading="lazy" />
          </a>
        ) : cutout ? (
          // Sahna rasmi yo'q — qolip/mahsulot suratining o'zi (fonsiz) asosiy rasm bo'ladi.
          <a href={href} tabIndex={-1} aria-hidden="true" className="sps-card__cutout">
            <Image src={cutout} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw" style={{ objectFit: 'contain' }} loading="lazy" />
          </a>
        ) : (
          <a href={href} tabIndex={-1} aria-hidden="true" className="sps-card__nophoto">
            <Icon.grid width={28} height={28} strokeWidth={1.25} aria-hidden="true" />
            <span>{t.photoSoon}</span>
          </a>
        )}
        {model.images.scene && model.images.molds.A ? (
          <span className="sps-card__mold">
            <Image src={model.images.molds.A} alt={`${modelName(model, lang)} — ${getUi(lang).alt.mold}`} fill sizes="(max-width: 640px) 19vw, 9vw" style={{ objectFit: 'contain' }} loading="lazy" />
          </span>
        ) : null}
        {model.code ? (
          <span className="sps-card__no" aria-hidden="true">
            № {model.code}
          </span>
        ) : null}
        <button
          type="button"
          className={`sps-card__cmp sps-iconbtn${inCompare ? ' sps-iconbtn--on' : ''}`}
          aria-label={t.cardCompare}
          aria-pressed={inCompare}
          onClick={() => compare.toggle(model.slug)}
        >
          <Icon.compare width={18} height={18} strokeWidth={1.5} aria-hidden="true" />
          <span className="hide-m" style={{ marginLeft: 6, font: '500 13px/18px var(--font-sans)' }}>
            {t.cardCompare}
          </span>
        </button>
        <button type="button" className="sps-card__quick sps-btn sps-btn--dark sps-btn--sm" onClick={() => onQuick(model)}>
          {t.cardQuick}
        </button>
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
          <div>
            <dt>{set > 1 ? t.mSet : per ? t.mPer : t.mMaterial}</dt>
            <dd>{third}</dd>
          </div>
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
