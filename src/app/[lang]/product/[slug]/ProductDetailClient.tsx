'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Send, Building2, Truck, ShieldCheck, Share2, Calculator, X, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { ProductTabs } from '@/components/product/ProductTabs';
import { ProductOptions, ProductOptionGroup } from '@/components/product/ProductOptions';
import { LeadModal } from '@/components/lead/LeadModal';
import { useUIStore } from '@/lib/store/uiStore';
import { Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

/**
 * Mahsulot sahifasining interaktiv qismi.
 *
 * 2026-10-04 arxitektura qarori: savat/checkout yo'q. Shuning uchun sahifada
 * narx bo'yicha savdo mexanikasi ham yo'q — barcha CTA'lar zayafka formasini
 * ochadi va menejer narxni telefonda tasdiqlaydi. Xarid qilish savati o'rniga
 * "miqdor + zayafka" oqimi ishlatiladi.
 */
interface ProductDetailClientProps {
  product: any;
  lang: Locale;
}

export const ProductDetailClient: React.FC<ProductDetailClientProps> = ({ product, lang }) => {
  const setBottomBarOwner = useUIStore((s) => s.setBottomBarOwner);

  const images = product.images.length > 0 ? product.images.map((i: any) => i.url) : ['/catalog/catalog-053.jpg'];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [calcArea, setCalcArea] = useState('');
  const [showCalc, setShowCalc] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [lead, setLead] = useState<null | 'PRODUCT_REQUEST' | 'B2B_WHOLESALE'>(null);

  const title = lang === 'ru' ? product.titleRu : product.titleUz;
  const description = lang === 'ru' ? product.descriptionRu : product.descriptionUz;
  const askPrice = !product.price || product.price <= 0;

  useEffect(() => {
    trackEvent('view_item', {
      item_id: product.id,
      item_name: title,
      price: product.price,
      item_category: product.category || '',
    });
  }, [product.id, product.price, product.category, title]);

  // Sticky panel faqat asosiy CTA ekrandan chiqqach ko'rinadi (scroll
  // listener o'rniga IntersectionObserver — sahifa qayta render bo'lmaydi).
  useEffect(() => {
    const sentinel = document.getElementById('atc-sentinel');
    if (!sentinel) return;

    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting), {
      rootMargin: '-400px 0px 0px 0px',
      threshold: 0,
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [product.id]);

  // Mahsulot sahifasidagi sticky panel mobil aloqa panelini yashirishi uchun.
  useEffect(() => {
    setBottomBarOwner(showSticky ? 'product' : null);
    return () => setBottomBarOwner(null);
  }, [showSticky, setBottomBarOwner]);

  /**
   * Variant opsiyalari (material, plastik qalinligi). Har bir guruhning birinchi
   * qiymati oldindan tanlanadi — zayafka xabariga aniq SKU tushadi.
   */
  const optionGroups: ProductOptionGroup[] = React.useMemo(() => product.optionGroups || [], [product.optionGroups]);
  const variantList: Array<{ id: string; sku: string; price: number; optionCodes: string[] }> = React.useMemo(
    () => product.variants || [],
    [product.variants]
  );

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(optionGroups.map((group) => [group.code, group.values[0]?.code]).filter(([, v]) => v))
  );

  const selectedVariant = React.useMemo(() => {
    if (variantList.length === 0 || optionGroups.length === 0) return null;
    return (
      variantList.find((variant) =>
        optionGroups.every((group) => variant.optionCodes.includes(selectedOptions[group.code]))
      ) || null
    );
  }, [variantList, optionGroups, selectedOptions]);

  const selectedOptionLabels = optionGroups
    .map((group) => group.values.find((value) => value.code === selectedOptions[group.code])?.label)
    .filter(Boolean)
    .join(' · ');

  const displaySku = selectedVariant?.sku || product.sku;
  const leadTitle = selectedOptionLabels ? `${title} (${selectedOptionLabels})` : title;

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

  // Maydon bo'yicha qolip soni: 30×30 o'lcham uchun 1 m² ≈ 11 dona.
  const calcQty = () => {
    const area = parseFloat(calcArea);
    if (!area || isNaN(area)) return 0;
    return Math.ceil(area * 11);
  };

  return (
    <>
      {/* Sticky CTA panel (mobil va desktop) */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 bg-surface border-t border-line shadow-[0_-12px_30px_-20px_rgba(16,24,40,0.35)] transition-transform duration-300 ${
          showSticky ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-[14px] bg-surface-soft p-1 shrink-0 hidden sm:block">
              <div className="relative w-full h-full">
                <Image src={images[0]} alt={title} fill sizes="48px" className="object-contain p-1" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink truncate max-w-[200px] sm:max-w-[300px]">{title}</div>
              <div className="text-xs text-ink-sub">SKU: {displaySku}</div>
            </div>
            <div className="hidden md:block ml-4">
              <Price price={product.price} lang={lang} size="md" />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex">
              <QuantitySelector
                quantity={quantity}
                onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
                onIncrease={() => setQuantity(quantity + 1)}
              />
            </div>
            <button
              onClick={() => setLead('PRODUCT_REQUEST')}
              disabled={!product.inStock}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all min-h-[46px] bg-brand-red hover:bg-brand-red-dark text-white shadow-red disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'ru' ? 'Оставить заявку' : 'Zayafka berish'}</span>
              <span className="sm:hidden">✚</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sentinel: sticky panel shu element ekrandan chiqqach paydo bo'ladi */}
      <div id="atc-sentinel" aria-hidden="true" className="h-px w-full" />

      <div className="bg-surface-soft p-2 sm:p-3 rounded-[24px]">
        <div className="bg-surface rounded-[20px] p-4 sm:p-7 shadow-card">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Galereya */}
            <div className="lg:col-span-6 space-y-3">
              <div className="relative aspect-square w-full rounded-[18px] overflow-hidden bg-surface-soft flex items-center justify-center p-4 group">
                <Image
                  src={images[activeImageIndex]}
                  alt={title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {product.isNew && <Badge variant="blue">{lang === 'ru' ? 'Новинка' : 'Yangi'}</Badge>}
                  {product.isBestseller && <Badge variant="dark">{lang === 'ru' ? 'Хит' : 'Top mahsulot'}</Badge>}
                  {product.oldPrice && product.oldPrice > product.price && (
                    <Badge variant="red">
                      -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                    </Badge>
                  )}
                </div>

                <button
                  onClick={handleShare}
                  className="absolute top-3 right-3 w-10 h-10 rounded-full bg-surface/95 shadow-card flex items-center justify-center text-ink-soft hover:text-ink transition-colors"
                  aria-label={lang === 'ru' ? 'Поделиться' : 'Ulashish'}
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
                      aria-current={activeImageIndex === idx}
                      className={`relative w-20 h-20 rounded-[16px] overflow-hidden shrink-0 bg-surface-soft transition-all p-1 border-2 ${
                        activeImageIndex === idx ? 'border-brand-red' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image src={imgUrl} alt={`${title} ${idx + 1}`} fill sizes="80px" className="object-contain p-2" />
                    </button>
                  ))}
                  {product.videoUrl && (
                    <a
                      href={product.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-20 h-20 rounded-[16px] overflow-hidden bg-[#FEF0F0] flex flex-col items-center justify-center gap-1 shrink-0 hover:bg-[#FCE4E4] transition-colors"
                    >
                      <Play className="w-6 h-6 text-brand-red fill-brand-red" />
                      <span className="text-[10px] font-bold text-brand-red">VIDEO</span>
                    </a>
                  )}
                </div>
              )}

              {/* Kalkulyator: maydon -> qolip soni (narx emas — narx menejerda) */}
              <div className="pt-2">
                <button
                  onClick={() => setShowCalc(!showCalc)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-ink text-white font-semibold text-sm hover:bg-black transition-colors"
                >
                  <Calculator className="w-4 h-4" />
                  <span>{lang === 'ru' ? 'Калькулятор: сколько нужно?' : 'Kalkulyator: qancha kerak?'}</span>
                </button>

                {showCalc && (
                  <div className="mt-3 p-4 rounded-[16px] bg-surface-soft space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-ink">
                        {lang === 'ru' ? 'Расчёт по площади' : 'Maydon bo‘yicha hisob'}
                      </h4>
                      <button
                        onClick={() => setShowCalc(false)}
                        className="p-1.5 hover:bg-[#E7ECF3] rounded-full text-ink-soft transition-colors"
                        aria-label={lang === 'ru' ? 'Закрыть' : 'Yopish'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <label htmlFor="calc-area" className="text-xs font-semibold text-ink-soft">m²</label>
                      <input
                        id="calc-area"
                        type="number"
                        inputMode="decimal"
                        aria-label={
                          lang === 'ru' ? 'Площадь в квадратных метрах' : 'Maydon (kvadrat metr)'
                        }
                        value={calcArea}
                        onChange={(e) => setCalcArea(e.target.value)}
                        placeholder={lang === 'ru' ? 'Например: 50' : 'Masalan: 50'}
                        className="mt-1 w-full px-4 py-2.5 rounded-full bg-surface-soft text-sm focus:bg-white focus:ring-1 focus:ring-line outline-none min-h-[44px]"
                      />
                    </div>
                    {calcQty() > 0 && (
                      <div className="p-3.5 rounded-[16px] bg-surface text-sm space-y-3 shadow-card">
                        <div className="flex justify-between">
                          <span className="text-ink-soft">{lang === 'ru' ? 'Нужно форм:' : 'Kerakli qolip:'}</span>
                          <span className="font-bold text-ink">{calcQty()} {lang === 'ru' ? 'шт' : 'dona'}</span>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setQuantity(calcQty());
                            setLead('PRODUCT_REQUEST');
                          }}
                        >
                          {lang === 'ru' ? 'Оставить заявку на это количество' : 'Shu miqdorga zayafka berish'}
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-ink-sub">
                      * 30×30 o‘lcham uchun 1 m² ≈ 11 dona. Boshqa o‘lchamlar uchun menejer bilan maslahatlashing.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Ma'lumot va harakatlar */}
            <div className="lg:col-span-6 space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="bg-surface-soft px-2.5 py-1 rounded-full text-ink-soft text-[12px] font-medium">
                    SKU: {displaySku}
                  </span>
                </div>

                <h1 className="text-[24px] sm:text-[30px] font-bold text-ink leading-[1.2] tracking-[-0.025em]">{title}</h1>

                {description && <p className="text-sm sm:text-base text-ink-soft leading-relaxed">{description}</p>}
              </div>

              {/* Narx holati: katalogda narx yo'q — ochiq aytamiz */}
              <div className="p-5 rounded-[20px] bg-surface-soft space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[12px] text-ink-sub font-medium block mb-1">
                      {lang === 'ru' ? 'Цена' : 'Narxi'}
                    </span>
                    <Price price={product.price} oldPrice={product.oldPrice} lang={lang} size="xl" showDiscountBadge />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLead('B2B_WHOLESALE')}
                    className="gap-2 border-brand-red text-brand-red hover:bg-brand-red hover:text-white text-[13px] shrink-0"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{lang === 'ru' ? 'Оптовая цена' : 'Ulgurji narx'}</span>
                  </Button>
                </div>
                <p className="text-xs text-ink-sub pt-3 border-t border-line">
                  {lang === 'ru'
                    ? 'Цена зависит от модели, материала (PP/ABS) и объёма. Оставьте заявку — менеджер назовёт точную цену и наличие.'
                    : 'Narx model, material (PP/ABS) va hajmga bog‘liq. Zayafka qoldiring — menejer aniq narx va mavjudlikni aytadi.'}
                </p>
              </div>

              {/* Variant opsiyalari */}
              <ProductOptions
                groups={optionGroups}
                selected={selectedOptions}
                onSelect={(groupCode, valueCode) => setSelectedOptions((prev) => ({ ...prev, [groupCode]: valueCode }))}
                lang={lang}
                variantSku={selectedVariant?.sku}
              />

              {/* Xususiyatlar */}
              <div className="rounded-[20px] bg-surface-soft p-5 space-y-2.5">
                <h4 className="font-semibold text-ink text-[15px] pb-2.5 border-b border-line">
                  {lang === 'ru' ? 'Характеристики' : 'Xususiyatlari va parametrlari'}
                </h4>

                {product.dimensions && (
                  <div className="flex justify-between py-2.5 border-b border-line-soft text-sm">
                    <span className="text-ink-sub">{lang === 'ru' ? 'Размер' : 'O‘lchami'}:</span>
                    <span className="text-ink font-semibold">{product.dimensions}</span>
                  </div>
                )}

                {product.material && (
                  <div className="flex justify-between py-2.5 border-b border-line-soft text-sm">
                    <span className="text-ink-sub">{lang === 'ru' ? 'Материал' : 'Material turi'}:</span>
                    <span className="text-ink font-semibold">{product.material}</span>
                  </div>
                )}

                {product.yieldPerCast && (
                  <div className="flex justify-between py-2.5 border-b border-line-soft text-sm">
                    <span className="text-ink-sub">{lang === 'ru' ? 'За 1 заливку' : 'Bitta quyishda'}:</span>
                    <span className="text-brand-red font-bold">{product.yieldPerCast} {lang === 'ru' ? 'шт' : 'dona'}</span>
                  </div>
                )}

                {product.durabilityCasts && (
                  <div className="flex justify-between py-2 text-sm">
                    <span className="text-ink-sub">{lang === 'ru' ? 'Ресурс' : 'Xizmat resursi'}:</span>
                    <span className="text-emerald-600 font-bold">{product.durabilityCasts}+</span>
                  </div>
                )}
              </div>

              {/* Miqdor va zayafka */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <QuantitySelector
                    quantity={quantity}
                    onDecrease={() => setQuantity(Math.max(1, quantity - 1))}
                    onIncrease={() => setQuantity(quantity + 1)}
                    className="justify-center sm:justify-start"
                  />

                  <button
                    disabled={!product.inStock}
                    onClick={() => setLead('PRODUCT_REQUEST')}
                    className="flex-1 flex items-center justify-center gap-2 text-sm sm:text-base font-semibold py-3.5 px-6 rounded-full transition-all min-h-[52px] bg-brand-red hover:bg-brand-red-dark text-white shadow-red active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                    <span>
                      {askPrice
                        ? lang === 'ru'
                          ? 'Запросить цену'
                          : 'Narx so‘rash'
                        : lang === 'ru'
                        ? 'Оставить заявку'
                        : 'Zayafka berish'}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setLead('PRODUCT_REQUEST')}
                    disabled={!product.inStock}
                    className="py-3 px-4 rounded-full bg-ink text-white font-semibold text-sm hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[46px]"
                  >
                    {lang === 'ru' ? 'Заявка в 1 клик' : '1-klikda zayafka'}
                  </button>
                  <button
                    onClick={() => setLead('B2B_WHOLESALE')}
                    className="py-3 px-4 rounded-full bg-surface-soft text-ink font-semibold text-sm hover:bg-[#E9EDF3] transition-colors min-h-[46px]"
                  >
                    {lang === 'ru' ? 'Опт' : 'Ulgurji'}
                  </button>
                </div>
              </div>

              {/* Kafolat bloklari — faqat dalillangan da'volar */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2.5 p-3.5 rounded-[16px] bg-surface-soft">
                  <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center shrink-0 shadow-card">
                    <Truck className="w-5 h-5 text-brand-red" />
                  </div>
                  <div>
                    <div className="font-semibold text-ink text-[13px]">{lang === 'ru' ? 'Доставка' : 'Yetkazish'}</div>
                    <div className="text-xs text-ink-sub">
                      {lang === 'ru' ? 'Ташкент: 1 рабочий день' : 'Toshkent: 1 ish kuni'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3.5 rounded-[16px] bg-surface-soft">
                  <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center shrink-0 shadow-card">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-ink text-[13px]">{lang === 'ru' ? 'Гарантия' : 'Kafolat'}</div>
                    <div className="text-xs text-ink-sub">
                      {lang === 'ru' ? 'Ресурс зависит от модели' : 'Resurs modelga bog‘liq'}
                    </div>
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
            sku: displaySku,
          }}
        />
      </div>

      {lead && (
        <LeadModal
          isOpen
          onClose={() => setLead(null)}
          lang={lang}
          product={{ title: leadTitle, sku: displaySku }}
          defaultQuantity={quantity}
          type={lead}
        />
      )}
    </>
  );
};
