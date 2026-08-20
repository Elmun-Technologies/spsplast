'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, CheckCircle, AlertCircle, Building2, Truck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { B2BModal } from '@/components/product/B2BModal';
import { useCartStore } from '@/lib/store/cartStore';
import { formatPrice } from '@/lib/utils';
import { getDictionary, Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

interface ProductDetailClientProps {
  product: any;
  lang: Locale;
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({ product, lang }) => {
  const dict = getDictionary(lang);
  const addItem = useCartStore((s) => s.addItem);

  const images = product.images.length > 0
    ? product.images.map((i: any) => i.url)
    : ['https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80'];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [b2bModalOpen, setB2bModalOpen] = useState(false);

  const title = lang === 'ru' ? product.titleRu : product.titleUz;
  const description = lang === 'ru' ? product.descriptionRu : product.descriptionUz;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      title,
      sku: product.sku,
      price: product.price,
      image: images[0],
      quantity,
      dimensions: product.dimensions || undefined,
    });

    trackEvent('add_to_cart', {
      item_id: product.id,
      item_name: title,
      price: product.price,
      quantity,
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        
        {/* Left Column: Product Gallery */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Large Image */}
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border-2 border-brand-border bg-black/50 shadow-2xl">
            <Image
              src={images[activeImageIndex]}
              alt={title}
              fill
              priority
              className="object-cover"
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {product.isNew && <Badge variant="red">Yangi / New</Badge>}
              {product.isBestseller && <Badge variant="amber">Bestseller</Badge>}
            </div>
          </div>

          {/* Gallery Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((imgUrl: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 bg-black/40 transition-all ${
                    activeImageIndex === idx
                      ? 'border-brand-red ring-2 ring-brand-red/30'
                      : 'border-brand-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={imgUrl} alt={`${title} ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Title, Prices, Spec table, Actions */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span className="font-mono bg-brand-card px-2.5 py-1 rounded border border-brand-border text-gray-300">
                {dict.product.sku}: {product.sku}
              </span>
              
              <span className="flex items-center gap-1 font-medium text-xs">
                {product.inStock ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> {dict.product.stockIn}
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {dict.product.stockOut}
                  </span>
                )}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {title}
            </h1>
          </div>

          {/* Pricing Block */}
          <div className="p-4 rounded-2xl bg-brand-card border border-brand-border flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Chakana Narx</p>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">
                {formatPrice(product.price, lang)}
              </p>
              {product.oldPrice && (
                <p className="text-xs text-gray-400 line-through">
                  {formatPrice(product.oldPrice, lang)}
                </p>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setB2bModalOpen(true)}
              className="gap-1.5 border-brand-red text-brand-red hover:bg-brand-red hover:text-white text-xs font-bold"
            >
              <Building2 className="w-4 h-4" />
              <span>{dict.product.b2bQuoteBtn}</span>
            </Button>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed">{description}</p>

          {/* Specifications Grid Table */}
          <div className="border border-brand-border rounded-xl bg-brand-card/40 p-4 space-y-2 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider mb-2 border-b border-brand-border/60 pb-1.5">
              Xususiyatlari va Parametrlari
            </h4>

            {product.dimensions && (
              <div className="flex justify-between py-1 border-b border-brand-border/30">
                <span className="text-gray-400">{dict.product.dimensions}:</span>
                <span className="text-white font-medium">{product.dimensions}</span>
              </div>
            )}

            {product.material && (
              <div className="flex justify-between py-1 border-b border-brand-border/30">
                <span className="text-gray-400">{dict.product.material}:</span>
                <span className="text-white font-medium">{product.material}</span>
              </div>
            )}

            {product.weight && (
              <div className="flex justify-between py-1 border-b border-brand-border/30">
                <span className="text-gray-400">{dict.product.weight}:</span>
                <span className="text-white font-medium">{product.weight}</span>
              </div>
            )}

            {product.yieldPerCast && (
              <div className="flex justify-between py-1 border-b border-brand-border/30">
                <span className="text-gray-400">{dict.product.yieldPerCast}:</span>
                <span className="text-brand-red font-bold">{product.yieldPerCast} dona</span>
              </div>
            )}

            {product.durabilityCasts && (
              <div className="flex justify-between py-1">
                <span className="text-gray-400">{dict.product.durabilityCasts}:</span>
                <span className="text-emerald-400 font-bold">{product.durabilityCasts}+ marotaba</span>
              </div>
            )}
          </div>

          {/* Quantity & Add to Cart Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <QuantitySelector
              quantity={quantity}
              onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
              onIncrease={() => setQuantity(quantity + 1)}
              className="py-1"
            />

            <Button
              size="lg"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="flex-1 gap-2 font-bold text-base shadow-red"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>{dict.product.addToCart}</span>
            </Button>
          </div>

          {/* Quick Badges */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-gray-400">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-brand-card border border-brand-border">
              <Truck className="w-4 h-4 text-brand-red" />
              <span>O‘zbekiston bo‘ylab express yetkazish</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-brand-card border border-brand-border">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Sifat va B2B Ulgurji kafolat</span>
            </div>
          </div>

        </div>
      </div>

      {/* B2B Wholesale Quote Modal */}
      <B2BModal
        isOpen={b2bModalOpen}
        onClose={() => setB2bModalOpen(false)}
        lang={lang}
        productName={title}
        productId={product.id}
      />
    </>
  );
};
