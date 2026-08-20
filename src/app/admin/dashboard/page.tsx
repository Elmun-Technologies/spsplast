import React from 'react';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { ShoppingBag, Users, Package, TrendingUp, ArrowRight } from 'lucide-react';

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const totalOrders = await db.order.count();
  const totalLeads = await db.lead.count();
  const totalProducts = await db.product.count();

  const orders = await db.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });

  const totalRevenue = await db.order.aggregate({
    _sum: { totalAmount: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Boshqaruv Paneli (Dashboard)</h1>
        <p className="text-xs text-gray-400 mt-1">SPS PLAST online magazin ko‘rsatkichlari (Admin: {session.admin.name})</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Jami Tushum</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">
            {formatPrice(totalRevenue._sum.totalAmount || 0, 'uz')}
          </p>
        </div>

        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Buyurtmalar</span>
            <ShoppingBag className="w-5 h-5 text-brand-red" />
          </div>
          <p className="text-2xl font-black text-white">{totalOrders} ta</p>
        </div>

        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">B2B So‘rovlar</span>
            <Users className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-2xl font-black text-white">{totalLeads} ta</p>
        </div>

        <div className="bg-brand-card border border-brand-border p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Mahsulotlar Turi</span>
            <Package className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white">{totalProducts} ta</p>
        </div>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">So‘nggi Buyurtmalar</h2>
          <Link href="/admin/orders" className="text-xs text-brand-red font-bold flex items-center gap-1">
            <span>Barchasini ko‘rish</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-brand-dark text-gray-400 uppercase font-mono">
              <tr>
                <th className="p-3">Raqami</th>
                <th className="p-3">Xaridor</th>
                <th className="p-3">Telefon</th>
                <th className="p-3">Manzil</th>
                <th className="p-3">Summa</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-white/5">
                  <td className="p-3 font-mono font-bold text-brand-red">#{o.orderNumber}</td>
                  <td className="p-3 font-medium text-white">{o.customerName}</td>
                  <td className="p-3 font-mono">{o.customerPhone}</td>
                  <td className="p-3">{o.region}</td>
                  <td className="p-3 font-bold text-white">{formatPrice(o.totalAmount, 'uz')}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
