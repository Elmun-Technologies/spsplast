import { NextResponse } from 'next/server';
import { validateEnvironment } from '@/lib/env';
import { isTelegramConfigured } from '@/lib/telegram';
import { getModels, getSectionCounts } from '@/lib/catalog2027';
import { getDb } from '@/server/db/client';
import { sql } from 'drizzle-orm';

/**
 * Sog'liq tekshiruvi (health-check).
 *
 * Konfiguratsiya (Telegram token/chat, analitika) va baza ulanishi
 * (`SELECT 1`, zayafkalar shu yerda saqlanadi). Bu javob keshga olinmaydi.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function databaseCheck(): Promise<'connected' | 'missing' | 'error'> {
  const db = getDb();
  if (!db) return 'missing';
  try {
    await db.execute(sql`select 1`);
    return 'connected';
  } catch (error) {
    console.error('[health] baza javob bermadi', error);
    return 'error';
  }
}

export async function GET() {
  const env = validateEnvironment();
  const database = await databaseCheck();
  if (database === 'error') env.errors.push('Baza ulanishi xato (DATABASE_URL tekshiring).');
  env.valid = env.errors.length === 0;
  const telegram = isTelegramConfigured();
  const models = getModels();
  const counts = getSectionCounts();
  const withImages = models.filter((m) => m.images.scene || m.images.sceneSm || Object.keys(m.images.molds).length).length;
  const analytics = {
    gtm: process.env.NEXT_PUBLIC_GTM_ID ? 'configured' : 'missing',
    ga4: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? 'configured' : 'missing',
    metrica: process.env.NEXT_PUBLIC_YANDEX_METRICA_ID ? 'configured' : 'missing',
    pixel: process.env.NEXT_PUBLIC_META_PIXEL_ID ? 'configured' : 'missing',
  };

  return NextResponse.json(
    {
      status: env.valid ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        telegram: telegram ? 'configured' : 'missing',
        database,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'default',
        analytics,
        catalog: {
          models: models.length,
          withImages,
          sections: counts,
        },
      },
      errors: env.errors,
      warnings: env.warnings,
    },
    { status: env.valid ? 200 : 503 }
  );
}
