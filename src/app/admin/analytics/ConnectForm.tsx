'use client';

import { useActionState } from 'react';
import type { FormState } from '../actions';

type Field = { key: string; label: string; env: string; secret: boolean; multiline?: boolean; placeholder: string; help: string };
type Status = Record<string, { set: boolean; source: 'env' | 'db' | null; hint: string }>;

/** Maxfiy qiymatlar formada qayta ko'rsatilmaydi: bo'sh qoldirilsa — o'zgarmaydi. */
export function ConnectForm({
  action,
  fields,
  status,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  fields: Field[];
  status: Status;
}) {
  const [state, run, pending] = useActionState<FormState, FormData>(action, undefined);
  return (
    <form action={run} className="adm-grid" key={state?.ok ?? 'connect'}>
      <div className="adm-fields">
        {fields.map((f) => {
          const st = status[f.key];
          return (
            <div key={f.key} className="sps-field">
              <label htmlFor={`sec-${f.key}`}>
                <b>{f.label}</b>
                {st?.set ? (
                  <span className="adm-st adm-st--won">
                    {st.source === 'env' ? 'env' : 'saqlangan'}
                    {st.hint ? ` · ${st.hint}` : ''}
                  </span>
                ) : (
                  <span className="adm-st">ulanmagan</span>
                )}
              </label>
              {f.multiline ? (
                <textarea className="sps-input adm-mono" id={`sec-${f.key}`} name={f.key} rows={4} placeholder={st?.set ? "o'zgartirish uchun yangisini qo'ying" : f.placeholder} autoComplete="off" spellCheck={false} />
              ) : (
                <input
                  className="sps-input adm-mono"
                  id={`sec-${f.key}`}
                  name={f.key}
                  type={f.secret ? 'password' : 'text'}
                  placeholder={st?.set ? (f.secret ? "o'zgartirish uchun yangisini kiriting" : st.hint) : f.placeholder}
                  autoComplete="off"
                  spellCheck={false}
                />
              )}
              <small>
                {f.help}
                {st?.source === 'env' ? <i> Vercel env ({f.env}) ustun turadi.</i> : null}
              </small>
              {st?.source === 'db' ? (
                <label className="adm-check adm-check--sm">
                  <input type="checkbox" name={`clear_${f.key}`} /> <span>O&apos;chirish</span>
                </label>
              ) : null}
            </div>
          );
        })}
      </div>
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
      <div>
        <button className="sps-btn sps-btn--dark" type="submit" disabled={pending}>
          {pending ? 'Saqlanmoqda…' : 'Saqlash'}
        </button>
      </div>
    </form>
  );
}
