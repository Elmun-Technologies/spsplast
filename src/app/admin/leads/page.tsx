import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { requireUser } from '@/server/session';
import { LEAD_STATUSES, LEAD_TYPES, adminUsers } from '@/server/db/schema';
import { leadStats, listLeads } from '@/server/leads';
import { AdminShell, StatusBadge } from '../AdminShell';
import { CLIENT_LABEL, STATUS_LABEL, TYPE_LABEL, countryName, formatDate, telLink } from '../labels';
import { parseLeadSearch, withParam, type LeadSearch } from '../filters';

export const metadata = { title: 'Zayafkalar' };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<LeadSearch> }) {
  const { user, db } = await requireUser();
  const sp = await searchParams;
  const f = parseLeadSearch(sp);
  const [list, stats, users] = await Promise.all([
    listLeads(db, f),
    leadStats(db),
    db.select({ id: adminUsers.id, name: adminUsers.name }).from(adminUsers).orderBy(asc(adminUsers.name)),
  ]);
  const total = Object.values(stats.status).reduce((a, b) => a + (b ?? 0), 0);
  const exportHref = `/admin/leads/export${withParam(sp, 'page', null)}`;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) || '';

  return (
    <AdminShell
      user={user}
      active="leads"
      title="Zayafkalar"
      actions={
        <a className="sps-btn sps-btn--outline sps-btn--sm" href={exportHref}>
          Excel (CSV) yuklab olish
        </a>
      }
    >
      <nav className="adm-chips" aria-label="Holat bo'yicha">
        <Link href={withParam(sp, 'status', null)} aria-current={!f.status ? 'true' : undefined}>
          Hammasi <small>{total}</small>
        </Link>
        {LEAD_STATUSES.map((st) => (
          <Link key={st} href={withParam(sp, 'status', st)} aria-current={f.status === st ? 'true' : undefined}>
            {STATUS_LABEL[st]} <small>{stats.status[st] ?? 0}</small>
          </Link>
        ))}
      </nav>

      <form className="adm-filters" method="GET" role="search">
        {f.status ? <input type="hidden" name="status" value={f.status} /> : null}
        <input
          className="sps-input q"
          type="search"
          name="q"
          defaultValue={f.q}
          placeholder="Qidirish: ism, telefon, SPS-raqam, shahar, kompaniya"
          aria-label="Qidirish"
        />
        <select className="sps-select" name="type" defaultValue={f.type ?? ''} aria-label="Turi">
          <option value="">Barcha turlar</option>
          {LEAD_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>
        <select className="sps-select" name="assignee" defaultValue={one('assignee')} aria-label="Mas'ul">
          <option value="">Barcha mas'ullar</option>
          <option value="none">Biriktirilmagan</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <input className="sps-input" type="date" name="from" defaultValue={one('from')} aria-label="Sanadan" />
        <div className="act">
          <button className="sps-btn sps-btn--dark sps-btn--sm" type="submit">
            Qo'llash
          </button>
          <Link className="sps-btn sps-btn--link sps-btn--sm" href="/admin/leads">
            Tozalash
          </Link>
        </div>
      </form>

      <p className="adm-empty" style={{ marginBottom: 10 }}>
        {list.total} ta zayafka
      </p>

      {list.rows.length ? (
        <table className="adm-table">
          <thead>
            <tr>
              <th scope="col">Raqam · sana</th>
              <th scope="col">Mijoz</th>
              <th scope="col">Joy</th>
              <th scope="col">Turi</th>
              <th scope="col">Mas'ul</th>
              <th scope="col">Holat</th>
            </tr>
          </thead>
          <tbody>
            {list.rows.map((l) => (
              <tr key={l.id}>
                <td>
                  <Link className="num" href={`/admin/leads/${l.id}`}>
                    {l.number}
                  </Link>
                  <small>{formatDate(l.createdAt)}</small>
                </td>
                <td data-m="right" data-d="hide">
                  <StatusBadge status={l.status} label={STATUS_LABEL[l.status]} />
                </td>
                <td data-m="full">
                  <b>{l.name}</b>
                  {l.clientType ? ` · ${CLIENT_LABEL[l.clientType]}` : ''}
                  <small>
                    <a href={telLink(l.phone)}>{l.phone}</a>
                  </small>
                </td>
                <td data-m="full">
                  {countryName(l.country || l.geoCountry)}
                  {l.city ? <small>{l.city}</small> : null}
                </td>
                <td data-m="full">
                  {TYPE_LABEL[l.type]}
                  <small>
                    {l.itemCount ? `${l.itemCount} model` : '—'}
                    {l.volumeM2 ? ` · ${l.volumeM2} m²/kun` : ''}
                  </small>
                  {!l.telegramDelivered ? <span className="adm-warn">Telegram'ga yetmagan</span> : null}
                </td>
                <td data-m="hide">{l.assigneeName ?? '—'}</td>
                <td data-m="hide">
                  <StatusBadge status={l.status} label={STATUS_LABEL[l.status]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="adm-card">
          <p className="adm-empty">Bu filtr bo'yicha zayafka topilmadi.</p>
        </div>
      )}

      {list.pages > 1 ? (
        <nav className="adm-pager" aria-label="Sahifalar">
          {list.page > 1 ? (
            <Link className="sps-btn sps-btn--outline sps-btn--sm" href={withParam(sp, 'page', String(list.page - 1))}>
              ← Oldingi
            </Link>
          ) : null}
          <span>
            {list.page} / {list.pages}
          </span>
          {list.page < list.pages ? (
            <Link className="sps-btn sps-btn--outline sps-btn--sm" href={withParam(sp, 'page', String(list.page + 1))}>
              Keyingi →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </AdminShell>
  );
}
