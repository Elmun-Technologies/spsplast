'use client';

import { useActionState, useState } from 'react';
import type { FormState } from '../actions';

type Action = (prev: FormState, fd: FormData) => Promise<FormState>;

function Msg({ state }: { state: FormState }) {
  if (state?.error)
    return (
      <p className="adm-msg adm-msg--err" role="alert">
        {state.error}
      </p>
    );
  if (state?.ok)
    return (
      <p className="adm-msg adm-msg--ok" role="status">
        {state.ok}
      </p>
    );
  return null;
}

/** Bitta tugmali amal (kalit yaratish, IndexNow, sitemap yuborish) — natija tugma ostida. */
export function ActionButton({ action, label, pendingLabel, dark }: { action: Action; label: string; pendingLabel: string; dark?: boolean }) {
  const [state, run, pending] = useActionState<FormState, FormData>(action, undefined);
  return (
    <form action={run} className="adm-actionform">
      <button className={`sps-btn ${dark ? 'sps-btn--dark' : 'sps-btn--outline'} sps-btn--sm`} type="submit" disabled={pending}>
        {pending ? pendingLabel : label}
      </button>
      <Msg state={state} />
    </form>
  );
}

const LANGS = [
  { l: 'uz', name: "O'zbekcha" },
  { l: 'ru', name: 'Русский' },
  { l: 'en', name: 'English' },
] as const;

export type SeoFormValues = Record<string, string>;
export type LiveMeta = Record<string, { title: string; description: string; h1: string } | null>;

/** Belgi hisoblagichi: SERP chegarasidan oshsa sariq. */
function Counter({ n, min, max }: { n: number; min?: number; max: number }) {
  const bad = n > max || (min !== undefined && n > 0 && n < min);
  return <span className={`adm-count${bad ? ' adm-count--warn' : ''}`}>{n}{min ? ` / ${min}–${max}` : ` / ${max}`}</span>;
}

export function SeoEditForm({
  action,
  path,
  initial,
  initialNoindex,
  live,
  allowH1,
  siteUrl,
}: {
  action: Action;
  path: string;
  initial: SeoFormValues;
  initialNoindex: boolean;
  live: LiveMeta;
  allowH1: boolean;
  siteUrl: string;
}) {
  const [state, run, pending] = useActionState<FormState, FormData>(action, undefined);
  const start = state?.values ?? initial;
  const [vals, setVals] = useState<SeoFormValues>(start);
  const v = (k: string) => vals[k] ?? '';
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setVals((x) => ({ ...x, [k]: e.target.value }));

  return (
    <form action={run} className="adm-grid">
      <input type="hidden" name="path" value={path} />
      <div className="adm-seo-langs">
        {LANGS.map(({ l, name }) => {
          const cur = live[l];
          const title = v(`${l}.title`) || cur?.title?.replace(/ · SPS Plast$/, '') || '';
          const desc = v(`${l}.description`) || cur?.description || '';
          return (
            <section className="adm-card" key={l}>
              <h2>{name}</h2>
              <div className="adm-serp" aria-label="Google'dagi ko'rinishi (taxminan)">
                <small>{`${siteUrl.replace(/^https:\/\//, '')} › ${l}${path.replace(/\//g, ' › ')}`}</small>
                <b>{`${title} · SPS Plast`.slice(0, 70)}</b>
                <span>{desc.slice(0, 170)}</span>
              </div>
              <div className="adm-fields">
                <div className="sps-field">
                  <label htmlFor={`${l}-title`}>
                    <b>Title</b> <Counter n={v(`${l}.title`).length} max={53} />
                  </label>
                  <input className="sps-input" id={`${l}-title`} name={`${l}.title`} value={v(`${l}.title`)} onChange={set(`${l}.title`)} placeholder={cur?.title?.replace(/ · SPS Plast$/, '') || 'standart'} maxLength={70} />
                  <small>Bo&apos;sh — standart. Oxiriga « · SPS Plast» o&apos;zi qo&apos;shiladi.</small>
                </div>
                <div className="sps-field">
                  <label htmlFor={`${l}-description`}>
                    <b>Description</b> <Counter n={v(`${l}.description`).length} min={50} max={170} />
                  </label>
                  <textarea className="sps-input" id={`${l}-description`} name={`${l}.description`} rows={3} value={v(`${l}.description`)} onChange={set(`${l}.description`)} placeholder={cur?.description || 'standart'} maxLength={300} />
                </div>
                {allowH1 ? (
                  <>
                    <div className="sps-field">
                      <label htmlFor={`${l}-h1`}>
                        <b>H1 sarlavha</b> <Counter n={v(`${l}.h1`).length} max={90} />
                      </label>
                      <input className="sps-input" id={`${l}-h1`} name={`${l}.h1`} value={v(`${l}.h1`)} onChange={set(`${l}.h1`)} placeholder={cur?.h1 || 'standart'} maxLength={120} />
                    </div>
                    <div className="sps-field">
                      <label htmlFor={`${l}-intro`}>
                        <b>Kirish matni</b> <Counter n={v(`${l}.intro`).length} max={1200} />
                      </label>
                      <textarea className="sps-input" id={`${l}-intro`} name={`${l}.intro`} rows={5} value={v(`${l}.intro`)} onChange={set(`${l}.intro`)} placeholder="H1 ostidagi matn (bo'sh — standart)" maxLength={1200} />
                      <small>Noyob matn (davlat, shaharlar, qalinlik) — SEO uchun eng kuchli signal.</small>
                    </div>
                  </>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
      <label className="adm-check">
        <input type="checkbox" name="noindex" defaultChecked={state?.values ? state.values.noindex === 'on' : initialNoindex} />
        <span>
          <b>Indeksdan yopish (noindex)</b> — sahifa Google/Yandex&apos;dan chiqadi va sitemap&apos;ga kirmaydi (uch tilda).
        </span>
      </label>
      <Msg state={state} />
      <div>
        <button className="sps-btn sps-btn--dark" type="submit" disabled={pending}>
          {pending ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </div>
    </form>
  );
}

export function RedirectForm({ action }: { action: Action }) {
  const [state, run, pending] = useActionState<FormState, FormData>(action, undefined);
  const val = (k: string) => state?.values?.[k] ?? '';
  return (
    <form action={run} className="adm-card adm-grid" key={state?.ok ?? 'f'}>
      <h2>Yangi 301 yo&apos;naltirish</h2>
      <div className="adm-fields adm-fields--3">
        <div className="sps-field">
          <label htmlFor="rd-source">
            <b>Eski manzil</b>
          </label>
          <input className="sps-input" id="rd-source" name="source" defaultValue={val('source')} placeholder="/ru/staraya-stranica yoki /ru/blog/*" required />
          <small>Oxirida /* — ichidagi hamma sahifalar. To&apos;liq URL ham bo&apos;ladi.</small>
        </div>
        <div className="sps-field">
          <label htmlFor="rd-destination">
            <b>Yangi manzil</b>
          </label>
          <input className="sps-input" id="rd-destination" name="destination" defaultValue={val('destination')} placeholder="/ru/catalog/paving" required />
        </div>
        <div className="sps-field">
          <label htmlFor="rd-note">
            <b>Izoh</b>
          </label>
          <input className="sps-input" id="rd-note" name="note" defaultValue={val('note')} placeholder="Nega (ixtiyoriy)" maxLength={200} />
        </div>
      </div>
      <Msg state={state} />
      <div>
        <button className="sps-btn sps-btn--dark sps-btn--sm" type="submit" disabled={pending}>
          {pending ? 'Qo\'shilmoqda…' : "Qo'shish"}
        </button>
      </div>
    </form>
  );
}
