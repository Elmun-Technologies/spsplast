'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingCart, Building2, Truck, ShieldCheck, Check, Share2, Calculator, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { StockBadge } from '@/components/ui/StockBadge';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { B2BModal } from '@/components/product/B2BModal';
import { OneClickModal } from '@/components/product/OneClickModal';
import { ProductTabs } from '@/components/product/ProductTabs';
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
    : ['/images/molds-warehouse.jpg'];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [b2bModalOpen, setB2bModalOpen] = useState(false);
  const [oneClickOpen, setOneClickOpen] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [calcArea, setCalcArea] = useState('');
  const [showCalc, setShowCalc] = useState(false);

  const title = lang === 'ru' ? product.titleRu : product.titleUz;
  const description = lang === 'ru' ? product.descriptionRu : product.descriptionUz;

  // Sticky ATC on scroll + view_item analytics
  useEffect(() => {
    const onScroll = () => {
      setShowSticky(window.scrollY > 400);
    };
    window.addEventListener('scroll', onScroll);

    // view_item
    trackEvent('view_item', {
      item_id: product.id,
      item_name: title,
      price: product.price,
      item_category: product.category || '',
    });

    return () => window.removeEventListener('scroll', onScroll);
  }, [product.id]);

  // Bulk Tier Pricing
  const basePrice = product.price;
  const getTierPrice = (qty: number) => {
    if (qty >= 50) return Math.round(basePrice * 0.9);
    if (qty >= 10) return Math.round(basePrice * 0.95);
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
    setTimeout(() => setAdded(false), 2500);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
    }
    trackEvent('share', { method: 'copy', content_type: 'product', item_id: product.id });
  };

  // Simple calculator: area / 0.09 = qty for 30x30 (approx)
  const calcQty = () => {
    const area = parseFloat(calcArea);
    if (!area || isNaN(area)) return 0;
    // Assume 30x30 = 0.09 m2 per piece, if dimensions known parse? Simplified: 11 pcs per m2
    return Math.ceil(area * 11);
  };

  const calcTotal = calcQty() * currentUnitPrice;

  return (
    <>
      {/* Sticky ATC Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-transform duration-300 lg:bottom-auto lg:top-0 lg:shadow-sm ${
          showSticky ? 'translate-y-0' : 'translate-y-full lg:-translate-y-full'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-[#F8F9FA] border border-gray-200 p-1 shrink-0 hidden sm:block">
              <div className="relative w-full h-full">
                <Image src={images[0]} alt={title} fill className="object-contain p-1" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate max-w-[200px] sm:max-w-[300px]">{title}</div>
              <div className="text-xs text-gray-500">SKU: {product.sku}</div>
            </div>
            <div className="hidden md:block ml-4">
              <Price price={currentUnitPrice} lang={lang} size="md" />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex">
              <QuantitySelector quantity={quantity} onDecrease={() => setQuantity(Math.max(1, quantity - 1))} onIncrease={() => setQuantity(quantity + 1)} />
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all min-h-[44px] ${
                added ? 'bg-emerald-600 text-white' : 'bg-brand-red hover:bg-brand-red-dark text-white shadow-red'
              }`}
            >
              {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              <span className="hidden sm:inline">{added ? (lang === 'ru' ? 'В корзине' : 'Savatda') : (lang === 'ru' ? 'В корзину' : 'Savatga')}</span>
              <span className="sm:hidden">{added ? '✓' : '+'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#F8F9FA] p-2 sm:p-3 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Gallery Column */}
            <div className="lg:col-span-6 space-y-3">
              <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-gray-200 bg-[#F8F9FA] flex items-center justify-center p-4 group">
                <Image
                  src={images[activeImageIndex]}
                  alt={title}
                  fill
                  priority
                  className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {product.isNew && <Badge variant="blue">Yangi</Badge>}
                  {product.isBestseller && <Badge variant="dark">Top Xit</Badge>}
                  {product.oldPrice && product.oldPrice > product.price && (
                    <Badge variant="red">
                      -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                    </Badge>
                  )}
                </div>

                <button
                  onClick={handleShare}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  aria-label="Ulashish"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {images.map((imgUrl: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 bg-[#F8F9FA] transition-all p-1 ${
                        activeImageIndex === idx
                          ? 'border-brand-red ring-2 ring-brand-red/20'
                          : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300'
                      }`}
                    >
                      <Image src={imgUrl} alt={`${title} ${idx + 1}`} fill className="object-contain p-2" />
                    </button>
                  ))}
                  {product.videoUrl && (
                    <a
                      href={product.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-red-200 bg-red-50 flex flex-col items-center justify-center gap-1 shrink-0 hover:bg-red-100 transition-colors"
                    >
                      <Play className="w-6 h-6 text-brand-red fill-brand-red" />
                      <span className="text-[10px] font-bold text-brand-red">VIDEO</span>
                    </a>
                  )}
                </div>
              )}

              {product.videoUrl && images.length <= 1 && (
                <a
                  href={product.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-brand-red font-bold text-sm hover:bg-red-100 transition-colors"
                >
                  <Play className="w-5 h-5 fill-brand-red" />
                  {lang === 'ru' ? 'Смотреть видео заливки' : 'Quyish videosini ko‘rish'}
                </a>
              )}

              {/* Calculator Toggle */}
              <div className="pt-2">
                <button
                  onClick={() => setShowCalc(!showCalc)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-colors"
                >
                  <Calculator className="w-4 h-4" />
                  <span>{lang === 'ru' ? 'Калькулятор: сколько нужно?' : 'Kalkulyator: qancha kerak?'}</span>
                </button>

                {showCalc && (
                  <div className="mt-3 p-4 rounded-xl bg-[#F8F9FA] border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900">{lang === 'ru' ? 'Расчет по площади' : 'Maydon bo‘yicha hisob'}</h4>
                      <button onClick={() => setShowCalc(false)} className="p-1 hover:bg-gray-200 rounded-lg">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700">m² (kvadrat)</label>
                      <input
                        type="number"
                        value={calcArea}
                        onChange={(e) => setCalcArea(e.target.value)}
                        placeholder="Masalan: 50"
                        className="mt-1 w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 outline-none"
                      />
                    </div>
                    {calcQty() > 0 && (
                      <div className="p-3 rounded-lg bg-white border border-gray-200 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kerakli qolip:</span>
                          <span className="font-bold text-gray-900">{calcQty()} dona</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Taxminiy narx:</span>
                          <span className="font-bold text-brand-red">{formatPrice(calcTotal, lang)}</span>
                        </div>
                        <Button size="sm" className="w-full mt-2" onClick={() => setQuantity(calcQty())}>
                          {calcQty()} donani savatga qo‘shish
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500">* 30x30 o‘lcham uchun 1 m² ≈ 11 dona. Boshqa o‘lchamlar uchun operator bilan maslahatlashing.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Details & Actions Column */}
            <div className="lg:col-span-6 space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700 text-xs font-bold">
                    SKU: {product.sku}
                  </span>
                  <StockBadge inStock={product.inStock} lang={lang} />
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight tracking-tight">
                  {title}
                </h1>

                {description && (
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{description}</p>
                )}
              </div>

              {/* Price Box & Bulk Discount Tier */}
              <div className="p-5 rounded-2xl bg-[#F8F9FA] border border-gray-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider block mb-1">
                      {lang === 'ru' ? 'Цена за шт' : 'Narxi (dona)'}
                    </span>
                    <Price price={currentUnitPrice} oldPrice={currentUnitPrice < basePrice ? basePrice : product.oldPrice} lang={lang} size="xl" showDiscountBadge />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setB2bModalOpen(true)}
                    className="gap-2 border-brand-red text-brand-red hover:bg-brand-red hover:text-white text-sm font-bold shrink-0 rounded-xl"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{lang === 'ru' ? 'Оптовая цена' : 'Ulgurji narx'}</span>
                  </Button>
                </div>

                {/* Bulk Wholesale Tier Preview Table */}
                <div className="pt-3 border-t border-gray-200/80">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
                    {lang === 'ru' ? 'Оптовые скидки от объема' : 'Ulgurji hajm chegirmalari'}
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className={`p-3 rounded-xl border-2 transition-all ${quantity < 10 ? 'bg-white border-brand-red shadow-sm' : 'bg-white border-gray-200 text-gray-600'}`}>
                      <div className="text-xs text-gray-500 font-medium">1 – 9 dona</div>
                      <div className="font-bold text-sm mt-1 text-gray-900">{formatPrice(basePrice, lang)}</div>
                    </div>
                    <div className={`p-3 rounded-xl border-2 transition-all ${quantity >= 10 && quantity < 50 ? 'bg-white border-brand-red shadow-sm' : 'bg-white border-gray-200 text-gray-600'}`}>
                      <div className="text-xs text-gray-500 font-medium">10 – 49 dona</div>
                      <div className="font-bold text-sm mt-1 text-emerald-700">{formatPrice(Math.round(basePrice * 0.95), lang)}</div>
                      <div className="text-[10px] font-bold text-emerald-600 mt-0.5">-5% CHEGIRMA</div>
                    </div>
                    <div className={`p-3 rounded-xl border-2 transition-all ${quantity >= 50 ? 'bg-white border-brand-red shadow-sm' : 'bg-white border-gray-200 text-gray-600'}`}>
                      <div className="text-xs text-gray-500 font-medium">50+ dona</div>
                      <div className="font-bold text-sm mt-1 text-brand-red">{formatPrice(Math.round(basePrice * 0.9), lang)}</div>
                      <div className="text-[10px] font-bold text-brand-red mt-0.5">-10% CHEGIRMA</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specifications Table */}
              <div className="border border-gray-200 rounded-2xl bg-white p-4 space-y-2.5">
                <h4 className="font-bold text-gray-900 uppercase tracking-wider text-sm border-b border-gray-100 pb-2.5">
                  {lang === 'ru' ? 'Характеристики' : 'Xususiyatlari va parametrlari'}
                </h4>

                {product.dimensions && (
                  <div className="flex justify-between py-2 border-b border-gray-50 text-sm">
                    <span className="text-gray-500">{lang === 'ru' ? 'Размер' : 'O‘lchami'}:</span>
                    <span className="text-gray-900 font-mono font-bold">{product.dimensions}</span>
                  </div>
                )}

                {product.material && (
                  <div className="flex justify-between py-2 border-b border-gray-50 text-sm">
                    <span className="text-gray-500">{lang === 'ru' ? 'Материал' : 'Material turi'}:</span>
                    <span className="text-gray-900 font-semibold">{product.material}</span>
                  </div>
                )}

                {product.yieldPerCast && (
                  <div className="flex justify-between py-2 border-b border-gray-50 text-sm">
                    <span className="text-gray-500">{lang === 'ru' ? 'За 1 заливку' : 'Bitta quyishda'}:</span>
                    <span className="text-brand-red font-bold">{product.yieldPerCast} dona</span>
                  </div>
                )}

                {product.durabilityCasts && (
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-gray-500">{lang === 'ru' ? 'Ресурс' : 'Xizmat resursi'}:</span>
                    <span className="text-emerald-600 font-bold">{product.durabilityCasts}+ marotaba</span>
                  </div>
                )}

                {product.weight && (
                  <div className="flex justify-between py-2 border-t border-gray-50 text-sm">
                    <span className="text-gray-500">{lang === 'ru' ? 'Вес' : 'Og‘irligi'}:</span>
                    <span className="text-gray-900 font-medium">{product.weight}</span>
                  </div>
                )}
              </div>

              {/* Quantity & Cart Action */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <QuantitySelector
                    quantity={quantity}
                    onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
                    onIncrease={() => setQuantity(quantity + 1)}
                    className="justify-center sm:justify-start"
                  />

                  <button
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                    className={`flex-1 flex items-center justify-center gap-2 text-sm sm:text-base font-bold py-3.5 px-6 rounded-xl transition-all min-h-[52px] ${
                      added
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : product.inStock
                        ? 'bg-brand-red hover:bg-brand-red-dark text-white shadow-red hover:shadow-lg active:scale-[0.98]'
                        : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                    }`}
                  >
                    {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                    <span>
                      {added
                        ? (lang === 'ru' ? 'В корзине ✓' : 'Savatga qo‘shildi ✓')
                        : (lang === 'ru' ? 'Добавить в корзину' : 'Savatga qo‘shish')}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setOneClickOpen(true)}
                    disabled={!product.inStock}
                    className="py-3 px-4 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                  >
                    {lang === 'ru' ? 'Заказ в 1 клик' : '1-klikda buyurtma'}
                  </button>
                  <button
                    onClick={() => setB2bModalOpen(true)}
                    className="py-3 px-4 rounded-xl bg-white border-2 border-gray-200 text-gray-900 font-bold text-sm hover:border-gray-900 hover:bg-gray-50 transition-colors min-h-[44px]"
                  >
                    {lang === 'ru' ? 'Опт' : 'Ulgurji'}
                  </button>
                </div>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F8F9FA] border border-gray-200">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-brand-red" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-xs">Express</div>
                    <div className="text-xs text-gray-500">1-3 kunda yetkazish</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F8F9FA] border border-gray-200">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-xs">100% Kafolat</div>
                    <div className="text-xs text-gray-500">300+ quyish resursi</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ProductTabs
          lang={lang}
          description={description}
          specs={{
            dimensions: product.dimensions,
            material: product.material,
            weight: product.weight,
            yieldPerCast: product.yieldPerCast,
            durabilityCasts: product.durabilityCasts,
            sku: product.sku,
          }}
        />
      </div>

      <B2BModal
        isOpen={b2bModalOpen}
        onClose={() => setB2bModalOpen(false)}
        lang={lang}
        productName={title}
        productId={product.id}
      />

      <OneClickModal
        isOpen={oneClickOpen}
        onClose={() => setOneClickOpen(false)}
        lang={lang}
        product={{
          id: product.id,
          title,
          price: currentUnitPrice,
          sku: product.sku,
          image: images[0],
        }}
      />
    </>
  );
};
