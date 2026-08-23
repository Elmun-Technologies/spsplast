import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompareItem {
  id: string;
  slug: string;
  title: string;
  price: number;
  oldPrice?: number | null;
  image: string;
  sku: string;
  dimensions?: string | null;
  material?: string | null;
  inStock: boolean;
}

interface CompareStore {
  items: CompareItem[];
  toggleCompare: (item: CompareItem) => void;
  removeCompare: (id: string) => void;
  isCompared: (id: string) => boolean;
  getCount: () => number;
  clearCompare: () => void;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggleCompare: (item) => {
        const exists = get().items.find((i) => i.id === item.id);
        if (exists) {
          set({ items: get().items.filter((i) => i.id !== item.id) });
        } else {
          if (get().items.length >= 4) {
            // max 4
            set({ items: [...get().items.slice(1), item] });
          } else {
            set({ items: [...get().items, item] });
          }
        }
      },
      removeCompare: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      isCompared: (id) => !!get().items.find((i) => i.id === id),
      getCount: () => get().items.length,
      clearCompare: () => set({ items: [] }),
    }),
    { name: 'spsplast-compare', version: 1 }
  )
);
