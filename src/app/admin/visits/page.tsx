import Link from 'next/link';
import { requireUser } from '@/server/session';
import { recentSessions, sessionsWithLeads, visitOverview, visitorJourney } from '@/server/visits';
import { AdminShell } from '../AdminShell';
import { Bars, DailyChart, Kpi } from '../charts';
import { countryName, formatDate } from '../labels';
import { EVENT_LABEL, JourneyList } from '../journey';

export const metadata = { title: 'Tashriflar' };

const RANGES = [
  { d: 1, label: '24 soat' },
  { d: 7, label: '7 kun' },
  { d: 30, label: '30 kun' },
  { d: 90, label: '90 kun' },
];

const DEVICE_LABEL: Record<string, string> = { mobile: 'Telefon', desktop: 'Kompyuter', tablet: 'Planshet' };

function sourceLabel(s: string) {
  return s === 'direct' ? "To'g'ridan-to'g'ri" : s;
}

export default async function VisitsPage({ searchParams }: { searchParams: Promise<{ d?: string; s?: string }> }) {
  const { user, db } = await requireUser();
  const sp = await searchParams;
  const days = RANGES.some((r) => String(r.d) === sp.d) ? Number(sp.d) : 30;

  if (sp.s) {
    const hits = await visitorJourney(db, { sessionId: sp.s, limit: 300 });
    const leadMap = await sessionsWithLeads(db, [sp.s]);
    const lead = leadMap.get(sp.s);
    const first = hits[0];
    return (
      <AdminShell
        user={user}
        active="visits"
        title="Sessiya"
        actions={
          <Link className="sps-btn sps-btn--link sps-btn--sm" href={`/admin/visits?d=${days}`}>
            ← Tashriflar
          </Link>
        }
      >
        <section className="adm-card">
          {first ? (
            <p className="adm-empty" style={{ marginBottom: 14 }}>
              {countryName(first.country)}
              {first.city ? `, ${first.city}` : ''} · {DEVICE_LABEL[first.device ?? ''] ?? first.device} · {first.browser} / {first.os} ·
              manba: {sourceLabel(first.source)}
              {lead ? (
                <>
                  {' · '}
                  <Link href={`/admin/leads/${lead.id}`}>
                    <b>{lead.number}</b>
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
          <JourneyList hits={hits} />
        </section>
      </AdminShell>
    );
  }

  const [o, sessions] = await Promise.all([visitOverview(db, days), recentSessions(db, 40)]);
  const leadMap = await sessionsWithLeads(
    db,
    sessions.map((s) => s.sessionId),
  );
  const conv = o.sessions ? ((o.funnel.lead / o.sessions) * 100).toFixed(1) : '0';

  return (
    <AdminShell user={user} active="visits" title="Tashriflar">
      <nav className="adm-chips" aria-label="Davr">
        {RANGES.map((r) => (
          <Link key={r.d} href={`/admin/visits?d=${r.d}`} aria-current={r.d === days ? 'true' : undefined}>
            {r.label}
          </Link>
        ))}
      </nav>

      <div className="adm-kpis">
        <Kpi label="Hozir saytda" value={o.online} hint="so'nggi 5 daqiqa" />
        <Kpi label="Tashrifchilar" value={o.visitors} />
        <Kpi label="Sessiyalar" value={o.sessions} />
        <Kpi label="Sahifa ko'rishlar" value={o.pageviews} />
        <Kpi label="Konversiya" value={`${conv}%`} hint={`${o.funnel.lead} zayafka`} />
      </div>

      <section className="adm-card" style={{ marginBottom: 16 }}>
        <h2>Kunlar bo'yicha tashrifchilar</h2>
        <DailyChart rows={o.daily.map((d) => ({ day: d.day, value: d.visitors }))} days={Math.max(days, 7)} />
      </section>

      <div className="adm-grid adm-grid--2">
        <section className="adm-card">
          <h2>Voronka (sessiyalar)</h2>
          <Bars
            rows={[
              { label: 'Saytga kirdi', n: o.funnel.sessions },
              { label: "Model sahifasini ko'rdi", n: o.funnel.viewedModel },
              { label: "Zayafka ro'yxatiga qo'shdi", n: o.funnel.addedToRequest },
              { label: "Qo'ng'iroq / messenjer", n: o.funnel.contacted },
              { label: 'Zayafka qoldirdi', n: o.funnel.lead },
            ]}
          />
        </section>
        <section className="adm-card">
          <h2>Manbalar</h2>
          <Bars rows={o.sources.map((r) => ({ label: sourceLabel(r.key), n: r.n }))} />
        </section>
        <section className="adm-card">
          <h2>Davlatlar</h2>
          <Bars rows={o.countries.map((r) => ({ label: countryName(r.key), n: r.visitors }))} />
        </section>
        <section className="adm-card">
          <h2>Eng ko'p ko'rilgan modellar</h2>
          <Bars rows={o.models.map((r) => ({ label: r.key ?? '—', n: r.n }))} />
        </section>
        <section className="adm-card">
          <h2>Sahifalar</h2>
          <Bars rows={o.pages.map((r) => ({ label: r.key ?? '—', n: r.n }))} />
        </section>
        <section className="adm-card">
          <h2>Qurilma · til · brauzer</h2>
          <Bars
            rows={[
              ...o.devices.map((r) => ({ label: DEVICE_LABEL[r.key ?? ''] ?? r.key ?? '—', n: r.visitors })),
              ...o.langs.map((r) => ({ label: `Til: ${String(r.key).toUpperCase()}`, n: r.visitors })),
              ...o.browsers.slice(0, 4).map((r) => ({ label: r.key ?? '—', n: r.visitors })),
            ]}
          />
        </section>
        <section className="adm-card">
          <h2>Voqealar</h2>
          <Bars rows={Object.entries(o.events).map(([k, v]) => ({ label: EVENT_LABEL[k] ?? k, n: v?.n ?? 0 }))} />
        </section>
      </div>

      <section className="adm-card" style={{ marginTop: 16 }}>
        <h2>So'nggi sessiyalar</h2>
        {sessions.length ? (
          <table className="adm-table adm-table--flat">
            <thead>
              <tr>
                <th scope="col">Vaqt</th>
                <th scope="col">Joy · qurilma</th>
                <th scope="col">Manba · kirish sahifasi</th>
                <th scope="col">Faollik</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => {
                const lead = leadMap.get(s.sessionId);
                return (
                  <tr key={s.sessionId}>
                    <td>
                      <Link className="num" href={`/admin/visits?s=${encodeURIComponent(s.sessionId)}&d=${days}`}>
                        {formatDate(s.last)}
                      </Link>
                    </td>
                    <td data-m="right">
                      {countryName(s.country)}
                      <small>
                        {s.city ? `${s.city} · ` : ''}
                        {DEVICE_LABEL[s.device ?? ''] ?? s.device} · {String(s.lang ?? '').toUpperCase()}
                      </small>
                    </td>
                    <td data-m="full">
                      {sourceLabel(s.source)}
                      <small>{s.entry}</small>
                    </td>
                    <td data-m="full">
                      {s.pageviews} sahifa
                      {s.events.length ? <small>{s.events.map((e) => EVENT_LABEL[e] ?? e).join(' · ')}</small> : null}
                      {lead ? (
                        <Link href={`/admin/leads/${lead.id}`} className="adm-st adm-st--won" style={{ marginTop: 4 }}>
                          {lead.number}
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="adm-empty">Hali tashrif yozilmagan. Sayt bazaga ulangach har bir kirish shu yerda ko'rinadi.</p>
        )}
      </section>
    </AdminShell>
  );
}
