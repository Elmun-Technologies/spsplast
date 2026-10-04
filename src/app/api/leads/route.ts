import { NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizePhone, isValidUzPhone } from '@/lib/phone';
import { escapeTelegramHtml, sendTelegramNotification } from '@/lib/telegram';
import { checkRateLimit } from '@/lib/rateLimit';

/**
 * Zayafka (lead) endpoint'i — saytdagi YAGONA server API.
 *
 * Arxitektura qarori (2026-10-04): backend yo'q, ma'lumotlar bazasi yo'q.
 * Mijoz formani to'ldiradi, xabar to'g'ridan-to'g'ri Telegram guruhiga tushadi,
 * menejer o'zi bog'lanadi. Shu sababli bu yerda hech qanday yozuv saqlanmaydi:
 * faqat validatsiya, spam himoyasi va Telegram xabari.
 *
 * Xabar tarkibi: forma turi, ism, telefon, mahsulot (nom + SKU), miqdor, izoh,
 * manba sahifa, til va Toshkent vaqti — menejerga kontekst to'liq bo'lsin.
 */
export const dynamic = 'force-dynamic';

const LEAD_TYPES = ['PRODUCT_REQUEST', 'CONSULTATION', 'B2B_WHOLESALE', 'ONE_CLICK', 'CALLBACK'] as const;

const TYPE_LABELS: Record<(typeof LEAD_TYPES)[number], string> = {
  PRODUCT_REQUEST: 'Mahsulot bo‘yicha zayafka',
  CONSULTATION: 'Konsultatsiya so‘rovi',
  B2B_WHOLESALE: 'Ulgurji (B2B) so‘rov',
  ONE_CLICK: '1-klik zayafka',
  CALLBACK: 'Qo‘ng‘iroq so‘rovi',
};

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
  product: z.string().trim().max(240).optional(),
  productSku: z.string().trim().max(64).optional(),
  quantity: z.coerce.number().int().min(1).max(1_000_000).optional(),
  message: z.string().trim().max(2000).optional(),
  pageUrl: z.string().trim().max(500).optional(),
  lang: z.enum(['uz', 'ru']).optional(),
  type: z.enum(LEAD_TYPES).optional().default('PRODUCT_REQUEST'),
  // Honeypot: botlar to'ldiradigan yashirin maydon. To'ldirilgan bo'lsa so'rov
  // "muvaffaqiyatli" javob oladi, lekin Telegram'ga hech narsa yuborilmaydi.
  website: z.string().max(200).optional(),
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

function tashkentTime(): string {
  try {
    return new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Tashkent' });
  } catch {
    return new Date().toISOString();
  }
}

export async function POST(req: Request) {
  const ip = clientIp(req);

  // Ochiq forma: cheklovsiz Telegram'ni spam bilan to'ldirish mumkin.
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
    return NextResponse.json({ error: first?.message || 'Ism va telefon raqami kiritilishi shart' }, { status: 400 });
  }

  const data = parsed.data;

  // Honeypot to'ldirilgan — bot. Javob bir xil, xabar yo'q.
  if (data.website && data.website.trim().length > 0) {
    return NextResponse.json({ success: true });
  }

  const normalizedPhone = normalizePhone(data.phone);
  if (!isValidUzPhone(normalizedPhone)) {
    return NextResponse.json({ error: 'Telefon raqami noto‘g‘ri. Format: +998 XX XXX XX XX' }, { status: 400 });
  }

  const typeLabel = TYPE_LABELS[data.type] || TYPE_LABELS.PRODUCT_REQUEST;

  const lines = [
    `📥 <b>${escapeTelegramHtml(typeLabel)}</b>`,
    '',
    `👤 <b>Ism:</b> ${escapeTelegramHtml(data.name)}`,
    `📞 <b>Telefon:</b> ${escapeTelegramHtml(normalizedPhone)}`,
  ];

  if (data.product) {
    const sku = data.productSku ? ` (${escapeTelegramHtml(data.productSku)})` : '';
    lines.push(`🧱 <b>Mahsulot:</b> ${escapeTelegramHtml(data.product)}${sku}`);
  }
  if (data.quantity) lines.push(`📦 <b>Miqdor:</b> ${data.quantity} dona`);
  if (data.message) lines.push(`💬 <b>Izoh:</b> ${escapeTelegramHtml(data.message)}`);
  if (data.pageUrl) lines.push(`🔗 <b>Manba sahifa:</b> ${escapeTelegramHtml(data.pageUrl)}`);
  if (data.lang) lines.push(`🌐 <b>Til:</b> ${data.lang.toUpperCase()}`);
  if (data.utmSource || data.utmCampaign) {
    lines.push(
      `🎯 <b>UTM:</b> ${escapeTelegramHtml(data.utmSource || '—')} / ${escapeTelegramHtml(data.utmMedium || '—')} / ${escapeTelegramHtml(data.utmCampaign || '—')}`
    );
  }
  lines.push(`🕒 <b>Vaqt:</b> ${escapeTelegramHtml(tashkentTime())}`);

  const sent = await sendTelegramNotification(lines.join('\n'));

  // Telegram sozlanmagan bo'lsa (mahalliy ishlab chiqish) — xabar konsolga
  // chiqadi va foydalanuvchi baribir muvaffaqiyat holatini ko'radi.
  return NextResponse.json({ success: true, delivered: sent });
}
