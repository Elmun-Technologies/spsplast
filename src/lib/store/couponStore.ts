import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Coupon {
  code: string;
  discountPercent: number;
  minAmount?: number;
  descriptionUz: string;
  descriptionRu: string;
}

const COUPONS: Coupon[] = [
  { code: 'SPS10', discountPercent: 10, minAmount: 500000, descriptionUz: '10% chegirma 500k dan yuqori', descriptionRu: 'Скидка 10% от 500k' },
  { code: 'B2B5', discountPercent: 5, minAmount: 300000, descriptionUz: '5% ulgurji chegirma', descriptionRu: 'Оптовая скидка 5%' },
  { code: 'YANGI', discountPercent: 7, descriptionUz: 'Yangi mijozlar uchun 7%', descriptionRu: 'Для новых клиентов 7%' },
];

interface CouponStore {
  appliedCoupon: Coupon | null;
  error: string | null;
  applyCoupon: (code: string, total: number) => boolean;
  removeCoupon: () => void;
  getDiscount: (total: number) => number;
  availableCoupons: Coupon[];
}

export const useCouponStore = create<CouponStore>()(
  persist(
    (set, get) => ({
      appliedCoupon: null,
      error: null,
      availableCoupons: COUPONS,
      applyCoupon: (code, total) => {
        const upper = code.trim().toUpperCase();
        const found = COUPONS.find((c) => c.code === upper);
        if (!found) {
          set({ error: 'Promokod topilmadi', appliedCoupon: null });
          return false;
        }
        if (found.minAmount && total < found.minAmount) {
          set({ error: `Minimal summa ${found.minAmount.toLocaleString()} so'm`, appliedCoupon: null });
          return false;
        }
        set({ appliedCoupon: found, error: null });
        return true;
      },
      removeCoupon: () => set({ appliedCoupon: null, error: null }),
      getDiscount: (total) => {
        const coupon = get().appliedCoupon;
        if (!coupon) return 0;
        return Math.round((total * coupon.discountPercent) / 100);
      },
    }),
    { name: 'spsplast-coupon', version: 1 }
  )
);
