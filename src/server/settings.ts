import { desc, eq, gt, max, sql } from 'drizzle-orm';
import type { Db } from './db/client.ts';
import { catalogSections, products, publishes, siteSettings } from './db/schema.ts';
import { INTEGRATION_FIELDS, isValidIntegration } from '../lib/integrations.ts';

/** Admin sozlamalari va "Nashr qilish" (sayt qayta yig'iladi). */

export async function getSettings(db: Db): Promise<Record<string, string>> {
  const rows = await db.select({ key: siteSettings.key, value: siteSettings.value }).from(siteSettings);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/** Faqat ma'lum kalitlar va to'g'ri formatdagi qiymatlar saqlanadi. Xato maydonlar ro'yxati qaytadi. */
export async function saveIntegrations(db: Db, userId: number, input: Record<string, string>): Promise<string[]> {
  const bad: string[] = [];
  const clean: { key: string; value: string }[] = [];
  for (const f of INTEGRATION_FIELDS) {
    const value = (input[f.key] ?? '').trim();
    if (!isValidIntegration(f.key, value)) bad.push(f.key);
    else clean.push({ key: f.key, value });
  }
  if (bad.length) return bad;
  const current = await getSettings(db);
  for (const { key, value } of clean) {
    if ((current[key] ?? '') === value) continue;
    await db
      .insert(siteSettings)
      .values({ key, value, updatedBy: userId, updatedAt: new Date() })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedBy: userId, updatedAt: new Date() } });
  }
  return [];
}

export async function lastPublish(db: Db) {
  const [row] = await db.select().from(publishes).orderBy(desc(publishes.createdAt), desc(publishes.id)).limit(1);
  return row ?? null;
}

/** Oxirgi muvaffaqiyatli nashrdan keyin o'zgargan narsalar soni. */
export async function pendingChanges(db: Db): Promise<{ products: number; sections: number; settings: number; since: Date | null }> {
  const [ok] = await db
    .select({ at: max(publishes.createdAt) })
    .from(publishes)
    .where(eq(publishes.status, 'ok'));
  const since = ok?.at ? new Date(ok.at) : null;
  const after = (col: typeof products.updatedAt | typeof catalogSections.updatedAt | typeof siteSettings.updatedAt) =>
    since ? gt(col, since) : sql`true`;
  const [[p], [s], [st]] = await Promise.all([
    db.select({ n: sql<number>`count(*)::int` }).from(products).where(after(products.updatedAt)),
    db.select({ n: sql<number>`count(*)::int` }).from(catalogSections).where(after(catalogSections.updatedAt)),
    db.select({ n: sql<number>`count(*)::int` }).from(siteSettings).where(after(siteSettings.updatedAt)),
  ]);
  return { products: p.n, sections: s.n, settings: st.n, since };
}

/**
 * Vercel Deploy Hook'ni chaqiradi → sayt bazadagi oxirgi ma'lumot bilan qayta yig'iladi
 * (build boshida `scripts/export-snapshot.mjs`). Natija `publishes` jadvaliga yoziladi.
 */
export async function triggerPublish(db: Db, userId: number, hookUrl = process.env.VERCEL_DEPLOY_HOOK_URL): Promise<{ ok: boolean; message: string }> {
  if (!hookUrl) {
    const message = 'VERCEL_DEPLOY_HOOK_URL sozlanmagan (docs/ADMIN.md → Nashr qilish).';
    await db.insert(publishes).values({ userId, status: 'error', message });
    return { ok: false, message };
  }
  try {
    const res = await fetch(hookUrl, { method: 'POST' });
    const ok = res.ok;
    const message = ok ? 'Sayt qayta yig\'ilmoqda (odatda 3–5 daqiqa).' : `Deploy hook javobi: HTTP ${res.status}`;
    await db.insert(publishes).values({ userId, status: ok ? 'ok' : 'error', message });
    return { ok, message };
  } catch (error) {
    const message = `Deploy hook'ga ulanib bo'lmadi: ${error instanceof Error ? error.message : 'xato'}`;
    await db.insert(publishes).values({ userId, status: 'error', message });
    return { ok: false, message };
  }
}
