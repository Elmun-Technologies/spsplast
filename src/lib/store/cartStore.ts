import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // unique deterministic cart key: productId or `${productId}-${variantId}`
  productId: string;
  variantId?: string;
  title: string;
  sku: string;
  price: number;
  image: string;
  quantity: number;
  dimensions?: string;
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
        const safeQty = typeof newItem.quantity === 'number' && !isNaN(newItem.quantity) && newItem.quantity > 0
          ? Math.floor(newItem.quantity)
          : 1;

        const itemId = newItem.variantId
          ? `${newItem.productId}-${newItem.variantId}`
          : newItem.productId;

        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.id === itemId);
          if (existingIndex > -1) {
            const updated = [...state.items];
            updated[existingIndex].quantity += safeQty;
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
                return newQty > 0 ? { ...item, quantity: newQty } : null;
              }
              return item;
            })
            .filter(Boolean) as CartItem[];
          return { items: updated };
        });
      },

      setQuantity: (id, quantity) => {
        const safeQty = typeof quantity === 'number' && !isNaN(quantity) && quantity > 0
          ? Math.floor(quantity)
          : 1;

        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, quantity: safeQty } : item)),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + (item.quantity || 0), 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price || 0) * (item.quantity || 0), 0);
      },
    }),
    {
      name: 'spsplast-cart',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return { ...persistedState, items: persistedState.items || [] };
        }
        return persistedState as CartStore;
      },
    }
  )
);
