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
  const [categoryId, setCategoryId] = useState('');
  const [descriptionUz, setDescriptionUz] = useState('');
  const [descriptionRu, setDescriptionRu] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [material, setMaterial] = useState('');
  const [yieldPerCast, setYieldPerCast] = useState('');
  const [durabilityCasts, setDurabilityCasts] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [resultImage, setResultImage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleUz,
          titleRu: titleRu || titleUz,
          sku,
          price: Number(price),
          oldPrice: oldPrice ? Number(oldPrice) : null,
          categoryId: categoryId || 'cat_fallback',
          descriptionUz,
          descriptionRu: descriptionRu || descriptionUz,
          dimensions,
          material,
          yieldPerCast: yieldPerCast ? Number(yieldPerCast) : null,
          durabilityCasts: durabilityCasts ? Number(durabilityCasts) : null,
          images: imageUrl ? [imageUrl] : [],
          resultImage: resultImage || null,
          inStock: true,
        }),
      });

      if (res.ok) {
        router.push('/admin/products');
      }
    } catch (err) {
      console.error(err);
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
            <label className="block text-xs font-semibold text-gray-300 mb-1">O‘lchami (mm)</label>
            <input
              type="text"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              placeholder="400x400x50 mm"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Material</label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="ABS Plastik 2mm"
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
            <label className="block text-xs font-semibold text-gray-300 mb-1">Qolip Rasmi URL</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Tayyor Natija Rasmi URL (USP Result)</label>
            <input
              type="text"
              value={resultImage}
              onChange={(e) => setResultImage(e.target.value)}
              placeholder="https://..."
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Tavsif (Description)</label>
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
