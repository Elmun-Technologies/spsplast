'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/server/session';
import { SECRET_FIELDS, saveSecrets } from '@/server/secrets';
import { clearReportCache } from '@/server/reports/http';
import type { FormState } from '../actions';

/** Hisobot ulanishlari (API kalitlari) — faqat administrator. */
export async function saveReportSecretsAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { user, db } = await requireUser('admin');
  const input = Object.fromEntries(SECRET_FIELDS.map((f) => [f.key, String(fd.get(f.key) ?? '')]));
  const clear = SECRET_FIELDS.filter((f) => fd.get(`clear_${f.key}`) === 'on').map((f) => f.key);
  const r = await saveSecrets(db, user.id, input, clear);
  if (!r.ok) {
    const label = (k: string) => SECRET_FIELDS.find((f) => f.key === k)?.label ?? k;
    return { error: Object.entries(r.errors).map(([k, e]) => `${label(k)}: ${e}`).join(' · ') };
  }
  clearReportCache();
  revalidatePath('/admin/analytics');
  return { ok: 'Saqlandi. Hisobotlar darhol yangilanadi (nashr shart emas).' };
}

export async function refreshReportsAction(): Promise<void> {
  await requireUser();
  clearReportCache();
  revalidatePath('/admin/analytics');
}
