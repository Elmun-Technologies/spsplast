'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/server/session';
import { saveContent } from '@/server/content';
import { CONTENT_LANGS, type ContentLang } from '@/server/db/schema';
import type { FormState } from '../actions';

/** Matnlar (CMS) — faqat administrator. Maydon nomi: `v|<kalit>|<til>`. */
export async function saveContentAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { user, db } = await requireUser('admin');
  const values: Record<string, Partial<Record<ContentLang, string>>> = {};
  for (const [name, raw] of fd.entries()) {
    const [p, key, lang] = name.split('|');
    if (p !== 'v' || !key || !(CONTENT_LANGS as readonly string[]).includes(lang)) continue;
    (values[key] ??= {})[lang as ContentLang] = String(raw);
  }
  const r = await saveContent(db, user.id, values);
  if (!r.ok) return { error: Object.entries(r.errors).map(([k, e]) => `${k}: ${e}`).join(' · ') };
  revalidatePath('/admin/content');
  return { ok: r.changed ? `${r.changed} ta matn o'zgardi. Saytga chiqishi uchun "Nashr qilish".` : "O'zgarish yo'q." };
}
