'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, X } from 'lucide-react';
import { useRecentStore } from '@/lib/store/recentStore';
import { Locale } from '@/lib/i18n';
import { formatPrice } from '@/lib/utils';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface RecentlyViewedProps {
  lang: Locale;
  currentProductId?: string;
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ lang, currentProductId }) => {
  const { items, clearRecent } = useRecentStore();
  const filtered = items.filter((i) => i.id !== currentProductId).slice(0, 6);

  if (filtered.length === 0) return null;

  return (
    <section className="py-6">
      <Container>
        <SectionHeader
          title={lang === 'ru' ? 'Вы недавно смотрели' : 'Yaqinda ko‘rilganlar'}
          subtitle={lang === 'ru' ? 'Вернитесь к просмотренным товарам' : 'Ko‘rgan mahsulotlaringizga qayting'}
        >
          <button
            onClick={clearRecent}
            className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            <X className="w-3 h-3" />
            {lang === 'ru' ? 'Очистить' : 'Tozalash'}
          </button>
        </SectionHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/${lang}/product/${p.slug}`}
              className="group bg-white border border-gray-200 rounded-xl p-3 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="relative aspect-square bg-[#F8F9FA] rounded-lg border border-gray-100 overflow-hidden p-2 mb-2">
                {p.image ? (
                  <Image src={p.image} alt={p.title} fill className="object-contain p-2 group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">SPS</div>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug min-h-[32px] group-hover:text-brand-red">
                  {p.title}
                </div>
                <div className="text-xs font-bold text-brand-red">{formatPrice(p.price, lang)}</div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
};

export const RecentlyViewedTracker: React.FC<{ product: { id: string; slug: string; title: string; price: number; image: string; sku: string } }> = ({
  product,
}) => {
  const addRecent = useRecentStore((s) => s.addRecent);

  React.useEffect(() => {
    addRecent(product);
  }, [product.id]);

  return null;
};
