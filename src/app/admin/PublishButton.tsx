'use client';

import { useActionState } from 'react';
import { publishAction, type FormState } from './actions';

export function PublishButton({ disabled }: { disabled?: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(publishAction, undefined);
  return (
    <form action={action} className="adm-publish__act">
      <button className="sps-btn sps-btn--primary sps-btn--sm" type="submit" disabled={pending || disabled}>
        {pending ? 'Yuborilmoqda…' : 'Nashr qilish'}
      </button>
      {state?.error ? <small className="adm-warn">{state.error}</small> : null}
      {state?.ok ? <small className="adm-ok">{state.ok}</small> : null}
    </form>
  );
}
