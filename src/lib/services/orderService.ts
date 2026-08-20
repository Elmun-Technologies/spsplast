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

  const validItems = items.filter((i) => i.quantity > 0);
  if (validItems.length === 0) {
    throw new Error('Savatda kamida bitta mahsulot miqdori 1 donadan ko‘p bo‘lishi kerak');
  }

  const normalizedPhone = normalizePhone(customerPhone);

  // Duplicate Order Protection: Check if identical order from same phone exists in last 30 seconds
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
  const existingRecentOrder = await db.order.findFirst({
    where: {
      customerPhone: normalizedPhone,
      createdAt: { gte: thirtySecondsAgo },
    },
  });

  if (existingRecentOrder) {
    return existingRecentOrder; // Return existing order to prevent double charging / double order creation
  }

  const orderNumber = `SPS-${Math.floor(100000 + Math.random() * 900000)}`;

  // Execute inside DB transaction with atomic stock decrement
  const order = await db.$transaction(async (tx) => {
    let grandTotal = 0;
    const itemSnapshots = [];

    for (const itemInput of validItems) {
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

      // Concurrency-Safe Atomic Inventory Check & Decrement
      if (product.trackInventory && !product.allowBackorder) {
        if (variant) {
          const updatedVariant = await tx.productVariant.updateMany({
            where: {
              id: variant.id,
              stockQty: { gte: itemInput.quantity },
            },
            data: { stockQty: { decrement: itemInput.quantity } },
          });

          if (updatedVariant.count === 0) {
            throw new Error(`Sotuvda yetarli variant mahsuloti yo‘q: ${variant.sku}`);
          }
        } else {
          const updatedProduct = await tx.product.updateMany({
            where: {
              id: product.id,
              stockQty: { gte: itemInput.quantity },
            },
            data: { stockQty: { decrement: itemInput.quantity } },
          });

          if (updatedProduct.count === 0) {
            throw new Error(`Sotuvda yetarli mahsulot yo‘q: ${product.sku}`);
          }
        }
      }

      // Server-calculated unit price in integer UZS
      const unitPrice = variant ? variant.price : product.basePrice;
      const lineTotal = unitPrice * itemInput.quantity;
      grandTotal += lineTotal;

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

  // Async Telegram Alert (Non-blocking)
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
