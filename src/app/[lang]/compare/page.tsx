'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightLeft, X, ShoppingBag, Check } from 'lucide-react';
import { useCompareStore } from '@/lib/store/compareStore';
import { useCartStore } from '@/lib/store/cartStore';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { Locale, getDictionary } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

export default function ComparePage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);
  const items = useCompareStore((s) => s.items);
  const remove = useCompareStore((s) => s.removeCompare);
  const clear = useCompareStore((s) => s.clearCompare);
  const addItem = useCartStore((s) => s.addItem);

  if (items.length === 0) {
    return (
      <div className="bg-[#F8F9FA] min-h-screen py-8">
        <Container>
          <Breadcrumbs lang={lang} items={[{ label: lang === 'ru' ? 'Сравнение' : 'Taqqoslash', active: true }]} className="mb-4" />
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
              <ArrowRightLeft className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{lang === 'ru' ? 'Нет товаров для сравнения' : 'Taqqoslash uchun mahsulot yo‘q'}</h2>
            <p className="text-sm text-gray-500">{lang === 'ru' ? 'Добавьте до 4 товаров' : '4 tagacha mahsulot qo‘shing'}</p>
            <Link href={`/${lang}/catalog`}>
              <Button className="rounded-xl mt-2">{lang === 'ru' ? 'В каталог' : 'Katalogga'}</Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const specs = ['price', 'dimensions', 'material', 'sku', 'inStock'];

  return (
    <div className="bg-[#F8F9FA] min-h-screen py-6">
      <Container>
        <Breadcrumbs lang={lang} items={[{ label: lang === 'ru' ? 'Сравнение' : 'Taqqoslash', active: true }]} className="mb-4" />

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{lang === 'ru' ? `Сравнение (${items.length})` : `Taqqoslash (${items.length})`}</h1>
          <button onClick={clear} className="text-sm text-red-600 hover:underline">
            {lang === 'ru' ? 'Очистить все' : 'Barchasini tozalash'}
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-[#F8F9FA]">
                <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase w-32">{lang === 'ru' ? 'Параметр' : 'Parametr'}</th>
                {items.map((item) => (
                  <th key={item.id} className="p-4 text-left min-w-[180px]">
                    <div className="relative">
                      <button onClick={() => remove(item.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center">
                        <X className="w-4 h-4" />
                      </button>
                      <Link href={`/${lang}/product/${item.slug}`} className="block">
                        <div className="relative aspect-square bg-[#F8F9FA] rounded-xl border border-gray-200 p-3 mb-2">
                          <Image src={item.image} alt={item.title} fill className="object-contain p-2" />
                        </div>
                        <div className="font-bold text-gray-900 line-clamp-2 leading-snug hover:text-brand-red">{item.title}</div>
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="p-4 font-semibold text-gray-600 bg-[#F8F9FA]">{lang === 'ru' ? 'Цена' : 'Narx'}</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4">
                    <div className="font-bold text-brand-red text-base">{formatPrice(item.price, lang)}</div>
                    {item.oldPrice && <div className="text-xs text-gray-400 line-through">{formatPrice(item.oldPrice, lang)}</div>}
                    <button
                      onClick={() => {
                        addItem({ productId: item.id, title: item.title, sku: item.sku, price: item.price, image: item.image, quantity: 1 });
                        trackEvent('add_to_cart', { from: 'compare' });
                      }}
                      className="mt-2 w-full py-2 bg-brand-red text-white rounded-xl text-xs font-bold hover:bg-brand-red-dark flex items-center justify-center gap-1"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Savatga
                    </button>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-4 font-semibold text-gray-600 bg-[#F8F9FA]">SKU</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 font-mono text-xs">
                    {item.sku}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-4 font-semibold text-gray-600 bg-[#F8F9FA]">{lang === 'ru' ? 'Размер' : 'O‘lcham'}</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4">
                    {item.dimensions || '-'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-4 font-semibold text-gray-600 bg-[#F8F9FA]">{lang === 'ru' ? 'Материал' : 'Material'}</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4">
                    {item.material || '-'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-semibold text-gray-600 bg-[#F8F9FA]">{lang === 'ru' ? 'Наличие' : 'Mavjudlik'}</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4">
                    {item.inStock ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        <Check className="w-3 h-3" /> Mavjud
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200 text-xs">Yo‘q</span>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Container>
    </div>
  );
}
