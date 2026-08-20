import { NextRequest, NextResponse } from 'next/server';
import { processPendingIntegrationJobs } from '@/lib/integrations/queue';

export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const secretParam = request.nextUrl.searchParams.get('secret');

    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
        const token = authHeader?.replace(/^Bearer\s+/i, '') || secretParam;
        if (token !== cronSecret) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    } else if (process.env.NODE_ENV === 'production') {
        // In production, CRON_SECRET is mandatory for security
        return NextResponse.json({ error: 'Cron secret is not configured' }, { status: 500 });
    }

    try {
        const processedCount = await processPendingIntegrationJobs();
        return NextResponse.json({
            success: true,
            processed: processedCount,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown cron error';
        return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    return GET(request);
}
