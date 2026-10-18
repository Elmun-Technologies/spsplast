import { requireUser } from '@/server/session';
import { getSettings } from '@/server/settings';
import { INTEGRATION_FIELDS, settingValue } from '@/lib/integrations';
import { SITE_URL } from '@/lib/seo';
import { AdminShell } from '../AdminShell';
import { PublishBar } from '../PublishBar';
import { IntegrationsForm } from './IntegrationsForm';

export const metadata = { title: 'Sozlamalar' };

export default async function SettingsPage() {
  const { user, db } = await requireUser('admin');
  const saved = await getSettings(db);
  // Hozir saytda ishlayotgan qiymat (oxirgi nashr yoki env).
  const live = Object.fromEntries(INTEGRATION_FIELDS.map((f) => [f.key, settingValue(f.key)]));

  return (
    <AdminShell user={user} active="settings" title="Sozlamalar: kontaktlar, raqamlar, integratsiyalar va SEO">
      <PublishBar db={db} />
      <IntegrationsForm saved={saved} live={live} />
      <section className="adm-card" style={{ marginTop: 16 }}>
        <h2>Qidiruv tizimlariga yuborish</h2>
        <dl className="adm-dl">
          <dt>Sitemap</dt>
          <dd>
            <a href={`${SITE_URL}/sitemap.xml`} target="_blank" rel="noopener noreferrer">
              {SITE_URL}/sitemap.xml
            </a>{' '}
            — Search Console va Yandex Webmaster'da "Sitemaps" bo'limiga qo'shing.
          </dd>
          <dt>robots.txt</dt>
          <dd>
            <a href={`${SITE_URL}/robots.txt`} target="_blank" rel="noopener noreferrer">
              {SITE_URL}/robots.txt
            </a>
          </dd>
          <dt>Tekshiruv</dt>
          <dd>
            <a href={`${SITE_URL}/api/health`} target="_blank" rel="noopener noreferrer">
              /api/health
            </a>{' '}
            — qaysi integratsiyalar ulanganini ko'rsatadi.
          </dd>
        </dl>
      </section>
    </AdminShell>
  );
}
