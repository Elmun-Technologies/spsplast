import { and, eq, inArray } from 'drizzle-orm';
import type { Db } from './db/client.ts';
import { CONTENT_LANGS, type ContentLang, contentOverrides } from './db/schema.ts';
import { cleanCopy, copyError } from './copyRules.ts';
import { touchRevision } from './seoAdmin.ts';
import { flattenStrings } from '../lib/textOverrides.ts';
import { pagesUz } from '../dictionaries/pages/uz.ts';
import { pagesRu } from '../dictionaries/pages/ru.ts';
import { pagesEn } from '../dictionaries/pages/en.ts';
import { pagesServerUz } from '../dictionaries/pagesServer/uz.ts';
import { pagesServerRu } from '../dictionaries/pagesServer/ru.ts';
import { pagesServerEn } from '../dictionaries/pagesServer/en.ts';
import { uz as uiUz } from '../dictionaries/ui/uz.ts';
import { ru as uiRu } from '../dictionaries/ui/ru.ts';
import { en as uiEn } from '../dictionaries/ui/en.ts';

/**
 * Admin → "Matnlar" (CMS). Kalitlar lug'atlardan avtomatik yig'iladi — yangi matn
 * kodga qo'shilsa, admin'da o'zi paydo bo'ladi. Shablonlar (`h1: (n) => …`) `{1}`, `{2}`
 * bilan tahrirlanadi; ro'yxat qaytaradigan funksiyalar (FAQ shablonlari) — kod.
 */

export type ContentEntry = { key: string; group: string; template: boolean; values: Record<ContentLang, string> };

/** Guruh = birinchi ikki bo'lak: `pages.home`, `ui.header`. */
export const groupOf = (key: string) => key.split('.').slice(0, 2).join('.');

let entriesCache: ContentEntry[] | null = null;

export function contentEntries(): ContentEntry[] {
  if (entriesCache) return entriesCache;
  const dicts: Record<ContentLang, { pages: unknown; ui: unknown }> = {
    // `pages.seo.*` va `pages.privacy.*` — alohida server lug'atida (mijoz bundle'iga tushmaydi), kalitlar o'sha.
    uz: { pages: { ...pagesUz, ...pagesServerUz }, ui: uiUz },
    ru: { pages: { ...pagesRu, ...pagesServerRu }, ui: uiRu },
    en: { pages: { ...pagesEn, ...pagesServerEn }, ui: uiEn },
  };
  const byKey = new Map<string, ContentEntry>();
  for (const lang of CONTENT_LANGS) {
    for (const ns of ['pages', 'ui'] as const) {
      for (const [key, value, template] of flattenStrings(dicts[lang][ns], ns)) {
        const e = byKey.get(key) ?? { key, group: groupOf(key), template, values: { uz: '', ru: '', en: '' } };
        e.values[lang] = value;
        byKey.set(key, e);
      }
    }
  }
  entriesCache = [...byKey.values()];
  return entriesCache;
}

export function contentGroups(): { group: string; count: number }[] {
  const m = new Map<string, number>();
  for (const e of contentEntries()) m.set(e.group, (m.get(e.group) ?? 0) + 1);
  return [...m].map(([group, count]) => ({ group, count }));
}

export async function listOverrides(db: Db, keys?: string[]) {
  const q = db.select().from(contentOverrides);
  return keys?.length ? q.where(inArray(contentOverrides.key, keys)) : q;
}

/** Maksimal uzunlik: standart matndan 3 baravar (kamida 160, ko'pi 4000). */
const maxFor = (def: string) => Math.min(4000, Math.max(160, def.length * 3));

/**
 * Bir guruh matnlarini saqlaydi: `values['pages.home.h1']['ru'] = '…'`. Bo'sh yoki
 * standart bilan bir xil — almashtirish o'chadi. Xatolar `kalit:til → matn`.
 */
export async function saveContent(
  db: Db,
  userId: number,
  values: Record<string, Partial<Record<ContentLang, string>>>,
): Promise<{ ok: true; changed: number } | { ok: false; errors: Record<string, string> }> {
  const entries = new Map(contentEntries().map((e) => [e.key, e]));
  const errors: Record<string, string> = {};
  const upserts: { key: string; lang: ContentLang; value: string }[] = [];
  const deletes: { key: string; lang: ContentLang }[] = [];
  for (const [key, perLang] of Object.entries(values)) {
    const entry = entries.get(key);
    if (!entry) {
      errors[key] = "Noma'lum kalit";
      continue;
    }
    for (const lang of CONTENT_LANGS) {
      const raw = perLang[lang];
      if (raw === undefined) continue;
      const v = cleanCopy(raw, entry.values[lang].includes('\n') || raw.includes('\n'));
      if (!v || v === entry.values[lang]) {
        deletes.push({ key, lang });
        continue;
      }
      // Shablonda {1}…{9} — argument o'rni; oddiy matnda ular ma'nosiz.
      const e = copyError(entry.template ? v.replace(/\{[1-9]\}/g, '') : v, lang, maxFor(entry.values[lang]));
      if (e) errors[`${key}:${lang}`] = e;
      else if (!entry.template && /\{[1-9]\}/.test(v)) errors[`${key}:${lang}`] = "{1}, {2} faqat shablon matnlarda ishlaydi";
      else upserts.push({ key, lang, value: v });
    }
  }
  if (Object.keys(errors).length) return { ok: false, errors };

  const current = await listOverrides(db, [...new Set([...upserts, ...deletes].map((x) => x.key))]);
  const cur = new Map(current.map((r) => [`${r.key}:${r.lang}`, r.value]));
  let changed = 0;
  const now = new Date();
  for (const u of upserts) {
    if (cur.get(`${u.key}:${u.lang}`) === u.value) continue;
    changed++;
    await db
      .insert(contentOverrides)
      .values({ ...u, updatedBy: userId, updatedAt: now })
      .onConflictDoUpdate({ target: [contentOverrides.key, contentOverrides.lang], set: { value: u.value, updatedBy: userId, updatedAt: now } });
  }
  let removed = 0;
  for (const d of deletes) {
    if (!cur.has(`${d.key}:${d.lang}`)) continue;
    removed++;
    await db.delete(contentOverrides).where(and(eq(contentOverrides.key, d.key), eq(contentOverrides.lang, d.lang)));
  }
  if (removed) await touchRevision(db, userId, 'content');
  return { ok: true, changed: changed + removed };
}
