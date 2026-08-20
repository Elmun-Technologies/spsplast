'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreateProductPage() {
  const router = useRouter();

  const [titleUz, setTitleUz] = useState('');
  const [titleRu, setTitleRu] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [descriptionUz, setDescriptionUz] = useState('');
  const [descriptionRu, setDescriptionRu] = useState('');
  const [yieldPerCast, setYieldPerCast] = useState('');
  const [durabilityCasts, setDurabilityCasts] = useState('');
  const [moldImageUrl, setMoldImageUrl] = useState('');
  const [resultImageUrl, setResultImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku,
          titleUz,
          titleRu: titleRu || titleUz,
          price: Number(price),
          oldPrice: oldPrice ? Number(oldPrice) : null,
          descriptionUz,
          descriptionRu: descriptionRu || descriptionUz,
          yieldPerCast: yieldPerCast ? Number(yieldPerCast) : null,
          durabilityCasts: durabilityCasts ? Number(durabilityCasts) : null,
          moldImageUrl: moldImageUrl || null,
          resultImageUrl: resultImageUrl || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin/products');
      } else {
        setErrorMsg(data.error || 'Mahsulot yaratishda xatolik');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Server xatosi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-xs text-brand-red font-bold">
        <ArrowLeft className="w-4 h-4" />
        <span>Mahsulotlar ro‘yxatiga qaytish</span>
      </Link>

      <h1 className="text-3xl font-black text-white">Yangi Mahsulot Yaratish</h1>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Nomi (O‘zbekcha) *</label>
            <input
              type="text"
              required
              value={titleUz}
              onChange={(e) => setTitleUz(e.target.value)}
              placeholder="Bruschatka qolipi 8 Kirpich"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Nomi (Ruscha)</label>
            <input
              type="text"
              value={titleRu}
              onChange={(e) => setTitleRu(e.target.value)}
              placeholder="Форма для брусчатки 8 Кирпичей"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Artikul / SKU *</label>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="SPS-BR-008"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Narxi (So‘m) *</label>
            <input
              type="number"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="25000"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Eski Narxi (Aksiya bo‘lsa)</label>
            <input
              type="number"
              value={oldPrice}
              onChange={(e) => setOldPrice(e.target.value)}
              placeholder="30000"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Bir quyishda mahsulot soni</label>
            <input
              type="number"
              value={yieldPerCast}
              onChange={(e) => setYieldPerCast(e.target.value)}
              placeholder="6"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Resurs (Quyishlar soni)</label>
            <input
              type="number"
              value={durabilityCasts}
              onChange={(e) => setDurabilityCasts(e.target.value)}
              placeholder="350"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Qolip Rasmi URL (Role: MOLD)</label>
            <input
              type="text"
              value={moldImageUrl}
              onChange={(e) => setMoldImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Tayyor Natija Rasmi URL (Role: FINISHED_RESULT)</label>
            <input
              type="text"
              value={resultImageUrl}
              onChange={(e) => setResultImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Tavsif (O‘zbekcha)</label>
          <textarea
            rows={3}
            value={descriptionUz}
            onChange={(e) => setDescriptionUz(e.target.value)}
            placeholder="Mahsulot afzalliklari va beton quyish tartibi..."
            className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <Button type="submit" isLoading={loading} size="lg" className="w-full gap-2 font-bold">
          <Save className="w-4 h-4" />
          <span>Mahsulotni Saqlash</span>
        </Button>
      </form>
    </div>
  );
}
