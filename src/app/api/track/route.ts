import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimit';
import { SITE_URL } from '@/lib/seo';
import { getDb } from '@/server/db/client';
import { VISIT_EVENTS, isBot, pruneVisits, recordVisit } from '@/server/visits';

/**
 * Tashrif statistikasi uchun beacon (`navigator.sendBeacon`): sahifa ko'rish va
 * voqealar → `visits` jadvali → admin "Tashriflar" sahifasi.
 * Har doim 204 qaytaradi — mijozga hech qanday ma'lumot oshkor qilinmaydi.
 */
export const dynamic = 'force-dynamic';

const id = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/);
const schema = z.object({
  vid: id,
  sid: id,
  t: z.enum(VISIT_EVENTS),
  p: z.string().startsWith('/').max(300),
  i: z.string().max(120).optional(),
  d: z.string().max(200).optional(),
  r: z.string().max(500).optional(),
  us: z.string().max(100).optional(),
  um: z.string().max(100).optional(),
  uc: z.string().max(100).optional(),
});

const NO_CONTENT = () => new Response(null, { status: 204 });
const SITE_HOST = (() => {
  try {
    return new URL(SITE_URL).hostname;
  } catch {
    return undefined;
  }
})();

export async function POST(req: Request) {
  const db = getDb();
  if (!db) return NO_CONTENT();
  const ua = req.headers.get('user-agent');
  if (isBot(ua)) return NO_CONTENT();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(`track_${ip}`, 120, 60_000).allowed) return NO_CONTENT();

  let raw: unknown;
  try {
    raw = JSON.parse(await req.text());
  } catch {
    return NO_CONTENT();
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NO_CONTENT();
  const v = parsed.data;
  if (v.p.startsWith('/admin') || v.p.startsWith('/api')) return NO_CONTENT();

  try {
    await recordVisit(db, {
      visitorId: v.vid,
      sessionId: v.sid,
      type: v.t,
      path: v.p,
      item: v.i,
      detail: v.d,
      referrer: v.r,
      utmSource: v.us,
      utmMedium: v.um,
      utmCampaign: v.uc,
      country: req.headers.get('x-vercel-ip-country'),
      city: req.headers.get('x-vercel-ip-city'),
      userAgent: ua || '',
      siteHost: SITE_HOST,
    });
    if (Math.random() < 0.002) await pruneVisits(db);
  } catch (error) {
    console.error('[track] yozilmadi', error);
  }
  return NO_CONTENT();
}
