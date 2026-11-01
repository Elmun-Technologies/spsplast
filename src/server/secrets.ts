import { eq } from 'drizzle-orm';
import type { Db } from './db/client.ts';
import { integrationSecrets } from './db/schema.ts';

/**
 * Hisobot ulanishlari (admin → Analitika → "Ulanishlar"). Qiymatlar `integration_secrets`
 * jadvalida — snapshot uni o'qimaydi, ya'ni saytning JS'iga hech qachon tushmaydi.
 * Env o'zgaruvchisi bo'lsa — u ustun (Vercel → Environment Variables, xavfsizroq).
 * Admin sahifasi qiymatni qayta ko'rsatmaydi, faqat "saqlangan" belgisi va oxirgi 4 belgi.
 */
export type SecretField = {
  key: string;
  label: string;
  env: string;
  secret: boolean;
  multiline?: boolean;
  placeholder: string;
  help: string;
  validate: (v: string) => string | null;
};

export type ServiceAccount = { client_email: string; private_key: string; project_id?: string };

export function parseServiceAccount(raw: string): ServiceAccount | null {
  try {
    const j = JSON.parse(raw) as Partial<ServiceAccount> & { type?: string };
    if (typeof j.client_email !== 'string' || !/@.+\.iam\.gserviceaccount\.com$/.test(j.client_email)) return null;
    if (typeof j.private_key !== 'string' || !j.private_key.includes('PRIVATE KEY')) return null;
    return { client_email: j.client_email, private_key: j.private_key, project_id: j.project_id };
  } catch {
    return null;
  }
}

export const SECRET_FIELDS: SecretField[] = [
  {
    key: 'yandex_oauth_token',
    label: 'Yandex OAuth token (Metrica + Webmaster)',
    env: 'YANDEX_OAUTH_TOKEN',
    secret: true,
    placeholder: 'y0_AgAAAA…',
    help: "oauth.yandex.ru → ilova (huquqlar: metrika:read, webmaster:hostinfo, webmaster:verify) → token. Metrica hisoblagich raqami Sozlamalardan olinadi.",
    validate: (v) => (/^[A-Za-z0-9_\-.]{20,200}$/.test(v) ? null : "Token formati noto'g'ri"),
  },
  {
    key: 'google_service_account',
    label: 'Google service account (JSON kalit)',
    env: 'GOOGLE_SERVICE_ACCOUNT_JSON',
    secret: true,
    multiline: true,
    placeholder: '{"type":"service_account","client_email":"…@….iam.gserviceaccount.com","private_key":"-----BEGIN PRIVATE KEY-----…"}',
    help: "console.cloud.google.com → IAM → Service accounts → Keys → JSON. Search Console API va Google Analytics Data API'ni yoqing; client_email'ni Search Console (Full) va GA4 (Viewer) ga foydalanuvchi qilib qo'shing.",
    validate: (v) => (parseServiceAccount(v) ? null : 'JSON kalit noto\'g\'ri (client_email va private_key kerak)'),
  },
  {
    key: 'gsc_property',
    label: 'Search Console mulki',
    env: 'GSC_PROPERTY',
    secret: false,
    placeholder: 'sc-domain:spsplast.com',
    help: "Domen mulki: sc-domain:spsplast.com; URL-prefiks mulki: https://spsplast.com/ (oxiridagi / bilan).",
    validate: (v) => (/^(sc-domain:[a-z0-9.-]+\.[a-z]{2,}|https:\/\/[a-z0-9.-]+\.[a-z]{2,}\/)$/i.test(v) ? null : 'sc-domain:domen yoki https://domen/ ko\'rinishida'),
  },
  {
    key: 'ga4_property_id',
    label: 'GA4 property ID (raqam)',
    env: 'GA4_PROPERTY_ID',
    secret: false,
    placeholder: '412345678',
    help: "analytics.google.com → Admin → Property settings → Property ID (G-… emas, faqat raqam).",
    validate: (v) => (/^\d{6,12}$/.test(v) ? null : 'Faqat raqam (6–12 xona)'),
  },
];

export async function getSecretRows(db: Db): Promise<Record<string, string>> {
  try {
    const rows = await db.select({ key: integrationSecrets.key, value: integrationSecrets.value }).from(integrationSecrets);
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

/** Yakuniy qiymat: env → baza → ''. */
export async function getSecret(db: Db, key: string): Promise<string> {
  const f = SECRET_FIELDS.find((x) => x.key === key);
  if (!f) return '';
  const env = process.env[f.env]?.trim();
  if (env) return env;
  const rows = await getSecretRows(db);
  return rows[key]?.trim() ?? '';
}

export async function getReportConfig(db: Db) {
  const rows = await getSecretRows(db);
  const val = (key: string) => {
    const f = SECRET_FIELDS.find((x) => x.key === key)!;
    return process.env[f.env]?.trim() || rows[key]?.trim() || '';
  };
  const sa = val('google_service_account');
  return {
    yandexToken: val('yandex_oauth_token'),
    serviceAccount: sa ? parseServiceAccount(sa) : null,
    gscProperty: val('gsc_property'),
    ga4PropertyId: val('ga4_property_id'),
  };
}

/** Admin'da ko'rsatish: qiymatning o'zi emas, holati. */
export async function secretStatus(db: Db): Promise<Record<string, { set: boolean; source: 'env' | 'db' | null; hint: string }>> {
  const rows = await getSecretRows(db);
  const out: Record<string, { set: boolean; source: 'env' | 'db' | null; hint: string }> = {};
  for (const f of SECRET_FIELDS) {
    const env = process.env[f.env]?.trim();
    const v = env || rows[f.key]?.trim() || '';
    let hint = '';
    if (v) {
      if (f.key === 'google_service_account') hint = parseServiceAccount(v)?.client_email ?? "noto'g'ri JSON";
      else if (f.secret) hint = `…${v.slice(-4)}`;
      else hint = v;
    }
    out[f.key] = { set: !!v, source: env ? 'env' : v ? 'db' : null, hint };
  }
  return out;
}

/**
 * Saqlash: bo'sh maydon — o'zgarmaydi (maxfiy qiymat formada ko'rsatilmaydi);
 * `clear` ro'yxatidagi kalitlar o'chiriladi.
 */
export async function saveSecrets(
  db: Db,
  userId: number,
  input: Record<string, string>,
  clear: string[] = [],
): Promise<{ ok: true } | { ok: false; errors: Record<string, string> }> {
  const errors: Record<string, string> = {};
  const writes: { key: string; value: string }[] = [];
  for (const f of SECRET_FIELDS) {
    const v = (input[f.key] ?? '').trim();
    if (!v) continue;
    const e = f.validate(v);
    if (e) errors[f.key] = e;
    else writes.push({ key: f.key, value: v });
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  const now = new Date();
  for (const w of writes) {
    await db
      .insert(integrationSecrets)
      .values({ ...w, updatedBy: userId, updatedAt: now })
      .onConflictDoUpdate({ target: integrationSecrets.key, set: { value: w.value, updatedBy: userId, updatedAt: now } });
  }
  for (const key of clear) {
    if (SECRET_FIELDS.some((f) => f.key === key)) await db.delete(integrationSecrets).where(eq(integrationSecrets.key, key));
  }
  return { ok: true };
}
