import { cached, dayRange, fetchJson, type Fetch } from './http.ts';

/**
 * Yandex API (bitta OAuth token): Metrica (Reporting + Management) va Webmaster v4.
 * Token huquqlari: `metrika:read`, `webmaster:hostinfo` (+ sitemap/recrawl uchun `webmaster:verify`).
 */
const auth = (token: string) => ({ authorization: `OAuth ${token}` });

// --- Metrica ---------------------------------------------------------------------

type MetricaData = { data?: { dimensions: { name: string | null; id?: string | null }[]; metrics: number[] }[]; totals?: number[] };
export type MetricaRow = { key: string; values: number[] };
export type MetricaReport = {
  totals: { visits: number; users: number; pageviews: number; bounceRate: number; avgDuration: number };
  daily: { day: string; value: number }[];
  sources: MetricaRow[];
  engines: MetricaRow[];
  countries: MetricaRow[];
  pages: MetricaRow[];
  goals: { id: number; name: string; reaches: number; conversion: number }[];
};

async function stat(f: Fetch, token: string, params: Record<string, string>) {
  const q = new URLSearchParams({ accuracy: 'full', lang: 'ru', ...params });
  return fetchJson<MetricaData>(f, `https://api-metrika.yandex.net/stat/v1/data?${q}`, { headers: auth(token) });
}

const rows = (d: MetricaData): MetricaRow[] =>
  (d.data ?? []).map((r) => ({ key: r.dimensions.map((x) => x.name ?? '—').join(' · '), values: r.metrics }));

export async function metricaReport(token: string, counterId: string, days: number, f: Fetch = fetch): Promise<MetricaReport> {
  return cached(`metrica:${counterId}:${days}`, async () => {
    const date = { ids: counterId, date1: `${days - 1}daysAgo`, date2: 'today' };
    const [tot, daily, sources, engines, countries, pages, goalsList] = await Promise.all([
      stat(f, token, { ...date, metrics: 'ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:bounceRate,ym:s:avgVisitDurationSeconds' }),
      stat(f, token, { ...date, metrics: 'ym:s:visits', dimensions: 'ym:s:date', sort: 'ym:s:date', limit: '400' }),
      stat(f, token, { ...date, metrics: 'ym:s:visits,ym:s:users', dimensions: 'ym:s:lastTrafficSource', sort: '-ym:s:visits', limit: '10' }),
      stat(f, token, { ...date, metrics: 'ym:s:visits', dimensions: 'ym:s:lastSearchEngineRoot', sort: '-ym:s:visits', limit: '10' }),
      stat(f, token, { ...date, metrics: 'ym:s:visits,ym:s:users', dimensions: 'ym:s:regionCountry', sort: '-ym:s:visits', limit: '15' }),
      stat(f, token, { ...date, metrics: 'ym:pv:pageviews', dimensions: 'ym:pv:URLPath', sort: '-ym:pv:pageviews', limit: '15' }),
      fetchJson<{ goals?: { id: number; name: string }[] }>(f, `https://api-metrika.yandex.net/management/v1/counter/${counterId}/goals`, {
        headers: auth(token),
      }).catch(() => ({ goals: [] })),
    ]);
    const goals = (goalsList.goals ?? []).slice(0, 8);
    let goalStats: number[] = [];
    if (goals.length) {
      const g = await stat(f, token, {
        ...date,
        metrics: goals.flatMap((x) => [`ym:s:goal${x.id}reaches`, `ym:s:goal${x.id}conversionRate`]).join(','),
      }).catch(() => ({ totals: [] }) as MetricaData);
      goalStats = g.totals ?? [];
    }
    const t = tot.totals ?? [];
    return {
      totals: { visits: t[0] ?? 0, users: t[1] ?? 0, pageviews: t[2] ?? 0, bounceRate: t[3] ?? 0, avgDuration: t[4] ?? 0 },
      daily: (daily.data ?? []).map((r) => ({ day: r.dimensions[0]?.name ?? '', value: r.metrics[0] ?? 0 })),
      sources: rows(sources),
      engines: rows(engines),
      countries: rows(countries),
      pages: rows(pages),
      goals: goals.map((x, i) => ({ id: x.id, name: x.name, reaches: goalStats[i * 2] ?? 0, conversion: goalStats[i * 2 + 1] ?? 0 })),
    };
  });
}

// --- Webmaster -------------------------------------------------------------------

const WM = 'https://api.webmaster.yandex.net/v4';

export type WebmasterHost = { userId: number; hostId: string; url: string; verified: boolean };
export type WebmasterReport = {
  host: WebmasterHost;
  summary: { sqi: number; searchable: number; excluded: number; problems: Record<string, number> };
  queries: { query: string; shows: number; clicks: number; position: number }[];
};

/** Hisobdagi saytlardan `siteUrl` ga mosini topadi (`www.` va protokolsiz solishtiriladi). */
export async function webmasterHost(token: string, siteUrl: string, f: Fetch = fetch): Promise<WebmasterHost> {
  return cached(`wm-host:${siteUrl}`, async () => {
    const { user_id } = await fetchJson<{ user_id: number }>(f, `${WM}/user`, { headers: auth(token) });
    const { hosts = [] } = await fetchJson<{ hosts?: { host_id: string; ascii_host_url: string; verified: boolean }[] }>(
      f,
      `${WM}/user/${user_id}/hosts`,
      { headers: auth(token) },
    );
    const want = new URL(siteUrl).hostname.replace(/^www\./, '');
    const host = hosts.find((h) => {
      try {
        return new URL(h.ascii_host_url).hostname.replace(/^www\./, '') === want;
      } catch {
        return false;
      }
    });
    if (!host) throw new Error(`Yandex Webmaster'da ${want} sayti topilmadi — avval saytni qo'shing va tasdiqlang (Sozlamalar → Yandex Webmaster meta-teg)`);
    return { userId: user_id, hostId: host.host_id, url: host.ascii_host_url, verified: host.verified };
  });
}

export async function webmasterReport(token: string, siteUrl: string, days: number, f: Fetch = fetch): Promise<WebmasterReport> {
  return cached(`wm:${siteUrl}:${days}`, async () => {
    const host = await webmasterHost(token, siteUrl, f);
    const base = `${WM}/user/${host.userId}/hosts/${encodeURIComponent(host.hostId)}`;
    const range = dayRange(days, 1);
    const q = new URLSearchParams({ order_by: 'TOTAL_SHOWS', date_from: range.start, date_to: range.end, limit: '25' });
    for (const ind of ['TOTAL_SHOWS', 'TOTAL_CLICKS', 'AVG_SHOW_POSITION']) q.append('query_indicator', ind);
    const [summary, popular] = await Promise.all([
      fetchJson<{ sqi?: number; searchable_pages_count?: number; excluded_pages_count?: number; site_problems?: Record<string, number> }>(f, `${base}/summary`, {
        headers: auth(token),
      }),
      fetchJson<{ queries?: { query_text: string; indicators: Record<string, number> }[] }>(f, `${base}/search-queries/popular?${q}`, {
        headers: auth(token),
      }).catch(() => ({ queries: [] })),
    ]);
    return {
      host,
      summary: {
        sqi: summary.sqi ?? 0,
        searchable: summary.searchable_pages_count ?? 0,
        excluded: summary.excluded_pages_count ?? 0,
        problems: summary.site_problems ?? {},
      },
      queries: (popular.queries ?? []).map((x) => ({
        query: x.query_text,
        shows: x.indicators.TOTAL_SHOWS ?? 0,
        clicks: x.indicators.TOTAL_CLICKS ?? 0,
        position: x.indicators.AVG_SHOW_POSITION ?? 0,
      })),
    };
  });
}

export async function webmasterAddSitemap(token: string, siteUrl: string, sitemapUrl: string, f: Fetch = fetch): Promise<void> {
  const host = await webmasterHost(token, siteUrl, f);
  await fetchJson(f, `${WM}/user/${host.userId}/hosts/${encodeURIComponent(host.hostId)}/user-added-sitemaps`, {
    method: 'POST',
    headers: { ...auth(token), 'content-type': 'application/json' },
    body: JSON.stringify({ url: sitemapUrl }),
  });
}
