import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateEnvironment } from '@/lib/env';

export async function GET() {
    const timestamp = new Date().toISOString();
    let dbStatus = 'disconnected';
    let isHealthy = true;

    try {
        await db.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (_err) {
        dbStatus = 'error';
        isHealthy = false;
    }

    const envValidation = validateEnvironment();
    if (!envValidation.valid) {
        isHealthy = false;
    }

    const responsePayload = {
        status: isHealthy ? 'ok' : 'degraded',
        timestamp,
        environment: process.env.NODE_ENV || 'development',
        database: dbStatus,
        storageProvider: process.env.STORAGE_PROVIDER || (process.env.S3_ENDPOINT ? 's3' : 'local'),
        envStatus: envValidation.valid ? 'valid' : 'invalid',
        envWarningsCount: envValidation.warnings.length,
    };

    return NextResponse.json(responsePayload, {
        status: isHealthy ? 200 : 503,
    });
}
