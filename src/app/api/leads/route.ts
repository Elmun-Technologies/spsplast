import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { normalizePhone, isValidUzPhone } from '@/lib/phone';
import { escapeTelegramHtml, sendTelegramNotification } from '@/lib/telegram';
import { getAdminSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const LEAD_TYPES = ['B2B_WHOLESALE', 'CONSULTATION', 'ONE_CLICK', 'CALLBACK'] as const;

const leadSchema = z.object({
  name: z
    .string({ required_error: 'Ism kiritilishi shart', invalid_type_error: 'Ism kiritilishi shart' })
    .trim()
    .min(2, 'Ism kamida 2 ta belgidan iborat bo‘lishi kerak')
    .max(120, 'Ism juda uzun'),
  phone: z
    .string({ required_error: 'Telefon raqami kiritilishi shart', invalid_type_error: 'Telefon raqami kiritilishi shart' })
    .trim()
    .min(7, 'Telefon raqami noto‘g‘ri. Format: +998 XX XXX XX XX')
    .max(32),
  company: z.string().trim().max(160).optional(),
  quantity: z.coerce.number().int().min(1).max(1_000_000).optional(),
  productId: z.string().trim().max(64).optional(),
  message: z.string().trim().max(2000).optional(),
  type: z.enum(LEAD_TYPES).optional().default('B2B_WHOLESALE'),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  gclid: z.string().max(200).optional(),
  fbclid: z.string().max(200).optional(),
});

function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(req: Request) {
  const ip = clientIp(req);

  // Public form endpoint: without a cap it is a free DB/Telegram spam cannon.
  const rateLimit = checkRateLimit(`lead_create_${ip}`, 10, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Juda ko‘p so‘rov yuborildingiz. Bir ozdan so‘ng qayta urinib ko‘ring.' },
      { status: 429 }
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'So‘rov formati noto‘g‘ri (JSON kutilgan)' }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message || 'Ism va telefon raqami kiritilishi shart' },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const normalizedPhone = normalizePhone(data.phone);

  if (!isValidUzPhone(normalizedPhone)) {
    return NextResponse.json(
      { error: 'Telefon raqami noto‘g‘ri. Format: +998 XX XXX XX XX' },
      { status: 400 }
    );
  }

  try {
    const lead = await db.lead.create({
      data: {
        name: data.name,
        phone: normalizedPhone,
        company: data.company || null,
        quantity: data.quantity ?? null,
        productId: data.productId || null,
        message: data.message || null,
        type: data.type,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
        gclid: data.gclid || null,
        fbclid: data.fbclid || null,
      },
    });

    (async () => {
      try {
        const telegramMsg =
          `🏢 <b>YANGI B2B / KONSULTATSIYA SO‘ROVI</b>\n\n` +
          `👤 <b>Ism:</b> ${escapeTelegramHtml(lead.name)}\n` +
          `📞 <b>Telefon:</b> ${escapeTelegramHtml(lead.phone)}\n` +
          (lead.company ? `🏢 <b>Kompaniya/Sex:</b> ${escapeTelegramHtml(lead.company)}\n` : '') +
          (lead.quantity ? `📦 <b>Miqdor:</b> ${lead.quantity} dona\n` : '') +
          (lead.message ? `💬 <b>Xabar:</b> ${escapeTelegramHtml(lead.message)}\n` : '') +
          (lead.utmSource ? `🎯 <b>UTM:</b> ${escapeTelegramHtml(lead.utmSource)} / ${escapeTelegramHtml(lead.utmMedium || '')}\n` : '');

        await sendTelegramNotification(telegramMsg);
      } catch (e) {
        console.error('Async Telegram Notification Error:', e);
      }
    })();

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error('Lead API Error:', error);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat etilmagan (Unauthorized)' }, { status: 401 });
  }

  try {
    const leads = await db.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    return NextResponse.json({ leads });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
