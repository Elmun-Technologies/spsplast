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
    <div className="bg-[#F8F9FA] min-h-screen py-6 text-gray-900">
      <Container>
        <Breadcrumbs lang={lang} items={[{ label: lang === 'ru' ? 'Избранное' : 'Sevimlilar', active: true }]} className="mb-4" />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
            <Heart className="w-6 h-6 text-brand-red fill-brand-red" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lang === 'ru' ? 'Избранное' : 'Sevimli mahsulotlar'}</h1>
            <p className="text-sm text-gray-500">{wishlistItems.length} ta mahsulot</p>
          </div>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{lang === 'ru' ? 'Список пуст' : 'Sevimlilar bo‘sh'}</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              {lang === 'ru' ? 'Добавляйте товары в избранное, чтобы не потерять.' : 'Yoqqan mahsulotlarni yurakchani bosib saqlang.'}
            </p>
            <Link href={`/${lang}/catalog`}>
              <Button className="mt-2 rounded-xl">{lang === 'ru' ? 'Перейти в каталог' : 'Katalogga o‘tish'}</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {wishlistItems.map((item) => (
              <div key={item.id} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-sm transition-all">
                <Link href={`/${lang}/product/${item.slug}`} className="block relative aspect-[4/3] bg-[#F8F9FA] p-4 border-b border-gray-100">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} fill className="object-contain p-3 group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">SPS</div>
                  )}
                </Link>
                <div className="p-3.5 space-y-2.5">
                  <Link href={`/${lang}/product/${item.slug}`} className="block text-sm font-bold text-gray-900 line-clamp-2 leading-snug hover:text-brand-red">
                    {item.title}
                  </Link>
                  <div className="text-sm font-bold text-brand-red">{formatPrice(item.price, lang)}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="flex items-center justify-center gap-1.5 py-2.5 bg-brand-red text-white rounded-xl text-xs font-bold hover:bg-brand-red-dark"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Savat
                    </button>
                    <button
                      onClick={() => remove(item.id)}
                      className="flex items-center justify-center gap-1 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:text-red-600 hover:bg-red-50"
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
