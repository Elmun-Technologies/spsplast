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
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-gray-200 text-gray-900 shadow-xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-red" />
              <h2 className="text-base font-bold text-gray-900">{dict.cart.title}</h2>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-gray-700 font-mono">
                {items.length}
              </span>
            </div>

            <button
              onClick={closeCart}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto text-gray-400">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <p className="text-gray-500 text-xs sm:text-sm">{dict.cart.empty}</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 rounded-lg bg-[#F8F9FA] border border-gray-200 items-center justify-between"
                >
                  <div className="relative w-14 h-14 rounded border border-gray-200 overflow-hidden shrink-0 bg-white p-1">
                    <Image src={item.image} alt={item.title} fill className="object-contain p-1" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate">{item.title}</h4>
                    <p className="text-[10px] text-gray-500 font-mono">SKU: {item.sku}</p>
                    <p className="text-xs font-bold text-brand-red mt-0.5">
                      {formatPrice(item.price, lang)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      title={dict.cart.remove}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
            <div className="p-4 sm:p-5 border-t border-gray-200 bg-white space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 font-medium">{dict.cart.subtotal}:</span>
                <span className="font-extrabold text-lg text-gray-900">
                  {formatPrice(totalPrice, lang)}
                </span>
              </div>

              <Link href={`/${lang}/checkout`} onClick={handleCheckoutClick}>
                <Button size="lg" className="w-full gap-2 font-bold text-sm bg-brand-red hover:bg-brand-red-dark text-white rounded-lg shadow-xs">
                  <span>{dict.cart.checkout}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
