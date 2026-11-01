import { createSign } from 'node:crypto';
import type { ServiceAccount } from '../secrets.ts';
import { cached, dayRange, fetchJson, type Fetch } from './http.ts';

/**
 * Google API: service account → JWT (RS256, `node:crypto`, kutubxonasiz) → access token.
 * Search Console (Search Analytics + sitemap yuborish) va GA4 Data API.
 */
export const SCOPES = {
  webmasters: 'https://www.googleapis.com/auth/webmasters',
  analytics: 'https://www.googleapis.com/auth/analytics.readonly',
};

const b64url = (input: string | Buffer) => Buffer.from(input).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

export function signJwt(sa: ServiceAccount, scopes: string[], nowSec = Math.floor(Date.now() / 1000)): string {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({ iss: sa.client_email, scope: scopes.join(' '), aud: 'https://oauth2.googleapis.com/token', iat: nowSec, exp: nowSec + 3600 }),
  );
  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  return `${header}.${claims}.${b64url(signer.sign(sa.private_key))}`;
}

const tokenCache = new Map<string, { token: string; exp: number }>();

export async function googleToken(sa: ServiceAccount, scopes: string[], f: Fetch = fetch): Promise<string> {
  const key = `${sa.client_email}|${scopes.join(' ')}`;
  const hit = tokenCache.get(key);
  if (hit && hit.exp > Date.now() + 60_000) return hit.token;
  const body = new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: signJwt(sa, scopes) });
  const r = await fetchJson<{ access_token: string; expires_in: number }>(f, 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  tokenCache.set(key, { token: r.access_token, exp: Date.now() + (r.expires_in ?? 3600) * 1000 });
  return r.access_token;
}

// --- Search Console -------------------------------------------------------------

type GscRow = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };
export type GscItem = { key: string; clicks: number; impressions: number; ctr: number; position: number };
export type GscReport = {
  range: { start: string; end: string };
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  daily: { day: string; value: number }[];
  queries: GscItem[];
  pages: GscItem[];
  countries: GscItem[];
  devices: GscItem[];
};

const site = (property: string) => encodeURIComponent(property);

async function gscQuery(f: Fetch, token: string, property: string, body: Record<string, unknown>): Promise<GscRow[]> {
  const r = await fetchJson<{ rows?: GscRow[] }>(f, `https://searchconsole.googleapis.com/webmasters/v3/sites/${site(property)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.rows ?? [];
}

const item = (r: GscRow): GscItem => ({ key: r.keys?.[0] ?? '', clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position });

/** Search Console ma'lumoti ~2 kun kechikadi — oraliq kechagi kundan 2 kun oldin tugaydi. */
export async function gscReport(sa: ServiceAccount, property: string, days: number, f: Fetch = fetch): Promise<GscReport> {
  return cached(`gsc:${property}:${days}`, async () => {
    const token = await googleToken(sa, [SCOPES.webmasters], f);
    const range = dayRange(days, 2);
    const base = { startDate: range.start, endDate: range.end, dataState: 'final' };
    const [tot, daily, queries, pages, countries, devices] = await Promise.all([
      gscQuery(f, token, property, { ...base }),
      gscQuery(f, token, property, { ...base, dimensions: ['date'], rowLimit: 500 }),
      gscQuery(f, token, property, { ...base, dimensions: ['query'], rowLimit: 25 }),
      gscQuery(f, token, property, { ...base, dimensions: ['page'], rowLimit: 15 }),
      gscQuery(f, token, property, { ...base, dimensions: ['country'], rowLimit: 15 }),
      gscQuery(f, token, property, { ...base, dimensions: ['device'], rowLimit: 5 }),
    ]);
    const t = tot[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    return {
      range,
      totals: { clicks: t.clicks, impressions: t.impressions, ctr: t.ctr, position: t.position },
      daily: daily.map((r) => ({ day: r.keys?.[0] ?? '', value: r.clicks })),
      queries: queries.map(item),
      pages: pages.map(item),
      countries: countries.map(item),
      devices: devices.map(item),
    };
  });
}

export async function gscSubmitSitemap(sa: ServiceAccount, property: string, sitemapUrl: string, f: Fetch = fetch): Promise<void> {
  const token = await googleToken(sa, [SCOPES.webmasters], f);
  await fetchJson(f, `https://www.googleapis.com/webmasters/v3/sites/${site(property)}/sitemaps/${encodeURIComponent(sitemapUrl)}`, {
    method: 'PUT',
    headers: { authorization: `Bearer ${token}` },
  });
}

// --- Google Analytics 4 ---------------------------------------------------------

type Ga4Response = { rows?: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }[] };
export type Ga4Report = {
  totals: { sessions: number; users: number; keyEvents: number; engagementRate: number };
  daily: { day: string; value: number }[];
  countries: { key: string; sessions: number; keyEvents: number }[];
  channels: { key: string; sessions: number; keyEvents: number }[];
  pages: { key: string; views: number }[];
};

async function ga4Run(f: Fetch, token: string, propertyId: string, body: Record<string, unknown>) {
  return fetchJson<Ga4Response>(f, `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const num = (v: string | undefined) => Number(v ?? 0) || 0;

export async function ga4Report(sa: ServiceAccount, propertyId: string, days: number, f: Fetch = fetch): Promise<Ga4Report> {
  return cached(`ga4:${propertyId}:${days}`, async () => {
    const token = await googleToken(sa, [SCOPES.analytics], f);
    const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }];
    const m = (names: string[]) => names.map((name) => ({ name }));
    const [tot, daily, countries, channels, pages] = await Promise.all([
      ga4Run(f, token, propertyId, { dateRanges, metrics: m(['sessions', 'totalUsers', 'keyEvents', 'engagementRate']) }),
      ga4Run(f, token, propertyId, { dateRanges, dimensions: [{ name: 'date' }], metrics: m(['sessions']), orderBys: [{ dimension: { dimensionName: 'date' } }] }),
      ga4Run(f, token, propertyId, { dateRanges, dimensions: [{ name: 'country' }], metrics: m(['sessions', 'keyEvents']), limit: 15, orderBys: [{ metric: { metricName: 'sessions' }, desc: true }] }),
      ga4Run(f, token, propertyId, { dateRanges, dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: m(['sessions', 'keyEvents']), limit: 10, orderBys: [{ metric: { metricName: 'sessions' }, desc: true }] }),
      ga4Run(f, token, propertyId, { dateRanges, dimensions: [{ name: 'pagePath' }], metrics: m(['screenPageViews']), limit: 15, orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }] }),
    ]);
    const t = tot.rows?.[0]?.metricValues ?? [];
    const dim = (r: Ga4Response) => r.rows ?? [];
    return {
      totals: { sessions: num(t[0]?.value), users: num(t[1]?.value), keyEvents: num(t[2]?.value), engagementRate: num(t[3]?.value) },
      daily: dim(daily).map((r) => {
        const d = r.dimensionValues?.[0]?.value ?? '';
        return { day: d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}` : d, value: num(r.metricValues?.[0]?.value) };
      }),
      countries: dim(countries).map((r) => ({ key: r.dimensionValues?.[0]?.value ?? '', sessions: num(r.metricValues?.[0]?.value), keyEvents: num(r.metricValues?.[1]?.value) })),
      channels: dim(channels).map((r) => ({ key: r.dimensionValues?.[0]?.value ?? '', sessions: num(r.metricValues?.[0]?.value), keyEvents: num(r.metricValues?.[1]?.value) })),
      pages: dim(pages).map((r) => ({ key: r.dimensionValues?.[0]?.value ?? '', views: num(r.metricValues?.[0]?.value) })),
    };
  });
}
