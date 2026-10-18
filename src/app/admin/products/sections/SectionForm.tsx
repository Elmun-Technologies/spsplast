'use client';

import { useActionState } from 'react';
import { saveSectionAction, type ProductFormState } from '../actions';

type S = { key: string; slug: string; name: { uz: string | null; ru: string | null; en: string | null }; sort: number; visible: boolean };

export function SectionForm({ section }: { section?: S }) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveSectionAction, undefined);
  const isNew = !section;
  const id = (k: string) => `${section?.key ?? 'new'}-${k}`;
  return (
    <form action={action} className="adm-form adm-secform">
      <input type="hidden" name="isNew" value={isNew ? '1' : '0'} />
      {isNew ? (
        <label className="sps-field">
          <span>Kalit (ichki, o'zgarmaydi)</span>
          <input className="sps-input" aria-label="Kalit" name="sectionKey" placeholder="termopanel" required pattern="[a-z][a-z0-9_]{1,30}" id={id('key')} />
        </label>
      ) : (
        <input type="hidden" name="sectionKey" value={section.key} />
      )}
      <div className="adm-row3">
        <label className="sps-field">
          <span>Nomi UZ *</span>
          <input className="sps-input" aria-label="Nomi UZ" name="name_uz" defaultValue={section?.name.uz ?? ''} required />
        </label>
        <label className="sps-field">
          <span>Nomi RU</span>
          <input className="sps-input" aria-label="Nomi RU" name="name_ru" defaultValue={section?.name.ru ?? ''} />
        </label>
        <label className="sps-field">
          <span>Nomi EN</span>
          <input className="sps-input" aria-label="Nomi EN" name="name_en" defaultValue={section?.name.en ?? ''} />
        </label>
      </div>
      <div className="adm-row3">
        <label className="sps-field">
          <span>URL (/uz/catalog/…)</span>
          <input className="sps-input" aria-label="URL slug" name="slug" defaultValue={section?.slug ?? ''} required placeholder="thermal-panels" />
        </label>
        <label className="sps-field">
          <span>Tartib</span>
          <input className="sps-input" aria-label="Tartib" name="sort" type="number" defaultValue={section?.sort ?? 100} />
        </label>
        <label className="adm-check" style={{ alignSelf: 'end' }}>
          <input type="checkbox" aria-label="Saytda ko'rinadi" name="visible" defaultChecked={section?.visible ?? true} /> Saytda ko'rinadi
        </label>
      </div>
      {state?.error ? <p className="adm-msg adm-msg--err">{state.error}</p> : null}
      {state?.ok ? <p className="adm-msg adm-msg--ok">{state.ok}</p> : null}
      <div>
        <button className="sps-btn sps-btn--dark sps-btn--sm" type="submit" disabled={pending}>
          {isNew ? "Bo'lim qo'shish" : 'Saqlash'}
        </button>
      </div>
    </form>
  );
}
