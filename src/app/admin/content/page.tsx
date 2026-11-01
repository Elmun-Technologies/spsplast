import Link from 'next/link';
import { requireUser } from '@/server/session';
import { contentEntries, contentGroups, listOverrides } from '@/server/content';
import { AdminShell } from '../AdminShell';
import { PublishBar } from '../PublishBar';
import { ContentForm, type ContentRow } from './ContentForm';
import { saveContentAction } from './actions';

export const metadata = { title: 'Matnlar' };

/** Lug'at guruhlarining tushunarli nomlari (qolganlari kalit bilan ko'rinadi). */
const GROUP_LABEL: Record<string, string> = {
  'pages.home': 'Bosh sahifa',
  'pages.catalog': 'Katalog sahifasi',
  'pages.model': 'Model sahifasi',
  'pages.compare': 'Solishtirish',
  'pages.request': "Zayafka ro'yxati",
  'pages.partners': 'Ulgurji va hamkorlik',
  'pages.production': 'Ishlab chiqarish va eksport',
  'pages.contact': 'Kontakt',
  'pages.privacy': 'Maxfiylik siyosati',
  'pages.notfound': '404 sahifa',
  'pages.error': 'Xato sahifasi',
  'pages.seo': 'SEO landinglar (teg, eksport)',
  'ui.header': 'Header (menyu)',
  'ui.footer': 'Footer',
  'ui.menu': 'Mobil menyu',
  'ui.catalog': 'Katalog bloki',
  'ui.nav': 'Navigatsiya',
  'ui.models': "Model so'zi (ko'plik)",
  'ui.a11y': 'Ekran o\'quvchi matnlari',
  'ui.seo': 'SEO (umumiy)',
  'ui.alt': 'Rasm alt matnlari',
};

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ g?: string; q?: string }> }) {
  const { user, db } = await requireUser('admin');
  const sp = await searchParams;
  const groups = contentGroups();
  const q = (sp.q ?? '').trim().toLowerCase();
  const group = groups.some((g) => g.group === sp.g) ? sp.g! : q ? '' : 'pages.home';

  const entries = contentEntries().filter((e) =>
    q ? e.key.toLowerCase().includes(q) || Object.values(e.values).some((v) => v.toLowerCase().includes(q)) : e.group === group,
  );
  const shown = entries.slice(0, 150);
  const overrides = await listOverrides(db, shown.map((e) => e.key));
  const all = await listOverrides(db);
  const changedGroups = new Map<string, number>();
  for (const o of all) {
    const g = o.key.split('.').slice(0, 2).join('.');
    changedGroups.set(g, (changedGroups.get(g) ?? 0) + 1);
  }
  const rows: ContentRow[] = shown.map((e) => {
    const cur = { uz: null, ru: null, en: null } as ContentRow['current'];
    for (const o of overrides) if (o.key === e.key) cur[o.lang] = o.value;
    return { key: e.key, template: e.template, defaults: e.values, current: cur };
  });

  return (
    <AdminShell user={user} active="content" title="Matnlar (CMS) — uz / ru / en">
      <PublishBar db={db} />
      <p className="adm-note">
        Saytdagi har bir matnni shu yerda o&apos;zgartirish mumkin. Standartga qaytarish — maydonni bo&apos;shating yoki asl matnni
        qo&apos;ying. Raqamlar va kontaktlar uchun tokenlar ishlaydi: {'{years}'}, {'{capacity}'}, {'{objects}'}, {'{countries}'},{' '}
        {'{countryList}'}, {'{contactLine}'}, {'{address}'}. &quot;Shablon&quot; matnlarda {'{1}'}, {'{2}'} — o&apos;zgaruvchan qiymat
        (model soni, davlat nomi) o&apos;rni. Narx, &quot;yaratish&quot; so&apos;zi va HTML qabul qilinmaydi.
      </p>
      <div className="adm-content">
        <nav className="adm-content__nav" aria-label="Matn guruhlari">
          <form method="get">
            <input className="sps-input" name="q" defaultValue={sp.q ?? ''} placeholder="Matn bo'yicha qidirish" aria-label="Matn bo'yicha qidirish" />
          </form>
          {groups.map((g) => (
            <Link key={g.group} href={`/admin/content?g=${g.group}`} aria-current={g.group === group ? 'page' : undefined}>
              <span>{GROUP_LABEL[g.group] ?? g.group}</span>
              <small>
                {changedGroups.get(g.group) ? <b>{changedGroups.get(g.group)} ✎ · </b> : null}
                {g.count}
              </small>
            </Link>
          ))}
        </nav>
        <div>
          <h2 className="adm-h3">
            {q ? `Qidiruv: "${sp.q}" — ${entries.length} ta` : `${GROUP_LABEL[group] ?? group} · ${entries.length} ta matn`}
            {entries.length > shown.length ? ` (birinchi ${shown.length})` : ''}
          </h2>
          {rows.length ? <ContentForm key={`${group}|${q}`} action={saveContentAction} rows={rows} /> : <p className="adm-empty">Topilmadi.</p>}
        </div>
      </div>
    </AdminShell>
  );
}
