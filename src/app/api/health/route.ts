import { NextResponse } from 'next/server';
import { validateEnvironment } from '@/lib/env';
import { isTelegramConfigured } from '@/lib/telegram';

/**
 * Sog'liq tekshiruvi (health-check).
 *
 * Ilgari bu marshrut bazaga `SELECT 1` yuborardi. Backendsiz arxitekturada
 * tekshiradigan narsa — konfiguratsiya: zayafkalar Telegram'ga yetib borishi
 * uchun token va chat ID o'rnatilganmi. Bu javob keshga olinmaydi.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const env = validateEnvironment();
  const telegram = isTelegramConfigured();

  return NextResponse.json(
    {
      status: env.valid ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        telegram: telegram ? 'configured' : 'missing',
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'default',
      },
      errors: env.errors,
      warnings: env.warnings,
    },
    { status: env.valid ? 200 : 503 }
  );
}
