import { NextRequest, NextResponse } from 'next/server';
import { AmoCrmClient } from '@/lib/amocrm/client';
import { getAdminSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
    const session = await getAdminSession();
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'Authorization code is missing' }, { status: 400 });
    }

    const client = new AmoCrmClient();
    const success = await client.exchangeCodeForToken(code);

    if (success) {
        return NextResponse.redirect(new URL('/admin/settings/integrations?amocrm=connected', req.url));
    } else {
        return NextResponse.redirect(new URL('/admin/settings/integrations?amocrm=error', req.url));
    }
}
