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
  idempotencyKey?: string;
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

export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY', 'CANCELLED'],
  READY: ['SHIPPED', 'DELIVERED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function isValidStatusTransition(fromStatus: string, toStatus: string): boolean {
  if (fromStatus === toStatus) return true;
  const allowed = VALID_STATUS_TRANSITIONS[fromStatus];
  if (!allowed) return false;
  return allowed.includes(toStatus);
}

export function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
  const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
  return `SPS-${dateStr}-${randomStr}`;
}

export async function createOrderServerSide(input: CreateOrderInput, locale: string = 'uz') {
  const {
    customerName,
    customerPhone,
    region,
    city,
    address,
    deliveryType,
    paymentMethod,
    notes,
    idempotencyKey,
    items,
  } = input;

  if (!customerName || !customerName.trim() || !customerPhone || !items || items.length === 0) {
    throw new Error('MAJBURIY_MAYDONLAR_BOSH: Majburiy maydonlar to‘ldirilmagan');
  }

  // Idempotency check: if key provided and already exists, return previous order
  if (idempotencyKey && idempotencyKey.trim() !== '') {
    const existingByIdempotency = await db.order.findUnique({
      where: { idempotencyKey },
      include: { items: true, statusHistory: true },
    });
    if (existingByIdempotency) {
      return existingByIdempotency;
    }
  }

  const normalizedPhone = normalizePhone(customerPhone);

  // Duplicate Order Protection: Check if identical order from same phone exists in last 30 seconds
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
  const existingRecentOrder = await db.order.findFirst({
    where: {
      customerPhone: normalizedPhone,
      createdAt: { gte: thirtySecondsAgo },
    },
    include: { items: true, statusHistory: true },
  });

  if (existingRecentOrder) {
    return existingRecentOrder;
  }

  // Filter valid quantities > 0
  const validItems = items.filter((i) => typeof i.quantity === 'number' && i.quantity > 0);
  if (validItems.length === 0) {
    throw new Error('MIQDOR_XATOSI: Savatda kamida bitta mahsulot miqdori 1 donadan ko‘p bo‘lishi kerak');
  }

  const orderNumber = generateOrderNumber();

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
        throw new Error(`PRODUCT_UNAVAILABLE: Mahsulot topilmadi yoki sotuvda mavjud emas`);
      }

      let variant = null;
      if (itemInput.variantId) {
        variant = await tx.productVariant.findUnique({
          where: { id: itemInput.variantId },
        });

        if (!variant || variant.status !== 'ACTIVE') {
          throw new Error(`INVALID_VARIANT: Tanlangan variant sotuvda mavjud emas`);
        }
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
            throw new Error(`OUT_OF_STOCK: Sotuvda yetarli variant mahsuloti yo‘q: ${variant.sku}`);
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
            throw new Error(`OUT_OF_STOCK: Sotuvda yetarli mahsulot yo‘q: ${product.sku}`);
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
        idempotencyKey: idempotencyKey && idempotencyKey.trim() !== '' ? idempotencyKey : null,
        customerName: customerName.trim(),
        customerPhone: normalizedPhone,
        region: region || 'Toshkent shahri',
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
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: 'NEW',
            note: 'Buyurtma rasmiylashtirildi',
          },
        },
      },
      include: { items: true, statusHistory: true },
    });

    return createdOrder;
  });

  // Async Telegram Alert (Non-blocking)
  (async () => {
    try {
      let itemsText = '';
      order.items.forEach((item, idx) => {
        itemsText += `  ${idx + 1}. <b>${item.productName}</b> (${item.sku}) — ${item.quantity} dona x ${item.unitPrice.toLocaleString()} so‘m\n`;
      });

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
      const adminLink = siteUrl ? `\n\n🔗 <a href="${siteUrl}/admin/orders/${order.id}">Admin Paneldan ko‘rish</a>` : '';

      const telegramMsg =
        `🛒 <b>YANGI BUYURTMA #${order.orderNumber}</b>\n\n` +
        `👤 <b>Mijoz:</b> ${order.customerName}\n` +
        `📞 <b>Telefon:</b> ${order.customerPhone}\n` +
        `📍 <b>Manzil:</b> ${order.region}, ${order.address}\n` +
        `🚚 <b>Yetkazib berish:</b> ${order.deliveryType}\n` +
        `💳 <b>To‘lov turi:</b> ${order.paymentMethod}\n\n` +
        `📦 <b>Mahsulotlar:</b>\n${itemsText}\n` +
        `💰 <b>Jami Summa:</b> <b>${order.totalAmount.toLocaleString()} so‘m</b>\n` +
        (order.utmSource ? `🎯 <b>UTM:</b> ${order.utmSource} / ${order.utmMedium || ''}\n` : '') +
        adminLink;

      await sendTelegramNotification(telegramMsg);
    } catch (e) {
      console.error('Async Telegram Notification Error:', e);
    }
  })();

  return order;
}

export async function updateOrderStatusServerSide(
  orderId: string,
  newStatus: string,
  adminId?: string,
  note?: string
) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, statusHistory: true },
  });

  if (!order) {
    throw new Error('Buyurtma topilmadi');
  }

  if (order.status === newStatus) {
    return order;
  }

  if (!isValidStatusTransition(order.status, newStatus)) {
    throw new Error(`INVALID_TRANSITION: ${order.status} holatidan ${newStatus} holatiga o‘tish taqiqlangan`);
  }

  // Handle Cancellation and Inventory Restore
  const isCancelling = newStatus === 'CANCELLED';
  const alreadyCancelled = order.statusHistory.some((h) => h.toStatus === 'CANCELLED');

  return await db.$transaction(async (tx) => {
    // If cancelling for the first time, restore inventory safely
    if (isCancelling && !alreadyCancelled) {
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQty: { increment: item.quantity } },
          });
        } else if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQty: { increment: item.quantity } },
          });
        }
      }
    }

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: newStatus,
            adminId: adminId || null,
            note: note || (isCancelling ? 'Buyurtma bekor qilindi, ombor zaxirasi tiklandi' : `Holat o‘zgartirildi: ${newStatus}`),
          },
        },
      },
      include: { items: true, statusHistory: true },
    });

    return updatedOrder;
  });
}
