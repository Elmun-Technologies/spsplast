import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await db.adminUser.findUnique({
      where: { email },
    });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Email yoki parol xato' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, user: { email: user.email, name: user.name } });

    // Set secure HttpOnly session cookie
    response.cookies.set('sps_admin_session', 'authenticated_token_2026', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Login error' }, { status: 500 });
  }
}
