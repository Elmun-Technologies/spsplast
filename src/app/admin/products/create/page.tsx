'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, Package, Tag, DollarSign, FileText } from 'lucide-react';
import Link from 'next/link';
import { ProductMediaUploader, MediaItem } from '@/components/admin/ProductMediaUploader';

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
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const moldMedia = media.find((m) => m.type === 'MOLD');
      const resultMedia = media.find((m) => m.type === 'FINISHED_RESULT');

      const res = await fetch('/api/admin/products', {
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
          moldImageUrl: moldMedia?.url || null,
          resultImageUrl: resultMedia?.url || null,
          media,
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
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm text-brand-red font-bold hover:gap-3 transition-all">
        <ArrowLeft className="w-4 h-4" />
        <span>Mahsulotlar ro'yxatiga qaytish</span>
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-brand-red flex items-center justify-center">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Yangi mahsulot yaratish</h1>
          <p className="text-sm text-gray-400 mt-0.5">Barcha maydonlarni to'ldiring va rasmlarni yuklang</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-[#1E222A] border border-[#2A2F3A] rounded-2xl p-6 space-y-5">
            <h3 className="font-bold text-white flex items-center gap-2 border-b border-[#2A2F3A] pb-3">
              <FileText className="w-4 h-4 text-brand-red" />
              Asosiy ma'lumotlar
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Nomi (O'zbekcha) *</label>
                <input
                  type="text"
                  required
                  value={titleUz}
                  onChange={(e) => setTitleUz(e.target.value)}
                  placeholder="Bruschatka qolipi 8 Kirpich"
                  className="w-full bg-[#161920] border border-[#2A2F3A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Nomi (Ruscha)</label>
                <input
                  type="text"
                  value={titleRu}
                  onChange={(e) => setTitleRu(e.target.value)}
                  placeholder="Форма для брусчатки 8 Кирпичей"
                  className="w-full bg-[#161920] border border-[#2A2F3A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Tavsif (O'zbekcha)</label>
              <textarea
                rows={3}
                value={descriptionUz}
                onChange={(e) => setDescriptionUz(e.target.value)}
                placeholder="Mahsulot afzalliklari va beton quyish tartibi..."
                className="w-full bg-[#161920] border border-[#2A2F3A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Tavsif (Ruscha)</label>
              <textarea
                rows={3}
                value={descriptionRu}
                onChange={(e) => setDescriptionRu(e.target.value)}
                placeholder="Описание на русском..."
                className="w-full bg-[#161920] border border-[#2A2F3A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
              />
            </div>
          </div>

          <div className="bg-[#1E222A] border border-[#2A2F3A] rounded-2xl p-6 space-y-5">
            <h3 className="font-bold text-white flex items-center gap-2 border-b border-[#2A2F3A] pb-3">
              <Tag className="w-4 h-4 text-brand-red" />
              Texnik parametrlar
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Bir quyishda dona</label>
                <input
                  type="number"
                  value={yieldPerCast}
                  onChange={(e) => setYieldPerCast(e.target.value)}
                  placeholder="6"
                  className="w-full bg-[#161920] border border-[#2A2F3A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Resurs (marta)</label>
                <input
                  type="number"
                  value={durabilityCasts}
                  onChange={(e) => setDurabilityCasts(e.target.value)}
                  placeholder="350"
                  className="w-full bg-[#161920] border border-[#2A2F3A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#1E222A] border border-[#2A2F3A] rounded-2xl p-6 space-y-5">
            <h3 className="font-bold text-white flex items-center gap-2 border-b border-[#2A2F3A] pb-3">
              <DollarSign className="w-4 h-4 text-brand-red" />
              Narx va SKU
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Artikul / SKU *</label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SPS-BR-008"
                  className="w-full bg-[#161920] border border-[#2A2F3A] rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Narxi (So'm) *</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="25000"
                  className="w-full bg-[#161920] border border-[#2A2F3A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1.5">Eski narx (aksiya)</label>
                <input
                  type="number"
                  value={oldPrice}
                  onChange={(e) => setOldPrice(e.target.value)}
                  placeholder="30000"
                  className="w-full bg-[#161920] border border-[#2A2F3A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#1E222A] border border-[#2A2F3A] rounded-2xl p-6">
            <ProductMediaUploader media={media} onChange={setMedia} />
          </div>

          <Button type="submit" isLoading={loading} size="lg" className="w-full gap-2 font-bold rounded-xl min-h-[52px]">
            <Save className="w-5 h-5" />
            <span>Mahsulotni saqlash</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
