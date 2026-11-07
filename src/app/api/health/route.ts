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
 *
 * Batafsil javob (qaysi integratsiya ulangan, baza xatosi matni, sayt manzili) ilgari
 * HAMMAGA ochiq edi — bu raqibga yoki hujumchiga konfiguratsiyani oshkor qiladi (audit
 * 2026-11-02, xavfsizlik). Endi: `HEALTH_CHECK_TOKEN` env sozlanmagan bo'lsa — avvalgidek
 * (uptime monitorlar va admin'ning o'zi hech narsa sozlamasdan ishlataveradi). Sozlangan
 * bo'lsa — faqat `Authorization: Bearer <token>` yoki `?token=` mos kelsa batafsil javob,
 * aks holda faqat `{ status, timestamp }` (uptime monitor uchun shuning o'zi yetarli: HTTP
 * kodi 200/503 va `status` maydoni).
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

function isAuthorized(req: Request): boolean {
  const required = process.env.HEALTH_CHECK_TOKEN;
  if (!required) return true;
  const header = req.headers.get('authorization');
  const bearer = header?.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : null;
  const query = new URL(req.url).searchParams.get('token');
  return bearer === required || query === required;
}

export async function GET(req: Request) {
  const env = validateEnvironment();
  const database = await databaseCheck();
  if (database === 'error') env.errors.push('Baza ulanishi xato (DATABASE_URL tekshiring).');
  env.valid = env.errors.length === 0;
  const status = env.valid ? 'ok' : 'degraded';
  const httpStatus = env.valid ? 200 : 503;
  const timestamp = new Date().toISOString();

  if (!isAuthorized(req)) {
    return NextResponse.json({ status, timestamp }, { status: httpStatus });
  }

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
      status,
      timestamp,
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
    { status: httpStatus }
  );
}
