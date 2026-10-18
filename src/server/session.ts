import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb, type Db } from './db/client.ts';
import { SESSION_COOKIE, getSessionUser, type SessionUser } from './auth.ts';
import type { AdminRole } from './db/schema.ts';

/**
 * Next.js tomonidagi sessiya yelimi: cookie o'qish/yozish va himoya.
 * Har bir admin sahifasi, server action va route `requireUser()` chaqiradi
 * (tests/admin2027.test.js 12-test nazorat qiladi).
 */

export class NoDatabaseError extends Error {
  constructor() {
    super('DATABASE_URL sozlanmagan');
  }
}

export function requireDb(): Db {
  const db = getDb();
  if (!db) throw new NoDatabaseError();
  return db;
}

export async function currentUser(): Promise<SessionUser | null> {
  const db = getDb();
  if (!db) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return getSessionUser(db, token);
}

/** Kirmagan bo'lsa → /admin/login; rol yetmasa → /admin. */
export async function requireUser(role?: AdminRole): Promise<{ user: SessionUser; db: Db }> {
  const db = getDb();
  if (!db) redirect('/admin/login?e=db');
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = await getSessionUser(db, token);
  if (!user) redirect('/admin/login');
  if (role === 'admin' && user.role !== 'admin') redirect('/admin');
  return { user, db };
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<string | undefined> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  jar.delete({ name: SESSION_COOKIE, path: '/admin' });
  return token;
}
