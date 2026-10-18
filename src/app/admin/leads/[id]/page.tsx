import Link from 'next/link';
import { notFound } from 'next/navigation';
import { asc, eq } from 'drizzle-orm';
import { requireUser } from '@/server/session';
import { LEAD_STATUSES, adminUsers } from '@/server/db/schema';
import { getLead } from '@/server/leads';
import { visitorJourney } from '@/server/visits';
import { JourneyList } from '../../journey';
import { AdminShell, StatusBadge } from '../../AdminShell';
import { assignAction, noteAction, setStatusAction } from '../../actions';
import { CLIENT_LABEL, STATUS_LABEL, TYPE_LABEL, countryName, formatDate, telLink, waLink } from '../../labels';

export const metadata = { title: 'Zayafka' };

const MATERIAL: Record<string, string> = { pp: 'PP', abs: 'ABS', advice: 'Maslahat kerak' };

function activityText(a: { kind: string; body: string | null; fromValue: string | null; toValue: string | null }): string {
  switch (a.kind) {
    case 'created':
      return 'Zayafka saytdan keldi';
    case 'status':
      return `Holat: ${STATUS_LABEL[a.fromValue as keyof typeof STATUS_LABEL] ?? a.fromValue} → ${STATUS_LABEL[a.toValue as keyof typeof STATUS_LABEL] ?? a.toValue}${a.body ? ` (${a.body})` : ''}`;
    case 'assign':
      return a.toValue ? `Mas'ul: ${a.toValue}` : "Mas'ul olib tashlandi";
    case 'telegram':
      return a.body || 'Telegram';
    default:
      return a.body || '';
  }
}

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, db } = await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const data = await getLead(db, id);
  if (!data) notFound();
  const { lead, items, activity } = data;
  const users = await db
    .select({ id: adminUsers.id, name: adminUsers.name })
    .from(adminUsers)
    .where(eq(adminUsers.active, true))
    .orderBy(asc(adminUsers.name));
  const journey = await visitorJourney(db, {
    visitorId: lead.visitorId,
    sessionId: lead.sessionId,
    before: lead.createdAt,
    limit: 60,
  });
  const place = [lead.city, lead.country].filter(Boolean).join(', ');
  const source = [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(' / ');
  const totalMolds = items.reduce((s, i) => s + (i.molds ?? 0), 0);

  return (
    <AdminShell
      user={user}
      active="leads"
      title={lead.number}
      actions={
        <Link className="sps-btn sps-btn--link sps-btn--sm" href="/admin/leads">
          ← Ro'yxatga
        </Link>
      }
    >
      <div className="adm-grid adm-grid--side">
        <div className="adm-grid">
          <section className="adm-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0 }}>
                {lead.name}
                {lead.clientType ? ` · ${CLIENT_LABEL[lead.clientType]}` : ''}
              </h2>
              <StatusBadge status={lead.status} label={STATUS_LABEL[lead.status]} />
            </div>
            <dl className="adm-dl">
              <dt>Telefon</dt>
              <dd>
                <a href={telLink(lead.phone)}>{lead.phone}</a>
              </dd>
              <dt>Joy</dt>
              <dd>
                {place || '—'}
                {lead.geoCountry ? ` (IP: ${countryName(lead.geoCountry)})` : ''}
              </dd>
              {lead.company ? (
                <>
                  <dt>Kompaniya</dt>
                  <dd>{lead.company}</dd>
                </>
              ) : null}
              <dt>Turi</dt>
              <dd>{TYPE_LABEL[lead.type]}</dd>
              {lead.volumeM2 ? (
                <>
                  <dt>Kunlik hajm</dt>
                  <dd>{lead.volumeM2} m²</dd>
                </>
              ) : null}
              {lead.material ? (
                <>
                  <dt>Material</dt>
                  <dd>{MATERIAL[lead.material] ?? lead.material}</dd>
                </>
              ) : null}
              <dt>Til · sahifa</dt>
              <dd>
                {lead.lang.toUpperCase()} · {lead.pageUrl || '—'}
              </dd>
              <dt>Manba</dt>
              <dd>
                {source || "To'g'ridan-to'g'ri"}
                {lead.gclid ? ' · Google Ads' : ''}
                {lead.fbclid ? ' · Meta Ads' : ''}
              </dd>
              <dt>Keldi</dt>
              <dd>
                {formatDate(lead.createdAt)}
                {!lead.telegramDelivered ? <span className="adm-warn"> · Telegram'ga yetmagan</span> : null}
              </dd>
            </dl>
            <div className="adm-contact">
              <a className="sps-btn sps-btn--primary sps-btn--sm" href={telLink(lead.phone)}>
                Qo'ng'iroq
              </a>
              <a className="sps-btn sps-btn--outline sps-btn--sm" href={waLink(lead.phone)} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
              <a
                className="sps-btn sps-btn--outline sps-btn--sm"
                href={`https://t.me/+${lead.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram
              </a>
            </div>
          </section>

          <section className="adm-card">
            <h2>Modellar</h2>
            {items.length ? (
              <table className="adm-items">
                <thead>
                  <tr>
                    <th scope="col">Model</th>
                    <th scope="col" className="n">
                      m²/kun
                    </th>
                    <th scope="col" className="n">
                      ≈ qolip
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td>
                        № {i.code ?? '—'} {i.name ?? i.slug}
                      </td>
                      <td className="n">{i.m2 ?? '—'}</td>
                      <td className="n">{i.molds?.toLocaleString('ru-RU') ?? 'menejer'}</td>
                    </tr>
                  ))}
                </tbody>
                {totalMolds ? (
                  <tfoot>
                    <tr>
                      <th scope="row" colSpan={2}>
                        Jami
                      </th>
                      <td className="n">
                        <b>{totalMolds.toLocaleString('ru-RU')}</b>
                      </td>
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            ) : (
              <p className="adm-empty">Model tanlanmagan (umumiy zayafka).</p>
            )}
            {lead.message ? (
              <>
                <h2 style={{ marginTop: 18 }}>Mijoz izohi</h2>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{lead.message}</p>
              </>
            ) : null}
          </section>

          <section className="adm-card">
            <h2>Mijoz yo'li — zayafkadan oldin saytda nimalarni ko'rgan</h2>
            {journey.length ? (
              <>
                {lead.sessionId ? (
                  <p className="adm-empty" style={{ marginBottom: 12 }}>
                    <a href={`/admin/visits?s=${encodeURIComponent(lead.sessionId)}`}>Sessiyani to'liq ochish →</a>
                  </p>
                ) : null}
                <JourneyList hits={journey} />
              </>
            ) : (
              <p className="adm-empty">Tashrif ma'lumoti yo'q (eski zayafka yoki brauzer statistikani bloklagan).</p>
            )}
          </section>
        </div>

        <div className="adm-grid">
          <section className="adm-card">
            <h2>Holat</h2>
            <form action={setStatusAction} className="adm-form">
              <input type="hidden" name="leadId" value={lead.id} />
              <div className="adm-statusbar">
                {LEAD_STATUSES.map((st) => (
                  <button key={st} type="submit" name="status" value={st} aria-pressed={lead.status === st}>
                    {STATUS_LABEL[st]}
                  </button>
                ))}
              </div>
              <label htmlFor="lostReason">Rad etilsa — sababi</label>
              <input
                className="sps-input"
                id="lostReason"
                name="lostReason"
                defaultValue={lead.lostReason ?? ''}
                placeholder="Masalan: narx, muddat, raqobatchi"
              />
            </form>
          </section>

          <section className="adm-card">
            <h2>Mas'ul menejer</h2>
            <form action={assignAction} className="adm-form">
              <input type="hidden" name="leadId" value={lead.id} />
              <div className="row">
                <select className="sps-select" name="assigneeId" defaultValue={lead.assigneeId ?? ''} aria-label="Mas'ul menejer">
                  <option value="">— biriktirilmagan —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <button className="sps-btn sps-btn--dark sps-btn--sm" type="submit" style={{ flex: 'none', height: 44 }}>
                  Saqlash
                </button>
              </div>
            </form>
          </section>

          <section className="adm-card">
            <h2>Izoh va tarix</h2>
            <form action={noteAction} className="adm-form" style={{ marginBottom: 18 }}>
              <input type="hidden" name="leadId" value={lead.id} />
              <textarea
                className="sps-textarea"
                name="body"
                required
                maxLength={4000}
                placeholder="Qo'ng'iroq natijasi, kelishuv, keyingi qadam…"
                aria-label="Izoh"
              />
              <button className="sps-btn sps-btn--outline sps-btn--sm" type="submit">
                Izoh qo'shish
              </button>
            </form>
            <ol className="adm-timeline">
              {activity.map((a) => (
                <li key={a.id} className={a.kind === 'note' ? 'note' : undefined}>
                  <time>
                    {formatDate(a.createdAt)}
                    {a.userName ? ` · ${a.userName}` : ''}
                  </time>
                  <p>{activityText(a)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
