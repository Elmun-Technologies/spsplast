'use client';

import { useActionState } from 'react';
import type { FormState } from '../actions';

export type ContentRow = { key: string; template: boolean; defaults: Record<'uz' | 'ru' | 'en', string>; current: Record<'uz' | 'ru' | 'en', string | null> };

const LANGS = ['uz', 'ru', 'en'] as const;

export function ContentForm({ action, rows }: { action: (p: FormState, fd: FormData) => Promise<FormState>; rows: ContentRow[] }) {
  const [state, run, pending] = useActionState<FormState, FormData>(action, undefined);
  return (
    <form action={run} className="adm-grid">
      <div className="adm-sticky adm-content-save">
        {state?.error ? (
          <p className="adm-msg adm-msg--err" role="alert">
            {state.error}
          </p>
        ) : null}
        {state?.ok ? (
          <p className="adm-msg adm-msg--ok" role="status">
            {state.ok}
          </p>
        ) : null}
        <button className="sps-btn sps-btn--dark" type="submit" disabled={pending}>
          {pending ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </div>
      {rows.map((r) => (
        <fieldset key={r.key} className="adm-text">
          <legend className="adm-mono">
            {r.key}
            {r.template ? <span className="adm-st" title="{1}, {2} — o'zgaruvchan qiymat o'rni (model soni, davlat nomi …)">shablon {'{1}'}</span> : null}
            {LANGS.some((l) => r.current[l]) ? <span className="adm-st adm-st--won">o&apos;zgartirilgan</span> : null}
          </legend>
          <div className="adm-text__langs">
            {LANGS.map((l) => {
              const def = r.defaults[l];
              const long = def.length > 90 || def.includes('\n');
              const id = `t-${r.key}-${l}`.replace(/[^a-zA-Z0-9-]/g, '-');
              return (
                <div key={l} className="sps-field">
                  <label htmlFor={id}>
                    <b>{l.toUpperCase()}</b>
                    {r.current[l] ? <small className="adm-muted"> standart: {def.slice(0, 80)}{def.length > 80 ? '…' : ''}</small> : null}
                  </label>
                  {long ? (
                    <textarea className="sps-input" id={id} name={`v|${r.key}|${l}`} defaultValue={r.current[l] ?? def} rows={Math.min(8, Math.ceil(def.length / 70) + 1)} />
                  ) : (
                    <input className="sps-input" id={id} name={`v|${r.key}|${l}`} defaultValue={r.current[l] ?? def} />
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}
    </form>
  );
}
