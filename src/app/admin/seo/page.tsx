import Link from 'next/link';
import { requireUser } from '@/server/session';
import { listRedirects, listSeoPages, H1_KINDS } from '@/server/seoAdmin';
import { seoHealth } from '@/server/seoHealth';
import { getReportConfig } from '@/server/secrets';
import { indexablePaths, type PathKind } from '@/lib/sitePaths';
import { integrationValue } from '@/lib/integrations';
import { SITE_URL } from '@/lib/seo';
import { AdminShell } from '../AdminShell';
import { PublishBar } from '../PublishBar';
import { formatDate } from '../labels';
import { ActionButton, RedirectForm } from './forms';
import {
  addRedirectAction,
  deleteRedirectAction,
  generateIndexNowKeyAction,
  submitIndexNowAction,
  submitSitemapAction,
} from './actions';

export const metadata = { title: 'SEO' };

const TABS = [
  { key: 'pages', label: 'Sahifalar (meta, H1, matn)' },
  { key: 'redirects', label: "Yo'naltirishlar (301)" },
  { key: 'index', label: 'Indekslash' },
  { key: 'health', label: 'Salomatlik' },
] as const;

const KIND_LABEL: Record<PathKind, string> = { page: 'Asosiy', section: "Bo'lim", tag: 'Teg (SEO)', export: 'Eksport (SEO)', model: 'Model' };

type Search = { tab?: string; k?: string; q?: string };

export default async function SeoPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { user, db } = await requireUser('admin');
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? (sp.tab as (typeof TABS)[number]['key']) : 'pages';

  return (
    <AdminShell user={user} active="seo" title="SEO markazi">
      <PublishBar db={db} />
      <nav className="adm-tabs" aria-label="SEO bo'limlari">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/seo?tab=${t.key}`} aria-current={t.key === tab ? 'page' : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>
      {tab === 'pages' ? <PagesTab db={db} sp={sp} /> : null}
      {tab === 'redirects' ? <RedirectsTab db={db} /> : null}
      {tab === 'index' ? <IndexTab db={db} /> : null}
      {tab === 'health' ? <HealthTab db={db} /> : null}
    </AdminShell>
  );
}

type DbArg = { db: Awaited<ReturnType<typeof requireUser>>['db'] };

async function PagesTab({ db, sp }: DbArg & { sp: Search }) {
  const rows = await listSeoPages(db);
  const edited = new Map<string, { langs: Set<string>; noindex: boolean; at: Date }>();
  for (const r of rows) {
    const e = edited.get(r.path) ?? { langs: new Set<string>(), noindex: false, at: r.updatedAt };
    if (r.title || r.description || r.h1 || r.intro) e.langs.add(r.lang);
    if (r.noindex) e.noindex = true;
    if (r.updatedAt > e.at) e.at = r.updatedAt;
    edited.set(r.path, e);
  }
  const all = indexablePaths();
  const q = (sp.q ?? '').trim().toLowerCase();
  const k = sp.k ?? '';
  const list = all.filter((p) => {
    if (k === 'edited' && !edited.has(p.path)) return false;
    if (k === 'noindex' && !edited.get(p.path)?.noindex) return false;
    if (k && k !== 'edited' && k !== 'noindex' && p.kind !== k) return false;
    return !q || p.label.toLowerCase().includes(q) || p.path.includes(q);
  });
  const filters = [
    ['', `Hammasi · ${all.length}`],
    ['page', 'Asosiy'],
    ['section', "Bo'limlar"],
    ['tag', 'Teglar'],
    ['export', 'Eksport'],
    ['model', 'Modellar'],
    ['edited', `Tahrirlangan · ${edited.size}`],
    ['noindex', 'Noindex'],
  ];
  return (
    <section className="adm-card">
      <h2>Sahifalar — title, description, H1, kirish matni (uz/ru/en)</h2>
      <p className="adm-note">
        Bo&apos;sh maydon — sayt standart matnni ishlatadi. H1 va kirish matni bo&apos;lim, teg va eksport sahifalarida
        almashtiriladi (bosh sahifa va model sahifasida maket matni / mahsulot nomi).
      </p>
      <form className="adm-filters" method="get">
        <input type="hidden" name="tab" value="pages" />
        {k ? <input type="hidden" name="k" value={k} /> : null}
        <input className="sps-input" name="q" defaultValue={sp.q ?? ''} placeholder="Qidirish: nom yoki manzil" aria-label="Sahifani qidirish" />
        <button className="sps-btn sps-btn--outline sps-btn--sm" type="submit">
          Qidirish
        </button>
      </form>
      <div className="adm-chips">
        {filters.map(([key, label]) => (
          <Link key={key} href={`/admin/seo?tab=pages${key ? `&k=${key}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`} aria-current={k === key ? 'true' : undefined}>
            {label}
          </Link>
        ))}
      </div>
      <div className="adm-tablewrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Sahifa</th>
              <th>Turi</th>
              <th>Admin matni</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const e = edited.get(p.path);
              return (
                <tr key={p.path}>
                  <td>
                    <b>{p.label}</b>
                    <br />
                    <a className="adm-mono" href={`${SITE_URL}/ru${p.path}`} target="_blank" rel="noopener noreferrer">
                      /ru{p.path}
                    </a>
                  </td>
                  <td>
                    {KIND_LABEL[p.kind]}
                    {(H1_KINDS as readonly string[]).includes(p.kind) ? <small className="adm-muted"> · H1</small> : null}
                  </td>
                  <td>
                    {e ? (
                      <>
                        {['uz', 'ru', 'en'].map((l) => (
                          <span key={l} className={`adm-st${e.langs.has(l) ? ' adm-st--won' : ''}`}>
                            {l}
                          </span>
                        ))}
                        {e.noindex ? <span className="adm-st adm-st--lost">noindex</span> : null}
                        <small className="adm-muted"> {formatDate(e.at)}</small>
                      </>
                    ) : (
                      <span className="adm-muted">standart</span>
                    )}
                  </td>
                  <td>
                    <Link className="sps-btn sps-btn--outline sps-btn--sm" href={`/admin/seo/edit?path=${encodeURIComponent(p.path)}`}>
                      Tahrirlash
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!list.length ? <p className="adm-empty">Hech narsa topilmadi.</p> : null}
    </section>
  );
}

async function RedirectsTab({ db }: DbArg) {
  const rows = await listRedirects(db);
  return (
    <div className="adm-grid">
      <RedirectForm action={addRedirectAction} />
      <section className="adm-card">
        <h2>Admin yo&apos;naltirishlari · {rows.length}</h2>
        <p className="adm-note">
          Eski saytdan 436 ta manzil allaqachon avtomatik yo&apos;naltirilgan (scripts/redirects-2027.json). Bu yerdagilar
          ulardan ustun turadi va &quot;Nashr qilish&quot;dan keyin ishlaydi. Mahsulot o&apos;chirilsa yoki slug o&apos;zgarsa —
          eski manzilni shu yerda yangi sahifaga yo&apos;naltiring.
        </p>
        {rows.length ? (
          <div className="adm-tablewrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Eski manzil</th>
                  <th>Yangi manzil</th>
                  <th>Izoh</th>
                  <th>Sana</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="adm-mono">{r.source}</td>
                    <td className="adm-mono">{r.destination}</td>
                    <td>{r.note ?? ''}</td>
                    <td>{formatDate(r.updatedAt)}</td>
                    <td>
                      <form action={deleteRedirectAction}>
                        <input type="hidden" name="redirectId" value={r.id} />
                        <button className="sps-btn sps-btn--outline sps-btn--sm" type="submit">
                          O&apos;chirish
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="adm-empty">Hozircha yo&apos;q.</p>
        )}
      </section>
    </div>
  );
}

async function IndexTab({ db }: DbArg) {
  const cfg = await getReportConfig(db);
  const key = integrationValue('indexnow_key');
  const host = new URL(SITE_URL).host;
  const tools: [string, string, string][] = [
    ['Google Search Console', `https://search.google.com/search-console?resource_id=${encodeURIComponent(cfg.gscProperty || `sc-domain:${host}`)}`, "Indeks, so'rovlar, xatolar"],
    ['Yandex Webmaster', 'https://webmaster.yandex.ru/sites/', 'Indeks, so\'rovlar, region'],
    ['Yandex Metrica', `https://metrika.yandex.ru/dashboard?id=${integrationValue('yandex_metrica_id')}`, 'Tashriflar, Vebvizor'],
    ['Google Analytics', 'https://analytics.google.com/', 'Sessiyalar, konversiyalar'],
    ['Bing Webmaster', 'https://www.bing.com/webmasters', 'Bing va DuckDuckGo'],
    ['PageSpeed Insights', `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(`${SITE_URL}/ru`)}`, 'Tezlik (Core Web Vitals)'],
    ['Rich Results Test', `https://search.google.com/test/rich-results?url=${encodeURIComponent(`${SITE_URL}/ru/catalog/paving/01-monako`)}`, 'JSON-LD (Product, FAQ)'],
    ['Yandex Бизнес', 'https://yandex.ru/sprav/', 'Kartochka va sharhlar'],
    ['Google Business Profile', 'https://business.google.com/', 'Kartochka va sharhlar'],
  ];
  return (
    <div className="adm-grid adm-grid--2">
      <section className="adm-card">
        <h2>Sitemap va robots</h2>
        <dl className="adm-dl">
          <dt>Sitemap</dt>
          <dd>
            <a href={`${SITE_URL}/sitemap.xml`} target="_blank" rel="noopener noreferrer">
              {SITE_URL}/sitemap.xml
            </a>
          </dd>
          <dt>robots.txt</dt>
          <dd>
            <a href={`${SITE_URL}/robots.txt`} target="_blank" rel="noopener noreferrer">
              {SITE_URL}/robots.txt
            </a>
          </dd>
        </dl>
        <p className="adm-note">Sitemap&apos;ni Google Search Console va Yandex Webmaster&apos;ga API orqali yuborish (Analitika → Ulanishlar kerak):</p>
        <ActionButton action={submitSitemapAction} label="Sitemap'ni Google va Yandex'ga yuborish" pendingLabel="Yuborilmoqda…" dark />
      </section>
      <section className="adm-card">
        <h2>IndexNow — Yandex va Bing&apos;ga darhol xabar</h2>
        <dl className="adm-dl">
          <dt>Kalit</dt>
          <dd>{key ? <span className="adm-mono">{key}</span> : 'saytda yo\'q'}</dd>
          <dt>Kalit fayli</dt>
          <dd>
            <a href={`${SITE_URL}/indexnow-key.txt`} target="_blank" rel="noopener noreferrer">
              /indexnow-key.txt
            </a>
          </dd>
        </dl>
        <p className="adm-note">
          Yangi model, teg yoki matn nashr qilingandan keyin bosing — barcha sahifalar (3 tilda) qayta ko&apos;rib chiqishga yuboriladi.
        </p>
        <div className="adm-row">
          {!key ? <ActionButton action={generateIndexNowKeyAction} label="Kalit yaratish" pendingLabel="…" /> : null}
          <ActionButton action={submitIndexNowAction} label="Hamma sahifalarni yuborish" pendingLabel="Yuborilmoqda…" dark />
        </div>
      </section>
      <section className="adm-card" style={{ gridColumn: '1 / -1' }}>
        <h2>Tashqi vositalar</h2>
        <div className="adm-tools">
          {tools.map(([name, href, hint]) => (
            <a key={name} href={href} target="_blank" rel="noopener noreferrer">
              <b>{name}</b>
              <small>{hint}</small>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

async function HealthTab({ db }: DbArg) {
  const checks = await seoHealth(db);
  const score = Math.round((checks.filter((c) => c.status === 'ok').length / checks.length) * 100);
  const icon = { ok: '✓', warn: '!', bad: '✕' } as const;
  return (
    <section className="adm-card">
      <h2>SEO salomatligi · {score}%</h2>
      <p className="adm-note">Saytdagi (oxirgi nashr) holat. Qizil — top natijalar uchun hal qiluvchi, sariq — tavsiya.</p>
      <ul className="adm-health">
        {checks.map((c) => (
          <li key={c.title} className={`adm-health--${c.status}`}>
            <span aria-hidden="true">{icon[c.status]}</span>
            <div>
              <b>{c.title}</b>
              <small>{c.detail}</small>
            </div>
            {c.href && c.status !== 'ok' ? (
              <Link className="sps-btn sps-btn--outline sps-btn--sm" href={c.href}>
                Tuzatish
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
