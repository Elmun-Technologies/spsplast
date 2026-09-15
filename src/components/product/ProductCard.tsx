'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ShoppingBag, Check, ImageOff, ArrowRight, Share2, Heart, Eye, ArrowRightLeft } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useCompareStore } from '@/lib/store/compareStore';
import { Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';
import { Price } from '@/components/ui/Price';
import { StockBadge } from '@/components/ui/StockBadge';
import { useCanHover } from '@/lib/hooks/useMediaQuery';

/**
 * Modal dialogs are opened from a hover action, so their code does not need to
 * be part of the catalog/home bundle. They are loaded on demand the first time
 * a card actually opens one.
 */
const QuickViewModal = dynamic(
  () => import('./QuickViewModal').then((m) => m.QuickViewModal),
  { ssr: false }
);

const B2BModal = dynamic(
  () => import('./B2BModal').then((m) => m.B2BModal),
  { ssr: false }
);

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

const ProductCardBase: React.FC<ProductCardProps> = ({ product, lang, featured = false }) => {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const toggleCompare = useCompareStore((s) => s.toggleCompare);
  const isCompared = useCompareStore((s) => s.isCompared(product.id));
  const [added, setAdded] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [quickOpen, setQuickOpen] = React.useState(false);
  const [b2bOpen, setB2bOpen] = React.useState(false);
  const addedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only devices with a real pointer get the hover image and hover actions.
  const canHover = useCanHover();

  React.useEffect(() => () => {
    if (addedTimer.current) clearTimeout(addedTimer.current);
  }, []);

  // If price is not set (0), this is a price-on-request catalog item -> route to B2B inquiry
  const askPrice = !product.price || product.price <= 0;

  const title = lang === 'ru' ? product.titleRu : product.titleUz;
  const mainImage = product.images?.[0]?.url;
  // Prefer the finished-result photo as the hover image (QOLIP -> NATIJA), else fall back to the 2nd image
  const hoverImage = product.images?.find((i) => i.type === 'FINISHED_RESULT')?.url || product.images?.[1]?.url;
  // The hover image is only mounted after a real hover, so touch devices never download it.
  const showHoverImage = Boolean(hoverImage) && canHover && hovered;

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
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 2000);
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
      className={`group relative bg-surface rounded-[20px] border border-line overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-lift hover:border-[#E2E8F0] ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}
      onMouseEnter={canHover ? () => setHovered(true) : undefined}
      onMouseLeave={canHover ? () => setHovered(false) : undefined}
    >
      {/* Hairline highlight on hover (no heavy accent bar) */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-red/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />

      {/* Badges — industrial mono */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
        {hasDiscount && (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-brand-red text-white text-[12px] font-bold tracking-tight shadow-[0_4px_12px_-4px_rgba(230,28,36,0.6)]">
            -{discountPercent}%
          </div>
        )}
        {product.isNew && (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface/95 text-ink text-[11px] font-bold tracking-tight border border-line">
            {lang === 'ru' ? 'Новинка' : 'Yangi'}
          </div>
        )}
        {product.isBestseller && !product.isNew && !hasDiscount && (
          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface/95 text-ink text-[11px] font-bold tracking-tight border border-line">
            {lang === 'ru' ? 'Хит продаж' : 'Top mahsulot'}
          </div>
        )}
      </div>

      {/*
        Actions — hover-revealed on pointer devices, always visible on touch
        (`hover-reveal` in globals.css) so wishlist/quick view stay reachable.
        Solid backgrounds instead of backdrop-blur: 4 blurred layers per card
        is a real paint cost on mobile GPUs.
      */}
      <div className="hover-reveal absolute top-3 right-3 z-10 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200">
        <button
          onClick={handleWishlist}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-card transition-all ${isWishlisted ? 'bg-brand-red text-white' : 'bg-surface/95 text-ink-soft hover:text-brand-red'}`}
          aria-label={lang === 'ru' ? 'В избранное' : 'Sevimlilarga'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
        </button>
        <button
          onClick={handleCompare}
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-card transition-all ${isCompared ? 'bg-ink text-white' : 'bg-surface/95 text-ink-soft hover:text-ink'}`}
          aria-label={lang === 'ru' ? 'Сравнить' : 'Taqqoslash'}
        >
          <ArrowRightLeft className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickOpen(true); }}
          className="w-10 h-10 rounded-full bg-surface/95 shadow-card flex items-center justify-center text-ink-soft hover:text-ink transition-all"
          aria-label={lang === 'ru' ? 'Быстрый просмотр' : 'Tez ko‘rish'}
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={handleShare}
          className="w-10 h-10 rounded-full bg-surface/95 shadow-card flex items-center justify-center text-ink-soft hover:text-ink transition-all"
          aria-label={lang === 'ru' ? 'Поделиться' : 'Ulashish'}
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Modals are mounted only while open (and code-split) */}
      {quickOpen && (
        <QuickViewModal isOpen onClose={() => setQuickOpen(false)} lang={lang} product={product} />
      )}
      {b2bOpen && (
        <B2BModal isOpen onClose={() => setB2bOpen(false)} lang={lang} productName={title} productId={product.id} />
      )}

      {/* Image — industrial grid + premium */}
      <Link
        href={`/${lang}/product/${product.slug}`}
        className="block relative aspect-[4/3] w-full bg-surface-soft overflow-hidden"
      >
        {!imgLoaded && <div className="absolute inset-0 bg-[#EDF1F6] animate-pulse" />}
        {mainImage && !imgError ? (
          <>
            <Image
              src={mainImage}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={() => setImgError(true)}
              onLoad={() => setImgLoaded(true)}
              className="object-contain p-6 group-hover:scale-[1.04] transition-transform duration-500 ease-out"
            />
            {showHoverImage && (
              <Image
                src={hoverImage as string}
                alt={`${title} hover`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-contain p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-400 bg-surface-soft"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[#C6CDD8] select-none">
            <div className="w-12 h-12 rounded-[20px] bg-surface border border-line flex items-center justify-center mb-2">
              <ImageOff className="w-6 h-6 text-[#B4BCCA]" />
            </div>
            <span className="text-[11px] font-semibold tracking-[0.2em] text-[#B4BCCA] uppercase">SPS</span>
          </div>
        )}
      </Link>

      {/* Details — premium typography */}
      <div className="p-4 sm:p-[18px] flex flex-col flex-1 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <StockBadge inStock={product.inStock} lang={lang} />
            {/* SKU stays visible: B2B buyers search and order by article number */}
            <span className="text-[11px] text-ink-sub whitespace-nowrap">SKU: {product.sku}</span>
          </div>

          <Link href={`/${lang}/product/${product.slug}`} className="block group/title">
            <h3 className="font-semibold text-[14px] sm:text-[15px] leading-[1.35] text-ink group-hover/title:text-brand-red transition-colors line-clamp-2 min-h-[38px]">
              {title}
            </h3>
          </Link>

          {product.dimensions && (
            <p className="text-[12px] text-ink-sub">
              {lang === 'ru' ? 'Размер' : 'O‘lcham'}:{' '}
              <span className="text-ink-soft font-medium">{product.dimensions}</span>
            </p>
          )}
        </div>

        <div className="mt-auto space-y-3">
          <Price price={product.price} oldPrice={product.oldPrice} lang={lang} size="md" showDiscountBadge={false} />

          {product.hasVariants ? (
            <Link
              href={`/${lang}/product/${product.slug}`}
              className="w-full flex items-center justify-between px-5 py-3 rounded-full bg-ink text-white text-sm font-semibold hover:bg-black transition-colors group/btn min-h-[44px] btn-press"
            >
              <span>{lang === 'ru' ? 'Выбрать' : 'Tanlash'}</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          ) : askPrice ? (
            <button
              onClick={() => setB2bOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-semibold transition-all min-h-[44px] btn-press bg-ink hover:bg-black text-white"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{lang === 'ru' ? 'Запросить цену' : 'Narx so‘rash'}</span>
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full text-sm font-semibold transition-all min-h-[44px] btn-press ${
                added
                  ? 'bg-emerald-600 text-white'
                  : product.inStock
                  ? 'bg-brand-red hover:bg-brand-red-dark text-white shadow-[0_8px_20px_-10px_rgba(230,28,36,0.7)]'
                  : 'bg-surface-soft text-ink-sub cursor-not-allowed'
              }`}
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

/**
 * Catalog pages render this card 24x, and the parent (CatalogClient) re-renders
 * on every keystroke inside the price filter inputs. Memoising keeps those
 * interactions instant.
 */
export const ProductCard = React.memo(ProductCardBase);
ProductCard.displayName = 'ProductCard';
