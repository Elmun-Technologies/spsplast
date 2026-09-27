'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { VariantForm, VariantFormValues, AxisAttribute } from '../../VariantForm';

/**
 * Mavjud variantni tahrirlash / o'chirish.
 * Mahsulot tahrirlash sahifasidagi variant havolasi shu yerga olib keladi.
 */
export default function EditVariantPage({
  params,
}: {
  params: Promise<{ id: string; variantId: string }>;
}) {
  const { id: productId, variantId } = use(params);
  const router = useRouter();

  const [axes, setAxes] = useState<AxisAttribute[]>([]);
  const [values, setValues] = useState<VariantFormValues | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch('/api/attributes?locale=uz').then((res) => res.json()),
      fetch(`/api/admin/products/${productId}/variants/${variantId}`).then((res) => res.json()),
    ])
      .then(([attrData, variantData]) => {
        if (cancelled) return;

        const axisList: AxisAttribute[] = (attrData.attributes || []).filter((a: AxisAttribute) => a.variantAxis);
        setAxes(axisList);

        const variant = variantData.variant;
        if (!variant) {
          setError('Variant topilmadi');
          return;
        }

        // Variantdagi optionId'larni o'q (atribut) bo'yicha joylashtiramiz.
        const selected: Record<string, string> = {};
        for (const axis of axisList) {
          const match = axis.options.find((option) =>
            variant.options.some((vo: any) => vo.option.id === option.id)
          );
          if (match) selected[axis.id] = match.id;
        }

        setValues({
          sku: variant.sku,
          price: String(variant.price ?? 0),
          compareAtPrice: variant.compareAtPrice ? String(variant.compareAtPrice) : '',
          stockQty: String(variant.stockQty ?? 0),
          status: variant.status || 'ACTIVE',
          optionIds: selected,
        });
      })
      .catch(() => !cancelled && setError('Ma’lumotni yuklab bo‘lmadi'));

    return () => {
      cancelled = true;
    };
  }, [productId, variantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/products/${productId}/variants/${variantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: values.sku.trim(),
          price: parseInt(values.price, 10) || 0,
          compareAtPrice: values.compareAtPrice ? parseInt(values.compareAtPrice, 10) : null,
          stockQty: parseInt(values.stockQty, 10) || 0,
          status: values.status,
          optionIds: Object.values(values.optionIds).filter(Boolean),
        }),
      });
      const data = await res.json();

      if (res.ok) {
        router.push(`/admin/products/${productId}/edit`);
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
    if (!confirm('Variant o‘chirilsinmi?')) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/products/${productId}/variants/${variantId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push(`/admin/products/${productId}/edit`);
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
        <Link
          href={`/admin/products/${productId}/edit`}
          className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Variantni tahrirlash</h1>
          <p className="text-xs text-gray-400 font-mono">{values?.sku || variantId}</p>
        </div>
      </div>

      {!values ? (
        <div className="text-sm text-gray-400">{error || 'Yuklanmoqda...'}</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <VariantForm axes={axes} values={values} onChange={setValues} />

          {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={loading} className="gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
            <Link href={`/admin/products/${productId}/edit`}>
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
