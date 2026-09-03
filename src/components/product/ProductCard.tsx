'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Check, ImageOff, ArrowRight, Share2, Heart, Eye, ArrowRightLeft } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useCompareStore } from '@/lib/store/compareStore';
import { Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';
import { Price } from '@/components/ui/Price';
import { StockBadge } from '@/components/ui/StockBadge';
import { QuickViewModal } from './QuickViewModal';
import { B2BModal } from './B2BModal';

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
  images: { url: string; altText?: string | null; type?: string | null }[];
}

interface ProductCardProps {
  product: ProductCardData;
  lang: Locale;
  featured?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, lang, featured = false }) => {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const toggleCompare = useCompareStore((s) => s.toggleCompare);
  const isCompared = useCompareStore((s) => s.isCompared(product.id));
  const [added, setAdded] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [quickOpen, setQuickOpen] = React.useState(false);
  const [b2bOpen, setB2bOpen] = React.useState(false);

  // If price is not set (0), this is a price-on-request catalog item -> route to B2B inquiry
  const askPrice = !product.price || product.price <= 0;

  const title = lang === 'ru' ? product.titleRu : product.titleUz;
  const mainImage = product.images?.[0]?.url;
  // Prefer the finished-result photo as the hover image (QOLIP -> NATIJA), else fall back to the 2nd image
  const hoverImage = product.images?.find((i) => i.type === 'FINISHED_RESULT')?.url || product.images?.[1]?.url;

  const hasDiscount = Boolean(product.oldPrice && product.oldPrice > product.price);
  const discountPercent = hasDiscount && product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;

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
    trackEvent('add_to_cart', { item_id: product.id, item_name: title, price: product.price });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({ id: product.id, slug: product.slug, title, price: product.price, image: mainImage || '', sku: product.sku });
    trackEvent(isWishlisted ? 'remove_from_wishlist' : 'add_to_wishlist', { item_id: product.id });
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompare({
      id: product.id,
      slug: product.slug,
      title,
      price: product.price,
      oldPrice: product.oldPrice,
      image: mainImage || '',
      sku: product.sku,
      dimensions: product.dimensions || null,
      inStock: product.inStock,
    });
    trackEvent(isCompared ? 'remove_from_compare' : 'add_to_compare', { item_id: product.id });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/${lang}/product/${product.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
    }
    trackEvent('share', { method: 'copy_link', content_type: 'product', item_id: product.id });
  };

  return (
    <div
      className={`group relative bg-white border border-[#E5E7EB] rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-[#111827] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}
    >
      {/* Industrial top line on hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gray-900 opacity-0 group-hover:opacity-100 transition-opacity z-10" />

      {/* Badges — industrial mono */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        {hasDiscount && (
          <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#E61C24] text-white text-xs font-mono font-bold tracking-wider">
            -{discountPercent}%
          </div>
        )}
        {product.isNew && (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#2563eb] text-white text-[11px] font-mono font-bold tracking-wider uppercase">
            {lang === 'ru' ? 'NEW' : 'YANGI'}
          </div>
        )}
        {product.isBestseller && !product.isNew && !hasDiscount && (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#111827] text-white text-[11px] font-mono font-bold tracking-wider uppercase">
            {lang === 'ru' ? 'ХИТ' : 'TOP'}
          </div>
        )}
      </div>

      {/* Actions — appear on hover, industrial */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200">
        <button
          onClick={handleWishlist}
          className={`w-9 h-9 rounded-full border flex items-center justify-center backdrop-blur-md transition-all ${isWishlisted ? 'bg-[#E61C24] border-[#E61C24] text-white' : 'bg-white/90 border-[#E5E7EB] text-[#6B7280] hover:text-[#E61C24] hover:border-[#E61C24]/30'}`}
          aria-label="Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
        </button>
        <button
          onClick={handleCompare}
          className={`w-9 h-9 rounded-full border flex items-center justify-center backdrop-blur-md transition-all ${isCompared ? 'bg-[#111827] border-[#111827] text-white' : 'bg-white/90 border-[#E5E7EB] text-[#6B7280] hover:text-[#111827]'}`}
          aria-label="Compare"
        >
          <ArrowRightLeft className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickOpen(true); }}
          className="w-9 h-9 rounded-full bg-white/90 border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#111827] backdrop-blur-md transition-all"
          aria-label="Quick view"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={handleShare}
          className="w-9 h-9 rounded-full bg-white/90 border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:text-[#111827] backdrop-blur-md transition-all"
          aria-label="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      <QuickViewModal isOpen={quickOpen} onClose={() => setQuickOpen(false)} lang={lang} product={product} />
      <B2BModal isOpen={b2bOpen} onClose={() => setB2bOpen(false)} lang={lang} productName={title} productId={product.id} />

      {/* Image — industrial grid + premium */}
      <Link
        href={`/${lang}/product/${product.slug}`}
        className="block relative aspect-[4/3] w-full bg-[#F8F9FA] overflow-hidden industrial-grid"
      >
        {!imgLoaded && <div className="absolute inset-0 bg-[#F1F3F5] animate-pulse" />}
        {mainImage && !imgError ? (
          <>
            <Image
              src={mainImage}
              alt={title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              onError={() => setImgError(true)}
              onLoad={() => setImgLoaded(true)}
              className="object-contain p-5 group-hover:scale-[1.03] transition-transform duration-500 ease-out"
            />
            {hoverImage && (
              <Image
                src={hoverImage}
                alt={`${title} hover`}
                fill
                sizes="25vw"
                className="object-contain p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-400 bg-white"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#D1D5DB] select-none">
            <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E7EB] flex items-center justify-center mb-2">
              <ImageOff className="w-6 h-6 text-[#9CA3AF]" />
            </div>
            <span className="text-[11px] font-mono font-bold tracking-widest text-[#9CA3AF] uppercase">SPS</span>
          </div>
        )}

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E5E7EB] to-transparent opacity-60" />
      </Link>

      {/* Details — premium typography */}
      <div className="p-4 flex flex-col flex-1 gap-3 bg-white">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-wider text-[#9CA3AF] uppercase">SKU: {product.sku}</span>
            <StockBadge inStock={product.inStock} lang={lang} />
          </div>

          <Link href={`/${lang}/product/${product.slug}`} className="block group/title">
            <h3 className="font-bold text-[14px] leading-[1.3] text-[#111827] group-hover/title:text-[#E61C24] transition-colors line-clamp-2 min-h-[36px] tracking-[-0.01em]">
              {title}
            </h3>
          </Link>

          {product.dimensions && (
            <div className="flex items-center gap-1.5 text-[12px]">
              <div className="w-1 h-1 rounded-full bg-[#9CA3AF]" />
              <span className="text-[#6B7280] font-mono text-[11px] uppercase tracking-wider">{lang === 'ru' ? 'Размер' : 'O‘lcham'}</span>
              <span className="text-[#111827] font-mono font-bold">{product.dimensions}</span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-[#F1F3F5] space-y-3">
          <Price price={product.price} oldPrice={product.oldPrice} lang={lang} size="md" />

          {product.hasVariants ? (
            <Link
              href={`/${lang}/product/${product.slug}`}
              className="w-full flex items-center justify-between px-4 py-3 rounded-full bg-[#111827] text-white text-sm font-bold hover:bg-black transition-colors group/btn min-h-[44px] btn-press"
            >
              <span>{lang === 'ru' ? 'Выбрать' : 'Tanlash'}</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          ) : askPrice ? (
            <button
              onClick={() => setB2bOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-bold transition-all min-h-[44px] btn-press bg-[#111827] hover:bg-black text-white"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{lang === 'ru' ? 'Запросить цену' : 'Narx so‘rash'}</span>
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-bold transition-all min-h-[44px] btn-press ${added ? 'bg-[#059669] text-white' : product.inStock ? 'bg-[#E61C24] hover:bg-[#C4141B] text-white' : 'bg-[#F1F3F5] text-[#9CA3AF] border border-[#E5E7EB] cursor-not-allowed'}`}
            >
              {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
              <span>{added ? (lang === 'ru' ? 'В корзине' : 'Savatda') : lang === 'ru' ? 'В корзину' : 'Savatga qo‘shish'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
