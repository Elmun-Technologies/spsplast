'use client';

import { useState } from 'react';
import { getModelBySlug, calcMolds, modelName } from '@/lib/catalog2027';
import type { Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { getPages } from '@/lib/pages';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import { submitLead } from '@/lib/leadSubmit';
import { useRequestList } from '@/lib/store/spsLists';

type ClientType = 'workshop' | 'dealer' | 'builder';
const MATERIALS: ('pp' | 'abs' | 'advice')[] = ['pp', 'abs', 'advice'];

/**
 * Ulgurji formasi (Partners.dc.html, `#sorov`): mijoz turi, kompaniya, davlat,
 * kunlik hajm, material. Zayafka ro'yxatidagi modellar shu yerda ko'rinadi.
 */
export function PartnersForm({ lang }: { lang: Locale }) {
  const t = getUi(lang);
  const p = getPages(lang);
  const list = useRequestList();
  const [clientType, setClientType] = useState<ClientType>('workshop');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [country, setCountry] = useState(p.partners.countries[0]);
  const [phone, setPhone] = useState('');
  const [volume, setVolume] = useState('');
  const [material, setMaterial] = useState(0);
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [requestId, setRequestId] = useState('');

  const items = list.items.flatMap((i) => {
    const m = getModelBySlug(i.slug);
    return m ? [{ item: i, model: m }] : [];
  });

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    const res = await submitLead({
      type: 'partners',
      clientType,
      name,
      phone,
      company: company || undefined,
      country: country || undefined,
      volumeM2: Number(String(volume).replace(',', '.')) || undefined,
      material: MATERIALS[material],
      message: message || undefined,
      lang,
      items: items.map(({ item, model }) => ({
        slug: item.slug,
        code: model.code,
        m2: item.m2 ?? (calcMolds(model, 100) ? 100 : undefined),
      })),
    });
    if (res.ok) {
      setRequestId(res.requestId ?? '');
      setState('ok');
    } else {
      setState('error');
    }
  };

  if (state === 'ok') {
    return (
      <div className="pt-form" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <b style={{ font: '600 24px/30px var(--font-sans)' }}>{p.partners.sentTitle}</b>
        <p className="body muted" style={{ margin: 0 }}>
          {p.partners.sentText}
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
    );
  }

  return (
    <form className="sps-form pt-form" onSubmit={send} noValidate>
      <div>
        <span className="sps-label" id="pt-client-type">
          {p.partners.formClientType}
        </span>
        <div className="sps-seg" style={{ marginTop: 6, flexWrap: 'wrap' }} role="radiogroup" aria-labelledby="pt-client-type">
          {(['workshop', 'dealer', 'builder'] as ClientType[]).map((k) => (
            <label key={k}>
              <input type="radio" name="pt-client" checked={clientType === k} onChange={() => setClientType(k)} />
              {p.partners.clientTypes[k]}
            </label>
          ))}
        </div>
      </div>

      <div className="sps-form__row">
        <div className="sps-field">
          <label className="sps-label" htmlFor="p-name">
            {p.partners.name}
          </label>
          <input
            className="sps-input"
            id="p-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={p.request.namePlaceholder}
            required
            minLength={2}
            maxLength={120}
          />
        </div>
        <div className="sps-field">
          <label className="sps-label" htmlFor="p-company">
            {p.partners.company}
          </label>
          <input
            className="sps-input"
            id="p-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={p.partners.companyPlaceholder}
            maxLength={160}
          />
        </div>
      </div>

      <div className="sps-form__row">
        <div className="sps-field">
          <label className="sps-label" htmlFor="p-country">
            {p.partners.country}
          </label>
          <select className="sps-input" id="p-country" value={country} onChange={(e) => setCountry(e.target.value)}>
            {p.partners.countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="sps-field">
          <label className="sps-label" htmlFor="p-phone">
            {p.partners.phone}
          </label>
          <input
            className="sps-input"
            id="p-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={p.request.phonePlaceholder}
            required
            minLength={7}
          />
        </div>
      </div>

      <div className="sps-form__row">
        <div className="sps-field">
          <label className="sps-label" htmlFor="p-vol">
            {p.partners.volume}
          </label>
          <input
            className="sps-input mono"
            id="p-vol"
            inputMode="decimal"
            value={volume}
            onChange={(e) => setVolume(e.target.value.replace(/[^\d.,]/g, ''))}
            placeholder={p.partners.volumePlaceholder}
          />
        </div>
        <div className="sps-field">
          <label className="sps-label" htmlFor="p-mat">
            {p.partners.material}
          </label>
          <select className="sps-input" id="p-mat" value={material} onChange={(e) => setMaterial(Number(e.target.value))}>
            {p.partners.materials.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="sps-field">
        <label className="sps-label" htmlFor="p-msg">
          {p.partners.message}
        </label>
        <textarea
          className="sps-textarea"
          id="p-msg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={p.partners.messagePlaceholder}
          maxLength={2000}
        />
      </div>

      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value=""
        onChange={() => {}}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
      />

      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="sps-help">{p.partners.responseTime}</span>
        <button className="sps-btn sps-btn--primary sps-btn--lg" type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? t.catalog.formSending : p.partners.submit}
        </button>
      </div>
      {state === 'error' ? (
        <p className="sps-form__error" role="alert" style={{ margin: 0 }}>
          {t.catalog.formError}
        </p>
      ) : null}
      <p className="small muted" style={{ margin: 0 }}>
        {p.request.direct} <span className="mono">{CONTACTS_2027.mainPhone}</span> · Telegram {CONTACTS_2027.telegramHandle}
      </p>

      {items.length ? (
        <div className="pt-list">
          <span className="sps-label">
            {p.partners.formListLabel} · {items.length}
          </span>
          {items.map(({ item, model }) => (
            <div className="pt-list-row" key={item.slug}>
              <span className="mono" style={{ fontSize: 14 }}>
                {model.code ? `№ ${model.code} ` : ''}
                {modelName(model, lang)}
              </span>
              <span className="mono muted" style={{ fontSize: 13 }}>
                {item.m2 ? `${item.m2} ${p.model.leadPerDay}` : t.sections[model.section]}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </form>
  );
}
