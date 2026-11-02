import type { Db } from '@/server/db/client';
import { lastPublish, pendingChanges } from '@/server/settings';
import { latestProductionDeploy } from '@/server/vercelStatus';
import { formatDate } from './labels';
import { PublishButton } from './PublishButton';

/**
 * "Nashr qilish" paneli: admin'dagi o'zgarishlar (mahsulotlar, bo'limlar,
 * integratsiyalar) saytga faqat qayta yig'ishdan keyin chiqadi.
 */
export async function PublishBar({ db }: { db: Db }) {
  const [pending, last, deploy] = await Promise.all([pendingChanges(db), lastPublish(db), latestProductionDeploy()]);
  const total = pending.products + pending.sections + pending.settings + pending.seo + pending.redirects + pending.texts;
  const parts = [
    pending.products ? `${pending.products} mahsulot` : null,
    pending.sections ? `${pending.sections} bo'lim` : null,
    pending.settings ? `${pending.settings} sozlama` : null,
    pending.seo ? `${pending.seo} SEO yozuvi` : null,
    pending.redirects ? `${pending.redirects} yo'naltirish` : null,
    pending.texts ? `${pending.texts} matn` : null,
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
        {deploy ? (
          <small className={deploy.state === 'error' ? 'adm-warn' : undefined}>
            Saytdagi oxirgi yig'ish ({formatDate(deploy.createdAt)}):{' '}
            {deploy.state === 'ready'
              ? 'tayyor — saytda'
              : deploy.state === 'building'
                ? "yig'ilmoqda… (odatda 3–5 daqiqa)"
                : "XATO — sayt avvalgi holatida qoldi; Vercel → Deployments'da logni ko'ring"}
          </small>
        ) : null}
      </div>
      <PublishButton disabled={!total} />
    </div>
  );
}
