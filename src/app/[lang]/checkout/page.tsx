'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cartStore';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { formatPrice } from '@/lib/utils';
import { getDictionary, Locale } from '@/lib/i18n';
import { captureAttribution, getStoredAttribution } from '@/lib/attribution';
import { trackEvent } from '@/lib/analytics';
import { ShieldCheck, Phone, MapPin, User, CreditCard, CheckCircle2, Truck, Store } from 'lucide-react';

const REGIONS = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Andijon viloyati',
  'Buxoro viloyati',
  'Farg‘ona viloyati',
  'Jizzax viloyati',
  'Xorazm viloyati',
  'Namangan viloyati',
  'Navoiy viloyati',
  'Qashqadaryo viloyati',
  'Qoraqalpog‘iston Respublikasi',
  'Samarqand viloyati',
  'Sirdaryo viloyati',
  'Surxondaryo viloyati',
];

export default function CheckoutPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+998');
  const [region, setRegion] = useState(REGIONS[0]);
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState('COURIER');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Stable client-side idempotency key for this checkout attempt
  const idempotencyKeyRef = useRef<string>('');
  if (!idempotencyKeyRef.current) {
    idempotencyKeyRef.current = `idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  useEffect(() => {
    captureAttribution();
  }, []);

  const totalPrice = getTotalPrice();

  const mapErrorMessage = (rawError: string): string => {
    if (rawError.includes('OUT_OF_STOCK')) {
      return lang === 'ru'
        ? 'Недостаточное количество товара на складе.'
        : 'Mahsulot omborda yetarli miqdorda mavjud emas.';
    }
    if (rawError.includes('PRODUCT_UNAVAILABLE')) {
      return lang === 'ru'
        ? 'Товар недоступен для заказа.'
        : 'Mahsulot hozirda sotuvda mavjud emas.';
    }
    if (rawError.includes('INVALID_VARIANT')) {
      return lang === 'ru'
        ? 'Выбранный вариант товара недоступен.'
        : 'Tanlangan variant mavjud emas.';
    }
    return rawError;
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || loading) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const attribution = getStoredAttribution();

      const payload = {
        customerName,
        customerPhone,
        region,
        city,
        address: deliveryType === 'PICKUP' ? 'SPS Plast Bosh Ombori (Olib ketish)' : address,
        deliveryType,
        paymentMethod,
        notes,
        locale: lang,
        idempotencyKey: idempotencyKeyRef.current,
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        ...attribution,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.order) {
        trackEvent('purchase', {
          transaction_id: data.order.orderNumber,
          value: totalPrice,
          currency: 'UZS',
        });

        clearCart();
        router.push(`/${lang}/order-success/${data.order.id}`);
      } else {
        setErrorMsg(mapErrorMessage(data.error || 'Buyurtma berishda xatolik yuz berdi.'));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Tarmoq xatosi yuz berdi.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-[#F8F9FA] min-h-screen py-16 text-gray-900">
        <Container>
          <div className="max-w-md mx-auto p-8 bg-white border border-gray-200 rounded-xl text-center space-y-3 shadow-xs">
            <p className="text-gray-900 font-bold">{dict.cart.empty}</p>
            <Button onClick={() => router.push(`/${lang}/catalog`)} className="bg-brand-red text-white">
              Katalogni ko‘rish
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FA] min-h-screen py-8 text-gray-900">
      <Container>
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{dict.checkout.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            {dict.checkout.guestCheckout}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold mb-6">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleOrderSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Xaridor Ma'lumotlari */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3.5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2.5">
                <User className="w-4 h-4 text-brand-red" />
                1. Xaridor Ma’lumotlari
              </h3>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {dict.checkout.name} *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Jasur Rahimov"
                  className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-brand-red focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {dict.checkout.phone} *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+998901234567"
                    className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg px-3 py-2 pl-9 text-xs text-gray-900 focus:outline-none focus:border-brand-red focus:bg-white"
                  />
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* 2. Yetkazib Berish Usuli va Manzili */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3.5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2.5">
                <MapPin className="w-4 h-4 text-brand-red" />
                2. Yetkazib Berish Usuli va Manzil
              </h3>

              <div className="grid grid-cols-2 gap-2.5 pb-1">
                <button
                  type="button"
                  onClick={() => setDeliveryType('COURIER')}
                  className={`p-2.5 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs transition-all ${deliveryType === 'COURIER'
                      ? 'border-brand-red bg-red-50 text-brand-red'
                      : 'border-gray-200 bg-[#F8F9FA] text-gray-600'
                    }`}
                >
                  <Truck className="w-4 h-4 text-brand-red" />
                  <span>Kuryer orqali yetkazish</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('PICKUP')}
                  className={`p-2.5 rounded-lg border flex items-center justify-center gap-2 font-bold text-xs transition-all ${deliveryType === 'PICKUP'
                      ? 'border-brand-red bg-red-50 text-brand-red'
                      : 'border-gray-200 bg-[#F8F9FA] text-gray-600'
                    }`}
                >
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Ombordan olib ketish</span>
                </button>
              </div>

              {deliveryType === 'PICKUP' ? (
                <div className="p-3 rounded-lg bg-[#F8F9FA] border border-gray-200 text-xs text-gray-600 space-y-0.5">
                  <p className="font-bold text-gray-900">SPS Plast Bosh Ombori:</p>
                  <p>Toshkent shahri, Sergeli tumani, Sanoat zonasi 4-daha</p>
                  <p className="text-emerald-700 font-semibold pt-0.5">Olib ketish bepul!</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        {dict.checkout.region} *
                      </label>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-brand-red focus:bg-white"
                      >
                        {REGIONS.map((reg) => (
                          <option key={reg} value={reg}>
                            {reg}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        {dict.checkout.city}
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Yunusobod tumani"
                        className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-brand-red focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {dict.checkout.address} *
                    </label>
                    <input
                      type="text"
                      required={deliveryType === 'COURIER'}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Amir Temur ko‘chasi 45-uy"
                      className="w-full bg-[#F8F9FA] border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-brand-red focus:bg-white"
                    />
                  </div>
                </>
              )}
            </div>

            {/* 3. To'lov Usuli */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3.5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2.5">
                <CreditCard className="w-4 h-4 text-brand-red" />
                3. To‘lov Usuli
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label
                  className={`p-3 rounded-lg border flex items-center justify-center gap-2 cursor-pointer transition-all ${paymentMethod === 'CASH'
                      ? 'border-brand-red bg-red-50 text-brand-red font-bold'
                      : 'border-gray-200 bg-[#F8F9FA] text-gray-600'
                    }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="CASH"
                    checked={paymentMethod === 'CASH'}
                    onChange={() => setPaymentMethod('CASH')}
                    className="sr-only"
                  />
                  <span className="text-xs text-center">{dict.checkout.payCash} (Qabul qilinganda)</span>
                </label>

                <label
                  className={`p-3 rounded-lg border flex items-center justify-center gap-2 cursor-pointer transition-all ${paymentMethod === 'BANK_TRANSFER'
                      ? 'border-brand-red bg-red-50 text-brand-red font-bold'
                      : 'border-gray-200 bg-[#F8F9FA] text-gray-600'
                    }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="BANK_TRANSFER"
                    checked={paymentMethod === 'BANK_TRANSFER'}
                    onChange={() => setPaymentMethod('BANK_TRANSFER')}
                    className="sr-only"
                  />
                  <span className="text-xs text-center">{dict.checkout.payBank} (Bank o‘tkazmasi)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Summary */}
          <div className="lg:col-span-5 bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              {dict.checkout.orderSummary}
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#F8F9FA] border border-gray-200 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{item.title}</p>
                    <p className="text-gray-500">
                      {item.quantity} dona x {formatPrice(item.price, lang)}
                    </p>
                  </div>
                  <span className="font-bold text-gray-900">
                    {formatPrice(item.price * item.quantity, lang)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Yetkazib berish:</span>
                <span className="text-emerald-700 font-semibold">
                  {deliveryType === 'PICKUP' ? 'Bepul (Ombordan)' : 'Operator tasdiqlaydi'}
                </span>
              </div>

              <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-100">
                <span>{dict.cart.subtotal}:</span>
                <span className="text-brand-red">{formatPrice(totalPrice, lang)}</span>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={loading}
              disabled={loading}
              className="w-full gap-2 font-bold text-sm bg-brand-red hover:bg-brand-red-dark text-white rounded-lg shadow-xs py-3"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{dict.checkout.confirmOrder}</span>
            </Button>
          </div>
        </form>
      </Container>
    </div>
  );
}
