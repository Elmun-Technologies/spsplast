'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Trash2, ArrowRight, AlertTriangle, Tag, X, Check } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Modal } from '@/components/ui/Modal';
import { FreeShippingProgress } from '@/components/cart/FreeShippingProgress';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
import { CrossSell } from '@/components/product/CrossSell';
import { useCouponStore } from '@/lib/store/couponStore';
import { formatPrice } from '@/lib/utils';
import { getDictionary, Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

export default function CartPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();
  const { appliedCoupon, error: couponError, applyCoupon, removeCoupon, getDiscount, availableCoupons } = useCouponStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [couponInput, setCouponInput] = useState('');

  const totalPrice = getTotalPrice();
  const discount = getDiscount(totalPrice);
  const finalTotal = totalPrice - discount;

  const handleClear = () => {
    clearCart();
    setShowClearConfirm(false);
    trackEvent('clear_cart', {});
  };

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    const ok = applyCoupon(couponInput, totalPrice);
    if (ok) {
      trackEvent('apply_coupon', { coupon_code: couponInput.toUpperCase(), discount });
      setCouponInput('');
    }
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen py-6 text-gray-900">
      <Container>
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-brand-red" />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{dict.cart.title}</h1>
            {items.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-bold">
                {items.length} ta tur • {items.reduce((a, b) => a + b.quantity, 0)} dona
              </span>
            )}
          </div>

          {items.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-sm text-gray-500 hover:text-red-600 font-semibold px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              {lang === 'ru' ? 'Очистить' : 'Tozalash'}
            </button>
          )}
        </div>

        <Modal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} title={lang === 'ru' ? 'Очистить корзину?' : 'Savatni tozalash?'}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900">
                {lang === 'ru' ? 'Удалить все товары? Действие нельзя отменить.' : 'Barcha mahsulotlarni o‘chirishga ishonchingiz komilmi?'}
              </p>
            </div>
            <div className="flex gap-2.5">
              <Button variant="secondary" className="flex-1 rounded-xl" onClick={() => setShowClearConfirm(false)}>
                {lang === 'ru' ? 'Отмена' : 'Bekor qilish'}
              </Button>
              <Button variant="danger" className="flex-1 rounded-xl" onClick={handleClear}>
                {lang === 'ru' ? 'Очистить' : 'Tozalash'}
              </Button>
            </div>
          </div>
        </Modal>

        {items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{dict.cart.empty}</h3>
            <p className="text-sm text-gray-500">Katalogimizdan tanlang</p>
            <Link href={`/${lang}/catalog`}>
              <Button size="md" className="mt-2 rounded-xl">
                {dict.cart.continueShopping}
              </Button>
            </Link>
            <div className="pt-6">
              <RecentlyViewed lang={lang} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-4">
              <FreeShippingProgress total={totalPrice} lang={lang} freeThreshold={1000000} />

              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#F8F9FA] border border-gray-200 p-2">
                      <Image src={item.image} alt={item.title} fill className="object-contain p-2" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate max-w-[220px]">{item.title}</h3>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">SKU: {item.sku}</p>
                      <p className="text-sm font-bold text-brand-red mt-1">{formatPrice(item.price, lang)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                    <QuantitySelector quantity={item.quantity} onDecrease={() => updateQuantity(item.id, -1)} onIncrease={() => updateQuantity(item.id, 1)} />

                    <p className="font-bold text-base text-gray-900 min-w-[100px] text-right">{formatPrice(item.price * item.quantity, lang)}</p>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      aria-label={dict.cart.remove}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              <RecentlyViewed lang={lang} />
              <CrossSell lang={lang} title={lang === 'ru' ? 'Вам может понадобиться' : 'Sizga kerak bo‘lishi mumkin'} limit={4} />
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm lg:sticky lg:top-24">
                <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                  {lang === 'ru' ? 'Итог заказа' : 'Buyurtma xulosasi'}
                </h3>

                {/* Coupon */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Promokod
                  </label>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div>
                        <div className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                          <Check className="w-4 h-4" />
                          {appliedCoupon.code} — {appliedCoupon.discountPercent}%
                        </div>
                        <div className="text-xs text-emerald-700 mt-0.5">{lang === 'ru' ? appliedCoupon.descriptionRu : appliedCoupon.descriptionUz}</div>
                      </div>
                      <button onClick={removeCoupon} className="p-1.5 hover:bg-emerald-100 rounded-lg">
                        <X className="w-4 h-4 text-emerald-700" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="SPS10"
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-sm font-mono uppercase focus:border-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red/20 min-h-[44px]"
                        />
                        <Button size="md" onClick={handleApplyCoupon} className="rounded-xl px-5 min-h-[44px]">
                          Qo'llash
                        </Button>
                      </div>
                      {couponError && <p className="text-xs text-red-600">{couponError}</p>}
                      <div className="flex flex-wrap gap-1.5">
                        {availableCoupons.slice(0, 3).map((c) => (
                          <button
                            key={c.code}
                            onClick={() => setCouponInput(c.code)}
                            className="px-2.5 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-mono font-bold hover:bg-gray-900 hover:text-white transition-colors"
                          >
                            {c.code} -{c.discountPercent}%
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-sm pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-gray-600">
                    <span>{lang === 'ru' ? 'Товары' : 'Mahsulotlar'}:</span>
                    <span className="font-semibold text-gray-900">{items.length} ta tur • {items.reduce((a, b) => a + b.quantity, 0)} dona</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>{lang === 'ru' ? 'Доставка' : 'Yetkazib berish'}:</span>
                    <span className="text-emerald-700 font-semibold">{lang === 'ru' ? 'Уточнит оператор' : 'Operator aniqlaydi'}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Chegirma ({appliedCoupon?.code}):</span>
                      <span>-{formatPrice(discount, lang)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-black text-gray-900 pt-4 border-t border-gray-200">
                    <span>{dict.cart.subtotal}:</span>
                    <span className="text-brand-red">{formatPrice(finalTotal, lang)}</span>
                  </div>
                  {discount > 0 && <div className="text-xs text-gray-400 line-through text-right">{formatPrice(totalPrice, lang)}</div>}
                </div>

                <Link
                  href={`/${lang}/checkout`}
                  onClick={() => trackEvent('begin_checkout', { value: finalTotal, num_items: items.length, coupon: appliedCoupon?.code })}
                  className="block"
                >
                  <Button size="lg" className="w-full gap-2 font-bold text-base rounded-xl shadow-red min-h-[52px]">
                    <span>{dict.cart.checkout}</span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>

                <Link href={`/${lang}/catalog`} className="block text-center text-sm text-gray-500 hover:text-gray-900 font-medium">
                  {dict.cart.continueShopping}
                </Link>

                <div className="pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                  <p>✓ 14 kun qaytarish</p>
                  <p>✓ 300+ quyish kafolati</p>
                  <p>✓ Click / Payme / Naqd / Bank</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
