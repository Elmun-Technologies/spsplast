import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Package, ShoppingBag, Users, Layers, LogOut, ExternalLink } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-dark flex text-white font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-brand-card border-r border-brand-border flex flex-col justify-between p-4 shrink-0 hidden md:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-brand-red flex items-center justify-center font-black text-sm text-white">
              SPS
            </div>
            <span className="font-extrabold text-lg text-white">Admin Panel</span>
          </div>

          <nav className="space-y-1 text-sm font-medium text-gray-300">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-border hover:text-white transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-brand-red" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/admin/orders"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-border hover:text-white transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Buyurtmalar (Orders)</span>
            </Link>

            <Link
              href="/admin/leads"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-border hover:text-white transition-colors"
            >
              <Users className="w-4 h-4 text-sky-400" />
              <span>B2B So‘rovlar (Leads)</span>
            </Link>

            <Link
              href="/admin/products"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-brand-border hover:text-white transition-colors"
            >
              <Package className="w-4 h-4 text-amber-400" />
              <span>Mahsulotlar</span>
            </Link>
          </nav>
        </div>

        <div className="pt-4 border-t border-brand-border space-y-2">
          <Link
            href="/uz"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Saytga o‘tish (Public site)</span>
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 sm:p-10">{children}</main>
    </div>
  );
}
