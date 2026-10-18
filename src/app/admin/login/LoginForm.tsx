'use client';

import { useActionState } from 'react';
import { loginAction, type FormState } from '../actions';

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, initialError ? { error: initialError } : undefined);
  return (
    <form action={action} className="adm-form">
      <input type="hidden" name="next" value={next || ''} />
      <div className="sps-field">
        <label htmlFor="email">E-pochta</label>
        <input className="sps-input" id="email" name="email" type="email" autoComplete="username" required autoFocus defaultValue={state?.values?.email} />
      </div>
      <div className="sps-field">
        <label htmlFor="password">Parol</label>
        <input className="sps-input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state?.error ? (
        <p className="adm-msg adm-msg--err" role="alert">
          {state.error}
        </p>
      ) : null}
      <button className="sps-btn sps-btn--primary sps-btn--lg" type="submit" disabled={pending}>
        {pending ? 'Tekshirilmoqda…' : 'Kirish'}
      </button>
    </form>
  );
}
