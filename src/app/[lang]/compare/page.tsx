'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightLeft, X, Send, Check } from 'lucide-react';
import { useCompareStore } from '@/lib/store/compareStore';
import { LeadButton } from '@/components/lead/LeadButton';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { Locale, getDictionary } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

export default function ComparePage({ params }: { params: Promise<{ lang: Locale }> }) {
  // Next.js 15 passes `params` to client components as a promise.
  const { lang } = React.use(params);
  const dict = getDictionary(lang);
  const items = useCompareStore((s) => s.items);
  const remove = useCompareStore((s) => s.removeCompare);
  const clear = useCompareStore((s) => s.clearCompare);

  if (items.length === 0) {
    return (
      <div className="bg-surface-page min-h-screen py-8">
        <Container>
          <Breadcrumbs lang={lang} items={[{ label: lang === 'ru' ? 'Сравнение' : 'Taqqoslash', active: true }]} className="mb-4" />
          {/* Bo'sh holatda ham sahifada bitta h1 bo'lishi kerak (a11y/SEO). */}
          <h1 className="sr-only">{lang === 'ru' ? 'Сравнение' : 'Taqqoslash'}</h1>
          <EmptyState lang={lang} type="compare" />
        </Container>
      </div>
    );
  }

  const specs = ['price', 'dimensions', 'material', 'sku'];

  return (
    <div className="bg-surface-page min-h-screen py-6">
      <Container>
        <Breadcrumbs lang={lang} items={[{ label: lang === 'ru' ? 'Сравнение' : 'Taqqoslash', active: true }]} className="mb-4" />

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[26px] sm:text-[30px] font-bold text-ink tracking-[-0.025em] leading-tight">{lang === 'ru' ? `Сравнение (${items.length})` : `Taqqoslash (${items.length})`}</h1>
          <button onClick={clear} className="text-sm text-red-600 hover:underline">
            {lang === 'ru' ? 'Очистить все' : 'Barchasini tozalash'}
          </button>
        </div>

        <div className="bg-surface rounded-[20px] border border-line shadow-card overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-soft">
                <th className="p-4 text-left text-xs font-bold text-ink-sub uppercase w-32">{lang === 'ru' ? 'Параметр' : 'Parametr'}</th>
                {items.map((item) => (
                  <th key={item.id} className="p-4 text-left min-w-[180px]">
                    <div className="relative">
                      <button
                        onClick={() => remove(item.id)}
                        aria-label={`${item.title} — ${lang === 'ru' ? 'убрать' : 'olib tashlash'}`}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-ink text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <Link href={`/${lang}/product/${item.slug}`} className="block">
                        <div className="relative aspect-square bg-surface-soft rounded-[16px] border border-line p-3 mb-2">
                          <Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 45vw, 180px" className="object-contain p-2" />
                        </div>
                        <div className="font-bold text-ink line-clamp-2 leading-snug hover:text-brand-red">{item.title}</div>
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line-soft">
                <td className="p-4 font-semibold text-ink-soft bg-surface-soft">{lang === 'ru' ? 'Цена' : 'Narx'}</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4">
                    <div className="font-bold text-brand-red text-base">{formatPrice(item.price, lang)}</div>
                    {item.oldPrice && <div className="text-xs text-ink-sub line-through">{formatPrice(item.oldPrice, lang)}</div>}
                    <LeadButton
                      lang={lang}
                      product={{ title: item.title, sku: item.sku }}
                      className="mt-2 w-full py-2.5 min-h-[44px] bg-brand-red text-white rounded-full text-[13px] font-semibold hover:bg-brand-red-dark transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {lang === 'ru' ? 'Заявка' : 'Zayafka'}
                    </LeadButton>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-line-soft">
                <td className="p-4 font-semibold text-ink-soft bg-surface-soft">SKU</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4 font-mono text-xs">
                    {item.sku}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-line-soft">
                <td className="p-4 font-semibold text-ink-soft bg-surface-soft">{lang === 'ru' ? 'Размер' : 'O‘lcham'}</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4">
                    {item.dimensions || '-'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-line-soft">
                <td className="p-4 font-semibold text-ink-soft bg-surface-soft">{lang === 'ru' ? 'Материал' : 'Material'}</td>
                {items.map((item) => (
                  <td key={item.id} className="p-4">
                    {item.material || '-'}
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
