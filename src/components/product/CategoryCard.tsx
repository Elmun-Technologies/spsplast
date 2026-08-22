'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, LayoutGrid } from 'lucide-react';
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
      className="group relative bg-white border border-gray-200/90 rounded-xl p-3 flex flex-col justify-between card-lift overflow-hidden shadow-xs"
    >
      {/* Header Info */}
      <div className="flex items-start justify-between gap-2 z-10">
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-brand-red transition-colors leading-snug">
            {name}
          </h3>
          {category._count?.products !== undefined && (
            <p className="text-[11px] text-gray-500 font-medium mt-0.5 font-mono">
              {category._count.products} {lang === 'ru' ? 'товаров' : 'ta mahsulot'}
            </p>
          )}
        </div>

        <div className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 group-hover:bg-brand-red group-hover:border-brand-red group-hover:text-white transition-all shrink-0 shadow-xs">
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Photography Area */}
      <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden mt-3 bg-[#F4F5F7] flex items-center justify-center border border-gray-100 group-hover:bg-[#EEF0F4] transition-colors">
        {category.image && !imgError ? (
          <Image
            src={category.image}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, 20vw"
            onError={() => setImgError(true)}
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 select-none">
            <LayoutGrid className="w-7 h-7 mb-1 text-gray-300" />
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-gray-400">
              SPS PLAST
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};
