'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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
  isBestseller?: boolean;
  isNew?: boolean;
  images: { url: string; altText?: string | null }[];
}

interface ProductCardProps {
  product: ProductCardData;
  lang: Locale;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, lang }) => {
  const addItem = useCartStore((s) => s.addItem);
  const title = lang === 'ru' ? product.titleRu : product.titleUz;
  const mainImage = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80';

  const discountPercent = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      productId: product.id,
      title: title,
      sku: product.sku,
      price: product.price,
      image: mainImage,
      quantity: 1,
      dimensions: product.dimensions || undefined,
    });

    trackEvent('add_to_cart', {
      item_id: product.id,
      item_name: title,
      price: product.price,
    });
  };

  return (
    <div className="group relative bg-brand-card border border-brand-border rounded-2xl overflow-hidden hover:border-brand-red/60 transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-2xl">
      
      {/* Top Media & Badges */}
      <div className="relative aspect-[4/3] bg-black/40 overflow-hidden">
        <Link href={`/${lang}/product/${product.slug}`} className="block w-full h-full">
          <Image
            src={mainImage}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Badges Container */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.isNew && <Badge variant="red">Yangi / New</Badge>}
          {product.isBestseller && <Badge variant="amber">Bestseller</Badge>}
          {discountPercent > 0 && <Badge variant="green">-{discountPercent}% Chegirma</Badge>}
        </div>

        {/* Hover Quick Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 z-10 pointer-events-none">
          <Link
            href={`/${lang}/product/${product.slug}`}
            className="pointer-events-auto p-3 rounded-full bg-brand-card/90 text-white border border-brand-border hover:bg-brand-red transition-colors shadow-lg"
            title="Batafsil кўриш"
          >
            <Eye className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* SKU & Stock */}
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span className="font-mono bg-brand-dark px-2 py-0.5 rounded border border-brand-border">
              {product.sku}
            </span>
            <span className="flex items-center gap-1 font-medium">
              {product.inStock ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Mavjud</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400">Mavjud emas</span>
                </>
              )}
            </span>
          </div>

          {/* Product Title */}
          <Link
            href={`/${lang}/product/${product.slug}`}
            className="font-bold text-white text-base hover:text-brand-red transition-colors line-clamp-2"
          >
            {title}
          </Link>

          {/* Dimension Info */}
          {product.dimensions && (
            <p className="text-xs text-gray-400 mt-1">
              O‘lchami: <span className="text-gray-200 font-medium">{product.dimensions}</span>
            </p>
          )}
        </div>

        {/* Price & Action */}
        <div className="pt-3 border-t border-brand-border/60 flex items-center justify-between gap-2">
          <div>
            <p className="font-extrabold text-lg text-white">
              {formatPrice(product.price, lang)}
            </p>
            {product.oldPrice && (
              <p className="text-xs text-gray-400 line-through">
                {formatPrice(product.oldPrice, lang)}
              </p>
            )}
          </div>

          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="gap-1.5 shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>+ Savat</span>
          </Button>
        </div>
      </div>

    </div>
  );
};
