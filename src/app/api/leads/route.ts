import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendTelegramNotification } from '@/lib/telegram';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, company, quantity, productId, message, type, utmSource, utmMedium } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Ism va telefon raqami shart' }, { status: 400 });
    }

    const lead = await db.lead.create({
      data: {
        name,
        phone,
        company: company || null,
        quantity: quantity ? Number(quantity) : null,
        productId: productId || null,
        message: message || null,
        type: type || 'B2B_WHOLESALE',
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
      },
    });

    const telegramMsg =
      `🏢 <b>YANGI B2B / KONSULTATSIYA SO‘ROVI</b>\n\n` +
      `👤 <b>Ism:</b> ${lead.name}\n` +
      `📞 <b>Telefon:</b> ${lead.phone}\n` +
      (lead.company ? `🏢 <b>Kompaniya/Sex:</b> ${lead.company}\n` : '') +
      (lead.quantity ? `📦 <b>Miqdor:</b> ${lead.quantity} dona\n` : '') +
      (lead.message ? `💬 <b>Xabar:</b> ${lead.message}\n` : '');

    await sendTelegramNotification(telegramMsg);

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error('Lead API error:', error);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const leads = await db.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ leads });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
