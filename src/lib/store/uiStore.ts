import { create } from 'zustand';

interface UIStore {
  /**
   * True while a page-level sticky action bar (e.g. the product "add to cart"
   * bar) owns the bottom edge on mobile. The global sticky contact bar listens
   * to this so two fixed bars never stack on top of each other.
   */
  bottomBarOwner: 'contact' | 'product' | null;
  setBottomBarOwner: (owner: UIStore['bottomBarOwner']) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  bottomBarOwner: 'contact',
  setBottomBarOwner: (owner) => set({ bottomBarOwner: owner }),
}));
