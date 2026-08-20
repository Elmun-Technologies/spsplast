import React from 'react';
import { db } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { Plus, Check, X } from 'lucide-react';

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    include: { category: true, images: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Mahsulotlar Boshqaruvi</h1>
          <p className="text-xs text-gray-400 mt-1">Saytdagi barcha qolip va fasad mahsulotlari</p>
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
                <th className="p-4">Kategoriya</th>
                <th className="p-4">Narxi</th>
                <th className="p-4">O‘lchami</th>
                <th className="p-4">Resurs (Quyish)</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-white/5">
                  <td className="p-4">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black/40 border border-brand-border">
                      <Image
                        src={p.images[0]?.url || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80'}
                        alt={p.titleUz}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-white text-sm">{p.titleUz}</p>
                    <p className="font-mono text-[10px] text-gray-400">SKU: {p.sku}</p>
                  </td>
                  <td className="p-4 font-semibold text-brand-red">{p.category.nameUz}</td>
                  <td className="p-4 font-extrabold text-white">{formatPrice(p.price, 'uz')}</td>
                  <td className="p-4">{p.dimensions || '—'}</td>
                  <td className="p-4 font-mono font-bold text-emerald-400">
                    {p.durabilityCasts ? `${p.durabilityCasts}+` : '—'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.inStock
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {p.inStock ? 'Mavjud' : 'Mavjud emas'}
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
