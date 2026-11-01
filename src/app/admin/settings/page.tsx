import Link from 'next/link';
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
        <h2>SEO va hisobotlar</h2>
        <dl className="adm-dl">
          <dt>SEO markazi</dt>
          <dd>
            <Link href="/admin/seo">Sahifalar meta/H1/matn, 301, indekslash (sitemap, IndexNow), salomatlik</Link>
          </dd>
          <dt>Analitika</dt>
          <dd>
            <Link href="/admin/analytics">Metrica, Search Console, GA4, Yandex Webmaster hisobotlari</Link> —{' '}
            <Link href="/admin/analytics#connect">API kalitlarini ulash</Link>
          </dd>
          <dt>Matnlar</dt>
          <dd>
            <Link href="/admin/content">Saytdagi barcha matnlar (uz/ru/en)</Link>
          </dd>
          <dt>Sitemap</dt>
          <dd>
            <a href={`${SITE_URL}/sitemap.xml`} target="_blank" rel="noopener noreferrer">
              {SITE_URL}/sitemap.xml
            </a>
          </dd>
          <dt>Tekshiruv</dt>
          <dd>
            <a href={`${SITE_URL}/api/health`} target="_blank" rel="noopener noreferrer">
              /api/health
            </a>{' '}
            — qaysi integratsiyalar ulanganini ko&apos;rsatadi.
          </dd>
        </dl>
      </section>
    </AdminShell>
  );
}
