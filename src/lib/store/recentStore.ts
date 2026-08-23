import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RecentProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  sku: string;
  viewedAt: number;
}

interface RecentStore {
  items: RecentProduct[];
  addRecent: (product: Omit<RecentProduct, 'viewedAt'>) => void;
  clearRecent: () => void;
}

export const useRecentStore = create<RecentStore>()(
  persist(
    (set, get) => ({
      items: [],
      addRecent: (product) => {
        set((state) => {
          const filtered = state.items.filter((i) => i.id !== product.id);
          const newItem = { ...product, viewedAt: Date.now() };
          const updated = [newItem, ...filtered].slice(0, 12);
          return { items: updated };
        });
      },
      clearRecent: () => set({ items: [] }),
    }),
    {
      name: 'spsplast-recent',
      version: 1,
    }
  )
);
