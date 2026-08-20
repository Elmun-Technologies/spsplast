'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Layers,
  Tag,
  LogOut,
  ExternalLink,
  ChevronDown,
  Settings,
} from 'lucide-react';

interface NavItem {
  label: string;
  labelRu: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    labelRu: 'Панель',
    href: '/admin/dashboard',
    icon: <LayoutDashboard className="w-4 h-4 text-brand-red" />,
  },
  {
    label: 'Buyurtmalar',
    labelRu: 'Заказы',
    href: '/admin/orders',
    icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />,
  },
  {
    label: 'B2B So‘rovlar',
    labelRu: 'B2B Запросы',
    href: '/admin/leads',
    icon: <Users className="w-4 h-4 text-sky-400" />,
  },
  {
    label: 'Mahsulotlar',
    labelRu: 'Продукты',
    href: '/admin/products',
    icon: <Package className="w-4 h-4 text-amber-400" />,
  },
  {
    label: 'Kategoriyalar',
    labelRu: 'Категории',
    href: '/admin/categories',
    icon: <Layers className="w-4 h-4 text-purple-400" />,
  },
  {
    label: 'Atributlar',
    labelRu: 'Атрибуты',
    href: '/admin/attributes',
    icon: <Tag className="w-4 h-4 text-pink-400" />,
  },
];

export default function AdminNavbar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-brand-card border-r border-brand-border flex flex-col justify-between p-4 shrink-0 hidden md:flex">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center font-black text-sm text-white">
            SPS
          </div>
          <span className="font-extrabold text-lg text-white">Admin Panel</span>
        </div>

        <nav className="space-y-1 text-sm font-medium text-gray-300">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-brand-red/20 text-white'
                    : 'hover:bg-brand-border hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-brand-border space-y-2">
        <Link
          href="/uz"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Saytga o'tish</span>
        </Link>

        <Link
          href="/admin/login"
          className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Tizimdan chiqish</span>
        </Link>
      </div>
    </aside>
  );
}
