import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateEnvironment } from '@/lib/env';

// Health responses must reflect the current runtime, never a cached build-time
// snapshot. This is especially important when debugging database availability.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getSafeDatabaseErrorCode(error: unknown): string | null {
    if (!error || typeof error !== 'object') return null;

    const candidate = error as { code?: unknown; name?: unknown };
    const value = typeof candidate.code === 'string'
        ? candidate.code
        : typeof candidate.name === 'string'
            ? candidate.name
            : null;

    // Expose only a short identifier (e.g. P1001 / ECONNREFUSED), never the raw
    // driver message, which could contain host or connection details.
    return value && /^[A-Za-z0-9_-]{1,40}$/.test(value) ? value : null;
}

function getSafeConfigurationIssues(errors: string[]): string[] {
    return Array.from(new Set(errors.map((error) => {
        const identifiers = error.match(/\b[A-Z][A-Z0-9_]{2,}\b/g) || [];
        return identifiers.find((identifier) => identifier.includes('_')) || 'PRODUCTION_CONFIGURATION';
    })));
}

export async function GET() {
    const timestamp = new Date().toISOString();
    let dbStatus = 'disconnected';
    let dbErrorCode: string | null = null;
    let isHealthy = true;

    try {
        await db.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
    } catch (error) {
        dbStatus = 'error';
        dbErrorCode = getSafeDatabaseErrorCode(error);
        isHealthy = false;
        console.error('Health check: database query failed', { code: dbErrorCode });
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
        databaseErrorCode: dbErrorCode,
        storageProvider: process.env.STORAGE_PROVIDER || (process.env.S3_ENDPOINT ? 's3' : 'local'),
        envStatus: envValidation.valid ? 'valid' : 'invalid',
        // Identifiers only; never expose environment variable values or raw
        // database errors from this public endpoint.
        configurationIssues: getSafeConfigurationIssues(envValidation.errors),
        envWarningsCount: envValidation.warnings.length,
    };

    return NextResponse.json(responsePayload, {
        status: isHealthy ? 200 : 503,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
}
