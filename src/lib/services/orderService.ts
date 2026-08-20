import { db } from '@/lib/db';
import { normalizePhone } from '@/lib/phone';
import { sendTelegramNotification } from '@/lib/telegram';

export interface CreateOrderItemInput {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  region: string;
  city?: string;
  address: string;
  deliveryType?: string;
  paymentMethod?: string;
  notes?: string;
  items: CreateOrderItemInput[];
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landingPage?: string;
}

export async function createOrderServerSide(input: CreateOrderInput, locale: string = 'uz') {
  const { customerName, customerPhone, region, city, address, deliveryType, paymentMethod, notes, items } = input;

  if (!customerName || !customerPhone || !items || items.length === 0) {
    throw new Error('Majburiy maydonlar to‘ldirilmagan');
  }

  const normalizedPhone = normalizePhone(customerPhone);
  const orderNumber = `SPS-${Math.floor(100000 + Math.random() * 900000)}`;

  // Execute inside DB transaction for atomic inventory and snapshot safety
  const order = await db.$transaction(async (tx) => {
    let grandTotal = 0;
    const itemSnapshots = [];

    for (const itemInput of items) {
      if (itemInput.quantity <= 0) continue;

      const product = await tx.product.findUnique({
        where: { id: itemInput.productId },
        include: { translations: true },
      });

      if (!product || product.status !== 'ACTIVE') {
        throw new Error(`Mahsulot topilmadi yoki sotuvda mavjud emas`);
      }

      let variant = null;
      if (itemInput.variantId) {
        variant = await tx.productVariant.findUnique({
          where: { id: itemInput.variantId },
        });
      }

      // Check Inventory
      if (product.trackInventory && !product.allowBackorder) {
        const availableQty = variant ? variant.stockQty : product.stockQty;
        if (availableQty < itemInput.quantity) {
          throw new Error(`Sotuvda yetarli mahsulot yo‘q: ${product.sku}`);
        }

        // Decrement stock
        if (variant) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stockQty: { decrement: itemInput.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: product.id },
            data: { stockQty: { decrement: itemInput.quantity } },
          });
        }
      }

      // Determine purchase-time price in UZS (Integer)
      const unitPrice = variant ? variant.price : product.basePrice;
      const lineTotal = unitPrice * itemInput.quantity;
      grandTotal += lineTotal;

      // Extract translation
      const trans = product.translations.find((t) => t.locale === locale) || product.translations[0];
      const productName = trans ? trans.name : product.sku;

      itemSnapshots.push({
        productId: product.id,
        variantId: variant ? variant.id : null,
        sku: variant ? variant.sku : product.sku,
        productName,
        variantName: variant ? variant.sku : null,
        unitPrice,
        quantity: itemInput.quantity,
        lineTotal,
      });
    }

    // Create Order record
    const createdOrder = await tx.order.create({
      data: {
        orderNumber,
        customerName,
        customerPhone: normalizedPhone,
        region: region || 'Toshkent',
        city: city || '',
        address: address || '',
        deliveryType: deliveryType || 'COURIER',
        paymentMethod: paymentMethod || 'CASH',
        totalAmount: grandTotal,
        notes: notes || '',
        utmSource: input.utmSource || null,
        utmMedium: input.utmMedium || null,
        utmCampaign: input.utmCampaign || null,
        utmContent: input.utmContent || null,
        utmTerm: input.utmTerm || null,
        gclid: input.gclid || null,
        fbclid: input.fbclid || null,
        referrer: input.referrer || null,
        landingPage: input.landingPage || null,
        items: {
          create: itemSnapshots,
        },
      },
      include: { items: true },
    });

    return createdOrder;
  });

  // Dispatch Telegram Alert asynchronously (isolated from order completion failure)
  (async () => {
    try {
      let itemsText = '';
      order.items.forEach((item, idx) => {
        itemsText += `  ${idx + 1}. <b>${item.productName}</b> — ${item.quantity} dona x ${item.unitPrice.toLocaleString()} so‘m\n`;
      });

      const telegramMsg =
        `🛒 <b>YANGI BUYURTMA #${order.orderNumber}</b>\n\n` +
        `👤 <b>Mijoz:</b> ${order.customerName}\n` +
        `📞 <b>Telefon:</b> ${order.customerPhone}\n` +
        `📍 <b>Manzil:</b> ${order.region}, ${order.address}\n` +
        `💳 <b>To‘lov turi:</b> ${order.paymentMethod}\n\n` +
        `📦 <b>Mahsulotlar:</b>\n${itemsText}\n` +
        `💰 <b>Jami Summa:</b> <b>${order.totalAmount.toLocaleString()} so‘m</b>\n` +
        (order.utmSource ? `🎯 <b>UTM:</b> ${order.utmSource} / ${order.utmMedium || ''}\n` : '');

      await sendTelegramNotification(telegramMsg);
    } catch (e) {
      console.error('Async Telegram Notification Error:', e);
    }
  })();

  return order;
}
