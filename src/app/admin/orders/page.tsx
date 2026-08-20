import React from 'react';
import { db } from '@/lib/db';
import { formatPrice } from '@/lib/utils';

export default async function AdminOrdersPage() {
  const orders = await db.order.findMany({
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Buyurtmalar Boshqaruvi</h1>
        <p className="text-xs text-gray-400 mt-1">Jami buyurtmalar ro‘yxati</p>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-brand-dark text-gray-400 uppercase font-mono">
              <tr>
                <th className="p-4">Raqami & Sana</th>
                <th className="p-4">Xaridor</th>
                <th className="p-4">Telefon</th>
                <th className="p-4">Manzil & Izoh</th>
                <th className="p-4">Mahsulotlar</th>
                <th className="p-4">Summa</th>
                <th className="p-4">UTM Source</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-white/5">
                  <td className="p-4 space-y-1">
                    <p className="font-mono font-bold text-brand-red">#{o.orderNumber}</p>
                    <p className="text-[10px] text-gray-500">{new Date(o.createdAt).toLocaleString()}</p>
                  </td>
                  <td className="p-4 font-bold text-white">{o.customerName}</td>
                  <td className="p-4 font-mono text-gray-200">{o.customerPhone}</td>
                  <td className="p-4">
                    <p className="font-semibold text-white">{o.region}</p>
                    <p className="text-[11px] text-gray-400">{o.address}</p>
                  </td>
                  <td className="p-4">
                    <ul className="space-y-1">
                      {o.items.map((item) => (
                        <li key={item.id} className="text-[11px]">
                          • <span className="font-medium text-white">{item.title}</span> ({item.quantity} dona)
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-4 font-extrabold text-white">{formatPrice(o.totalAmount, 'uz')}</td>
                  <td className="p-4 font-mono text-[10px] text-sky-400">
                    {o.utmSource ? `${o.utmSource} / ${o.utmMedium || ''}` : 'Direct'}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
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
