'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/cartStore';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { getDictionary, Locale } from '@/lib/i18n';
import { captureAttribution, getStoredAttribution } from '@/lib/attribution';
import { trackEvent } from '@/lib/analytics';
import { ShieldCheck, Phone, MapPin, User, CreditCard, CheckCircle2 } from 'lucide-react';

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

  useEffect(() => {
    captureAttribution();
  }, []);

  const totalPrice = getTotalPrice();

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const attribution = getStoredAttribution();

      const payload = {
        customerName,
        customerPhone,
        region,
        city,
        address,
        deliveryType,
        paymentMethod,
        notes,
        locale: lang,
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
        setErrorMsg(data.error || 'Buyurtma berishda xatolik yuz berdi.');
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
      <div className="max-w-md mx-auto my-20 p-8 bg-brand-card border border-brand-border rounded-2xl text-center space-y-4">
        <p className="text-white font-bold">{dict.cart.empty}</p>
        <Button onClick={() => router.push(`/${lang}/catalog`)}>
          Katalogni ko‘rish
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-brand-border pb-4">
        <h1 className="text-3xl font-black text-white">{dict.checkout.title}</h1>
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          {dict.checkout.guestCheckout}
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleOrderSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-brand-border pb-3">
              <User className="w-4 h-4 text-brand-red" />
              1. Xaridor Ma’lumotlari
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                {dict.checkout.name} *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Jasur Rahimov"
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                {dict.checkout.phone} *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+998901234567"
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-brand-red"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              </div>
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-brand-border pb-3">
              <MapPin className="w-4 h-4 text-brand-red" />
              2. Yetkazib Berish Manzili
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {dict.checkout.region} *
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red"
                >
                  {REGIONS.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">
                  {dict.checkout.city}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Yunusobod tumani"
                  className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">
                {dict.checkout.address} *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Amir Temur ko‘chasi 45-uy"
                className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          <div className="bg-brand-card border border-brand-border rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-brand-border pb-3">
              <CreditCard className="w-4 h-4 text-brand-red" />
              3. To‘lov Usuli
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-brand-red bg-brand-red/10 text-white font-bold'
                    : 'border-brand-border bg-brand-dark text-gray-400'
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
                <span className="text-xs text-center">{dict.checkout.payCash}</span>
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'CLICK'
                    ? 'border-brand-red bg-brand-red/10 text-white font-bold'
                    : 'border-brand-border bg-brand-dark text-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="CLICK"
                  checked={paymentMethod === 'CLICK'}
                  onChange={() => setPaymentMethod('CLICK')}
                  className="sr-only"
                />
                <span className="text-xs text-center">{dict.checkout.payClick}</span>
              </label>

              <label
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-brand-red bg-brand-red/10 text-white font-bold'
                    : 'border-brand-border bg-brand-dark text-gray-400'
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
                <span className="text-xs text-center">{dict.checkout.payBank}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-5 bg-brand-card border border-brand-border rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-white border-b border-brand-border pb-4">
            {dict.checkout.orderSummary}
          </h3>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-2 rounded-lg bg-brand-dark border border-brand-border text-xs"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{item.title}</p>
                  <p className="text-gray-400">
                    {item.quantity} dona x {formatPrice(item.price, lang)}
                  </p>
                </div>
                <span className="font-bold text-white">
                  {formatPrice(item.price * item.quantity, lang)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-brand-border space-y-3 text-sm">
            <div className="flex justify-between text-xl font-black text-white pt-4 border-t border-brand-border">
              <span>{dict.cart.subtotal}:</span>
              <span className="text-brand-red">{formatPrice(totalPrice, lang)}</span>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            isLoading={loading}
            className="w-full gap-2 font-extrabold text-base shadow-red py-4"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{dict.checkout.confirmOrder}</span>
          </Button>
        </div>

      </form>
    </div>
  );
}
