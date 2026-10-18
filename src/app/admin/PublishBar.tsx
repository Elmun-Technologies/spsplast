import type { Db } from '@/server/db/client';
import { lastPublish, pendingChanges } from '@/server/settings';
import { formatDate } from './labels';
import { PublishButton } from './PublishButton';

/**
 * "Nashr qilish" paneli: admin'dagi o'zgarishlar (mahsulotlar, bo'limlar,
 * integratsiyalar) saytga faqat qayta yig'ishdan keyin chiqadi.
 */
export async function PublishBar({ db }: { db: Db }) {
  const [pending, last] = await Promise.all([pendingChanges(db), lastPublish(db)]);
  const total = pending.products + pending.sections + pending.settings;
  const parts = [
    pending.products ? `${pending.products} mahsulot` : null,
    pending.sections ? `${pending.sections} bo'lim` : null,
    pending.settings ? `${pending.settings} sozlama` : null,
  ].filter(Boolean);
  return (
    <div className={`adm-publish${total ? ' adm-publish--pending' : ''}`}>
      <div>
        <b>{total ? `Saytga chiqmagan o'zgarishlar: ${parts.join(', ')}` : "Barcha o'zgarishlar saytda"}</b>
        <small>
          {last
            ? `Oxirgi nashr: ${formatDate(last.createdAt)} — ${last.status === 'ok' ? 'yuborildi' : 'xato'}${last.message ? ` (${last.message})` : ''}`
            : 'Hali nashr qilinmagan'}
        </small>
      </div>
      <PublishButton disabled={!total} />
    </div>
  );
}
