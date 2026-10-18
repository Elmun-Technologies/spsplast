import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { and, eq, gt, lt } from 'drizzle-orm';
import type { Db } from './db/client.ts';
import { adminSessions, adminUsers, type AdminRole } from './db/schema.ts';

/**
 * Admin avtorizatsiyasi: e-pochta + parol (scrypt), sessiya — tasodifiy token
 * cookie'da, bazada faqat uning sha256 xeshi. Tashqi auth xizmati kerak emas.
 */

export const SESSION_COOKIE = 'sps_admin';
export const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const MIN_PASSWORD_LENGTH = 10;

const SCRYPT_N = 16384;
const KEY_LEN = 64;

function scrypt(password: string, salt: Buffer, n: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, KEY_LEN, { N: n, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, key) =>
      err ? reject(err) : resolve(key),
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, SCRYPT_N);
  return `scrypt$${SCRYPT_N}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, nStr, saltB64, keyB64] = stored.split('$');
  if (algo !== 'scrypt' || !nStr || !saltB64 || !keyB64) return false;
  const expected = Buffer.from(keyB64, 'base64');
  const actual = await scrypt(password, Buffer.from(saltB64, 'base64'), Number(nStr));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type SessionUser = { id: number; email: string; name: string; role: AdminRole };

/** Login: to'g'ri bo'lsa foydalanuvchi, aks holda `null` (sabab oshkor qilinmaydi). */
export async function authenticate(db: Db, email: string, password: string): Promise<SessionUser | null> {
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, normalizeEmail(email))).limit(1);
  if (!user || !user.active) {
    // Vaqt bo'yicha farq bo'lmasligi uchun baribir xeshlaymiz.
    await hashPassword(password);
    return null;
  }
  if (!(await verifyPassword(password, user.passwordHash))) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function createSession(db: Db, userId: number, now = new Date()): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await db.insert(adminSessions).values({ tokenHash: hashToken(token), userId, expiresAt, createdAt: now });
  await db.update(adminUsers).set({ lastLoginAt: now }).where(eq(adminUsers.id, userId));
  // Eskirgan sessiyalarni yo'l-yo'lakay tozalaymiz.
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, now));
  return { token, expiresAt };
}

export async function getSessionUser(db: Db, token: string | undefined, now = new Date()): Promise<SessionUser | null> {
  if (!token) return null;
  const [row] = await db
    .select({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name, role: adminUsers.role })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.userId))
    .where(and(eq(adminSessions.tokenHash, hashToken(token)), gt(adminSessions.expiresAt, now), eq(adminUsers.active, true)))
    .limit(1);
  return row ?? null;
}

export async function deleteSession(db: Db, token: string | undefined): Promise<void> {
  if (!token) return;
  await db.delete(adminSessions).where(eq(adminSessions.tokenHash, hashToken(token)));
}

export async function createAdminUser(
  db: Db,
  input: { email: string; name: string; role: AdminRole; password: string },
): Promise<{ id: number }> {
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Parol kamida ${MIN_PASSWORD_LENGTH} belgi bo'lishi kerak`);
  }
  const [row] = await db
    .insert(adminUsers)
    .values({
      email: normalizeEmail(input.email),
      name: input.name.trim(),
      role: input.role,
      passwordHash: await hashPassword(input.password),
    })
    .returning({ id: adminUsers.id });
  return row;
}

/** Postgres 23505 (unique) — drizzle xatoni `cause` ichiga o'raydi. Xabar matnida so'rov parametrlari (parol xeshi) bor, uni foydalanuvchiga ko'rsatmaymiz. */
export function isUniqueViolation(error: unknown): boolean {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code === '23505' || e?.cause?.code === '23505';
}

export async function setUserPassword(db: Db, userId: number, password: string): Promise<void> {
  if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`Parol kamida ${MIN_PASSWORD_LENGTH} belgi bo'lishi kerak`);
  await db.update(adminUsers).set({ passwordHash: await hashPassword(password) }).where(eq(adminUsers.id, userId));
  // Parol almashsa, eski qurilmalardagi sessiyalar yopiladi.
  await db.delete(adminSessions).where(eq(adminSessions.userId, userId));
}

export async function setUserActive(db: Db, userId: number, active: boolean): Promise<void> {
  await db.update(adminUsers).set({ active }).where(eq(adminUsers.id, userId));
  if (!active) await db.delete(adminSessions).where(eq(adminSessions.userId, userId));
}
