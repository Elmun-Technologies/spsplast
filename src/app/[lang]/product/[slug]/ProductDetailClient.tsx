'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, Building2, Truck, ShieldCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { StockBadge } from '@/components/ui/StockBadge';
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
  const [added, setAdded] = useState(false);
  const [b2bModalOpen, setB2bModalOpen] = useState(false);

  const title = lang === 'ru' ? product.titleRu : product.titleUz;
  const description = lang === 'ru' ? product.descriptionRu : product.descriptionUz;

  // Bulk Tier Pricing Calculations
  const basePrice = product.price;
  const getTierPrice = (qty: number) => {
    if (qty >= 50) return Math.round(basePrice * 0.9); // 10% discount for 50+
    if (qty >= 10) return Math.round(basePrice * 0.95); // 5% discount for 10+
    return basePrice;
  };

  const currentUnitPrice = getTierPrice(quantity);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      title,
      sku: product.sku,
      price: currentUnitPrice,
      image: images[0],
      quantity,
      dimensions: product.dimensions || undefined,
    });

    trackEvent('add_to_cart', {
      item_id: product.id,
      item_name: title,
      price: currentUnitPrice,
      quantity,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <div className="bg-[#F8F9FA] p-1.5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="bg-white rounded-xl p-5 sm:p-6 border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* Gallery Column */}
            <div className="lg:col-span-6 space-y-3">
              <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-gray-200 bg-[#F8F9FA] flex items-center justify-center p-4">
                <Image
                  src={images[activeImageIndex]}
                  alt={title}
                  fill
                  priority
                  className="object-contain p-4"
                />

                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {product.isNew && <Badge variant="blue">Yangi</Badge>}
                  {product.isBestseller && <Badge variant="dark">Top Xit</Badge>}
                </div>
              </div>

              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((imgUrl: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border shrink-0 bg-[#F8F9FA] transition-all p-1 ${
                        activeImageIndex === idx
                          ? 'border-brand-red ring-1 ring-brand-red'
                          : 'border-gray-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image src={imgUrl} alt={`${title} ${idx + 1}`} fill className="object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details & Actions Column */}
            <div className="lg:col-span-6 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-gray-700">
                    SKU: {product.sku}
                  </span>
                  <StockBadge inStock={product.inStock} lang={lang} />
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  {title}
                </h1>
              </div>

              {/* Price Box & Bulk Discount Tier */}
              <div className="p-4 rounded-xl bg-[#F8F9FA] border border-gray-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-gray-500 font-semibold uppercase block mb-0.5">Narxi (dona)</span>
                    <Price price={currentUnitPrice} oldPrice={currentUnitPrice < basePrice ? basePrice : product.oldPrice} lang={lang} size="xl" showDiscountBadge />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setB2bModalOpen(true)}
                    className="gap-1.5 border-brand-red text-brand-red hover:bg-brand-red hover:text-white text-xs font-bold shrink-0"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Ulgurji Narx So‘rash</span>
                  </Button>
                </div>

                {/* Bulk Wholesale Tier Preview Table */}
                <div className="pt-2.5 border-t border-gray-200/80">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    {lang === 'ru' ? 'Оптовые скидки от объема' : 'Ulgurji hajm chegirmalari'}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className={`p-2 rounded border transition-colors ${quantity < 10 ? 'bg-white border-brand-red font-bold text-gray-900 shadow-xs' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                      <div className="text-[10px] text-gray-500">1 – 9 dona</div>
                      <div className="font-semibold">{formatPrice(basePrice, lang)}</div>
                    </div>
                    <div className={`p-2 rounded border transition-colors ${quantity >= 10 && quantity < 50 ? 'bg-white border-brand-red font-bold text-gray-900 shadow-xs' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                      <div className="text-[10px] text-gray-500">10 – 49 dona</div>
                      <div className="font-semibold text-emerald-700">{formatPrice(Math.round(basePrice * 0.95), lang)} (-5%)</div>
                    </div>
                    <div className={`p-2 rounded border transition-colors ${quantity >= 50 ? 'bg-white border-brand-red font-bold text-gray-900 shadow-xs' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                      <div className="text-[10px] text-gray-500">50+ dona</div>
                      <div className="font-semibold text-brand-red">{formatPrice(Math.round(basePrice * 0.9), lang)} (-10%)</div>
                    </div>
                  </div>
                </div>
              </div>

              {description && (
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{description}</p>
              )}

              {/* Specifications Table */}
              <div className="border border-gray-200 rounded-lg bg-white p-3.5 space-y-2 text-xs">
                <h4 className="font-bold text-gray-900 uppercase tracking-wider mb-1.5 border-b border-gray-100 pb-1">
                  Xususiyatlari va Parametrlari
                </h4>

                {product.dimensions && (
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">O‘lchami:</span>
                    <span className="text-gray-900 font-mono font-medium">{product.dimensions}</span>
                  </div>
                )}

                {product.material && (
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Material turi:</span>
                    <span className="text-gray-900 font-medium">{product.material}</span>
                  </div>
                )}

                {product.yieldPerCast && (
                  <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-gray-500">Bitta quyishda dona:</span>
                    <span className="text-brand-red font-bold">{product.yieldPerCast} dona</span>
                  </div>
                )}

                {product.durabilityCasts && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500">Xizmat resursi:</span>
                    <span className="text-emerald-600 font-bold">{product.durabilityCasts}+ marotaba</span>
                  </div>
                )}
              </div>

              {/* Quantity & Cart Action */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <QuantitySelector
                  quantity={quantity}
                  onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
                  onIncrease={() => setQuantity(quantity + 1)}
                />

                <button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className={`flex-1 flex items-center justify-between gap-2 text-xs sm:text-sm font-bold py-2.5 pl-4 pr-2 rounded-lg transition-colors ${
                    added
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : product.inStock
                      ? 'bg-brand-red hover:bg-brand-red-dark text-white shadow-xs'
                      : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                  }`}
                >
                  <span>
                    {added
                      ? (lang === 'ru' ? 'В корзине' : 'Savatga qo‘shildi')
                      : (lang === 'ru' ? 'Добавить в корзину' : 'Savatga qo‘shish')}
                  </span>

                  <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                    {added ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <ShoppingCart className="w-4 h-4 text-white" />
                    )}
                  </div>
                </button>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-2 gap-2.5 pt-1 text-[11px] text-gray-500 font-medium">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8F9FA] border border-gray-200">
                  <Truck className="w-4 h-4 text-brand-red shrink-0" />
                  <span>Express yetkazib berish</span>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#F8F9FA] border border-gray-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Sifat va Kafolat</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

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
