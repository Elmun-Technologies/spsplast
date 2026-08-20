import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { normalizePhone } from '@/lib/phone';
import { sendTelegramNotification } from '@/lib/telegram';
import { getAdminSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, phone, company, quantity, productId, message, type, utmSource, utmMedium, utmCampaign, gclid, fbclid } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Ism va telefon raqami kiritilishi shart' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);

    const lead = await db.lead.create({
      data: {
        name,
        phone: normalizedPhone,
        company: company || null,
        quantity: quantity ? Number(quantity) : null,
        productId: productId || null,
        message: message || null,
        type: type || 'B2B_WHOLESALE',
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        gclid: gclid || null,
        fbclid: fbclid || null,
      },
    });

    (async () => {
      try {
        const telegramMsg =
          `🏢 <b>YANGI B2B / KONSULTATSIYA SO‘ROVI</b>\n\n` +
          `👤 <b>Ism:</b> ${lead.name}\n` +
          `📞 <b>Telefon:</b> ${lead.phone}\n` +
          (lead.company ? `🏢 <b>Kompaniya/Sex:</b> ${lead.company}\n` : '') +
          (lead.quantity ? `📦 <b>Miqdor:</b> ${lead.quantity} dona\n` : '') +
          (lead.message ? `💬 <b>Xabar:</b> ${lead.message}\n` : '') +
          (lead.utmSource ? `🎯 <b>UTM:</b> ${lead.utmSource} / ${lead.utmMedium || ''}\n` : '');

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
    });
    return NextResponse.json({ leads });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
