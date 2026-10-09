import { NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizePhone, isValidUzPhone, isValidIntlPhone } from '@/lib/phone';
import { escapeTelegramHtml, sendTelegramNotification } from '@/lib/telegram';
import { checkRateLimit } from '@/lib/rateLimit';
import { calcMolds, getModelBySlug, modelName, modelSetSize } from '@/lib/catalog2027';

/**
 * Zayafka endpoint'i — saytdagi YAGONA yozuv API (HANDOFF 5-bo'lim).
 *
 * Backend va ma'lumotlar bazasi yo'q: forma → Zod validatsiyasi → honeypot +
 * rate limit → Telegram xabari (parse_mode HTML) → `{ ok, requestId }`.
 * requestId formati: SPS-YYMM-NNNN.
 */
export const dynamic = 'force-dynamic';

const leadSchema = z.object({
  type: z.enum(['quick', 'list', 'partners']).default('quick'),
  clientType: z.enum(['workshop', 'dealer', 'builder', 'private']).optional(),
  name: z
    .string({ required_error: 'Ism kiritilishi shart', invalid_type_error: 'Ism kiritilishi shart' })
    .trim()
    .min(2, 'Ism kiritilishi shart')
    .max(120, 'Ism juda uzun'),
  phone: z
    .string({ required_error: 'Telefon raqami noto‘g‘ri', invalid_type_error: 'Telefon raqami noto‘g‘ri' })
    .trim()
    .min(7, 'Telefon raqami noto‘g‘ri')
    .max(32, 'Telefon raqami noto‘g‘ri'),
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
  // Honeypot: botlar to'ldiradigan yashirin maydon — bo'sh bo'lishi shart.
  website: z.string().max(200).optional(),
});

const CLIENT_LABELS: Record<string, string> = {
  workshop: 'Sex',
  dealer: 'Diler',
  builder: 'Quruvchi',
  private: 'Xususiy',
};

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

function tashkentTime(now: Date): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Asia/Tashkent',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(now);
  } catch {
    return now.toISOString();
  }
}

function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limit = checkRateLimit(`lead_create_${ip}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
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

  const phone = normalizePhone(data.phone);
  if (!isValidIntlPhone(data.phone)) {
    return NextResponse.json({ ok: false, error: 'bad_phone' }, { status: 400 });
  }

  const now = new Date();
  const requestId = makeRequestId(now);

  const typeLabel =
    data.type === 'list'
      ? `Zayafka ro'yxati (${data.items?.length || 0} model)`
      : data.type === 'partners'
        ? 'Ulgurji forma'
        : 'Tez zayafka';

  const lines: string[] = [`🟥 Yangi zayafka · ${requestId}`, `Turi: ${escapeTelegramHtml(typeLabel)}`];

  const client = data.clientType ? CLIENT_LABELS[data.clientType] : null;
  lines.push(`Mijoz: ${escapeTelegramHtml([client, data.name].filter(Boolean).join(' · '))}`);

  const wa = isValidUzPhone(phone) ? `  (WhatsApp: wa.me/${phone.replace(/\D/g, '')})` : '';
  lines.push(`Telefon: <a href="tel:${phone.replace(/[^\d+]/g, '')}">${escapeTelegramHtml(phone)}</a>${wa}`);

  const place = [data.city, data.country].filter(Boolean).join(', ');
  if (place) lines.push(`Shahar: ${escapeTelegramHtml(place)}`);
  if (data.volumeM2) lines.push(`Kunlik hajm: ${data.volumeM2} m²`);
  if (data.company) lines.push(`Kompaniya: ${escapeTelegramHtml(data.company)}`);
  if (data.material) lines.push(`Material: ${escapeTelegramHtml(data.material.toUpperCase())}`);

  if (data.items?.length) {
    lines.push('', 'Modellar:');
    for (const item of data.items) {
      const model = getModelBySlug(item.slug);
      const label = model ? `№ ${model.code || '—'} ${modelName(model, 'uz')}` : item.slug;
      const setNote = model && modelSetSize(model) > 1 ? " (to'plam A+B)" : '';
      if (item.m2) {
        const molds = model ? calcMolds(model, item.m2) : null;
        lines.push(
          molds
            ? `• ${escapeTelegramHtml(label)}${setNote} — ${item.m2} m²/kun ≈ ${molds.toLocaleString('ru-RU')} qolip`
            : `• ${escapeTelegramHtml(label)}${setNote} — ${item.m2} m²/kun, soni menejer hisoblaydi`,
        );
      } else {
        lines.push(`• ${escapeTelegramHtml(label)}${setNote}`);
      }
    }
  }

  if (data.message) lines.push('', `Izoh: ${escapeTelegramHtml(data.message)}`);
  lines.push(`Til: ${data.lang} · Sahifa: ${escapeTelegramHtml(data.pageUrl || '—')}`);
  if (data.utm_source || data.utm_medium || data.utm_campaign || data.gclid || data.fbclid) {
    lines.push(
      `Manba: ${escapeTelegramHtml([data.utm_source, data.utm_medium, data.utm_campaign].filter(Boolean).join(' / ') || 'to‘g‘ridan-to‘g‘ri')}`,
    );
  }
  lines.push(`Vaqt: ${tashkentTime(now)} (Toshkent)`);

  const sent = await sendTelegramNotification(lines.join('\n'));

  // Telegram sozlanmagan bo'lsa (mahalliy dev) — javob baribir ok, /api/health
  // "degraded" holatini ko'rsatadi.
  return NextResponse.json({ ok: true, requestId, delivered: sent });
}
