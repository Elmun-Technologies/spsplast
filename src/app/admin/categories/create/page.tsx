'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

function CreateCategoryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const parentId = searchParams.get('parentId');

  const [nameUz, setNameUz] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [descriptionUz, setDescriptionUz] = useState('');
  const [descriptionRu, setDescriptionRu] = useState('');
  const [image, setImage] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parentCategory, setParentCategory] = useState<any>(null);

  useEffect(() => {
    if (parentId) {
      fetch(`/api/categories/${parentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.category) {
            setParentCategory(data.category);
          }
        })
        .catch(console.error);
    }
  }, [parentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const slugUz = nameUz
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const slugRu = (nameRu || nameUz)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: parentId || null,
          image: image || null,
          sortOrder: parseInt(sortOrder) || 0,
          translations: [
            {
              locale: 'uz',
              name: nameUz,
              slug: slugUz,
              description: descriptionUz || null,
            },
            {
              locale: 'ru',
              name: nameRu || nameUz,
              slug: slugRu,
              description: descriptionRu || descriptionUz || null,
            },
          ],
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin/categories');
      } else {
        setError(data.error || 'Kategoriya yaratishda xatolik');
      }
    } catch (err) {
      console.error(err);
      setError('Server xatosi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/admin/categories" className="inline-flex items-center gap-1.5 text-xs text-brand-red font-bold">
        <ArrowLeft className="w-4 h-4" />
        <span>Kategoriyalarga qaytish</span>
      </Link>

      <h1 className="text-3xl font-black text-white">
        {parentId ? 'Ost-kategoriya Yaratish' : 'Yangi Kategoriya Yaratish'}
      </h1>

      {parentCategory && (
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-xs text-purple-300">
          Ost-kategoriya: <span className="font-bold">{parentCategory.translations?.[0]?.name}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Nomi (O'zbekcha) *</label>
            <input
              type="text"
              required
              value={nameUz}
              onChange={(e) => setNameUz(e.target.value)}
              placeholder="Beton qoliplari"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Nomi (Ruscha)</label>
            <input
              type="text"
              value={nameRu}
              onChange={(e) => setNameRu(e.target.value)}
              placeholder="Формы для бетона"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Rasm URL</label>
          <input
            type="text"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://..."
            className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Tartib (Sort Order)</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            placeholder="0"
            className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Tavsif (O'zbekcha)</label>
          <textarea
            rows={3}
            value={descriptionUz}
            onChange={(e) => setDescriptionUz(e.target.value)}
            placeholder="Kategoriya haqida..."
            className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1">Tavsif (Ruscha)</label>
          <textarea
            rows={3}
            value={descriptionRu}
            onChange={(e) => setDescriptionRu(e.target.value)}
            placeholder="Описание категории..."
            className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <Button type="submit" isLoading={loading} size="lg" className="w-full gap-2 font-bold">
          <Save className="w-4 h-4" />
          <span>Kategoriyani Saqlash</span>
        </Button>
      </form>
    </div>
  );
}

export default function CreateCategoryPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 text-sm">Yuklanmoqda...</div>}>
      <CreateCategoryForm />
    </Suspense>
  );
}
