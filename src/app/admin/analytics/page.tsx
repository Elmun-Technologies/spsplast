import Link from 'next/link';
import { requireUser } from '@/server/session';
import { getReportConfig, secretStatus, SECRET_FIELDS } from '@/server/secrets';
import { safe } from '@/server/reports/http';
import { ga4Report, gscReport } from '@/server/reports/google';
import { metricaReport, webmasterReport } from '@/server/reports/yandex';
import { integrationValue } from '@/lib/integrations';
import { SITE_URL } from '@/lib/seo';
import { AdminShell } from '../AdminShell';
import { Bars, DailyChart, Kpi } from '../charts';
import { ConnectForm } from './ConnectForm';
import { refreshReportsAction, saveReportSecretsAction } from './actions';

export const metadata = { title: 'Analitika' };

const RANGES = [7, 28, 90];

/** Search Console mamlakat kodlari (ISO 3166-1 alpha-3) — asosiy bozorlar. */
const ISO3: Record<string, string> = {
  uzb: "O'zbekiston",
  rus: 'Rossiya',
  kaz: "Qozog'iston",
  blr: 'Belarus',
  kgz: "Qirg'iziston",
  tjk: 'Tojikiston',
  aze: 'Ozarbayjon',
  arm: 'Armaniston',
  geo: 'Gruziya',
  tkm: 'Turkmaniston',
  ukr: 'Ukraina',
  tur: 'Turkiya',
  usa: 'AQSh',
  deu: 'Germaniya',
};

const fmt = (n: number, digits = 0) => n.toLocaleString('ru-RU', { maximumFractionDigits: digits, minimumFractionDigits: digits });
const pct = (n: number) => `${fmt(n * 100, 1)}%`;
const shortPath = (u: string) => u.replace(/^https?:\/\/[^/]+/, '') || '/';

function Setup({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="adm-setup">
      <b>{title} ulanmagan</b>
      <ol>
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </div>
  );
}

function Err({ error }: { error: string }) {
  return (
    <p className="adm-msg adm-msg--err" role="alert">
      API xatosi: {error}
    </p>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { user, db } = await requireUser();
  const sp = await searchParams;
  const days = RANGES.includes(Number(sp.d)) ? Number(sp.d) : 28;
  const cfg = await getReportConfig(db);
  const counter = integrationValue('yandex_metrica_id');

  const [metrica, gsc, ga4, wm] = await Promise.all([
    cfg.yandexToken && counter ? safe(() => metricaReport(cfg.yandexToken, counter, days)) : null,
    cfg.serviceAccount && cfg.gscProperty ? safe(() => gscReport(cfg.serviceAccount!, cfg.gscProperty, days)) : null,
    cfg.serviceAccount && cfg.ga4PropertyId ? safe(() => ga4Report(cfg.serviceAccount!, cfg.ga4PropertyId, days)) : null,
    cfg.yandexToken ? safe(() => webmasterReport(cfg.yandexToken, SITE_URL, days)) : null,
  ]);
  const status = user.role === 'admin' ? await secretStatus(db) : null;

  return (
    <AdminShell
      user={user}
      active="analytics"
      title="Analitika: Yandex, Google, qidiruv so'rovlari"
      actions={
        <form action={refreshReportsAction}>
          <button className="sps-btn sps-btn--outline sps-btn--sm" type="submit">
            Yangilash
          </button>
        </form>
      }
    >
      <div className="adm-chips" style={{ marginBottom: 16 }}>
        {RANGES.map((d) => (
          <Link key={d} href={`/admin/analytics?d=${d}`} aria-current={d === days ? 'true' : undefined}>
            {d} kun
          </Link>
        ))}
        <Link href="/admin/visits">O&apos;z statistikamiz (Tashriflar) →</Link>
      </div>
      <p className="adm-note">Ma&apos;lumot API&apos;dan 15 daqiqalik kesh bilan olinadi. Search Console ~2 kun kechikadi.</p>

      <div className="adm-grid">
        {/* Yandex Metrica */}
        <section className="adm-card">
          <h2>Yandex Metrica {counter ? <small className="adm-muted">· hisoblagich {counter}</small> : null}</h2>
          {!metrica ? (
            <Setup
              title="Yandex Metrica hisoboti"
              steps={[
                counter ? 'Hisoblagich saytda ✓' : 'Sozlamalar → Yandex Metrica: hisoblagich raqamini kiriting va nashr qiling',
                'Pastdagi "Ulanishlar"ga Yandex OAuth tokenini kiriting (metrika:read)',
              ]}
            />
          ) : !metrica.ok ? (
            <Err error={metrica.error} />
          ) : (
            <>
              <div className="adm-kpis">
                <Kpi label="Tashriflar" value={fmt(metrica.data.totals.visits)} />
                <Kpi label="Foydalanuvchilar" value={fmt(metrica.data.totals.users)} />
                <Kpi label="Ko'rishlar" value={fmt(metrica.data.totals.pageviews)} />
                <Kpi label="Rad etish" value={`${fmt(metrica.data.totals.bounceRate, 1)}%`} />
                <Kpi label="O'rtacha vaqt" value={`${Math.round(metrica.data.totals.avgDuration / 60)} daq ${Math.round(metrica.data.totals.avgDuration % 60)} s`} />
              </div>
              <DailyChart rows={metrica.data.daily} days={days} />
              <div className="adm-grid adm-grid--2">
                <div>
                  <h3 className="adm-h3">Trafik manbalari</h3>
                  <Bars rows={metrica.data.sources.map((r) => ({ label: r.key, n: r.values[0] ?? 0 }))} />
                </div>
                <div>
                  <h3 className="adm-h3">Qidiruv tizimlari</h3>
                  <Bars rows={metrica.data.engines.map((r) => ({ label: r.key, n: r.values[0] ?? 0 }))} />
                </div>
                <div>
                  <h3 className="adm-h3">Davlatlar</h3>
                  <Bars rows={metrica.data.countries.map((r) => ({ label: r.key, n: r.values[0] ?? 0 }))} />
                </div>
                <div>
                  <h3 className="adm-h3">Sahifalar</h3>
                  <Bars rows={metrica.data.pages.map((r) => ({ label: r.key, n: r.values[0] ?? 0 }))} />
                </div>
              </div>
              {metrica.data.goals.length ? (
                <>
                  <h3 className="adm-h3">Maqsadlar (zayafka va boshqalar)</h3>
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Maqsad</th>
                        <th>Yetishlar</th>
                        <th>Konversiya</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrica.data.goals.map((g) => (
                        <tr key={g.id}>
                          <td>{g.name}</td>
                          <td>{fmt(g.reaches)}</td>
                          <td>{fmt(g.conversion, 2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="adm-note">
                  Metrica&apos;da maqsad yo&apos;q. Sayt <span className="adm-mono">generate_lead</span>, <span className="adm-mono">add_to_request</span> voqealarini yuboradi —
                  Metrica → Maqsadlar → &quot;JavaScript-voqea&quot; bilan shu nomlarni qo&apos;shing.
                </p>
              )}
            </>
          )}
        </section>

        {/* Google Search Console */}
        <section className="adm-card">
          <h2>Google Search Console {cfg.gscProperty ? <small className="adm-muted">· {cfg.gscProperty}</small> : null}</h2>
          {!gsc ? (
            <Setup
              title="Search Console hisoboti"
              steps={[
                'Sozlamalar → Google Search Console: tasdiqlash meta-tegini kiriting, nashr qiling, Search Console\'da "Tasdiqlash"ni bosing',
                'Google Cloud\'da service account yarating, Search Console API\'ni yoqing, JSON kalitni yuklab oling',
                'Search Console → Sozlamalar → Foydalanuvchilar: service account email\'ini "Full" huquq bilan qo\'shing',
                'Pastdagi "Ulanishlar"ga JSON kalit va mulk nomini (sc-domain:spsplast.com) kiriting',
              ]}
            />
          ) : !gsc.ok ? (
            <Err error={gsc.error} />
          ) : (
            <>
              <div className="adm-kpis">
                <Kpi label="Bosishlar" value={fmt(gsc.data.totals.clicks)} />
                <Kpi label="Ko'rsatishlar" value={fmt(gsc.data.totals.impressions)} />
                <Kpi label="CTR" value={pct(gsc.data.totals.ctr)} />
                <Kpi label="O'rtacha pozitsiya" value={fmt(gsc.data.totals.position, 1)} />
              </div>
              <DailyChart rows={gsc.data.daily} days={days} end={gsc.data.range.end} />
              <h3 className="adm-h3">Qidiruv so&apos;rovlari</h3>
              <div className="adm-tablewrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>So&apos;rov</th>
                      <th>Bosish</th>
                      <th>Ko&apos;rsatish</th>
                      <th>CTR</th>
                      <th>Pozitsiya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gsc.data.queries.map((q) => (
                      <tr key={q.key}>
                        <td>{q.key}</td>
                        <td>{fmt(q.clicks)}</td>
                        <td>{fmt(q.impressions)}</td>
                        <td>{pct(q.ctr)}</td>
                        <td className={q.position <= 3 ? 'adm-good' : q.position <= 10 ? '' : 'adm-muted'}>{fmt(q.position, 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!gsc.data.queries.length ? <p className="adm-empty">So&apos;rovlar hali yo&apos;q (yangi sayt 1–4 hafta).</p> : null}
              <div className="adm-grid adm-grid--2">
                <div>
                  <h3 className="adm-h3">Sahifalar (bosish)</h3>
                  <Bars rows={gsc.data.pages.map((r) => ({ label: shortPath(r.key), n: r.clicks }))} />
                </div>
                <div>
                  <h3 className="adm-h3">Davlatlar (bosish)</h3>
                  <Bars rows={gsc.data.countries.map((r) => ({ label: ISO3[r.key] ?? r.key.toUpperCase(), n: r.clicks }))} />
                </div>
              </div>
            </>
          )}
        </section>

        {/* Yandex Webmaster */}
        <section className="adm-card">
          <h2>Yandex Webmaster</h2>
          {!wm ? (
            <Setup
              title="Yandex Webmaster hisoboti"
              steps={[
                'Sozlamalar → Yandex Webmaster: meta-tegni kiriting, nashr qiling, Webmaster\'da tasdiqlang',
                'Pastdagi "Ulanishlar"ga Yandex OAuth tokenini kiriting (webmaster:hostinfo)',
              ]}
            />
          ) : !wm.ok ? (
            <Err error={wm.error} />
          ) : (
            <>
              <div className="adm-kpis">
                <Kpi label="Qidiruvdagi sahifalar" value={fmt(wm.data.summary.searchable)} />
                <Kpi label="Chiqarilgan sahifalar" value={fmt(wm.data.summary.excluded)} />
                <Kpi label="ИКС (sifat indeksi)" value={fmt(wm.data.summary.sqi)} />
                <Kpi
                  label="Muammolar"
                  value={Object.values(wm.data.summary.problems).reduce((a, b) => a + b, 0)}
                  alert={(wm.data.summary.problems.FATAL ?? 0) + (wm.data.summary.problems.CRITICAL ?? 0) > 0}
                  hint={Object.entries(wm.data.summary.problems).filter(([, n]) => n).map(([k, n]) => `${k}: ${n}`).join(', ') || "yo'q"}
                />
              </div>
              <h3 className="adm-h3">Yandex so&apos;rovlari</h3>
              <div className="adm-tablewrap">
                <table className="adm-table">
                  <thead>
                    <tr>
                      <th>So&apos;rov</th>
                      <th>Ko&apos;rsatish</th>
                      <th>Bosish</th>
                      <th>Pozitsiya</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wm.data.queries.map((q) => (
                      <tr key={q.query}>
                        <td>{q.query}</td>
                        <td>{fmt(q.shows)}</td>
                        <td>{fmt(q.clicks)}</td>
                        <td className={q.position <= 3 ? 'adm-good' : ''}>{fmt(q.position, 1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!wm.data.queries.length ? <p className="adm-empty">So&apos;rovlar hali yo&apos;q.</p> : null}
            </>
          )}
        </section>

        {/* GA4 */}
        <section className="adm-card">
          <h2>Google Analytics 4</h2>
          {!ga4 ? (
            <Setup
              title="GA4 hisoboti"
              steps={[
                'Sozlamalar → Google Analytics 4 (yoki GTM): o\'lchov ID\'sini kiriting va nashr qiling',
                'Google Cloud\'da "Google Analytics Data API"ni yoqing (Search Console bilan bir xil service account)',
                'GA4 → Admin → Property access: service account email\'ini Viewer qilib qo\'shing',
                'Pastdagi "Ulanishlar"ga GA4 property ID (raqam) kiriting',
              ]}
            />
          ) : !ga4.ok ? (
            <Err error={ga4.error} />
          ) : (
            <>
              <div className="adm-kpis">
                <Kpi label="Sessiyalar" value={fmt(ga4.data.totals.sessions)} />
                <Kpi label="Foydalanuvchilar" value={fmt(ga4.data.totals.users)} />
                <Kpi label="Asosiy voqealar" value={fmt(ga4.data.totals.keyEvents)} hint="generate_lead va b." />
                <Kpi label="Faollik" value={pct(ga4.data.totals.engagementRate)} />
              </div>
              <DailyChart rows={ga4.data.daily} days={days} />
              <div className="adm-grid adm-grid--2">
                <div>
                  <h3 className="adm-h3">Kanallar</h3>
                  <Bars rows={ga4.data.channels.map((r) => ({ label: r.key, n: r.sessions }))} />
                </div>
                <div>
                  <h3 className="adm-h3">Davlatlar</h3>
                  <Bars rows={ga4.data.countries.map((r) => ({ label: r.key, n: r.sessions }))} />
                </div>
              </div>
            </>
          )}
        </section>

        {status ? (
          <section className="adm-card" id="connect">
            <h2>Ulanishlar (API kalitlari)</h2>
            <p className="adm-note">
              Kalitlar alohida jadvalda saqlanadi va saytga (ommaviy kodga) hech qachon chiqmaydi; formada qayta ko&apos;rsatilmaydi.
              Vercel env o&apos;zgaruvchilari berilsa — ular ustun. Sayt kodlari (Metrica, GA4, tasdiqlash teglari) —{' '}
              <Link href="/admin/settings">Sozlamalar</Link>da.
            </p>
            <ConnectForm
              action={saveReportSecretsAction}
              fields={SECRET_FIELDS.map(({ key, label, env, secret, multiline, placeholder, help }) => ({ key, label, env, secret, multiline, placeholder, help }))}
              status={status}
            />
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
