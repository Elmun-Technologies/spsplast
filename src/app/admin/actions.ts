'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  MIN_PASSWORD_LENGTH,
  authenticate,
  createAdminUser,
  createSession,
  deleteSession,
  isUniqueViolation,
  setUserActive,
  setUserPassword,
} from '@/server/auth';
import { getDb } from '@/server/db/client';
import { ADMIN_ROLES, LEAD_STATUSES, type AdminRole, type LeadStatus } from '@/server/db/schema';
import { addLeadNote, assignLead, recentHits, recordHit, setLeadStatus } from '@/server/leads';
import { clearSessionCookie, requireUser, setSessionCookie } from '@/server/session';
import { saveIntegrations, triggerPublish } from '@/server/settings';
import { INTEGRATION_FIELDS } from '@/lib/integrations';

/**
 * Admin server action'lari. Next server action'larni Origin tekshiruvi bilan
 * himoyalaydi (CSRF); har bir action yana sessiyani o'zi tekshiradi.
 */

/**
 * React 19 forma action'dan keyin maydonlarni tozalaydi — xato bo'lsa kiritilgan
 * qiymatlar `values` orqali qaytariladi (`defaultValue`), qayta yozish shart emas.
 */
export type FormState = { error?: string; ok?: string; values?: Record<string, string> } | undefined;

// Yashirin maydon nomi `id` bo'lmasin: `form.id` DOM'da shu input'ga aylanadi
// (named property) va React submit tugmasining name/value'sini yo'qotadi.
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const int = (fd: FormData, k: string) => {
  const n = Number(fd.get(k));
  return Number.isInteger(n) && n > 0 ? n : null;
};

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const db = getDb();
  const values = { email: str(fd, 'email') };
  if (!db) return { error: 'Baza ulanmagan (DATABASE_URL).', values };
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  // Faqat xato urinishlar sanaladi: ofisdagi bir IP ortidagi menejerlar bir-birini bloklamaydi.
  const key = `login_${ip}`;
  if ((await recentHits(db, key, 15 * 60 * 1000)) >= 10) {
    return { error: "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring.", values };
  }
  const user = await authenticate(db, str(fd, 'email'), String(fd.get('password') ?? ''));
  if (!user) {
    await recordHit(db, key);
    return { error: "E-pochta yoki parol noto'g'ri.", values };
  }
  const { token, expiresAt } = await createSession(db, user.id);
  await setSessionCookie(token, expiresAt);
  const next = str(fd, 'next');
  redirect(next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin');
}

export async function logoutAction(): Promise<void> {
  const token = await clearSessionCookie();
  const db = getDb();
  if (db) await deleteSession(db, token);
  redirect('/admin/login');
}

export async function setStatusAction(fd: FormData): Promise<void> {
  const { user, db } = await requireUser();
  const id = int(fd, 'leadId');
  const status = str(fd, 'status') as LeadStatus;
  if (!id || !LEAD_STATUSES.includes(status)) return;
  await setLeadStatus(db, id, user.id, status, str(fd, 'lostReason'));
  revalidatePath(`/admin/leads/${id}`);
}

export async function assignAction(fd: FormData): Promise<void> {
  const { user, db } = await requireUser();
  const id = int(fd, 'leadId');
  if (!id) return;
  await assignLead(db, id, user.id, int(fd, 'assigneeId'));
  revalidatePath(`/admin/leads/${id}`);
}

export async function noteAction(fd: FormData): Promise<void> {
  const { user, db } = await requireUser();
  const id = int(fd, 'leadId');
  if (!id) return;
  await addLeadNote(db, id, user.id, str(fd, 'body'));
  revalidatePath(`/admin/leads/${id}`);
}

export async function createUserAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { db } = await requireUser('admin');
  const email = str(fd, 'email');
  const name = str(fd, 'name');
  const role = str(fd, 'role') as AdminRole;
  const password = String(fd.get('password') ?? '');
  const values = { email, name, role };
  const fail = (error: string): FormState => ({ error, values });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("E-pochta noto'g'ri.");
  if (name.length < 2) return fail('Ism kiritilmagan.');
  if (!ADMIN_ROLES.includes(role)) return fail("Rol noto'g'ri.");
  if (password.length < MIN_PASSWORD_LENGTH) return fail(`Parol kamida ${MIN_PASSWORD_LENGTH} belgi bo'lishi kerak.`);
  try {
    await createAdminUser(db, { email, name, role, password });
  } catch (error) {
    if (isUniqueViolation(error)) return fail('Bu e-pochta allaqachon bor.');
    console.error('[admin] xodim saqlanmadi', error);
    return fail('Saqlanmadi.');
  }
  revalidatePath('/admin/users');
  return { ok: `${name} qo'shildi.` };
}

export async function toggleUserAction(fd: FormData): Promise<void> {
  const { user, db } = await requireUser('admin');
  const id = int(fd, 'userId');
  // O'zini o'zi o'chirib, admin'siz qolmaslik uchun.
  if (!id || id === user.id) return;
  await setUserActive(db, id, str(fd, 'active') === '1');
  revalidatePath('/admin/users');
}

export async function resetPasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { user, db } = await requireUser();
  const id = int(fd, 'userId') ?? user.id;
  // Menejer faqat o'z parolini almashtiradi.
  if (id !== user.id && user.role !== 'admin') return { error: "Ruxsat yo'q." };
  const password = String(fd.get('password') ?? '');
  if (password.length < MIN_PASSWORD_LENGTH) return { error: `Parol kamida ${MIN_PASSWORD_LENGTH} belgi bo'lishi kerak.` };
  await setUserPassword(db, id, password);
  if (id === user.id) redirect('/admin/login');
  return { ok: 'Parol yangilandi.' };
}

export async function saveIntegrationsAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { user, db } = await requireUser('admin');
  const input = Object.fromEntries(INTEGRATION_FIELDS.map((f) => [f.key, str(fd, f.key)]));
  const bad = await saveIntegrations(db, user.id, input);
  if (bad.length) {
    const labels = INTEGRATION_FIELDS.filter((f) => bad.includes(f.key)).map((f) => f.label);
    return { error: `Format noto'g'ri: ${labels.join(', ')}.`, values: input };
  }
  revalidatePath('/admin/settings');
  return { ok: "Saqlandi. Saytga chiqishi uchun \"Nashr qilish\" tugmasini bosing.", values: input };
}

export async function publishAction(_prev: FormState, _fd: FormData): Promise<FormState> {
  const { user, db } = await requireUser();
  const res = await triggerPublish(db, user.id);
  revalidatePath('/admin', 'layout');
  return res.ok ? { ok: res.message } : { error: res.message };
}
