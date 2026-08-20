import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { formatPrice } from '@/lib/utils';
import { Eye, Search, Filter } from 'lucide-react';

interface AdminOrdersPageProps {
  searchParams: {
    search?: string;
    status?: string;
    page?: string;
  };
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const search = searchParams.search || '';
  const status = searchParams.status || '';
  const page = parseInt(searchParams.page || '1', 10);
  const limit = 25;
  const skip = (page - 1) * limit;

  const whereClause: any = {};

  if (status) {
    whereClause.status = status;
  }

  if (search) {
    whereClause.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
      { customerPhone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [orders, totalCount] = await Promise.all([
    db.order.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.order.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Buyurtmalar Boshqaruvi</h1>
          <p className="text-xs text-gray-400 mt-1">Jami buyurtmalar: {totalCount} ta</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <form method="GET" className="bg-brand-card border border-brand-border rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Raqami, xaridor ismi yoki telefon bo‘yicha qidiruv..."
            className="w-full bg-brand-dark border border-brand-border rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            name="status"
            defaultValue={status}
            className="bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-red w-full sm:w-auto"
          >
            <option value="">Barcha Holatlar</option>
            <option value="NEW">NEW (Yangi)</option>
            <option value="CONFIRMED">CONFIRMED (Tasdiqlangan)</option>
            <option value="PROCESSING">PROCESSING (Jarayonda)</option>
            <option value="READY">READY (Tayyor)</option>
            <option value="SHIPPED">SHIPPED (Yuborilgan)</option>
            <option value="DELIVERED">DELIVERED (Yetkazildi)</option>
            <option value="CANCELLED">CANCELLED (Bekor qilingan)</option>
          </select>

          <button
            type="submit"
            className="bg-brand-red text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Filtrlash
          </button>
        </div>
      </form>

      {/* Orders Table */}
      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-brand-dark text-gray-400 uppercase font-mono">
              <tr>
                <th className="p-4">Raqami & Sana</th>
                <th className="p-4">Xaridor</th>
                <th className="p-4">Telefon</th>
                <th className="p-4">Mintaqa / Manzil</th>
                <th className="p-4">Mahsulotlar</th>
                <th className="p-4">Summa</th>
                <th className="p-4">Manba (UTM)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400">
                    Buyurtmalar topilmadi.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 space-y-1">
                      <Link href={`/admin/orders/${o.id}`} className="font-mono font-bold text-brand-red hover:underline">
                        #{o.orderNumber}
                      </Link>
                      <p className="text-[10px] text-gray-500">{new Date(o.createdAt).toLocaleString()}</p>
                    </td>
                    <td className="p-4 font-bold text-white">{o.customerName}</td>
                    <td className="p-4 font-mono text-gray-200">{o.customerPhone}</td>
                    <td className="p-4">
                      <p className="font-semibold text-white">{o.region}</p>
                      <p className="text-[11px] text-gray-400 truncate max-w-[150px]">{o.address}</p>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-white">{o.items.length} xil mahsulot</span>
                    </td>
                    <td className="p-4 font-extrabold text-white">{formatPrice(o.totalAmount, 'uz')}</td>
                    <td className="p-4 font-mono text-[10px] text-sky-400">
                      {o.utmSource ? `${o.utmSource} / ${o.utmMedium || ''}` : 'Direct'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded font-bold text-[10px] ${o.status === 'CANCELLED'
                          ? 'bg-red-500/20 text-red-400'
                          : o.status === 'DELIVERED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-brand-red/20 text-brand-red'
                        }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex items-center gap-1 bg-brand-dark border border-brand-border px-3 py-1.5 rounded text-xs text-gray-200 hover:text-white hover:border-gray-500 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Batafsil</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-brand-border flex items-center justify-between text-xs">
            <span className="text-gray-400">
              Sahifa {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/orders?page=${page - 1}&search=${search}&status=${status}`}
                  className="px-3 py-1 bg-brand-dark border border-brand-border rounded text-white"
                >
                  Oldingi
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/orders?page=${page + 1}&search=${search}&status=${status}`}
                  className="px-3 py-1 bg-brand-dark border border-brand-border rounded text-white"
                >
                  Keyingi
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
