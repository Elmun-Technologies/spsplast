import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      region,
      city,
      address,
      deliveryType,
      paymentMethod,
      notes,
      totalAmount,
      items,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body;

    if (!customerName || !customerPhone || !items || items.length === 0) {
      return NextResponse.json({ error: 'Majburiy maydonlar to‘ldirilmagan' }, { status: 400 });
    }

    const orderNumber = `SPS-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = await db.order.create({
      data: {
        orderNumber,
        customerName,
        customerPhone,
        region: region || 'Toshkent',
        city: city || '',
        address: address || '',
        deliveryType: deliveryType || 'COURIER',
        paymentMethod: paymentMethod || 'CASH',
        totalAmount: Number(totalAmount) || 0,
        notes: notes || '',
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId || null,
            variantId: item.variantId || null,
            title: item.title,
            price: Number(item.price),
            quantity: Number(item.quantity),
          })),
        },
      },
      include: { items: true },
    });

    // Build Telegram Notification HTML
    let itemsText = '';
    order.items.forEach((item, idx) => {
      itemsText += `  ${idx + 1}. <b>${item.title}</b> — ${item.quantity} dona x ${item.price.toLocaleString()} so‘m\n`;
    });

    const telegramMsg =
      `🛒 <b>YANGI BUYURTMA #${order.orderNumber}</b>\n\n` +
      `👤 <b>Mijoz:</b> ${order.customerName}\n` +
      `📞 <b>Telefon:</b> ${order.customerPhone}\n` +
      `📍 <b>Manzil:</b> ${order.region}, ${order.address}\n` +
      `💳 <b>To‘lov turi:</b> ${order.paymentMethod}\n\n` +
      `📦 <b>Mahsulotlar:</b>\n${itemsText}\n` +
      `💰 <b>Jami Summa:</b> <b>${order.totalAmount.toLocaleString()} so‘m</b>\n` +
      (order.utmSource ? `🎯 <b>UTM:</b> ${order.utmSource} / ${order.utmMedium}\n` : '');

    await sendTelegramNotification(telegramMsg);

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Order API error:', error);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}

export async function GET() {
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
