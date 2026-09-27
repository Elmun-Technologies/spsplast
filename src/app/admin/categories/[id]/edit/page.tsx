'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const input =
  'w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:border-red-500';
const label = 'block text-xs font-semibold text-gray-400 mb-1.5';

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Kategoriyani tahrirlash.
 *
 * `/admin/categories` ro'yxatidagi "Edit" tugmasi shu sahifaga ishora qilardi,
 * lekin sahifaning o'zi yo'q edi (404). Endi nom/slug/tavsif (uz + ru), rasm va
 * tartib raqamini tahrirlash va kategoriyani o'chirish mumkin.
 */
export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [nameUz, setNameUz] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [slugUz, setSlugUz] = useState('');
  const [slugRu, setSlugRu] = useState('');
  const [descriptionUz, setDescriptionUz] = useState('');
  const [descriptionRu, setDescriptionRu] = useState('');
  const [image, setImage] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [productCount, setProductCount] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/categories/${id}`)
      .then((res) => res.json())
      .then((data) => {
        const category = data.category;
        if (!category) {
          setError(data.error || 'Kategoriya topilmadi');
          return;
        }
        const uz = category.translations?.find((t: any) => t.locale === 'uz');
        const ru = category.translations?.find((t: any) => t.locale === 'ru');
        setNameUz(uz?.name || '');
        setNameRu(ru?.name || '');
        setSlugUz(uz?.slug || '');
        setSlugRu(ru?.slug || '');
        setDescriptionUz(uz?.description || '');
        setDescriptionRu(ru?.description || '');
        setImage(category.image || '');
        setSortOrder(String(category.sortOrder ?? 0));
        setProductCount(category._count?.products ?? null);
        setLoaded(true);
      })
      .catch(() => setError('Ma’lumotni yuklab bo‘lmadi'));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: image || null,
          sortOrder: parseInt(sortOrder, 10) || 0,
          translations: [
            {
              locale: 'uz',
              name: nameUz,
              slug: slugUz || slugify(nameUz),
              description: descriptionUz || null,
            },
            {
              locale: 'ru',
              name: nameRu || nameUz,
              slug: slugRu || slugify(nameRu || nameUz),
              description: descriptionRu || descriptionUz || null,
            },
          ],
        }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push('/admin/categories');
        router.refresh();
      } else {
        setError(data.error || 'Saqlashda xatolik');
      }
    } catch {
      setError('Tarmoq xatosi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Kategoriya o‘chirilsinmi? Mahsulotlar o‘chmaydi, faqat bog‘lanish yo‘qoladi.')) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/admin/categories');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'O‘chirishda xatolik');
      }
    } catch {
      setError('Tarmoq xatosi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/categories" className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Kategoriyani tahrirlash</h1>
          <p className="text-xs text-gray-400">
            {nameUz || '...'}
            {productCount !== null && ` · ${productCount} mahsulot`}
          </p>
        </div>
      </div>

      {!loaded && !error ? (
        <div className="text-sm text-gray-400">Yuklanmoqda...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Nomi (uz) *</label>
              <input className={input} value={nameUz} onChange={(e) => setNameUz(e.target.value)} required />
            </div>
            <div>
              <label className={label}>Nomi (ru)</label>
              <input className={input} value={nameRu} onChange={(e) => setNameRu(e.target.value)} />
            </div>
            <div>
              <label className={label}>Slug (uz)</label>
              <input className={input} value={slugUz} onChange={(e) => setSlugUz(e.target.value)} />
            </div>
            <div>
              <label className={label}>Slug (ru)</label>
              <input className={input} value={slugRu} onChange={(e) => setSlugRu(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Tavsif (uz)</label>
              <textarea
                className={`${input} min-h-[80px]`}
                value={descriptionUz}
                onChange={(e) => setDescriptionUz(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Tavsif (ru)</label>
              <textarea
                className={`${input} min-h-[80px]`}
                value={descriptionRu}
                onChange={(e) => setDescriptionRu(e.target.value)}
              />
            </div>
            <div>
              <label className={label}>Rasm (yo‘l)</label>
              <input
                className={input}
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="/catalog/catalog-084.jpg"
              />
            </div>
            <div>
              <label className={label}>Tartib raqami</label>
              <input
                type="number"
                className={input}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
          </div>

          {image && (
            <div className="relative w-40 h-28 rounded-lg overflow-hidden bg-gray-800">
              <Image src={image} alt={nameUz || 'kategoriya'} fill sizes="160px" className="object-contain" />
            </div>
          )}

          {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={loading} className="gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
            <Link href="/admin/categories">
              <Button type="button" variant="secondary">
                Bekor qilish
              </Button>
            </Link>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              O‘chirish
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
