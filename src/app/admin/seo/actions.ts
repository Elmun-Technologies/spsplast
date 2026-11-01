'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/server/session';
import { CONTENT_LANGS } from '@/server/db/schema';
import { addRedirect, deleteRedirect, deleteSeoPage, saveSeoPage, type SeoInput } from '@/server/seoAdmin';
import { getSettings, saveIntegrations } from '@/server/settings';
import { getReportConfig } from '@/server/secrets';
import { gscSubmitSitemap } from '@/server/reports/google';
import { webmasterAddSitemap } from '@/server/reports/yandex';
import { submitIndexNow } from '@/server/reports/indexnow';
import { integrationValue } from '@/lib/integrations';
import { indexablePaths } from '@/lib/sitePaths';
import { noindexPaths } from '@/lib/seoOverrides';
import { SITE_URL } from '@/lib/seo';
import type { FormState } from '../actions';

/** Admin → SEO. Har bir action — faqat administrator (`requireUser('admin')`). */

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '');

export async function saveSeoPageAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { user, db } = await requireUser('admin');
  const path = str(fd, 'path');
  const input = Object.fromEntries(
    CONTENT_LANGS.map((l) => [l, { title: str(fd, `${l}.title`), description: str(fd, `${l}.description`), h1: str(fd, `${l}.h1`), intro: str(fd, `${l}.intro`) }]),
  ) as SeoInput;
  const values = Object.fromEntries([...fd.entries()].filter(([k]) => !k.startsWith('$')).map(([k, v]) => [k, String(v)]));
  const r = await saveSeoPage(db, user.id, path, input, fd.get('noindex') === 'on');
  if (!r.ok) {
    return { error: Object.entries(r.errors).map(([k, e]) => `${k}: ${e}`).join(' · '), values };
  }
  revalidatePath('/admin/seo');
  return { ok: 'Saqlandi. Saytga chiqishi uchun "Nashr qilish"ni bosing.', values };
}

export async function resetSeoPageAction(fd: FormData): Promise<void> {
  const { user, db } = await requireUser('admin');
  await deleteSeoPage(db, user.id, str(fd, 'path'));
  revalidatePath('/admin/seo');
}

export async function addRedirectAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { user, db } = await requireUser('admin');
  const values = { source: str(fd, 'source'), destination: str(fd, 'destination'), note: str(fd, 'note') };
  const r = await addRedirect(db, user.id, values.source, values.destination, values.note);
  if (!r.ok) return { error: r.error, values };
  revalidatePath('/admin/seo');
  return { ok: `${r.source} → ${r.destination} qo'shildi (nashrdan keyin ishlaydi).` };
}

export async function deleteRedirectAction(fd: FormData): Promise<void> {
  const { user, db } = await requireUser('admin');
  const id = Number(fd.get('redirectId'));
  if (Number.isInteger(id) && id > 0) await deleteRedirect(db, user.id, id);
  revalidatePath('/admin/seo');
}

/** IndexNow kalitini yaratadi (mavjud sozlamalarga tegmasdan). */
export async function generateIndexNowKeyAction(): Promise<FormState> {
  const { user, db } = await requireUser('admin');
  const saved = await getSettings(db);
  const bad = await saveIntegrations(db, user.id, { ...saved, indexnow_key: randomBytes(16).toString('hex') });
  if (bad.length) return { error: `Sozlamalarda xato maydonlar bor: ${bad.join(', ')} — avval Sozlamalarni tuzating.` };
  revalidatePath('/admin/seo');
  return { ok: 'Kalit yaratildi. "Nashr qilish"dan keyin /indexnow-key.txt ishlaydi, so\'ng yuborish mumkin.' };
}

function liveUrls(): string[] {
  const hidden = noindexPaths();
  return indexablePaths()
    .filter((p) => !hidden.has(p.path))
    .flatMap((p) => ['uz', 'ru', 'en'].map((l) => `${SITE_URL}/${l}${p.path}`));
}

export async function submitIndexNowAction(): Promise<FormState> {
  await requireUser('admin');
  const key = integrationValue('indexnow_key');
  if (!key) return { error: "IndexNow kaliti saytda yo'q: kalit yarating va nashr qiling." };
  const urls = liveUrls();
  const res = await submitIndexNow(SITE_URL, key, urls);
  const lines = res.map((r) => `${new URL(r.endpoint).host}: ${r.ok ? `qabul qilindi (${r.status})` : `xato ${r.status || ''} ${'error' in r && r.error ? r.error : ''}`}`);
  return res.some((r) => r.ok) ? { ok: `${urls.length} ta URL yuborildi — ${lines.join(' · ')}` } : { error: lines.join(' · ') };
}

export async function submitSitemapAction(): Promise<FormState> {
  const { db } = await requireUser('admin');
  const cfg = await getReportConfig(db);
  const sitemap = `${SITE_URL}/sitemap.xml`;
  const out: string[] = [];
  const errors: string[] = [];
  if (cfg.serviceAccount && cfg.gscProperty) {
    try {
      await gscSubmitSitemap(cfg.serviceAccount, cfg.gscProperty, sitemap);
      out.push('Google Search Console: yuborildi');
    } catch (e) {
      errors.push(`Google: ${e instanceof Error ? e.message : e}`);
    }
  } else errors.push('Google: ulanmagan (Analitika → Ulanishlar)');
  if (cfg.yandexToken) {
    try {
      await webmasterAddSitemap(cfg.yandexToken, SITE_URL, sitemap);
      out.push('Yandex Webmaster: yuborildi');
    } catch (e) {
      errors.push(`Yandex: ${e instanceof Error ? e.message : e}`);
    }
  } else errors.push('Yandex: ulanmagan (Analitika → Ulanishlar)');
  return out.length ? { ok: [...out, ...errors].join(' · ') } : { error: errors.join(' · ') };
}
