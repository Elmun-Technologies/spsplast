import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { escapeTelegramHtml, sendTelegramNotification } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

/**
 * Mahsulot sharhlari API'si.
 *
 * Oqim: mijoz sharh yozadi → `PENDING` holatida saqlanadi → admin panelda
 * tasdiqlanadi (`APPROVED`) → shundan keyingina saytda ko'rinadi.
 *
 * Shu sababli bu endpoint ommaviy yozish nuqtasi: rate-limit, honeypot va
 * qat'iy zod validatsiyasi bilan himoyalangan (spam bazani to'ldirmasligi kerak).
 */

const REVIEW_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;

const reviewSchema = z.object({
  productId: z
    .string({ required_error: 'Mahsulot ko‘rsatilmagan' })
    .trim()
    .min(1, 'Mahsulot ko‘rsatilmagan')
    .max(64),
  name: z
    .string({ required_error: 'Ism kiritilishi shart', invalid_type_error: 'Ism kiritilishi shart' })
    .trim()
    .min(2, 'Ism kamida 2 ta belgidan iborat bo‘lishi kerak')
    .max(80, 'Ism juda uzun'),
  phone: z.string().trim().max(32).optional(),
  rating: z.coerce
    .number({ invalid_type_error: 'Baholash 1 dan 5 gacha bo‘lishi kerak' })
    .int('Baholash butun son bo‘lishi kerak')
    .min(1, 'Baholash 1 dan 5 gacha bo‘lishi kerak')
    .max(5, 'Baholash 1 dan 5 gacha bo‘lishi kerak'),
  text: z
    .string({ required_error: 'Sharh matni kiritilishi shart' })
    .trim()
    .min(10, 'Sharh kamida 10 ta belgidan iborat bo‘lishi kerak')
    .max(1200, 'Sharh juda uzun (1200 belgidan oshmasligi kerak)'),
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

  // Ommaviy endpoint: cheklovsiz qoldirilsa bazani va Telegram kanalni spam
  // bilan to'ldirish mumkin.
  const rateLimit = checkRateLimit(`review_create_${ip}`, 5, 30 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Juda ko‘p sharh yuborildi. Iltimos, keyinroq qayta urinib ko‘ring.' },
      { status: 429 }
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'So‘rov formati noto‘g‘ri (JSON kutilgan)' }, { status: 400 });
  }

  // Honeypot: haqiqiy foydalanuvchi bu maydonni ko'rmaydi va to'ldirmaydi.
  // Bot to'ldirsa — muvaffaqiyat javobini qaytaramiz, lekin hech nima yozmaymiz
  // (botning "qayta urinish" mantiqini o'chirish uchun).
  const honeypot = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>).website : undefined;
  if (typeof honeypot === 'string' && honeypot.trim().length > 0) {
    return NextResponse.json({ success: true });
  }

  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message || 'Ma’lumotlar to‘liq emas' }, { status: 400 });
  }

  const data = parsed.data;

  try {
    // Faqat mavjud va faol mahsulotga sharh yoziladi — aks holda bog'lanish
    // "osilib" qoladi va keyinchalik hech qachon ko'rinmaydi.
    const product = await db.product.findFirst({
      where: { id: data.productId, status: 'ACTIVE' },
      select: {
        id: true,
        sku: true,
        translations: { where: { locale: 'uz' }, select: { name: true }, take: 1 },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Mahsulot topilmadi' }, { status: 404 });
    }

    const review = await db.productReview.create({
      data: {
        productId: product.id,
        name: data.name,
        phone: data.phone || null,
        rating: data.rating,
        text: data.text,
        status: 'PENDING',
        source: 'SITE',
      },
      select: { id: true, name: true, rating: true, text: true, createdAt: true },
    });

    const productName = product.translations[0]?.name || product.sku || 'Mahsulot';

    (async () => {
      try {
        await sendTelegramNotification(
          `⭐ <b>YANGI SHARH (moderatsiya kutilmoqda)</b>\n\n` +
            `📦 <b>Mahsulot:</b> ${escapeTelegramHtml(productName)}\n` +
            `👤 <b>Ism:</b> ${escapeTelegramHtml(review.name)}\n` +
            `⭐ <b>Baho:</b> ${review.rating}/5\n` +
            `💬 <b>Matn:</b> ${escapeTelegramHtml(review.text)}\n\n` +
            `Tasdiqlash: /admin/reviews`
        );
      } catch (e) {
        console.error('Sharh haqida Telegram xabar yuborilmadi:', e);
      }
    })();

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Review API Error:', error);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}

/**
 * Moderatsiya ro'yxati — faqat admin sessiyasi bilan.
 * Ommaviy sahifalar tasdiqlangan sharhlarni to'g'ridan-to'g'ri serverda
 * (Prisma orqali) o'qiydi, shuning uchun bu yerda public GET yo'q.
 */
export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat etilmagan (Unauthorized)' }, { status: 401 });
  }

  const status = new URL(req.url).searchParams.get('status');
  const where = status && (REVIEW_STATUSES as readonly string[]).includes(status) ? { status } : {};

  try {
    const reviews = await db.productReview.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 300,
      include: {
        product: {
          select: {
            sku: true,
            translations: { select: { locale: true, name: true, slug: true } },
          },
        },
      },
    });

    const pendingCount = await db.productReview.count({ where: { status: 'PENDING' } });

    return NextResponse.json({ reviews, pendingCount });
  } catch (error) {
    console.error('Reviews GET Error:', error);
    return NextResponse.json({ error: 'Sharhlarni olishda xatolik' }, { status: 500 });
  }
}
