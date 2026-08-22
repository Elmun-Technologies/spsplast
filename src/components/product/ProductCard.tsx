'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Check, ImageOff, Heart, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';
import { Price } from '@/components/ui/Price';
import { StockBadge } from '@/components/ui/StockBadge';
import { Badge } from '@/components/ui/Badge';

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

  const hasDiscount = Boolean(product.oldPrice && product.oldPrice > product.price);
  const discountPercent = hasDiscount && product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
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
      className={`group relative bg-white border border-gray-200/90 rounded-xl overflow-hidden flex flex-col justify-between card-lift ${
        featured ? 'md:col-span-2 md:row-span-2' : ''
      }`}
    >
      {/* Top Floating Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 pointer-events-none">
        {hasDiscount && (
          <Badge variant="red" size="sm" className="shadow-xs">
            -{discountPercent}%
          </Badge>
        )}
        {product.isNew && (
          <Badge variant="blue" size="sm" className="shadow-xs">
            {lang === 'ru' ? 'Новинка' : 'Yangi'}
          </Badge>
        )}
        {product.isBestseller && !product.isNew && !hasDiscount && (
          <Badge variant="dark" size="sm" className="shadow-xs">
            {lang === 'ru' ? 'Хит' : 'Top'}
          </Badge>
        )}
      </div>

      {/* Favorite Button */}
      <button
        onClick={toggleFavorite}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-brand-red transition-all shadow-xs hover:scale-105"
        aria-label="Favorite"
      >
        <Heart className={`w-4 h-4 ${isLiked ? 'fill-brand-red text-brand-red' : ''}`} />
      </button>

      {/* Product Photography Display Frame */}
      <Link
        href={`/${lang}/product/${product.slug}`}
        className="block relative aspect-square w-full bg-[#F4F5F7] overflow-hidden flex items-center justify-center p-4 border-b border-gray-100 group-hover:bg-[#EEF0F4] transition-colors"
      >
        {mainImage && !imgError ? (
          <Image
            src={mainImage}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            onError={() => setImgError(true)}
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 select-none">
            <ImageOff className="w-8 h-8 mb-1 text-gray-300" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
              SPS PLAST
            </span>
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3 bg-white">
        <div>
          {/* Stock Indicator & SKU */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5 font-medium">
            <span className="truncate font-mono">SKU: {product.sku}</span>
            <StockBadge inStock={product.inStock} lang={lang} />
          </div>

          {/* Title */}
          <Link href={`/${lang}/product/${product.slug}`} className="block group/title">
            <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover/title:text-brand-red transition-colors line-clamp-2 leading-snug">
              {title}
            </h3>
          </Link>

          {/* Dimensions */}
          {product.dimensions && (
            <p className="text-[11px] text-gray-500 mt-1 font-medium">
              <span>{lang === 'ru' ? 'Размер: ' : 'O‘lchami: '}</span>
              <span className="text-gray-800 font-mono font-semibold">{product.dimensions}</span>
            </p>
          )}
        </div>

        {/* Pricing & CTA Button */}
        <div className="pt-2 flex flex-col gap-2.5 mt-auto border-t border-gray-100">
          <Price
            price={product.price}
            oldPrice={product.oldPrice}
            lang={lang}
            size="md"
          />

          {product.hasVariants ? (
            <Link
              href={`/${lang}/product/${product.slug}`}
              className="w-full flex items-center justify-between gap-2 text-xs font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 border border-gray-200 py-2 px-3 rounded-lg transition-colors group/btn"
            >
              <span>{lang === 'ru' ? 'Выбрать variant' : 'Tanlash'}</span>
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-gray-700 group-hover/btn:translate-x-0.5 transition-transform">
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`w-full flex items-center justify-between gap-2 text-xs font-bold py-2.5 pl-3.5 pr-2 rounded-lg transition-all ${
                added
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : product.inStock
                  ? 'bg-brand-red hover:bg-brand-red-dark text-white shadow-red'
                  : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
            >
              <span>
                {added
                  ? (lang === 'ru' ? 'В корзине' : 'Savatda')
                  : (lang === 'ru' ? 'В корзину' : 'Savatga')}
              </span>

              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                {added ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <ShoppingBag className="w-3.5 h-3.5 text-white" />
                )}
              </div>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
