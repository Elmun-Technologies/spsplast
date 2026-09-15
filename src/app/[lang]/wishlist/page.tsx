'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useCartStore } from '@/lib/store/cartStore';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatPrice } from '@/lib/utils';
import { Locale, getDictionary } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

export default function WishlistPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);
  const { items, removeWishlist, clearRecent } = useWishlistStore() as any;
  const wishlistItems = useWishlistStore((s) => s.items);
  const remove = useWishlistStore((s) => s.removeWishlist);
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (item: any) => {
    addItem({
      productId: item.id,
      title: item.title,
      sku: item.sku,
      price: item.price,
      image: item.image,
      quantity: 1,
    });
    trackEvent('add_to_cart', { item_id: item.id, from: 'wishlist' });
  };

  return (
    <div className="bg-surface-page min-h-screen py-6 text-ink">
      <Container>
        <Breadcrumbs lang={lang} items={[{ label: lang === 'ru' ? 'Избранное' : 'Sevimlilar', active: true }]} className="mb-4" />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-[16px] bg-[#FEF0F0] flex items-center justify-center">
            <Heart className="w-6 h-6 text-brand-red fill-brand-red" />
          </div>
          <div>
            <h1 className="text-[26px] sm:text-[30px] font-bold text-ink tracking-[-0.025em] leading-tight">{lang === 'ru' ? 'Избранное' : 'Sevimli mahsulotlar'}</h1>
            <p className="text-sm text-ink-sub">{wishlistItems.length} ta mahsulot</p>
          </div>
        </div>

        {wishlistItems.length === 0 ? (
          <EmptyState lang={lang} type="wishlist" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {wishlistItems.map((item) => (
              <div key={item.id} className="group bg-surface rounded-[18px] border border-line shadow-card overflow-hidden hover:shadow-card transition-all">
                <Link href={`/${lang}/product/${item.slug}`} className="block relative aspect-[4/3] bg-surface-soft p-4 border-b border-line-soft">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} fill sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-contain p-3 group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-ink-sub">SPS</div>
                  )}
                </Link>
                <div className="p-3.5 space-y-2.5">
                  <Link href={`/${lang}/product/${item.slug}`} className="block text-sm font-bold text-ink line-clamp-2 leading-snug hover:text-brand-red">
                    {item.title}
                  </Link>
                  <div className="text-sm font-bold text-brand-red">{formatPrice(item.price, lang)}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="flex items-center justify-center gap-2 py-2.5 min-h-[44px] bg-brand-red text-white rounded-full text-[13px] font-semibold hover:bg-brand-red-dark transition-colors"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Savat
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      className="flex items-center justify-center gap-1 py-2.5 bg-surface-soft border border-line rounded-[16px] text-xs font-bold text-ink-soft hover:text-brand-red hover:bg-[#FEF0F0]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      O‘chirish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
