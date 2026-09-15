'use client';

import React, { useEffect, useState } from 'react';
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
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const [visible, setVisible] = useState(false);

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const t = setTimeout(() => setVisible(false), 200);
      document.body.style.overflow = '';
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, closeCart]);

  const handleCheckoutClick = () => {
    trackEvent('begin_checkout', {
      value: totalPrice,
      num_items: items.length,
    });
    closeCart();
  };

  if (!isOpen && !visible) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div
          className={`w-screen max-w-md bg-surface border-l border-line text-ink shadow-pop flex flex-col justify-between transform transition-transform duration-300 ease-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#FEF0F0] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-brand-red" />
              </div>
              <h2 className="text-base font-bold text-ink">{dict.cart.title}</h2>
              <span className="text-[11px] bg-surface-soft text-ink-soft px-2 py-0.5 rounded-full font-semibold min-w-[20px] text-center">
                {items.length}
              </span>
            </div>

            <button
              onClick={closeCart}
              className="p-2 rounded-[16px] text-ink-sub hover:text-ink-soft hover:bg-surface-soft transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-surface-soft">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-[20px] bg-surface border border-line flex items-center justify-center mx-auto text-ink-sub shadow-card">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-ink font-bold text-sm">{dict.cart.empty}</p>
                  <p className="text-xs text-ink-sub mt-1">Katalogimizdan tanlang</p>
                </div>
                <Link href={`/${lang}/catalog`} onClick={closeCart}>
                  <Button size="md" className="mt-2">
                    {dict.cart.continueShopping}
                  </Button>
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 rounded-[16px] bg-surface border border-line items-center justify-between shadow-card hover:shadow-lift transition-shadow"
                >
                  <div className="relative w-14 h-14 rounded-[14px] overflow-hidden shrink-0 bg-surface-soft p-1">
                    <Image src={item.image} alt={item.title} fill sizes="64px" className="object-contain p-1" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-ink truncate">{item.title}</h4>
                    <p className="text-xs text-ink-sub font-mono">SKU: {item.sku}</p>
                    <p className="text-sm font-bold text-brand-red mt-0.5">
                      {formatPrice(item.price, lang)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-ink-sub hover:text-brand-red hover:bg-[#FEF0F0] transition-colors p-1.5 rounded-full"
                      title={dict.cart.remove}
                      aria-label={dict.cart.remove}
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
            <div className="p-4 sm:p-5 border-t border-line bg-surface space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-ink-sub">{lang === 'ru' ? 'Товаров' : 'Mahsulotlar'}:</span>
                  <span className="font-semibold text-ink">{items.length} ta tur</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold pt-2 border-t border-line-soft">
                  <span className="text-ink">{dict.cart.subtotal}:</span>
                  <span className="text-brand-red text-lg">
                    {formatPrice(totalPrice, lang)}
                  </span>
                </div>
              </div>

              <Link href={`/${lang}/checkout`} onClick={handleCheckoutClick} className="block">
                <Button size="lg" className="w-full gap-2 text-sm min-h-[48px]">
                  <span>{dict.cart.checkout}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <Link href={`/${lang}/catalog`} onClick={closeCart} className="block text-center text-sm text-ink-sub hover:text-ink font-medium">
                {dict.cart.continueShopping}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
