'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { VariantForm, VariantFormValues, AxisAttribute } from '../VariantForm';

/**
 * Yangi variant (opsiya kombinatsiyasi) qo'shish.
 *
 * Mahsulot tahrirlash sahifasidagi "Variant qo'shish" havolasi shu yerga
 * olib keladi — ilgari bu sahifa mavjud emas edi va 404 qaytarardi.
 */
export default function CreateVariantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params);
  const router = useRouter();

  const [axes, setAxes] = useState<AxisAttribute[]>([]);
  const [productSku, setProductSku] = useState('');
  const [values, setValues] = useState<VariantFormValues>({
    sku: '',
    price: '0',
    compareAtPrice: '',
    stockQty: '10',
    status: 'ACTIVE',
    optionIds: {},
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/attributes?locale=uz')
      .then((res) => res.json())
      .then((data) => setAxes((data.attributes || []).filter((a: AxisAttribute) => a.variantAxis)))
      .catch(() => setError('Atributlarni yuklab bo‘lmadi'));

    fetch(`/api/admin/products/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        const sku = data.product?.sku || '';
        setProductSku(sku);
        setValues((prev) => (prev.sku ? prev : { ...prev, sku: sku ? `${sku}-` : '' }));
      })
      .catch(() => {});
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/products/${productId}/variants`, {
        method: 'POST',
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
          <h1 className="text-xl font-bold text-white">Yangi variant</h1>
          <p className="text-xs text-gray-400">{productSku || 'Mahsulot'} uchun opsiya kombinatsiyasi</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <VariantForm axes={axes} values={values} onChange={setValues} />

        {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading || !values.sku.trim()} className="gap-2">
            <Save className="w-4 h-4" />
            {loading ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
          <Link href={`/admin/products/${productId}/edit`}>
            <Button type="button" variant="secondary">
              Bekor qilish
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
