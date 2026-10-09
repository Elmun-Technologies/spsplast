import { LayoutGrid, Search, ChartNoAxesColumn, ClipboardList, Phone, Menu, X } from 'lucide-react';

/**
 * Lucide ikonlari (ds/README: 1.5px chiziq, currentColor).
 * Maketdagi SVG'lar bilan bir xil ko'rinish (source/Header.dc.html).
 */
export const Icon = {
  grid: LayoutGrid,
  search: Search,
  compare: ChartNoAxesColumn,
  list: ClipboardList,
  phone: Phone,
  menu: Menu,
  close: X,
};

export type IconName = keyof typeof Icon;
