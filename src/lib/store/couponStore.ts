import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  COUPONS,
  computeCouponDiscount,
  findCoupon,
  isCouponApplicable,
  type Coupon,
} from '@/lib/pricing';

export type { Coupon };

interface CouponStore {
  appliedCoupon: Coupon | null;
  error: string | null;
  /** Re-validates the stored code and returns the discount for `total`. */
  applyCoupon: (code: string, total: number) => boolean;
  removeCoupon: () => void;
  getDiscount: (total: number) => number;
  availableCoupons: Coupon[];
}

/**
 * Client-side promo-code state.
 *
 * The code list lives in `@/lib/pricing` and the discount is recomputed by the
 * server in `createOrderServerSide` — this store only drives the UI. A coupon
 * that stops qualifying (because the cart shrank below `minAmount`) is dropped
 * here so the displayed total always equals the total that will be stored.
 */
export const useCouponStore = create<CouponStore>()(
  persist(
    (set, get) => ({
      appliedCoupon: null,
      error: null,
      availableCoupons: COUPONS,
      applyCoupon: (code, total) => {
        const coupon = findCoupon(code);

        if (!coupon) {
          set({ error: 'Promokod topilmadi', appliedCoupon: null });
          return false;
        }

        if (!isCouponApplicable(total, coupon)) {
          set({
            error: `Minimal summa ${(coupon.minAmount || 0).toLocaleString()} so‘m`,
            appliedCoupon: null,
          });
          return false;
        }

        set({ appliedCoupon: coupon, error: null });
        return true;
      },
      removeCoupon: () => set({ appliedCoupon: null, error: null }),
      getDiscount: (total) => computeCouponDiscount(total, get().appliedCoupon),
    }),
    {
      name: 'spsplast-coupon',
      version: 2,
      // Re-resolve the persisted code against the current table so a retired
      // promo code cannot survive in localStorage and show a phantom discount.
      migrate: (persistedState: any) => {
        const state = persistedState || {};
        return {
          ...state,
          appliedCoupon: findCoupon(state.appliedCoupon?.code),
          error: null,
        };
      },
    }
  )
);
