import { NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizePhone, isValidIntlPhone } from '@/lib/phone';
import { sendTelegramNotification } from '@/lib/telegram';
import { checkRateLimit } from '@/lib/rateLimit';
import { calcMolds, getModelBySlug, modelName } from '@/lib/catalog2027';
import { SITE_URL } from '@/lib/seo';
import { getDb } from '@/server/db/client';
import { createLead, hitRateLimit, markTelegram } from '@/server/leads';
import { formatLeadMessage } from '@/server/leadMessage';
import { ipKey } from '@/server/privacy';

/**
 * Zayafka endpoint'i — saytdagi YAGONA yozuv API (HANDOFF 5-bo'lim).
 *
 * Forma → Zod validatsiyasi → honeypot + rate limit → **bazaga yozish** →
 * Telegram xabari (parse_mode HTML) → `{ ok, requestId }`.
 * requestId formati: SPS-YYMM-NNNN — baza bo'lsa oy bo'yicha ketma-ket.
 *
 * Baza (`DATABASE_URL`) bo'lmasa yoki yozish yiqilsa, eski yo'l ishlaydi:
 * tasodifiy raqam + faqat Telegram — mijoz baribir zayafka qoldira oladi.
 * Ikkalasi ham ishlamasa — 503 `not_delivered` (productionda "ok" deyilmaydi).
 */
export const dynamic = 'force-dynamic';

const leadSchema = z.object({
  type: z.enum(['quick', 'list', 'partners']).default('quick'),
  clientType: z.enum(['workshop', 'dealer', 'builder', 'private']).optional(),
  name: z
    .string({ error: 'Ism kiritilishi shart' })
    .trim()
    .min(2, 'Ism kiritilishi shart')
    .max(120, 'Ism juda uzun'),
  phone: z
    .string({ error: 'Telefon raqami noto‘g‘ri' })
    .trim()
    .min(7, 'Telefon raqami noto‘g‘ri')
    .max(32, 'Telefon raqami noto‘g‘ri'),
  // Formada tanlangan davlat kodi (`+996`) — davlat kodisiz yozilgan raqamni to'g'ri o'qish uchun.
  dial: z.string().regex(/^\+\d{1,4}$/).optional(),
  city: z.string().trim().max(120).optional(),
  volumeM2: z.coerce.number().min(1).max(1_000_000).optional(),
  company: z.string().trim().max(200).optional(),
  country: z.string().trim().max(120).optional(),
  material: z.enum(['pp', 'abs', 'advice']).optional(),
  items: z
    .array(
      z.object({
        slug: z.string().trim().min(1).max(120),
        code: z.string().trim().max(16).optional(),
        m2: z.coerce.number().min(1).max(1_000_000).optional(),
      }),
    )
    .max(60)
    .optional(),
  message: z.string().trim().max(2000).optional(),
  lang: z.enum(['uz', 'ru', 'en']).default('uz'),
  pageUrl: z.string().trim().max(500).optional(),
  utm_source: z.string().max(200).optional(),
  utm_medium: z.string().max(200).optional(),
  utm_campaign: z.string().max(200).optional(),
  gclid: z.string().max(200).optional(),
  fbclid: z.string().max(200).optional(),
  visitorId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).optional(),
  sessionId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).optional(),
  // Honeypot: botlar to'ldiradigan yashirin maydon — bo'sh bo'lishi shart.
  website: z.string().max(200).optional(),
});

const usedRequestIds = new Set<string>();

function makeRequestId(now: Date): string {
  const ym = `${String(now.getFullYear() % 100).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}`;
  for (let i = 0; i < 50; i += 1) {
    const n = String(1 + Math.floor(Math.random() * 9999)).padStart(4, '0');
    const id = `SPS-${ym}-${n}`;
    if (!usedRequestIds.has(id)) {
      usedRequestIds.add(id);
      return id;
    }
  }
  return `SPS-${ym}-${Date.now() % 10000}`;
}

function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

const RATE_MAX = 10;
const RATE_WINDOW_MS = 15 * 60 * 1000;

async function rateAllowed(ip: string): Promise<boolean> {
  const db = getDb();
  if (db) {
    try {
      // Bazada IP emas, uning HMAC xeshi (src/server/privacy.ts).
      return await hitRateLimit(db, ipKey('lead_create', ip), RATE_MAX, RATE_WINDOW_MS);
    } catch (error) {
      console.error('[leads] rate limit (baza) xatosi', error);
    }
  }
  return checkRateLimit(`lead_create_${ip}`, RATE_MAX, RATE_WINDOW_MS).allowed;
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!(await rateAllowed(ip))) {
    return NextResponse.json({ ok: false, error: 'rate_limit' }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 5);
    // Telefon xatosi alohida kod bilan qaytadi (HANDOFF 5: `bad_phone`) —
    // mijoz formasi telefon maydonini shu kod bo'yicha belgilaydi.
    const phoneOnly = parsed.error.issues.length > 0 && parsed.error.issues.every((i) => i.path[0] === 'phone');
    return NextResponse.json({ ok: false, error: phoneOnly ? 'bad_phone' : 'validation', issues }, { status: 400 });
  }
  const data = parsed.data;

  // Honeypot to'ldirilgan — bot: javob bir xil, xabar yuborilmaydi.
  if (data.website && data.website.trim()) {
    return NextResponse.json({ ok: true, requestId: makeRequestId(new Date()) });
  }

  const phone = normalizePhone(data.phone, data.dial);
  if (!isValidIntlPhone(data.phone, data.dial)) {
    return NextResponse.json({ ok: false, error: 'bad_phone' }, { status: 400 });
  }

  const now = new Date();

  // Modellar: nom va qolip soni zayafka paytidagidek saqlanadi (katalog keyin o'zgarsa ham).
  const items = (data.items || []).map((item) => {
    const model = getModelBySlug(item.slug);
    return {
      slug: item.slug,
      model,
      code: model?.code || item.code || null,
      name: model ? modelName(model, 'uz') : null,
      m2: item.m2,
      molds: model && item.m2 ? calcMolds(model, item.m2) : null,
    };
  });

  const db = getDb();
  let saved: { id: number; number: string } | null = null;
  if (db) {
    try {
      saved = await createLead(
        db,
        {
          ...data,
          phone,
          geoCountry: req.headers.get('x-vercel-ip-country'),
          items: items.map(({ model: _model, ...rest }) => rest),
        },
        now,
      );
    } catch (error) {
      // Zayafka yo'qolmasin: Telegram baribir yuboriladi, xato loglarda qoladi.
      console.error('[leads] bazaga yozilmadi', error);
    }
  }
  const requestId = saved?.number ?? makeRequestId(now);

  const message = formatLeadMessage({
    number: requestId,
    id: saved?.id ?? null,
    type: data.type,
    clientType: data.clientType,
    name: data.name,
    phone,
    phoneTyped: data.phone,
    city: data.city,
    country: data.country,
    volumeM2: data.volumeM2,
    company: data.company,
    material: data.material,
    message: data.message,
    lang: data.lang,
    pageUrl: data.pageUrl,
    utmSource: data.utm_source,
    utmMedium: data.utm_medium,
    utmCampaign: data.utm_campaign,
    gclid: data.gclid,
    fbclid: data.fbclid,
    items: items.map(({ model: _model, ...rest }) => rest),
    createdAt: now,
    siteUrl: SITE_URL,
  });

  // Xabar matni (tel:, wa.me havolalari, escape) — src/server/leadMessage.ts.
  const sent = await sendTelegramNotification(message);
  if (db && saved) {
    try {
      await markTelegram(db, saved.id, sent);
    } catch (error) {
      console.error('[leads] Telegram holati yozilmadi', error);
    }
  }

  // Zayafka hech qayerga yetmadi (baza ham, Telegram ham yo'q yoki ikkalasi ham yiqildi):
  // mijozga "qabul qilindi" deyish — zayafkani jim yo'qotish. 503 qaytadi, forma mijozga
  // telefon/Telegram/WhatsApp tugmalarini ko'rsatadi (audit 2026-11-02, 1-band).
  // Mahalliy `npm run dev` da (baza va Telegram sozlanmagan) forma oqimini tekshirish uchun ok.
  if (!saved && !sent && process.env.NODE_ENV === 'production') {
    console.error('[leads] ZAYAFKA YETKAZILMADI', { requestId, type: data.type, lang: data.lang });
    return NextResponse.json({ ok: false, error: 'not_delivered', requestId }, { status: 503 });
  }

  return NextResponse.json({ ok: true, requestId, delivered: sent });
}
