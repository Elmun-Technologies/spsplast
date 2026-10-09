'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  SECTION_SLUGS,
  calcMolds,
  getModelBySlug,
  modelImage,
  modelName,
  modelSetSize,
  moldLetters,
  modelTileSize,
} from '@/lib/catalog2027';
import type { Locale } from '@/lib/i18n';
import { getUi, formatNumber } from '@/lib/ui';
import { getPages } from '@/lib/pages';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import { submitLead } from '@/lib/leadSubmit';
import { useRequestList } from '@/lib/store/spsLists';

type ClientType = 'workshop' | 'dealer' | 'builder' | 'private';

const num = (lang: Locale, n: number) => new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'ru-RU').format(n);

/**
 * Zayafka ro'yxati (HANDOFF 4.4): "Bu savat emas — to'lov yo'q."
 * Har qatorda kunlik m² va "≈ N qolip"; o'ngda forma → POST /api/leads.
 */
export function RequestClient({ lang }: { lang: Locale }) {
  const t = getUi(lang);
  const p = getPages(lang);
  const list = useRequestList();
  const [volumes, setVolumes] = useState<Record<string, string>>({});
  const [clientType, setClientType] = useState<ClientType>('workshop');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [requestId, setRequestId] = useState('');
  const [error, setError] = useState('');

  const rows = list.items.flatMap((item) => {
    const m = getModelBySlug(item.slug);
    return m ? [{ item, model: m }] : [];
  });

  const volumeOf = (slug: string, fallback?: number) => {
    const raw = volumes[slug] ?? (fallback ? String(fallback) : '100');
    return Math.max(0, Number(String(raw).replace(',', '.')) || 0);
  };

  let total = 0;
  let hasUnknown = false;
  for (const { item, model } of rows) {
    const molds = calcMolds(model, volumeOf(item.slug, item.m2));
    if (molds === null) hasUnknown = true;
    else total += molds;
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    setError('');
    const res = await submitLead({
      type: 'list',
      clientType,
      name,
      phone,
      city: city || undefined,
      message: message || undefined,
      lang,
      items: rows.map(({ item, model }) => ({
        slug: item.slug,
        code: model.code,
        m2: volumeOf(item.slug, item.m2) || undefined,
      })),
    });
    if (res.ok) {
      setRequestId(res.requestId ?? '');
      setState('ok');
      list.clear();
    } else {
      setError(res.error === 'rate_limit' ? t.catalog.formRateLimit : t.catalog.formError);
      setState('error');
    }
  };

  return (
    <section style={{ paddingBlock: '28px var(--space-9)' }}>
      <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <nav className="crumbs" aria-label="breadcrumb">
          <a href={`/${lang}`}>{p.model.breadcrumbHome}</a>
          <span>/</span>
          <span>{p.request.title}</span>
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h1 className="disp-l">{p.request.title}</h1>
          <p className="body muted">{p.request.note}</p>
        </div>

        <div className="rl">
          <div>
            <div className="rl-head">
              <span className="sps-label">{p.request.colModel}</span>
              <span className="sps-label">{p.request.colVolume}</span>
            </div>

            {rows.map(({ item, model }) => {
              const v = volumeOf(item.slug, item.m2);
              const molds = calcMolds(model, v);
              const meta = [
                modelTileSize(model) || model.molds[0]?.size,
                modelSetSize(model) > 1 ? `${modelSetSize(model)} · ${moldLetters(model)}` : null,
              ]
                .filter(Boolean)
                .join(' · ');
              return (
                <div className="ri" key={item.slug}>
                  {modelImage(model) ? (
                    <Image src={modelImage(model) as string} alt={modelName(model, lang)} width={120} height={90} loading="lazy" />
                  ) : (
                    <div className="ph" style={{ width: '100%', height: 66 }}>
                      {model.code || '—'}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                      {model.code ? `№ ${model.code} · ` : ''}
                      {t.sections[model.section]}
                    </span>
                    <a
                      href={`/${lang}/catalog/${SECTION_SLUGS[model.section]}/${model.slug}`}
                      style={{ font: '600 18px/22px var(--font-sans)', color: 'var(--ink)', textDecoration: 'none' }}
                    >
                      {modelName(model, lang)}
                    </a>
                    <span className="mono" style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                      {meta}
                    </span>
                  </div>
                  <div className="qty">
                    <input
                      className="sps-input mono"
                      inputMode="decimal"
                      aria-label={`${p.request.volumeA11y}: ${modelName(model, lang)}`}
                      value={volumes[item.slug] ?? (item.m2 ? String(item.m2) : '100')}
                      onChange={(e) =>
                        setVolumes((prev) => ({ ...prev, [item.slug]: e.target.value.replace(/[^\d.,]/g, '') }))
                      }
                    />
                    <span className="small muted">
                      {molds === null ? p.request.managerCounts : p.request.approx(num(lang, molds))}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="ri-x"
                    aria-label={`${p.request.removeA11y}: ${modelName(model, lang)}`}
                    onClick={() => list.remove(item.slug)}
                  >
                    ✕
                  </button>
                </div>
              );
            })}

            {!rows.length ? (
              <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
                <b style={{ font: '600 22px/28px var(--font-sans)' }}>{p.request.emptyTitle}</b>
                <p className="body muted" style={{ margin: 0 }}>
                  {p.request.emptyText}
                </p>
                <a className="sps-btn sps-btn--outline" href={`/${lang}/catalog`}>
                  {p.request.toCatalog}
                </a>
              </div>
            ) : (
              <>
                <div className="row" style={{ marginTop: 16, justifyContent: 'space-between' }}>
                  <a className="sps-btn sps-btn--link" href={`/${lang}/catalog`}>
                    {p.request.addMore}
                  </a>
                  <button type="button" className="sps-btn sps-btn--link" onClick={() => list.clear()}>
                    {p.request.clearList}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="rl-sum">
            {state === 'ok' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: 'var(--success-bg)',
                    color: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-hidden="true"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                </div>
                <b style={{ font: '600 24px/30px var(--font-sans)' }}>{p.request.sentTitle}</b>
                <p className="body muted" style={{ margin: 0 }}>
                  {p.request.sentText}
                </p>
                {requestId ? (
                  <span className="mono" style={{ fontSize: 13 }}>
                    {p.request.requestId} {requestId}
                  </span>
                ) : null}
                <a className="sps-btn sps-btn--outline" href={`/${lang}/catalog`}>
                  {p.request.backToCatalog}
                </a>
              </div>
            ) : (
              <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: 14 }} noValidate>
                <b style={{ font: '600 22px/28px var(--font-sans)' }}>{p.request.formTitle}</b>
                <div className="mono" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{p.request.modelsLabel}</span>
                  <b>{rows.length}</b>
                </div>
                <div
                  className="mono"
                  style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--line)' }}
                >
                  <span>{p.request.moldsLabel}</span>
                  <b>{total ? `${num(lang, total)}${hasUnknown ? p.request.totalPlus : ''}` : '—'}</b>
                </div>

                <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                  <legend className="sps-label">{p.request.whoLegend}</legend>
                  <div className="sps-seg" style={{ marginTop: 6 }}>
                    {(Object.keys(p.request.clientTypes) as ClientType[]).map((k) => (
                      <label key={k}>
                        <input
                          type="radio"
                          name="client-type"
                          checked={clientType === k}
                          onChange={() => setClientType(k)}
                        />
                        {p.request.clientTypes[k]}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="sps-field">
                  <label className="sps-label" htmlFor="r-name">
                    {p.request.name}
                  </label>
                  <input
                    className="sps-input"
                    id="r-name"
                    placeholder={p.request.namePlaceholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    minLength={2}
                    maxLength={120}
                  />
                </div>
                <div className="sps-field">
                  <label className="sps-label" htmlFor="r-phone">
                    {p.request.phone}
                  </label>
                  <input
                    className="sps-input"
                    id="r-phone"
                    type="tel"
                    placeholder={p.request.phonePlaceholder}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    minLength={7}
                  />
                </div>
                <div className="sps-field">
                  <label className="sps-label" htmlFor="r-city">
                    {p.request.city}
                  </label>
                  <input
                    className="sps-input"
                    id="r-city"
                    placeholder={p.request.cityPlaceholder}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    maxLength={120}
                  />
                </div>
                <div className="sps-field">
                  <label className="sps-label" htmlFor="r-msg">
                    {p.request.message}
                  </label>
                  <textarea
                    className="sps-textarea"
                    id="r-msg"
                    placeholder={p.request.messagePlaceholder}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={2000}
                  />
                </div>

                <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value="" onChange={() => {}} style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} />

                <button className="sps-btn sps-btn--primary sps-btn--lg" type="submit" disabled={state === 'sending'}>
                  {state === 'sending' ? t.catalog.formSending : p.request.submit}
                </button>
                {state === 'error' ? (
                  <p className="sps-form__error" role="alert" style={{ margin: 0 }}>
                    {error}
                  </p>
                ) : null}
                <p className="small muted" style={{ margin: 0 }}>
                  {p.request.direct} <span className="mono">{CONTACTS_2027.mainPhone}</span> · Telegram{' '}
                  {CONTACTS_2027.telegramHandle}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
