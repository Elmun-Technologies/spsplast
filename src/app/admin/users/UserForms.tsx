'use client';

import { useActionState } from 'react';
import { createUserAction, resetPasswordAction, type FormState } from '../actions';

function Msg({ state }: { state: FormState }) {
  if (!state) return null;
  return state.error ? (
    <p className="adm-msg adm-msg--err" role="alert">
      {state.error}
    </p>
  ) : (
    <p className="adm-msg adm-msg--ok" role="status">
      {state.ok}
    </p>
  );
}

export function CreateUserForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createUserAction, undefined);
  return (
    <form action={action} className="adm-form">
      <div className="sps-field">
        <label htmlFor="u-name">Ism</label>
        <input className="sps-input" id="u-name" name="name" autoComplete="off" required defaultValue={state?.values?.name} />
      </div>
      <div className="sps-field">
        <label htmlFor="u-email">E-pochta (login)</label>
        <input className="sps-input" id="u-email" name="email" type="email" autoComplete="off" required defaultValue={state?.values?.email} />
      </div>
      <div className="sps-field">
        <label htmlFor="u-role">Rol</label>
        <select className="sps-select" id="u-role" name="role" defaultValue={state?.values?.role ?? 'manager'} key={state?.values?.role}>
          <option value="manager">Menejer — zayafkalar bilan ishlaydi</option>
          <option value="admin">Administrator — hammasi + xodimlar</option>
        </select>
      </div>
      <div className="sps-field">
        <label htmlFor="u-pass">Boshlang'ich parol (kamida 10 belgi)</label>
        <input className="sps-input" id="u-pass" name="password" type="text" minLength={10} autoComplete="new-password" required />
      </div>
      <Msg state={state} />
      <button className="sps-btn sps-btn--dark sps-btn--sm" type="submit" disabled={pending}>
        Qo'shish
      </button>
    </form>
  );
}

export function PasswordForm({ userId, label = 'Yangi parol' }: { userId?: number; label?: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPasswordAction, undefined);
  const fieldId = `pw-${userId ?? 'me'}`;
  return (
    <form action={action} className="adm-form">
      {userId ? <input type="hidden" name="userId" value={userId} /> : null}
      <label htmlFor={fieldId}>{label}</label>
      <div className="row">
        <input className="sps-input" id={fieldId} name="password" type="password" minLength={10} autoComplete="new-password" required />
        <button className="sps-btn sps-btn--outline sps-btn--sm" type="submit" disabled={pending} style={{ flex: 'none', height: 44 }}>
          Saqlash
        </button>
      </div>
      <Msg state={state} />
    </form>
  );
}
