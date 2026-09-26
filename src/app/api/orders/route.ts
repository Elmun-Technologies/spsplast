import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createOrderServerSide, createOrderSchema } from '@/lib/services/orderService';
import { getAdminSession } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';
import { MAX_ORDER_LINES } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(req: Request) {
  const ip = clientIp(req);

  // Public, unauthenticated and write-heavy: cap it per IP so a script cannot
  // flood the order table (and the Telegram chat) with junk orders.
  const rateLimit = checkRateLimit(`order_create_${ip}`, 20, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Juda ko‘p so‘rov yuborildingiz. Bir ozdan so‘ng qayta urinib ko‘ring.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'So‘rov formati noto‘g‘ri (JSON kutilgan)' }, { status: 400 });
  }

  // Fail fast on a malformed payload — before any database work happens.
  const parsed = createOrderSchema.safeParse(normalize(body));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message || 'Buyurtma ma’lumotlari noto‘g‘ri' },
      { status: 400 }
    );
  }

  try {
    const order = await createOrderServerSide(body, parsed.data.locale);
    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Order Submission Error:', error);
    const status = error?.code === 'P2002' ? 409 : 400;
    return NextResponse.json(
      { error: error.message || 'Buyurtma rasmiylashtirishda xatolik yuz berdi' },
      { status }
    );
  }
}

/** Coerce string quantities and empty variant ids coming from older clients. */
function normalize(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const input = { ...(body as Record<string, unknown>) };
  if (Array.isArray(input.items)) {
    input.items = input.items.slice(0, MAX_ORDER_LINES).map((item: any) => {
      if (!item || typeof item !== 'object') return item;
      const next = { ...item };
      if (typeof next.quantity === 'string') {
        const n = Number(next.quantity);
        next.quantity = Number.isFinite(n) ? n : next.quantity;
      }
      if (!next.variantId) delete next.variantId;
      return next;
    });
  }
  if (input.couponCode === '') input.couponCode = null;
  return input;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat etilmagan (Unauthorized)' }, { status: 401 });
  }

  try {
    const orders = await db.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
