'use client';

import { useActionState } from 'react';
import { saveTestimonialAction, type TestimonialFormState } from './actions';

type Loc = { uz: string | null; ru: string | null; en: string | null };
type T = { id: number; authorName: Loc; authorRole: Loc | null; text: Loc; rating: number | null; sort: number; visible: boolean };

export function TestimonialForm({ testimonial }: { testimonial?: T }) {
  const [state, action, pending] = useActionState<TestimonialFormState, FormData>(saveTestimonialAction, undefined);
  const isNew = !testimonial;
  const id = (k: string) => `${testimonial?.id ?? 'new'}-${k}`;
  return (
    <form action={action} className="adm-form">
      <input type="hidden" name="testimonialId" value={testimonial?.id ?? ''} />
      <div className="adm-row3">
        <label className="sps-field">
          <span>Mijoz ismi UZ *</span>
          <input className="sps-input" aria-label="Mijoz ismi UZ" name="author_name_uz" defaultValue={testimonial?.authorName.uz ?? ''} required id={id('an-uz')} />
        </label>
        <label className="sps-field">
          <span>Mijoz ismi RU</span>
          <input className="sps-input" aria-label="Mijoz ismi RU" name="author_name_ru" defaultValue={testimonial?.authorName.ru ?? ''} id={id('an-ru')} />
        </label>
        <label className="sps-field">
          <span>Mijoz ismi EN</span>
          <input className="sps-input" aria-label="Mijoz ismi EN" name="author_name_en" defaultValue={testimonial?.authorName.en ?? ''} id={id('an-en')} />
        </label>
      </div>
      <div className="adm-row3">
        <label className="sps-field">
          <span>Lavozim/korxona UZ</span>
          <input className="sps-input" aria-label="Lavozim UZ" name="author_role_uz" defaultValue={testimonial?.authorRole?.uz ?? ''} id={id('ar-uz')} />
        </label>
        <label className="sps-field">
          <span>Lavozim/korxona RU</span>
          <input className="sps-input" aria-label="Lavozim RU" name="author_role_ru" defaultValue={testimonial?.authorRole?.ru ?? ''} id={id('ar-ru')} />
        </label>
        <label className="sps-field">
          <span>Lavozim/korxona EN</span>
          <input className="sps-input" aria-label="Lavozim EN" name="author_role_en" defaultValue={testimonial?.authorRole?.en ?? ''} id={id('ar-en')} />
        </label>
      </div>
      <label className="sps-field">
        <span>Sharh matni UZ *</span>
        <textarea className="sps-input" aria-label="Sharh matni UZ" name="text_uz" rows={3} defaultValue={testimonial?.text.uz ?? ''} required id={id('tx-uz')} />
      </label>
      <label className="sps-field">
        <span>Sharh matni RU</span>
        <textarea className="sps-input" aria-label="Sharh matni RU" name="text_ru" rows={3} defaultValue={testimonial?.text.ru ?? ''} id={id('tx-ru')} />
      </label>
      <label className="sps-field">
        <span>Sharh matni EN</span>
        <textarea className="sps-input" aria-label="Sharh matni EN" name="text_en" rows={3} defaultValue={testimonial?.text.en ?? ''} id={id('tx-en')} />
      </label>
      <div className="adm-row3">
        <label className="sps-field">
          <span>Baho (1-5, ixtiyoriy)</span>
          <input className="sps-input" aria-label="Baho" name="rating" type="number" min={1} max={5} defaultValue={testimonial?.rating ?? ''} id={id('rt')} />
        </label>
        <label className="sps-field">
          <span>Tartib</span>
          <input className="sps-input" aria-label="Tartib" name="sort" type="number" defaultValue={testimonial?.sort ?? 100} id={id('srt')} />
        </label>
        <label className="adm-check" style={{ alignSelf: 'end' }}>
          <input type="checkbox" aria-label="Saytda ko'rinadi" name="visible" defaultChecked={testimonial?.visible ?? true} /> Saytda ko'rinadi
        </label>
      </div>
      {state?.error ? <p className="adm-msg adm-msg--err">{state.error}</p> : null}
      {state?.ok ? <p className="adm-msg adm-msg--ok">{state.ok}</p> : null}
      <div>
        <button className="sps-btn sps-btn--dark sps-btn--sm" type="submit" disabled={pending}>
          {isNew ? "Sharh qo'shish" : 'Saqlash'}
        </button>
      </div>
    </form>
  );
}
