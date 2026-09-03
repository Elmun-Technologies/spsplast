'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, LayoutGrid } from 'lucide-react';
import { Locale } from '@/lib/i18n';

interface CategoryCardProps {
  category: {
    id: string;
    slug: string;
    nameUz: string;
    nameRu: string;
    descriptionUz?: string | null;
    descriptionRu?: string | null;
    image?: string | null;
    _count?: { products: number };
  };
  lang: Locale;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, lang }) => {
  const name = lang === 'ru' ? category.nameRu : category.nameUz;
  const [imgError, setImgError] = React.useState(false);

  return (
    <Link
      href={`/${lang}/catalog/${category.slug}`}
      className="group relative bg-white border border-[#E5E7EB] rounded-[16px] p-4 flex flex-col justify-between transition-all duration-300 hover:border-[#111827] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#111827] opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-black text-[14px] leading-[1.2] text-[#111827] group-hover:text-[#E61C24] transition-colors uppercase tracking-[-0.01em]">
            {name}
          </h3>
          {category._count?.products !== undefined && (
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#9CA3AF]">
              {category._count.products} {lang === 'ru' ? 'товаров' : 'mahsulot'}
            </p>
          )}
        </div>

        <div className="w-8 h-8 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] group-hover:bg-[#111827] group-hover:text-white group-hover:border-[#111827] transition-all shrink-0">
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      <div className="relative aspect-[4/3] w-full rounded-[12px] overflow-hidden mt-4 bg-[#F8F9FA] border border-[#F1F3F5] industrial-grid flex items-center justify-center">
        {category.image && !imgError ? (
          <Image
            src={category.image}
            alt={name}
            fill
            sizes="20vw"
            onError={() => setImgError(true)}
            className="object-contain p-4 group-hover:scale-[1.04] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center select-none">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center mb-2">
              <LayoutGrid className="w-5 h-5 text-[#9CA3AF]" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#9CA3AF]">SPS</span>
          </div>
        )}
      </div>
    </Link>
  );
};
