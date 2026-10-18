'use client';

import { useActionState } from 'react';
import { INTEGRATION_FIELDS } from '@/lib/integrations';
import { saveIntegrationsAction, type FormState } from '../actions';

const GROUPS = [
  { key: 'analytics', title: 'Analitika' },
  { key: 'ads', title: 'Reklama piksellari' },
  { key: 'verification', title: 'Qidiruv tizimlari va domen tasdig\'i (SEO)' },
] as const;

export function IntegrationsForm({ saved, live }: { saved: Record<string, string>; live: Record<string, string> }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveIntegrationsAction, undefined);
  const value = (k: string) => state?.values?.[k] ?? saved[k] ?? '';
  return (
    <form action={action} className="adm-grid">
      {GROUPS.map((g) => (
        <section key={g.key} className="adm-card">
          <h2>{g.title}</h2>
          <div className="adm-fields">
            {INTEGRATION_FIELDS.filter((f) => f.group === g.key).map((f) => (
              <div key={f.key} className="sps-field">
                <label htmlFor={`int-${f.key}`}>
                  <b>{f.label}</b>
                  {live[f.key] ? <span className="adm-st adm-st--won">saytda faol</span> : <span className="adm-st">ulanmagan</span>}
                </label>
                <input
                  className="sps-input"
                  id={`int-${f.key}`}
                  name={f.key}
                  defaultValue={value(f.key)}
                  key={`${f.key}-${value(f.key)}`}
                  placeholder={f.placeholder}
                  autoComplete="off"
                  spellCheck={false}
                />
                <small>
                  {f.help} <i>Qayerdan: {f.where}.</i>
                </small>
              </div>
            ))}
          </div>
        </section>
      ))}
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
