import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createOrderServerSide } from '@/lib/services/orderService';
import { getAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const order = await createOrderServerSide(body, body.locale || 'uz');
    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Order Submission Error:', error);
    return NextResponse.json(
      { error: error.message || 'Buyurtma rasmiylashtirishda xatolik yuz berdi' },
      { status: 400 }
    );
  }
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
    });
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
