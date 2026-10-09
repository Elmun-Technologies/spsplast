'use client';

import Image from 'next/image';
import { type Model, modelName, modelSetSize } from '@/lib/catalog2027';
import { type Locale } from '@/lib/i18n';
import { formatNumber, getUi } from '@/lib/ui';
import { useModalShell } from '@/components/site/useModalShell';
import { Icon } from '@/components/site/icons';
import { productHref } from '@/components/catalog2027/ProductCard';

/** Tez ko'rish: 2 ustunli modal (rasm + qolip | kod, nom, 4 qatorli jadval, CTA). */
export function QuickViewModal({
  model,
  lang,
  onClose,
  onRequest,
}: {
  model: Model | null;
  lang: Locale;
  onClose: () => void;
  onRequest: (m: Model) => void;
}) {
  const t = getUi(lang).catalog;
  const ref = useModalShell(Boolean(model), onClose);
  if (!model) return null;

  const size = model.tiles[0]?.size || model.molds[0]?.size;
  const depth = model.molds[0]?.depth;
  const per = model.tiles[0]?.per;
  const rows: [string, string][] = [
    [t.mSize, size || '—'],
    [t.mThickness, depth ? `${depth} ${t.mm}` : '—'],
    [t.mPer, per ? `${formatNumber(lang, per)} ${t.dona}` : '—'],
    [t.mSet, `${modelSetSize(model)} ${t.molds}`],
  ];

  return (
    <div
      className="sps-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sps-modal" style={{ maxWidth: 760 }} role="dialog" aria-modal="true" aria-label={modelName(model, lang)} ref={ref}>
        <div className="sps-modal__head">
          <h2 className="h2">{modelName(model, lang)}</h2>
          <button type="button" className="sps-iconbtn" aria-label={getUi(lang).a11y.close} onClick={onClose}>
            <Icon.close width={18} height={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <div className="qv-grid">
          <div className="qv-media">
            {model.images.scene ? <Image src={model.images.scene} alt="" fill sizes="(max-width: 760px) 100vw, 340px" style={{ objectFit: 'cover' }} /> : <div className="ph" style={{ position: 'absolute', inset: 0 }}>{model.code || '—'}</div>}
            {model.images.molds.A ? (
              <span className="sps-card__mold">
                <Image src={model.images.molds.A} alt="" fill sizes="80px" style={{ objectFit: 'contain' }} />
              </span>
            ) : null}
          </div>
          <div style={{ display: 'grid', gap: 'var(--space-4)', alignContent: 'start' }}>
            <span className="sps-card__code">
              {model.code ? `№ ${model.code} · ` : ''}
              {getUi(lang).sections[model.section]}
            </span>
            <table className="sps-spec">
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k}>
                    <th scope="row">{k}</th>
                    <td>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="row cta-row">
              <button type="button" className="sps-btn sps-btn--primary" onClick={() => onRequest(model)}>
                {t.cardRequest}
              </button>
              <a className="sps-btn sps-btn--outline" href={productHref(lang, model)}>
                {t.quickViewDetails}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
