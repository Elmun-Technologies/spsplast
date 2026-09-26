/**
 * Single source of truth for order pricing.
 *
 * Both the storefront (cart drawer / cart / checkout) and `createOrderServerSide`
 * must produce the *same* number. Before this module existed the client summed
 * `item.price * item.quantity` (using whatever unit price happened to be stored
 * when the product was added) while the server re-derived bulk-tier prices from
 * the DB, and promo codes were only written into the order `notes` string. The
 * result was a checkout that displayed one total and an order that stored
 * another.
 *
 * Everything here is pure and dependency-free so it can run in the browser, in a
 * route handler and in `node --test`.
 */

export interface BulkTier {
  /** Inclusive minimum quantity that unlocks the tier. */
  minQty: number;
  /** Multiplier applied to the base unit price. */
  multiplier: number;
  labelUz: string;
  labelRu: string;
}

/** Sorted ascending by `minQty`; the highest matching tier wins. */
export const BULK_TIERS: BulkTier[] = [
  { minQty: 10, multiplier: 0.95, labelUz: '10+ dona — 5% chegirma', labelRu: '10+ шт — скидка 5%' },
  { minQty: 50, multiplier: 0.9, labelUz: '50+ dona — 10% chegirma', labelRu: '50+ шт — скидка 10%' },
];

/** Hard per-line ceiling: mirrors the UI (`QuantitySelector max`). */
export const MAX_QUANTITY_PER_ITEM = 9999;

/** Guards the order endpoint against oversized payloads. */
export const MAX_ORDER_LINES = 50;

/**
 * Unit price for a line after bulk-tier discount.
 * Prices are integer UZS, so the result is rounded the same way on both sides.
 */
export function getBulkUnitPrice(basePrice: number, quantity: number): number {
  const base = Number.isFinite(basePrice) && basePrice > 0 ? basePrice : 0;
  if (!Number.isFinite(quantity) || quantity <= 0) return Math.round(base);

  let multiplier = 1;
  for (const tier of BULK_TIERS) {
    if (quantity >= tier.minQty) multiplier = tier.multiplier;
  }

  return Math.round(base * multiplier);
}

/** The tier that applies to a quantity, or null when the list price applies. */
export function getBulkTier(quantity: number): BulkTier | null {
  let match: BulkTier | null = null;
  for (const tier of BULK_TIERS) {
    if (quantity >= tier.minQty) match = tier;
  }
  return match;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  minAmount?: number;
  descriptionUz: string;
  descriptionRu: string;
}

/**
 * Static promo-code table.
 *
 * This list is shipped to the browser, so it must only ever contain codes that
 * are safe to publish. Validation is repeated server-side in
 * `createOrderServerSide` — never trust a discount computed in the client.
 */
export const COUPONS: Coupon[] = [
  {
    code: 'SPS10',
    discountPercent: 10,
    minAmount: 500000,
    descriptionUz: '10% chegirma 500 000 so‘mdan yuqori',
    descriptionRu: 'Скидка 10% от 500 000 сум',
  },
  {
    code: 'B2B5',
    discountPercent: 5,
    minAmount: 300000,
    descriptionUz: '5% ulgurji chegirma 300 000 so‘mdan yuqori',
    descriptionRu: 'Оптовая скидка 5% от 300 000 сум',
  },
  {
    code: 'YANGI',
    discountPercent: 7,
    descriptionUz: 'Yangi mijozlar uchun 7%',
    descriptionRu: 'Скидка 7% для новых клиентов',
  },
];

export function findCoupon(code: string | null | undefined): Coupon | null {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  if (!upper) return null;
  return COUPONS.find((c) => c.code === upper) || null;
}

export interface PricedLineInput {
  /** Base (list) unit price in UZS — not the tier-adjusted price. */
  basePrice: number;
  quantity: number;
}

export interface Totals {
  /** Sum of tier-adjusted line totals, before the coupon. */
  subtotal: number;
  /** Coupon discount in UZS (0 when no valid coupon applies). */
  discount: number;
  /** What the customer pays: `subtotal - discount`. */
  total: number;
  /** Number of units across all lines. */
  quantity: number;
  coupon: Coupon | null;
}

export function computeCouponDiscount(subtotal: number, coupon: Coupon | null): number {
  if (!coupon || subtotal <= 0) return 0;
  if (coupon.minAmount && subtotal < coupon.minAmount) return 0;
  return Math.round((subtotal * coupon.discountPercent) / 100);
}

/** True when the coupon is usable for this subtotal (used for UI messaging). */
export function isCouponApplicable(subtotal: number, coupon: Coupon | null): boolean {
  if (!coupon) return false;
  if (coupon.minAmount && subtotal < coupon.minAmount) return false;
  return true;
}

/**
 * Deterministic order total from base prices + quantities (+ optional coupon).
 * Used by the cart UI for display and by the server to persist the real total.
 */
export function computeTotals(lines: PricedLineInput[], couponCode?: string | null): Totals {
  let subtotal = 0;
  let quantity = 0;

  for (const line of lines) {
    const qty = Math.floor(line.quantity || 0);
    if (qty <= 0) continue;
    subtotal += getBulkUnitPrice(line.basePrice, qty) * qty;
    quantity += qty;
  }

  const coupon = findCoupon(couponCode);
  const discount = computeCouponDiscount(subtotal, coupon);

  return {
    subtotal,
    discount,
    total: subtotal - discount,
    quantity,
    coupon: discount > 0 ? coupon : null,
  };
}
