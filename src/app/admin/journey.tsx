import { formatDate } from './labels';

export const EVENT_LABEL: Record<string, string> = {
  add_to_request: "Ro'yxatga qo'shdi",
  add_to_compare: 'Solishtirdi',
  generate_lead: 'Zayafka qoldirdi',
  search: 'Qidirdi',
  contact_click: 'Aloqa (tel/WhatsApp/Telegram)',
  pdf_download: 'PDF katalog',
};

export function JourneyList({
  hits,
}: {
  hits: { id: number; type: string; path: string; item: string | null; detail: string | null; createdAt: Date }[];
}) {
  if (!hits.length) return <p className="adm-empty">Tashrif ma'lumoti yo'q.</p>;
  return (
    <ol className="adm-timeline">
      {hits.map((h) => (
        <li key={h.id} className={h.type === 'pageview' ? undefined : 'note'}>
          <time>{formatDate(h.createdAt)}</time>
          <p>
            {h.type === 'pageview' ? h.path : `${EVENT_LABEL[h.type] ?? h.type}${h.item ? ` · ${h.item}` : ''}${h.detail ? ` · ${h.detail}` : ''}`}
          </p>
        </li>
      ))}
    </ol>
  );
}
