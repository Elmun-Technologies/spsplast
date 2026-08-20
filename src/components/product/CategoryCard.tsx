'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, LayoutGrid } from 'lucide-react';
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
  index?: number;
  featured?: boolean;
  lang: Locale;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  lang,
}) => {
  const name = lang === 'ru' ? category.nameRu : category.nameUz;
  const [imgError, setImgError] = React.useState(false);

  return (
    <Link
      href={`/${lang}/catalog/${category.slug}`}
      className="group relative bg-[#F9FAFB] hover:bg-[#F3F4F6] transition-all duration-300 rounded-3xl p-4 sm:p-5 flex flex-col justify-between border border-neutral-100 hover:border-neutral-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
    >
      {/* Title & Floating Action Arrow Button */}
      <div className="flex items-start justify-between gap-2 z-10">
        <div>
          <h3 className="font-semibold text-sm sm:text-[15px] text-[#333333] group-hover:text-brand-blue transition-colors leading-snug">
            {name}
          </h3>
          {category._count?.products !== undefined && (
            <p className="text-[11px] text-[#888888] font-medium mt-1">
              {category._count.products} {lang === 'ru' ? 'товаров' : 'ta mahsulot'}
            </p>
          )}
        </div>

        {/* Circular Action Button like Santekhnika Online */}
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-neutral-200/60 flex items-center justify-center text-neutral-500 group-hover:bg-brand-blue group-hover:border-brand-blue group-hover:text-white transition-all shadow-sm shrink-0">
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </div>

      {/* Category Image Area */}
      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden mt-4 bg-transparent flex items-center justify-center transition-transform group-hover:scale-105">
        {category.image && !imgError ? (
          <Image
            src={category.image}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setImgError(true)}
            className="object-contain p-2"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300 select-none">
            <LayoutGrid className="w-10 h-10 mb-2 text-neutral-300" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-300">
              SPS PLAST
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};
