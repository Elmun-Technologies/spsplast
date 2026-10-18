import { and, count, countDistinct, desc, eq, gte, inArray, isNotNull, lt, sql } from 'drizzle-orm';
import type { Db } from './db/client.ts';
import { leads, visits } from './db/schema.ts';

/**
 * O'z tashrif statistikamiz (Bosqich 10). GA/Metrica'ga bog'liq emas:
 * admin panel saytga kim, qayerdan, qaysi sahifalarga kirganini o'zi ko'rsatadi.
 * IP saqlanmaydi (faqat Vercel bergan davlat/shahar).
 */

export const VISIT_EVENTS = [
  'pageview',
  'add_to_request',
  'add_to_compare',
  'generate_lead',
  'search',
  'contact_click',
  'pdf_download',
] as const;
export type VisitEvent = (typeof VISIT_EVENTS)[number];

const BOT_RE = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pagespeed|yandex(?!browser)|python|curl|wget|httpclient|go-http|axios|node-fetch|preview/i;

export function isBot(ua: string | null | undefined): boolean {
  return !ua || BOT_RE.test(ua);
}

export function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  const device = /ipad|tablet|(android(?!.*mobile))/i.test(ua) ? 'tablet' : /mobi|iphone|android/i.test(ua) ? 'mobile' : 'desktop';
  const browser = /yabrowser/i.test(ua)
    ? 'Yandex'
    : /edg\//i.test(ua)
      ? 'Edge'
      : /opr\/|opera/i.test(ua)
        ? 'Opera'
        : /samsungbrowser/i.test(ua)
          ? 'Samsung'
          : /chrome|crios/i.test(ua)
            ? 'Chrome'
            : /firefox|fxios/i.test(ua)
              ? 'Firefox'
              : /safari/i.test(ua)
                ? 'Safari'
                : 'Boshqa';
  const os = /windows/i.test(ua)
    ? 'Windows'
    : /iphone|ipad|ios/i.test(ua)
      ? 'iOS'
      : /android/i.test(ua)
        ? 'Android'
        : /mac os/i.test(ua)
          ? 'macOS'
          : /linux/i.test(ua)
            ? 'Linux'
            : 'Boshqa';
  return { device, browser, os };
}

/** `/uz/catalog/paving/01-monako` → `01-monako` (model sahifasi bo'lsa). */
export function modelSlugFromPath(path: string): string | null {
  const m = /^\/(?:uz|ru|en)\/catalog\/[^/]+\/([^/?#]+)/.exec(path);
  return m ? decodeURIComponent(m[1]) : null;
}

export function langFromPath(path: string): string | null {
  const m = /^\/(uz|ru|en)(?:\/|$)/.exec(path);
  return m ? m[1] : null;
}

export function referrerHost(ref: string | null | undefined, siteHost?: string): string | null {
  if (!ref) return null;
  try {
    const host = new URL(ref).hostname.replace(/^www\./, '');
    if (siteHost && host === siteHost.replace(/^www\./, '')) return null;
    return host || null;
  } catch {
    return null;
  }
}

export type VisitInput = {
  visitorId: string;
  sessionId: string;
  type: string;
  path: string;
  item?: string | null;
  detail?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  country?: string | null;
  city?: string | null;
  userAgent: string;
  siteHost?: string;
};

export async function recordVisit(db: Db, v: VisitInput, now = new Date()): Promise<void> {
  const ua = parseUserAgent(v.userAgent);
  await db.insert(visits).values({
    visitorId: v.visitorId,
    sessionId: v.sessionId,
    type: v.type,
    path: v.path.slice(0, 300),
    item: (v.item || (v.type === 'pageview' ? modelSlugFromPath(v.path) : null))?.slice(0, 120) ?? null,
    detail: v.detail?.slice(0, 200) ?? null,
    referrerHost: referrerHost(v.referrer, v.siteHost),
    utmSource: v.utmSource?.slice(0, 100) || null,
    utmMedium: v.utmMedium?.slice(0, 100) || null,
    utmCampaign: v.utmCampaign?.slice(0, 100) || null,
    country: v.country || null,
    city: v.city ? decodeURIComponentSafe(v.city).slice(0, 100) : null,
    device: ua.device,
    browser: ua.browser,
    os: ua.os,
    lang: langFromPath(v.path),
    createdAt: now,
  });
}

function decodeURIComponentSafe(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Eski yozuvlarni o'chirish (13 oy). */
export async function pruneVisits(db: Db, now = new Date()): Promise<void> {
  await db.delete(visits).where(lt(visits.createdAt, new Date(now.getTime() - 400 * 86_400_000)));
}

// --- Admin hisobotlari --------------------------------------------------------

const DAY = 86_400_000;

/** Manba: UTM bo'lsa u, aks holda referrer domeni, bo'lmasa "direct". Sessiyaning birinchi hit'idan. */
const sourceExpr = sql<string>`coalesce(nullif(${visits.utmSource}, ''), ${visits.referrerHost}, 'direct')`;

export async function visitOverview(db: Db, days: number, now = new Date()) {
  const since = new Date(now.getTime() - days * DAY);
  const range = gte(visits.createdAt, since);
  const pv = and(range, eq(visits.type, 'pageview'));

  const [totals] = await db
    .select({
      visitors: countDistinct(visits.visitorId),
      sessions: countDistinct(visits.sessionId),
      pageviews: sql<number>`count(*) filter (where ${visits.type} = 'pageview')::int`,
    })
    .from(visits)
    .where(range);

  const [online] = await db
    .select({ n: countDistinct(visits.sessionId) })
    .from(visits)
    .where(gte(visits.createdAt, new Date(now.getTime() - 5 * 60_000)));

  const [leadCount] = await db.select({ n: count() }).from(leads).where(gte(leads.createdAt, since));

  const events = await db
    .select({ type: visits.type, n: count(), sessions: countDistinct(visits.sessionId) })
    .from(visits)
    .where(and(range, sql`${visits.type} <> 'pageview'`))
    .groupBy(visits.type);

  const [modelSessions] = await db
    .select({ n: countDistinct(visits.sessionId) })
    .from(visits)
    .where(and(pv, isNotNull(visits.item)));

  const dayExpr = sql<string>`to_char(${visits.createdAt} at time zone 'Asia/Tashkent', 'YYYY-MM-DD')`;
  const daily = await db
    .select({
      day: dayExpr,
      visitors: countDistinct(visits.visitorId),
      pageviews: sql<number>`count(*) filter (where ${visits.type} = 'pageview')::int`,
    })
    .from(visits)
    .where(range)
    .groupBy(dayExpr)
    .orderBy(dayExpr);

  const top = (col: typeof visits.path | typeof visits.item | typeof visits.country | typeof visits.device | typeof visits.lang | typeof visits.browser | typeof visits.os, where = pv, limit = 10) =>
    db
      .select({ key: col, n: count(), visitors: countDistinct(visits.visitorId) })
      .from(visits)
      .where(and(where, isNotNull(col)))
      .groupBy(col)
      .orderBy(desc(count()))
      .limit(limit);

  // Manba sessiya bo'yicha: sessiyaning birinchi hit'i.
  const firstHits = db
    .selectDistinctOn([visits.sessionId], { sessionId: visits.sessionId, source: sourceExpr.as('source') })
    .from(visits)
    .where(range)
    .orderBy(visits.sessionId, visits.createdAt)
    .as('first_hits');
  const sources = await db
    .select({ key: firstHits.source, n: count() })
    .from(firstHits)
    .groupBy(firstHits.source)
    .orderBy(desc(count()))
    .limit(12);

  const [pages, models, countries, devices, langs, browsers] = await Promise.all([
    top(visits.path),
    top(visits.item),
    top(visits.country, range),
    top(visits.device, range),
    top(visits.lang, pv),
    top(visits.browser, range),
  ]);

  const ev = Object.fromEntries(events.map((e) => [e.type, e])) as Record<string, { n: number; sessions: number } | undefined>;
  return {
    visitors: totals.visitors,
    sessions: totals.sessions,
    pageviews: totals.pageviews,
    online: online.n,
    leads: leadCount.n,
    events: ev,
    funnel: {
      sessions: totals.sessions,
      viewedModel: modelSessions.n,
      addedToRequest: ev.add_to_request?.sessions ?? 0,
      contacted: ev.contact_click?.sessions ?? 0,
      lead: ev.generate_lead?.sessions ?? 0,
    },
    daily,
    pages,
    models,
    countries,
    devices,
    langs,
    browsers,
    sources,
  };
}

/** So'nggi sessiyalar (jonli lenta). */
export async function recentSessions(db: Db, limit = 30) {
  const rows = await db
    .select({
      sessionId: visits.sessionId,
      visitorId: sql<string>`min(${visits.visitorId})`,
      first: sql<Date>`min(${visits.createdAt})`,
      last: sql<Date>`max(${visits.createdAt})`,
      pageviews: sql<number>`count(*) filter (where ${visits.type} = 'pageview')::int`,
      events: sql<string[]>`array_remove(array_agg(distinct case when ${visits.type} <> 'pageview' then ${visits.type} end), null)`,
      country: sql<string | null>`max(${visits.country})`,
      city: sql<string | null>`max(${visits.city})`,
      device: sql<string | null>`max(${visits.device})`,
      lang: sql<string | null>`max(${visits.lang})`,
      source: sql<string>`(array_agg(${sourceExpr} order by ${visits.createdAt}))[1]`,
      entry: sql<string>`(array_agg(${visits.path} order by ${visits.createdAt}))[1]`,
    })
    .from(visits)
    .groupBy(visits.sessionId)
    .orderBy(desc(sql`max(${visits.createdAt})`))
    .limit(limit);
  return rows;
}

/** Bitta sessiya yoki tashrifchining yo'li (zayafka kartochkasida ham). */
export async function visitorJourney(db: Db, opts: { sessionId?: string | null; visitorId?: string | null; before?: Date; limit?: number }) {
  const cond = [];
  if (opts.visitorId) cond.push(eq(visits.visitorId, opts.visitorId));
  else if (opts.sessionId) cond.push(eq(visits.sessionId, opts.sessionId));
  else return [];
  if (opts.before) cond.push(lt(visits.createdAt, new Date(opts.before.getTime() + 60_000)));
  const rows = await db
    .select({
      id: visits.id,
      sessionId: visits.sessionId,
      type: visits.type,
      path: visits.path,
      item: visits.item,
      detail: visits.detail,
      source: sourceExpr,
      country: visits.country,
      city: visits.city,
      device: visits.device,
      browser: visits.browser,
      os: visits.os,
      createdAt: visits.createdAt,
    })
    .from(visits)
    .where(and(...cond))
    .orderBy(desc(visits.createdAt), desc(visits.id))
    .limit(opts.limit ?? 200);
  return rows.reverse();
}

/** Sessiyalar ichida zayafka qoldirganlari (lenta belgisi uchun). */
export async function sessionsWithLeads(db: Db, sessionIds: string[]) {
  if (!sessionIds.length) return new Map<string, { id: number; number: string }>();
  const rows = await db
    .select({ sessionId: leads.sessionId, id: leads.id, number: leads.number })
    .from(leads)
    .where(inArray(leads.sessionId, sessionIds));
  return new Map(rows.filter((r) => r.sessionId).map((r) => [r.sessionId as string, { id: r.id, number: r.number }]));
}
