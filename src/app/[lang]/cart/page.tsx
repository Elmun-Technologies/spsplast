'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Trash2, ArrowRight, AlertTriangle } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Modal } from '@/components/ui/Modal';
import { formatPrice } from '@/lib/utils';
import { getDictionary, Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

export default function CartPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const totalPrice = getTotalPrice();

  const handleClear = () => {
    clearCart();
    setShowClearConfirm(false);
    trackEvent('clear_cart', {});
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen py-8 text-gray-900">
      <Container>
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-brand-red" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{dict.cart.title}</h1>
            {items.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700">
                {items.length} ta tur
              </span>
            )}
          </div>

          {items.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-sm text-gray-500 hover:text-red-600 font-semibold transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              {lang === 'ru' ? 'Очистить корзину' : 'Savatni tozalash'}
            </button>
          )}
        </div>

        <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title={lang === 'ru' ? 'Очистить корзину?' : 'Savatni tozalash?'}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                {lang === 'ru'
                  ? 'Вы уверены, что хотите удалить все товары из корзины? Это действие нельзя отменить.'
                  : 'Barcha mahsulotlarni savatdan o‘chirishga ishonchingiz komilmi? Bu amalni bekor qilib bo‘lmaydi.'}
              </p>
            </div>
            <div className="flex gap-2.5">
              <Button variant="secondary" className="flex-1" onClick={() => setShowClearConfirm(false)}>
                {lang === 'ru' ? 'Отмена' : 'Bekor qilish'}
              </Button>
              <Button variant="danger" className="flex-1" onClick={handleClear}>
                {lang === 'ru' ? 'Очистить' : 'Tozalash'}
              </Button>
            </div>
          </div>
        </Modal>

        {items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto text-gray-400">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900">{dict.cart.empty}</h3>
            <p className="text-xs text-gray-500">Katalogimizdan kerakli mahsulotlarni tanlang</p>
            <Link href={`/${lang}/catalog`}>
              <Button size="md" className="mt-2 bg-brand-red text-white">
                {dict.cart.continueShopping}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Cart Table List */}
            <div className="lg:col-span-8 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-[#F8F9FA] border border-gray-200 p-1">
                      <Image src={item.image} alt={item.title} fill className="object-contain p-1" />
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                      <p className="text-xs text-gray-500 font-mono">Artikul: {item.sku}</p>
                      <p className="text-sm font-bold text-brand-red mt-0.5">
                        {formatPrice(item.price, lang)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                    <QuantitySelector
                      quantity={item.quantity}
                      onDecrease={() => updateQuantity(item.id, -1)}
                      onIncrease={() => updateQuantity(item.id, 1)}
                    />

                    <p className="font-bold text-sm text-gray-900 min-w-[90px] text-right">
                      {formatPrice(item.price * item.quantity, lang)}
                    </p>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label={dict.cart.remove}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary Card */}
            <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                Xarid Xulosasi
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Mahsulotlar turlari:</span>
                  <span className="text-gray-900 font-semibold">{items.length} ta</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Yetkazib berish:</span>
                  <span className="text-emerald-700 font-medium">Operator aniqlaydi</span>
                </div>

                <div className="flex justify-between text-base font-bold text-gray-900 pt-3 border-t border-gray-100">
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
                <Button size="lg" className="w-full gap-2 font-bold text-sm bg-brand-red hover:bg-brand-red-dark text-white rounded-lg shadow-xs">
                  <span>{dict.cart.checkout}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
