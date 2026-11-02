'use client';

import { useState } from 'react';
import Image from 'next/image';
import { type Model, modelName, modelSetSize, sectionLabel } from '@/lib/catalog2027';
import { type Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { submitLead } from '@/lib/leadSubmit';
import { useRequestList } from '@/lib/store/spsLists';
import { useModalShell } from '@/components/site/useModalShell';
import { Icon } from '@/components/site/icons';
import { LeadFormError, checkLead, useRevealOnShow, type LeadError } from '@/components/site/LeadFeedback';

/**
 * Tez zayafka oynasi: desktop — markazda modal, mobil — pastdan sheet (92vh).
 * Yuborilgach: yashil belgi + requestId + ish vaqti (HANDOFF 3).
 */
export function QuickRequestModal({
  model,
  lang,
  onClose,
  initialVolume,
}: {
  model: Model | null;
  lang: Locale;
  onClose: () => void;
  /** Model sahifasidagi kalkulyatorda kiritilgan hajm (m²/kun) — formaga o'tadi. */
  initialVolume?: number;
}) {
  const t = getUi(lang).catalog;
  const request = useRequestList();
  const ref = useModalShell(Boolean(model), onClose);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [volume, setVolume] = useState(initialVolume ? String(initialVolume) : '100');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [requestId, setRequestId] = useState('');
  const [error, setError] = useState<LeadError>('');
  const okRef = useRevealOnShow<HTMLParagraphElement>(state === 'ok');

  if (!model) return null;
  const size = model.tiles[0]?.size || model.molds[0]?.size;

  return (
    <div
      className="sps-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sps-sheet sps-modal" role="dialog" aria-modal="true" aria-label={t.cardRequest} ref={ref}>
        <div className="sps-sheet__head">
          <div className="qr-head">
            {model.images.sceneSm || model.images.scene ? (
              <Image src={(model.images.sceneSm || model.images.scene) as string} alt={`${modelName(model, lang)} — ${getUi(lang).alt.scene}`} width={88} height={88} style={{ objectFit: 'cover', borderRadius: 'var(--radius-mini)' }} />
            ) : null}
            <div>
              <span className="sps-card__code">{model.code ? `№ ${model.code}` : sectionLabel(model.section, lang)}</span>
              <h2 className="h3">{modelName(model, lang)}</h2>
              <span className="sps-help">{size || '—'}</span>
            </div>
          </div>
          <button type="button" className="sps-iconbtn" aria-label={getUi(lang).a11y.close} onClick={onClose}>
            <Icon.close width={18} height={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {state === 'ok' ? (
          <div className="sps-form">
            <p className="sps-form__ok" role="status" tabIndex={-1} ref={okRef}>
              <b>✓ {t.formOk}</b>
              {requestId ? <span className="mono">{requestId}</span> : null}
              <span>{t.formOkText}</span>
            </p>
            <button type="button" className="sps-btn sps-btn--outline" onClick={onClose}>
              {t.formBack}
            </button>
          </div>
        ) : (
          <form
            className="sps-form"
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              const invalid = checkLead(name, phone);
              if (invalid) {
                setError(invalid);
                setState('error');
                return;
              }
              setError('');
              setState('sending');
              const res = await submitLead({
                type: 'quick',
                name,
                phone,
                city: city || undefined,
                volumeM2: Number(volume) || undefined,
                message: message || undefined,
                lang,
                items: [{ slug: model.slug, code: model.code, m2: Number(volume) || undefined }],
              });
              if (res.ok) {
                setRequestId(res.requestId || '');
                setState('ok');
              } else {
                setError(res.error || 'network');
                setState('error');
              }
            }}
          >
            {state === 'error' && error ? <LeadFormError lang={lang} error={error} /> : null}
            <label className="sps-field">
              <span className="sps-label">{t.formName} *</span>
              <input className="sps-input ym-disable-keys" value={name} aria-label={t.formName} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} autoComplete="name" aria-invalid={error === 'name' || undefined} />
            </label>
            <label className="sps-field">
              <span className="sps-label">{t.formPhone} *</span>
              <input className="sps-input ym-disable-keys" value={phone} aria-label={t.formPhone} onChange={(e) => setPhone(e.target.value)} required minLength={7} maxLength={32} type="tel" inputMode="tel" autoComplete="tel" placeholder="+998" aria-invalid={error === 'bad_phone' || undefined} />
            </label>
            <div className="sps-form__row">
              <label className="sps-field">
                <span className="sps-label">{t.formVolume}</span>
                <input className="sps-input ym-disable-keys" type="number" min={1} max={100000} value={volume} aria-label={t.formVolume} onChange={(e) => setVolume(e.target.value)} />
              </label>
              <label className="sps-field">
                <span className="sps-label">{t.formCity}</span>
                <input className="sps-input ym-disable-keys" value={city} aria-label={t.formCity} onChange={(e) => setCity(e.target.value)} maxLength={120} autoComplete="address-level2" />
              </label>
            </div>
            <label className="sps-field">
              <span className="sps-label">{t.formNote}</span>
              <textarea className="sps-textarea ym-disable-keys" value={message} aria-label={t.formNote} onChange={(e) => setMessage(e.target.value)} maxLength={2000} />
            </label>
            <p className="sps-help">{t.formHelp}</p>
            <div className="row cta-row">
              <button className="sps-btn sps-btn--primary sps-btn--lg" type="submit" disabled={state === 'sending'}>
                {state === 'sending' ? t.formSending : t.formSubmit}
              </button>
              <button
                type="button"
                className="sps-btn sps-btn--outline"
                onClick={() => {
                  request.add({ slug: model.slug, code: model.code, name: modelName(model, lang) });
                  onClose();
                }}
              >
                {t.formAddList}
              </button>
            </div>
            {modelSetSize(model) > 1 ? <p className="sps-help">{t.estimated}</p> : null}
          </form>
        )}
      </div>
    </div>
  );
}
