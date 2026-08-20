'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { getDictionary, Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

export default function CartPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();

  const totalPrice = getTotalPrice();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      <div className="flex items-center justify-between border-b border-brand-border pb-6">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-brand-red" />
          <h1 className="text-3xl font-black text-white">{dict.cart.title}</h1>
        </div>

        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-gray-400 hover:text-red-400 font-semibold"
          >
            Savatni tozalash
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-dark border border-brand-border flex items-center justify-center mx-auto text-gray-500">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">{dict.cart.empty}</h3>
          <p className="text-xs text-gray-400">Katalogimizdan kerakli mahsulotlarni tanlang</p>
          <Link href={`/${lang}/catalog`}>
            <Button size="md" className="mt-2">
              {dict.cart.continueShopping}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Cart Table List */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-brand-card border border-brand-border rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-black/40 border border-brand-border">
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-base">{item.title}</h3>
                    <p className="text-xs text-gray-400 font-mono">Artikul: {item.sku}</p>
                    <p className="text-sm font-bold text-brand-red mt-1">
                      {formatPrice(item.price, lang)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-brand-border pt-3 sm:pt-0">
                  <QuantitySelector
                    quantity={item.quantity}
                    onDecrease={() => updateQuantity(item.id, -1)}
                    onIncrease={() => updateQuantity(item.id, 1)}
                  />

                  <p className="font-extrabold text-base text-white min-w-[90px] text-right">
                    {formatPrice(item.price * item.quantity, lang)}
                  </p>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-4 bg-brand-card border border-brand-border rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-brand-border pb-4">
              Xarid Xulosasi
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Mahsulotlar soni:</span>
                <span className="text-white font-medium">{items.length} turdagi</span>
              </div>

              <div className="flex justify-between text-gray-400">
                <span>Yetkazib berish:</span>
                <span className="text-emerald-400 font-medium">Kuryer / Operator aniqlaydi</span>
              </div>

              <div className="flex justify-between text-lg font-black text-white pt-4 border-t border-brand-border">
                <span>{dict.cart.subtotal}:</span>
                <span className="text-brand-red">{formatPrice(totalPrice, lang)}</span>
              </div>
            </div>

            <Link
              href={`/${lang}/checkout`}
              onClick={() =>
                trackEvent('begin_checkout', { value: totalPrice, num_items: items.length })
              }
            >
              <Button size="lg" className="w-full gap-2 font-bold text-base shadow-red">
                <span>{dict.cart.checkout}</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>

        </div>
      )}
    </div>
  );
}
