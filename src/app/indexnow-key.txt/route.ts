import { integrationValue } from '@/lib/integrations';

/**
 * IndexNow kalit fayli (`keyLocation`): qidiruv tizimi so'rov yuborilgan kalit
 * shu domenga tegishli ekanini tekshiradi. Kalit admin → Sozlamalar (`indexnow_key`),
 * build paytida statik fayl bo'lib chiqadi. Kalit sozlanmagan bo'lsa — 404.
 */
export const dynamic = 'force-static';

export function GET() {
  const key = integrationValue('indexnow_key');
  if (!key) return new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  return new Response(key, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
