/**
 * Oxirgi Production deploy holati (Vercel REST API) — admin "Nashr qilish" paneli uchun
 * (audit 2026-11-02: hook yuborilgach admin "yuborildi" ko'rardi, build keyin yiqilsa ham bilmasdi).
 *
 * Ixtiyoriy env: `VERCEL_API_TOKEN` (Vercel → Account → Tokens, faqat o'qish yetadi),
 * `VERCEL_PROJECT_ID` (Project → Settings → General), jamoa loyihasi bo'lsa `VERCEL_TEAM_ID`.
 * Sozlanmagan bo'lsa `null` — panel avvalgidek faqat hook natijasini ko'rsatadi.
 */
export type DeployState = 'building' | 'ready' | 'error';
export type DeployStatus = { state: DeployState; createdAt: Date; url: string | null; raw: string };

export function deployStateOf(raw: string): DeployState {
  if (raw === 'READY') return 'ready';
  if (raw === 'ERROR' || raw === 'CANCELED') return 'error';
  return 'building';
}

export async function latestProductionDeploy(
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<DeployStatus | null> {
  const token = env.VERCEL_API_TOKEN;
  const project = env.VERCEL_PROJECT_ID;
  if (!token || !project) return null;
  const qs = new URLSearchParams({ projectId: project, target: 'production', limit: '1' });
  if (env.VERCEL_TEAM_ID) qs.set('teamId', env.VERCEL_TEAM_ID);
  try {
    const res = await fetchImpl(`https://api.vercel.com/v6/deployments?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5_000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { deployments?: { state?: string; readyState?: string; created?: number; createdAt?: number; url?: string }[] };
    const d = json.deployments?.[0];
    if (!d) return null;
    const raw = d.state || d.readyState || 'UNKNOWN';
    return { state: deployStateOf(raw), createdAt: new Date(d.created ?? d.createdAt ?? Date.now()), url: d.url ? `https://${d.url}` : null, raw };
  } catch {
    return null;
  }
}
