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
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';
import {
  ShieldCheck,
  Phone,
  MapPin,
  User,
  CreditCard,
  CheckCircle2,
  Truck,
  Store,
  FileText,
  AlertCircle,
  Wallet,
  Building2,
} from 'lucide-react';

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

function formatPhone(value: string) {
  // Keep +998 and 9 digits
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('998')) digits = digits.slice(3);
  digits = digits.slice(0, 9);
  if (!digits) return '+998';
  let formatted = '+998';
  if (digits.length > 0) formatted += ' ' + digits.slice(0, 2);
  if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
  if (digits.length > 5) formatted += ' ' + digits.slice(5, 7);
  if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);
  return formatted;
}

function validatePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('998');
}

export default function CheckoutPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+998');
  const [region, setRegion] = useState(REGIONS[0]);
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'COURIER' | 'PICKUP'>('COURIER');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('');
  const [agree, setAgree] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
      return lang === 'ru' ? 'Недостаточное количество товара на складе.' : 'Mahsulot omborda yetarli miqdorda mavjud emas.';
    }
    if (rawError.includes('PRODUCT_UNAVAILABLE')) {
      return lang === 'ru' ? 'Товар недоступен для заказа.' : 'Mahsulot hozirda sotuvda mavjud emas.';
    }
    if (rawError.includes('INVALID_VARIANT')) {
      return lang === 'ru' ? 'Выбранный вариант товара недоступен.' : 'Tanlangan variant mavjud emas.';
    }
    return rawError;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!customerName.trim() || customerName.trim().length < 2) {
      errors.name = lang === 'ru' ? 'Введите имя' : 'Ismingizni kiriting';
    }
    if (!validatePhone(customerPhone)) {
      errors.phone = lang === 'ru' ? 'Введите корректный номер +998' : 'To‘g‘ri telefon kiriting +998 XX XXX XX XX';
    }
    if (deliveryType === 'COURIER' && !address.trim()) {
      errors.address = lang === 'ru' ? 'Введите адрес' : 'Manzilni kiriting';
    }
    if (!agree) {
      errors.agree = lang === 'ru' ? 'Примите условия' : 'Shartlarga rozilik bildiring';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || loading) return;
    if (!validateForm()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const attribution = getStoredAttribution();

      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.replace(/\s/g, ''),
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
          <div className="max-w-md mx-auto p-8 bg-white border border-gray-200 rounded-2xl text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto">
              <Store className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-900 font-bold">{dict.cart.empty}</p>
            <Button onClick={() => router.push(`/${lang}/catalog`)} className="bg-brand-red text-white w-full">
              {lang === 'ru' ? 'Перейти в каталог' : 'Katalogni ko‘rish'}
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F9FA] min-h-screen py-6 sm:py-8 text-gray-900">
      <Container>
        {/* Header + Stepper */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <span className="px-2.5 py-1 rounded-full bg-gray-900 text-white text-xs font-bold">1</span>
            <span className="font-medium text-gray-900">{lang === 'ru' ? 'Корзина' : 'Savat'}</span>
            <span className="w-6 h-px bg-gray-300" />
            <span className="px-2.5 py-1 rounded-full bg-brand-red text-white text-xs font-bold">2</span>
            <span className="font-bold text-gray-900">{dict.checkout.title}</span>
            <span className="w-6 h-px bg-gray-300" />
            <span className="px-2.5 py-1 rounded-full bg-gray-200 text-gray-500 text-xs font-bold">3</span>
            <span className="text-gray-500">{lang === 'ru' ? 'Подтверждение' : 'Tasdiqlash'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">{dict.checkout.title}</h1>
          <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            {dict.checkout.guestCheckout} • {COMPANY_CONTACTS.phoneDisplay}
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium mb-6 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleOrderSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. Customer */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="w-7 h-7 rounded-lg bg-brand-red text-white flex items-center justify-center text-xs font-bold">1</span>
                <User className="w-4 h-4 text-brand-red" />
                {lang === 'ru' ? 'Данные покупателя' : 'Xaridor ma’lumotlari'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {dict.checkout.name} *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Jasur Rahimov"
                    className={`w-full bg-white border rounded-xl px-4 py-3 text-[16px] md:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red min-h-[48px] ${
                      fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    {dict.checkout.phone} *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                      placeholder="+998 90 123 45 67"
                      className={`w-full bg-white border rounded-xl px-4 py-3 pl-11 text-[16px] md:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red min-h-[48px] font-mono ${
                        fieldErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    <Phone className="w-4 h-4 text-gray-400 absolute left-4 top-4" />
                  </div>
                  {fieldErrors.phone ? (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">Format: +998 90 123 45 67</p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Delivery */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="w-7 h-7 rounded-lg bg-brand-red text-white flex items-center justify-center text-xs font-bold">2</span>
                <MapPin className="w-4 h-4 text-brand-red" />
                {lang === 'ru' ? 'Доставка' : 'Yetkazib berish'}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType('COURIER')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 font-bold text-sm transition-all text-center ${
                    deliveryType === 'COURIER'
                      ? 'border-brand-red bg-red-50 text-brand-red shadow-sm'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Truck className="w-6 h-6" />
                  <span>{lang === 'ru' ? 'Курьером' : 'Kuryer orqali'}</span>
                  <span className="text-xs font-normal text-gray-500">1-3 kun</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('PICKUP')}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 font-bold text-sm transition-all text-center ${
                    deliveryType === 'PICKUP'
                      ? 'border-brand-red bg-red-50 text-brand-red shadow-sm'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Store className="w-6 h-6" />
                  <span>{lang === 'ru' ? 'Самовывоз' : 'Olib ketish'}</span>
                  <span className="text-xs font-normal text-emerald-600">{lang === 'ru' ? 'Бесплатно' : 'Bepul'}</span>
                </button>
              </div>

              {deliveryType === 'PICKUP' ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 space-y-1">
                  <p className="font-bold text-gray-900 flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-600" />
                    SPS Plast Bosh Ombori
                  </p>
                  <p>{COMPANY_CONTACTS.addressUz}</p>
                  <p className="text-emerald-700 font-semibold">Olib ketish bepul! 09:00 - 18:00</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        {dict.checkout.region} *
                      </label>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-[16px] md:text-sm text-gray-900 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 min-h-[48px]"
                      >
                        {REGIONS.map((reg) => (
                          <option key={reg} value={reg}>
                            {reg}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        {dict.checkout.city}
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Yunusobod tumani"
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-[16px] md:text-sm text-gray-900 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 min-h-[48px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {dict.checkout.address} *
                    </label>
                    <input
                      type="text"
                      required={deliveryType === 'COURIER'}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Amir Temur ko‘chasi 45-uy, 12-xonadon"
                      className={`w-full bg-white border rounded-xl px-4 py-3 text-[16px] md:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red/20 min-h-[48px] ${
                        fieldErrors.address ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:border-brand-red'
                      }`}
                    />
                    {fieldErrors.address && <p className="text-xs text-red-600 mt-1">{fieldErrors.address}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Payment */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                <span className="w-7 h-7 rounded-lg bg-brand-red text-white flex items-center justify-center text-xs font-bold">3</span>
                <CreditCard className="w-4 h-4 text-brand-red" />
                {lang === 'ru' ? 'Оплата' : 'To‘lov usuli'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'CASH'
                      ? 'border-brand-red bg-red-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="CASH"
                    checked={paymentMethod === 'CASH'}
                    onChange={() => setPaymentMethod('CASH')}
                    className="mt-1 accent-brand-red"
                  />
                  <div className="flex-1">
                    <div className={`text-sm font-bold ${paymentMethod === 'CASH' ? 'text-brand-red' : 'text-gray-900'}`}>
                      <Wallet className="w-4 h-4 inline mr-1.5" />
                      {dict.checkout.payCash}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {lang === 'ru' ? 'Оплата при получении' : 'Qabul qilganda to‘lash'}
                    </div>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'CLICK'
                      ? 'border-brand-red bg-red-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="CLICK"
                    checked={paymentMethod === 'CLICK'}
                    onChange={() => setPaymentMethod('CLICK')}
                    className="mt-1 accent-brand-red"
                  />
                  <div className="flex-1">
                    <div className={`text-sm font-bold ${paymentMethod === 'CLICK' ? 'text-brand-red' : 'text-gray-900'}`}>
                      Click / Payme
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {lang === 'ru' ? 'Ссылка после подтверждения' : 'Tasdiqdan keyin link SMS orqali'}
                    </div>
                  </div>
                </label>

                <label
                  className={`p-4 rounded-xl border-2 flex items-start gap-3 cursor-pointer transition-all sm:col-span-2 ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'border-brand-red bg-red-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="BANK_TRANSFER"
                    checked={paymentMethod === 'BANK_TRANSFER'}
                    onChange={() => setPaymentMethod('BANK_TRANSFER')}
                    className="mt-1 accent-brand-red"
                  />
                  <div className="flex-1">
                    <div className={`text-sm font-bold ${paymentMethod === 'BANK_TRANSFER' ? 'text-brand-red' : 'text-gray-900'}`}>
                      <Building2 className="w-4 h-4 inline mr-1.5" />
                      {dict.checkout.payBank}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {lang === 'ru' ? 'Для юр. лиц, договор и счет-фактура' : 'Yuridik shaxslar uchun, shartnoma va hisob-faktura'}
                    </div>
                  </div>
                </label>
              </div>

              {paymentMethod === 'CLICK' && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                  {lang === 'ru'
                    ? 'После подтверждения заказа оператором, вы получите SMS с ссылкой для оплаты через Click/Payme.'
                    : 'Buyurtma operator tomonidan tasdiqlangandan so‘ng, Click/Payme orqali to‘lash uchun SMS havola olasiz.'}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gray-400" />
                  {dict.checkout.notes} (ixtiyoriy)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={lang === 'ru' ? 'Комментарий к заказу...' : 'Buyurtmaga izoh...'}
                  className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-[16px] md:text-sm text-gray-900 focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
                />
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-brand-red"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  {lang === 'ru' ? (
                    <>
                      Я согласен с <a href={`/${lang}/terms`} className="text-brand-red underline">публичной офертой</a> и{' '}
                      <a href={`/${lang}/privacy`} className="text-brand-red underline">политикой конфиденциальности</a>
                    </>
                  ) : (
                    <>
                      <a href={`/${lang}/terms`} className="text-brand-red underline">Ommaviy oferta</a> va{' '}
                      <a href={`/${lang}/privacy`} className="text-brand-red underline">maxfiylik siyosati</a>ga roziman
                    </>
                  )}
                </span>
              </label>
              {fieldErrors.agree && <p className="text-xs text-red-600">{fieldErrors.agree}</p>}
            </div>
          </div>

          {/* Right Summary */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-sm lg:sticky lg:top-24">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
                {dict.checkout.orderSummary}
              </h3>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 -mr-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#F8F9FA] border border-gray-200 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{item.title}</p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} dona × {formatPrice(item.price, lang)}
                      </p>
                    </div>
                    <span className="font-bold text-gray-900 shrink-0">
                      {formatPrice(item.price * item.quantity, lang)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{lang === 'ru' ? 'Товары' : 'Mahsulotlar'}:</span>
                  <span className="font-semibold text-gray-900">{items.length} ta tur, {items.reduce((a,b)=>a+b.quantity,0)} dona</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{lang === 'ru' ? 'Доставка' : 'Yetkazib berish'}:</span>
                  <span className="text-emerald-700 font-semibold">
                    {deliveryType === 'PICKUP' ? (lang === 'ru' ? 'Бесплатно' : 'Bepul') : lang === 'ru' ? 'Уточнит оператор' : 'Operator aniqlaydi'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{lang === 'ru' ? 'Оплата' : 'To‘lov'}:</span>
                  <span className="font-medium text-gray-900">
                    {paymentMethod === 'CASH' ? dict.checkout.payCash : paymentMethod === 'CLICK' ? 'Click / Payme' : dict.checkout.payBank}
                  </span>
                </div>

                <div className="flex justify-between text-xl font-bold text-gray-900 pt-4 border-t border-gray-200">
                  <span>{dict.cart.subtotal}:</span>
                  <span className="text-brand-red">{formatPrice(totalPrice, lang)}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {lang === 'ru' ? 'Без учета доставки' : 'Yetkazib berish narxisiz'}
                </p>
              </div>

              <Button
                type="submit"
                size="lg"
                isLoading={loading}
                disabled={loading}
                className="w-full gap-2 font-bold text-base bg-brand-red hover:bg-brand-red-dark text-white rounded-xl shadow-red py-4 min-h-[52px]"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>{dict.checkout.confirmOrder}</span>
              </Button>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{lang === 'ru' ? 'Безопасный заказ' : 'Xavfsiz buyurtma'}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span>{COMPANY_CONTACTS.phoneDisplay}</span>
              </div>
            </div>
          </div>
        </form>
      </Container>
    </div>
  );
}
