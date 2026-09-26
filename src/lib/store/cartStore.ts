import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Quantities are positive integers, capped to the same limit the server enforces. */
export function clampQuantity(quantity: unknown): number {
  const n = typeof quantity === 'number' ? quantity : Number(quantity);
  if (!Number.isFinite(n) || n <= 0) return 1;
  return Math.min(Math.floor(n), MAX_QUANTITY_PER_ITEM);
}

import { MAX_QUANTITY_PER_ITEM, getBulkUnitPrice } from '@/lib/pricing';

export interface CartItem {
  id: string; // unique deterministic cart key: productId or `${productId}-${variantId}`
  productId: string;
  variantId?: string;
  title: string;
  sku: string;
  /**
   * BASE (list) unit price in UZS.
   *
   * Never store a bulk-tier price here: the tier depends on the current
   * quantity, which the shopper can change from the cart. Use
   * `getLineUnitPrice(item)` / `getCartTotals(items)` to derive what is
   * actually charged — the server applies the same rule in `orderService`.
   */
  price: number;
  image: string;
  quantity: number;
  dimensions?: string;
}

/** Tier-adjusted unit price for a cart line. */
export function getLineUnitPrice(item: Pick<CartItem, 'price' | 'quantity'>): number {
  return getBulkUnitPrice(item.price, item.quantity);
}

/** Tier-adjusted total for a single cart line. */
export function getLineTotal(item: Pick<CartItem, 'price' | 'quantity'>): number {
  return getLineUnitPrice(item) * (item.quantity || 0);
}

/** Sum of tier-adjusted line totals — matches `computeTotals().subtotal`. */
export function getCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + getLineTotal(item), 0);
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (newItem) => {
        const safeQty = clampQuantity(newItem.quantity);

        const itemId = newItem.variantId
          ? `${newItem.productId}-${newItem.variantId}`
          : newItem.productId;

        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.id === itemId);
          if (existingIndex > -1) {
            // Never mutate the existing item object: subscribers that memoize on
            // item identity (React.memo / useShallow) would keep the stale row.
            const updated = [...state.items];
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: clampQuantity(updated[existingIndex].quantity + safeQty),
            };
            return { items: updated, isOpen: true };
          } else {
            return {
              items: [...state.items, { ...newItem, quantity: safeQty, id: itemId }],
              isOpen: true,
            };
          }
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      updateQuantity: (id, delta) => {
        set((state) => {
          const updated = state.items
            .map((item) => {
              if (item.id === id) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return null;
                return { ...item, quantity: clampQuantity(newQty) };
              }
              return item;
            })
            .filter(Boolean) as CartItem[];
          return { items: updated };
        });
      },

      setQuantity: (id, quantity) => {
        const safeQty = clampQuantity(quantity);

        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, quantity: safeQty } : item)),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + (item.quantity || 0), 0);
      },

      getTotalPrice: () => {
        return getCartSubtotal(get().items);
      },
    }),
    {
      name: 'spsplast-cart',
      // v2: `price` is now always the base unit price and quantities are clamped.
      version: 2,
      migrate: (persistedState: any, version: number) => {
        const state = persistedState || {};
        const items = (state.items || []).map((item: any) => ({
          ...item,
          quantity: clampQuantity(item?.quantity),
        }));
        if (version < 2) {
          return { ...state, items };
        }
        return { ...state, items } as CartStore;
      },
    }
  )
);
