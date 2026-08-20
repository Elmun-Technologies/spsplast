import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '@/lib/db';

const COOKIE_NAME = 'sps_admin_session';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAdminSession(adminId: string, ipAddress?: string, userAgent?: string) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.adminSession.create({
    data: {
      adminId,
      tokenHash,
      expiresAt,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
  });

  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return rawToken;
}

export async function getAdminSession() {
  const cookieStore = cookies();
  const rawToken = cookieStore.get(COOKIE_NAME)?.value;

  if (!rawToken) return null;

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const session = await db.adminSession.findUnique({
    where: { tokenHash },
    include: { admin: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await db.adminSession.delete({ where: { id: session.id } });
    }
    return null;
  }

  return session;
}

export async function destroyAdminSession() {
  const cookieStore = cookies();
  const rawToken = cookieStore.get(COOKIE_NAME)?.value;

  if (rawToken) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await db.adminSession.deleteMany({ where: { tokenHash } });
    cookieStore.delete(COOKIE_NAME);
  }
}

export async function createAuditLog(
  adminId: string | null,
  action: string,
  entityType: string,
  entityId?: string,
  metadata?: Record<string, any>
) {
  try {
    await db.auditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId: entityId || null,
        metadataJson: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
}
