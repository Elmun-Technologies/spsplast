'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShoppingBag, Check, ImageOff, Heart } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

export interface ProductCardData {
  id: string;
  slug: string;
  sku: string;
  titleUz: string;
  titleRu: string;
  price: number;
  oldPrice?: number | null;
  dimensions?: string | null;
  inStock: boolean;
  hasVariants?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  images: { url: string; altText?: string | null }[];
}

interface ProductCardProps {
  product: ProductCardData;
  lang: Locale;
  featured?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, lang, featured = false }) => {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const [isLiked, setIsLiked] = React.useState(false);

  const title = lang === 'ru' ? product.titleRu : product.titleUz;
  const mainImage = product.images?.[0]?.url;

  const hasDiscount = product.oldPrice && product.oldPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.oldPrice! - product.price) / product.oldPrice!) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      productId: product.id,
      title,
      sku: product.sku,
      price: product.price,
      image: mainImage || '',
      quantity: 1,
      dimensions: product.dimensions || undefined,
    });

    trackEvent('add_to_cart', {
      item_id: product.id,
      item_name: title,
      price: product.price,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <div
      className={`group relative bg-white border border-neutral-200/60 hover:border-neutral-300 transition-all duration-300 rounded-3xl overflow-hidden flex flex-col justify-between text-[#111111] shadow-soft hover:shadow-card hover:-translate-y-1 ${featured ? 'md:col-span-2 md:row-span-2' : ''
        }`}
    >
      {/* Top Badges — Rounded Pill Style */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 pointer-events-none text-[11px] font-extrabold tracking-wide">
        {product.isNew && (
          <span className="bg-brand-blue text-white px-2.5 py-0.5 rounded-full shadow-xs">
            {lang === 'ru' ? 'Новинка' : 'Yangi'}
          </span>
        )}
        {product.isBestseller && !product.isNew && !hasDiscount && (
          <span className="bg-[#111111] text-white px-2.5 py-0.5 rounded-full shadow-xs">
            {lang === 'ru' ? 'Хит' : 'Top'}
          </span>
        )}
      </div>

      {/* Favorite Circle Button — Top Right */}
      <button
        onClick={toggleFavorite}
        className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs shadow-soft flex items-center justify-center text-neutral-400 hover:text-brand-red transition-all hover:scale-110"
        title="Saqlanganlarga qo'shish"
      >
        <Heart className={`w-4 h-4 ${isLiked ? 'fill-brand-red text-brand-red' : ''}`} />
      </button>

      {/* Image Area — Clean soft gray card background (`#F4F5F7`) */}
      <Link
        href={`/${lang}/product/${product.slug}`}
        className="block relative aspect-[4/3] w-full bg-white m-0 overflow-hidden flex items-center justify-center p-6 group-hover:bg-[#F9FAFB] transition-colors"
      >
        {mainImage && !imgError ? (
          <Image
            src={mainImage}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            onError={() => setImgError(true)}
            className="object-contain p-6 group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 p-4 select-none">
            <ImageOff className="w-9 h-9 mb-1 text-neutral-200" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-300">
              SPS PLAST
            </span>
          </div>
        )}
        
        {/* Discount Badge on Image Bottom Left */}
        {hasDiscount && (
          <div className="absolute bottom-3 left-3 z-20">
            <span className="bg-brand-red text-white px-2 py-1 rounded-lg shadow-sm text-xs font-bold">
              -{discountPercent}%
            </span>
          </div>
        )}
      </Link>

      {/* Product Content & Pricing */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3 bg-white">
        <div>
          {/* Stock Indicator & SKU */}
          <div className="flex items-center justify-between text-[11px] text-[#888888] mb-2 font-medium">
            <span className="truncate">SKU: {product.sku}</span>
            <span className={product.inStock ? 'text-emerald-600 font-semibold flex items-center gap-1.5' : 'text-[#888888]'}>
              {product.inStock
                ? lang === 'ru'
                  ? 'В наличии'
                  : 'Mavjud'
                : lang === 'ru'
                  ? 'Нет в наличии'
                  : 'Mavjud emas'}
            </span>
          </div>

          {/* Product Title */}
          <Link href={`/${lang}/product/${product.slug}`} className="block group/title">
            <h3 className="font-semibold text-sm sm:text-[15px] text-[#333333] group-hover/title:text-brand-blue transition-colors line-clamp-2 leading-snug">
              {title}
            </h3>
          </Link>

          {/* Dimensions */}
          {product.dimensions && (
            <p className="text-xs text-[#888888] mt-2 font-medium">
              <span className="text-[#888888]">Размер: </span>
              <span className="text-[#333333] font-mono">{product.dimensions}</span>
            </p>
          )}
        </div>

        {/* Price & Action Button */}
        <div className="pt-2 flex flex-col gap-3 mt-auto">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
                {formatPrice(product.price, lang)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-[#98A2B3] line-through">
                  {formatPrice(product.oldPrice!, lang)}
                </span>
              )}
            </div>
          </div>

          {/* Action CTA Button */}
          {product.hasVariants ? (
            <Link
              href={`/${lang}/product/${product.slug}`}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[#111111] bg-[#F2F4F7] hover:bg-[#E4E7EC] py-2.5 px-3 rounded-xl transition-all"
            >
              <span>{lang === 'ru' ? 'Выбрать' : 'Tanlash'}</span>
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 px-4 rounded-xl transition-all ${added
                  ? 'bg-emerald-500 text-white shadow-soft'
                  : product.inStock
                    ? 'bg-brand-blue hover:bg-brand-blue-dark text-white shadow-soft hover:shadow-md'
                    : 'bg-[#F2F4F7] text-[#98A2B3] cursor-not-allowed'
                }`}
            >
              {added ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{lang === 'ru' ? 'В корзине' : 'Savatda'}</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>{lang === 'ru' ? 'В корзину' : 'Savatga'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
