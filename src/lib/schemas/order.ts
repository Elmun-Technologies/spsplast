import { z } from 'zod';
import { MAX_ORDER_LINES, MAX_QUANTITY_PER_ITEM } from '@/lib/pricing';

/**
 * Validation for the public `POST /api/orders` body.
 *
 * Lives outside `orderService` (which pulls in Prisma) so it can be unit tested
 * and reused by the route handler to reject malformed payloads before any
 * database work happens.
 */
const REQUIRED = 'MAJBURIY_MAYDONLAR_BOSH: Majburiy maydonlar to‘ldirilmagan';

const orderItemSchema = z.object({
  productId: z.string({ required_error: REQUIRED, invalid_type_error: REQUIRED }).min(1, REQUIRED).max(64),
  variantId: z.string().min(1).max(64).optional(),
  quantity: z
    .number()
    .int('MIQDOR_XATOSI: Miqdor butun son bo‘lishi kerak')
    .min(1, 'MIQDOR_XATOSI: Miqdor kamida 1 bo‘lishi kerak')
    .max(MAX_QUANTITY_PER_ITEM, `MIQDOR_XATOSI: Miqdor ${MAX_QUANTITY_PER_ITEM} dan oshmasligi kerak`),
});

export const createOrderSchema = z.object({
  customerName: z
    .string({ required_error: 'MAJBURIY_MAYDONLAR_BOSH: Ism kiritilishi shart', invalid_type_error: 'MAJBURIY_MAYDONLAR_BOSH: Ism kiritilishi shart' })
    .trim()
    .min(2, 'MAJBURIY_MAYDONLAR_BOSH: Ism kamida 2 ta belgidan iborat bo‘lishi kerak')
    .max(120, 'Ism juda uzun'),
  customerPhone: z
    .string({ required_error: 'MAJBURIY_MAYDONLAR_BOSH: Telefon raqami kiritilishi shart', invalid_type_error: 'MAJBURIY_MAYDONLAR_BOSH: Telefon raqami kiritilishi shart' })
    .trim()
    .min(7, 'TELEFON_XATOSI: Telefon raqami noto‘g‘ri (+998 XX XXX XX XX)')
    .max(32),
  region: z.string().trim().max(120).optional().default(''),
  city: z.string().trim().max(120).optional().default(''),
  address: z.string().trim().max(500).optional().default(''),
  deliveryType: z.enum(['COURIER', 'PICKUP']).optional().default('COURIER'),
  paymentMethod: z.enum(['CASH', 'CLICK', 'PAYME', 'BANK_TRANSFER']).optional().default('CASH'),
  notes: z.string().trim().max(1000).optional().default(''),
  idempotencyKey: z.string().trim().max(128).optional(),
  couponCode: z.string().trim().max(32).nullable().optional(),
  items: z
    .array(orderItemSchema, { required_error: 'MIQDOR_XATOSI: Savatda kamida bitta mahsulot bo‘lishi kerak', invalid_type_error: 'MIQDOR_XATOSI: Savatda kamida bitta mahsulot bo‘lishi kerak' })
    .min(1, 'MIQDOR_XATOSI: Savatda kamida bitta mahsulot bo‘lishi kerak')
    .max(MAX_ORDER_LINES, `MIQDOR_XATOSI: Bir buyurtmada ko‘pi bilan ${MAX_ORDER_LINES} ta pozitsiya bo‘lishi mumkin`),
  locale: z.enum(['uz', 'ru']).optional().default('uz'),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
  utmContent: z.string().max(200).optional(),
  utmTerm: z.string().max(200).optional(),
  gclid: z.string().max(200).optional(),
  fbclid: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  landingPage: z.string().max(500).optional(),
});

export type CreateOrderPayload = z.infer<typeof createOrderSchema>;

/**
 * The client sends `variantId: undefined` for non-variant products (dropped by
 * JSON) but some callers send empty strings or string quantities. Normalize
 * both shapes before validation.
 */
export function normalizeOrderInput(rawInput: unknown): Record<string, unknown> {
  if (!rawInput || typeof rawInput !== 'object') return {};
  const input = { ...(rawInput as Record<string, unknown>) };

  if (Array.isArray(input.items)) {
    input.items = (input.items as any[]).map((item) => {
      if (!item || typeof item !== 'object') return item;
      const next = { ...item };
      if (typeof next.quantity === 'string') {
        const asNumber = Number(next.quantity);
        next.quantity = Number.isFinite(asNumber) ? asNumber : next.quantity;
      }
      if (!next.variantId) delete next.variantId;
      return next;
    });
  }

  if (input.couponCode === '') input.couponCode = null;
  return input;
}
