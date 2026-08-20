import React from 'react';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { Plus } from 'lucide-react';

export default async function AdminProductsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const products = await db.product.findMany({
    include: {
      translations: { where: { locale: 'uz' } },
      media: { orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Mahsulotlar Boshqaruvi</h1>
          <p className="text-xs text-gray-400 mt-1">Saytdagi barcha qolip va fasad mahsulotlari ({products.length} ta)</p>
        </div>

        <Link href="/admin/products/create">
          <Button className="gap-2 font-bold">
            <Plus className="w-4 h-4" />
            <span>Yangi Mahsulot Qo‘shish</span>
          </Button>
        </Link>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-brand-dark text-gray-400 uppercase font-mono">
              <tr>
                <th className="p-4">Rasm</th>
                <th className="p-4">Nomi & SKU</th>
                <th className="p-4">Narxi</th>
                <th className="p-4">Resurs (Quyish)</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {products.map((p) => {
                const name = p.translations[0]?.name || p.sku;
                const mainMedia = p.media.find((m) => m.type === 'MOLD' || m.type === 'MAIN') || p.media[0];

                return (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="p-4">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black/40 border border-brand-border">
                        {mainMedia ? (
                          <Image
                            src={mainMedia.url}
                            alt={name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-brand-dark flex items-center justify-center text-[10px] text-gray-500">
                            No Img
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-white text-sm">{name}</p>
                      <p className="font-mono text-[10px] text-gray-400">SKU: {p.sku}</p>
                    </td>
                    <td className="p-4 font-extrabold text-white">{formatPrice(p.basePrice, 'uz')}</td>
                    <td className="p-4 font-mono font-bold text-emerald-400">
                      {p.durabilityCasts ? `${p.durabilityCasts}+` : '—'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
