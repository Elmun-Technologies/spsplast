import Link from 'next/link';
import { requireUser } from '@/server/session';
import { LEAD_STATUSES } from '@/server/db/schema';
import { leadStats, listLeads } from '@/server/leads';
import { AdminShell, StatusBadge } from './AdminShell';
import { Bars } from './charts';
import { STATUS_LABEL, TYPE_LABEL, countryName, formatDate } from './labels';

export const metadata = { title: 'Bosh sahifa' };

export default async function AdminHome() {
  const { user, db } = await requireUser();
  const [s, latest] = await Promise.all([leadStats(db), listLeads(db, { pageSize: 8 })]);

  return (
    <AdminShell
      user={user}
      active="home"
      title="Bosh sahifa"
      actions={
        <Link className="sps-btn sps-btn--dark sps-btn--sm" href="/admin/leads?status=new">
          Yangi zayafkalar · {s.status.new ?? 0}
        </Link>
      }
    >
      <div className="adm-kpis">
        <div className="adm-kpi">
          <span>24 soat</span>
          <b>{s.today}</b>
        </div>
        <div className="adm-kpi">
          <span>7 kun</span>
          <b>{s.week}</b>
        </div>
        <div className="adm-kpi">
          <span>30 kun</span>
          <b>{s.month}</b>
        </div>
        <Link className="adm-kpi" href="/admin/leads?status=won">
          <span>Kelishildi</span>
          <b>{s.status.won ?? 0}</b>
        </Link>
        <Link className={`adm-kpi${s.undelivered ? ' adm-kpi--alert' : ''}`} href="/admin/leads?tg=0">
          <span>Telegram'ga yetmagan</span>
          <b>{s.undelivered}</b>
        </Link>
      </div>

      <div className="adm-grid adm-grid--2">
        <section className="adm-card">
          <h2>Holat bo'yicha (hammasi)</h2>
          <Bars
            rows={LEAD_STATUSES.map((st) => ({ label: STATUS_LABEL[st], n: s.status[st] ?? 0, href: `/admin/leads?status=${st}` }))}
          />
        </section>
        <section className="adm-card">
          <h2>Davlatlar · 30 kun</h2>
          <Bars rows={s.byCountry.map((r) => ({ label: countryName(r.country), n: r.n }))} />
        </section>
        <section className="adm-card">
          <h2>Ko'p so'ralgan modellar · 30 kun</h2>
          <Bars rows={s.topModels.map((r) => ({ label: `№ ${r.code ?? '—'} ${r.name ?? r.slug}`, n: r.n }))} />
        </section>
        <section className="adm-card">
          <h2>Manbalar (UTM) · 30 kun</h2>
          <Bars rows={s.bySource.map((r) => ({ label: r.source === 'direct' ? "To'g'ridan-to'g'ri" : r.source, n: r.n }))} />
        </section>
      </div>

      <section className="adm-card" style={{ marginTop: 16 }}>
        <h2>So'nggi zayafkalar</h2>
        {latest.rows.length ? (
          <ul className="adm-timeline">
            {latest.rows.map((l) => (
              <li key={l.id}>
                <time>{formatDate(l.createdAt)}</time>
                <span>
                  <Link href={`/admin/leads/${l.id}`}>
                    <b>{l.number}</b>
                  </Link>{' '}
                  · {l.name} · {TYPE_LABEL[l.type]} · {countryName(l.country || l.geoCountry)}{' '}
                  <StatusBadge status={l.status} label={STATUS_LABEL[l.status]} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="adm-empty">Hali zayafka yo'q. Saytdagi forma to'ldirilganda shu yerda paydo bo'ladi.</p>
        )}
      </section>
    </AdminShell>
  );
}
