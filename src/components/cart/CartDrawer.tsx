'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { getDictionary, Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

interface CartDrawerProps {
  lang: Locale;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ lang }) => {
  const dict = getDictionary(lang);
  const { items, isOpen, closeCart, updateQuantity, removeItem, getTotalPrice } = useCartStore();

  if (!isOpen) return null;

  const totalPrice = getTotalPrice();

  const handleCheckoutClick = () => {
    trackEvent('begin_checkout', {
      value: totalPrice,
      num_items: items.length,
    });
    closeCart();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-brand-dark border-l border-brand-border text-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-brand-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-red" />
              <h2 className="text-lg font-bold text-white">{dict.cart.title}</h2>
              <span className="text-xs bg-brand-card px-2 py-0.5 rounded-full border border-brand-border text-gray-400 font-mono">
                {items.length}
              </span>
            </div>

            <button
              onClick={closeCart}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-brand-card border border-brand-border flex items-center justify-center mx-auto text-gray-500">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-gray-400 text-sm">{dict.cart.empty}</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 rounded-xl bg-brand-card border border-brand-border items-center justify-between"
                >
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-black/40">
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                    <p className="text-xs text-gray-400 font-mono">SKU: {item.sku}</p>
                    <p className="text-xs font-bold text-brand-red mt-1">
                      {formatPrice(item.price, lang)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors p-1"
                      title={dict.cart.remove}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <QuantitySelector
                      quantity={item.quantity}
                      onDecrease={() => updateQuantity(item.id, -1)}
                      onIncrease={() => updateQuantity(item.id, 1)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {items.length > 0 && (
            <div className="p-6 border-t border-brand-border bg-brand-card/60 space-y-4">
              <div className="flex items-center justify-between text-base">
                <span className="text-gray-400">{dict.cart.subtotal}:</span>
                <span className="font-extrabold text-xl text-white">
                  {formatPrice(totalPrice, lang)}
                </span>
              </div>

              <Link href={`/${lang}/checkout`} onClick={handleCheckoutClick}>
                <Button size="lg" className="w-full gap-2 font-bold text-base">
                  <span>{dict.cart.checkout}</span>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
