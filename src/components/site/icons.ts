import { LayoutGrid, Search, ChartNoAxesColumn, ClipboardList, Phone, Menu, X, TriangleAlert, RotateCw, Download, Send, ArrowRight, MessageCircle } from 'lucide-react';

/**
 * Lucide ikonlari (ds/README: 1.5px chiziq, currentColor).
 * Maketdagi SVG'lar bilan bir xil ko'rinish (source/Header.dc.html).
 */
export const Icon = {
  grid: LayoutGrid,
  download: Download,
  telegram: Send,
  whatsapp: MessageCircle,
  arrowRight: ArrowRight,
  search: Search,
  compare: ChartNoAxesColumn,
  list: ClipboardList,
  phone: Phone,
  menu: Menu,
  close: X,
  alert: TriangleAlert,
  refresh: RotateCw,
};

export type IconName = keyof typeof Icon;
