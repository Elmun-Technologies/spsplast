'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutGrid } from 'lucide-react';
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

/**
 * Category tile: soft grey surface, title on top, product photo below — the
 * quiet "category grid" pattern of the reference storefront.
 */
export const CategoryCard: React.FC<CategoryCardProps> = ({ category, lang }) => {
  const name = lang === 'ru' ? category.nameRu : category.nameUz;
  const [imgError, setImgError] = React.useState(false);

  return (
    <Link
      href={`/${lang}/catalog/${category.slug}`}
      className="group relative bg-surface-soft rounded-[20px] p-4 flex flex-col justify-between transition-all duration-300 hover:bg-surface hover:shadow-lift overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-[13px] sm:text-sm leading-snug text-ink group-hover:text-brand-red transition-colors line-clamp-2">
          {name}
        </h3>
        {category._count?.products !== undefined && (
          <span className="shrink-0 text-[11px] font-medium text-ink-sub bg-surface rounded-full px-2.5 py-1">
            {category._count.products}
          </span>
        )}
      </div>

      <div className="relative aspect-[4/3] w-full mt-4 flex items-center justify-center">
        {category.image && !imgError ? (
          <Image
            src={category.image}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
            onError={() => setImgError(true)}
            className="object-contain p-2 group-hover:scale-[1.04] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center select-none">
            <div className="w-10 h-10 rounded-[20px] bg-surface flex items-center justify-center mb-2">
              <LayoutGrid className="w-5 h-5 text-[#B4BCCA]" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#B4BCCA]">SPS</span>
          </div>
        )}
      </div>
    </Link>
  );
};
