import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  sku: string;
}

interface WishlistStore {
  items: WishlistItem[];
  toggleWishlist: (item: WishlistItem) => void;
  removeWishlist: (id: string) => void;
  isWishlisted: (id: string) => boolean;
  getCount: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggleWishlist: (item) => {
        const exists = get().items.find((i) => i.id === item.id);
        if (exists) {
          set({ items: get().items.filter((i) => i.id !== item.id) });
        } else {
          set({ items: [item, ...get().items].slice(0, 50) });
        }
      },
      removeWishlist: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      isWishlisted: (id) => !!get().items.find((i) => i.id === id),
      getCount: () => get().items.length,
    }),
    { name: 'spsplast-wishlist', version: 1 }
  )
);
