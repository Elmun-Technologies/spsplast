import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
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
  };
  lang: Locale;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, lang }) => {
  const name = lang === 'ru' ? category.nameRu : category.nameUz;
  const desc = lang === 'ru' ? category.descriptionRu : category.descriptionUz;
  const imageUrl = category.image || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80';

  return (
    <Link
      href={`/${lang}/catalog/${category.slug}`}
      className="group relative bg-brand-card border border-brand-border rounded-2xl overflow-hidden hover:border-brand-red transition-all duration-300 flex flex-col justify-between p-6 shadow-xl"
    >
      {/* Category Image Preview */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-black/40">
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-card via-transparent to-transparent opacity-80" />
      </div>

      <div>
        <h3 className="text-xl font-bold text-white group-hover:text-brand-red transition-colors mb-2">
          {name}
        </h3>
        {desc && <p className="text-xs text-gray-400 line-clamp-2 mb-4">{desc}</p>}
      </div>

      <div className="flex items-center text-sm font-semibold text-brand-red group-hover:translate-x-1 transition-transform gap-2 mt-auto">
        <span>Ko‘rish</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
};
