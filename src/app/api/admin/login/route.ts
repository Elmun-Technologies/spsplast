import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createAdminSession, createAuditLog } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email va parol kiritilishi shart' }, { status: 400 });
    }

    const admin = await db.adminUser.findUnique({
      where: { email },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Email yoki parol noto‘g‘ri' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Email yoki parol noto‘g‘ri' }, { status: 401 });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    await createAdminSession(admin.id, ipAddress, userAgent);
    await createAuditLog(admin.id, 'LOGIN', 'AdminUser', admin.id, { email: admin.email });

    return NextResponse.json({
      success: true,
      user: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (error) {
    console.error('Admin Login Error:', error);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
