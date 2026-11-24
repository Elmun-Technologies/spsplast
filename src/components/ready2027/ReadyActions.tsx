'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { type Model, modelName } from '@/lib/catalogCore';
import { type Locale } from '@/lib/i18n';
import { useUi } from '@/components/site/UiProvider';
import { useRequestList } from '@/lib/store/spsLists';
import { Icon } from '@/components/site/icons';

const QuickRequestModal = dynamic(
  () => import('@/components/catalog2027/QuickRequestModal').then((m) => m.QuickRequestModal),
  { ssr: false },
);

/**
 * Tayyor mahsulot sahifasidagi harakatlar: zayafka (tez forma), zayafka ro'yxatiga qo'shish, WhatsApp.
 * Narx yo'q — biznes qoidasi 1. WhatsApp matni serverda yig'iladi (`waHref`).
 */
export function ReadyActions({ model, lang, waHref }: { model: Model; lang: Locale; waHref: string }) {
  const t = useUi().catalog;
  const request = useRequestList();
  const inList = request.has(model.slug);
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="rd-actions">
        <button type="button" className="sps-btn sps-btn--primary" onClick={() => setOpen(true)}>
          {t.cardRequest}
        </button>
        <button
          type="button"
          className={`sps-btn sps-btn--outline${inList ? ' is-on' : ''}`}
          aria-pressed={inList}
          onClick={() => {
            if (inList) request.remove(model.slug);
            else request.add({ slug: model.slug, code: model.code, name: modelName(model, lang) });
          }}
        >
          <Icon.list width={18} height={18} strokeWidth={1.5} aria-hidden="true" />
          {inList ? t.cardInList : t.formAddList}
        </button>
        <a className="sps-btn sps-btn--outline" href={waHref} target="_blank" rel="noopener noreferrer">
          <Icon.whatsapp width={18} height={18} strokeWidth={1.5} aria-hidden="true" />
          WhatsApp
        </a>
      </div>
      {open ? <QuickRequestModal key={model.slug} model={model} lang={lang} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
