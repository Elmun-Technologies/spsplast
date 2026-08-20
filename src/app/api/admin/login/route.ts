import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createAdminSession, createAuditLog } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const rateLimitKey = `admin_login_${ipAddress}`;
    
    // Max 5 login attempts per IP per 15 minutes
    const rateLimit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      const waitSeconds = Math.ceil(rateLimit.resetTimeMs / 1000);
      return NextResponse.json(
        { error: `Juda ko‘p noto‘g‘ri urunishlar. Iltimos ${waitSeconds} sekutdan so‘ng qayta urinib ko‘ring.` },
        { status: 429 }
      );
    }

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
