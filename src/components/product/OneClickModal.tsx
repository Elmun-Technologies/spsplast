'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { Locale } from '@/lib/i18n';
import { Phone, User, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

function formatPhone(value: string) {
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

interface OneClickModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Locale;
  product: {
    id: string;
    title: string;
    price: number;
    sku: string;
    image?: string;
  };
}

export const OneClickModal: React.FC<OneClickModalProps> = ({ isOpen, onClose, lang, product }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  /**
   * Narxi katalogda ko'rsatilmagan mahsulot (price = 0) uchun 0 so'mlik
   * buyurtma yaratish noto'g'ri bo'lardi — bunday holatda "zayafka" (lead)
   * yuboriladi va operator narx bilan bog'lanadi.
   */
  const askPrice = !product.price || product.price <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = askPrice
        ? await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              phone: phone.replace(/\s/g, ''),
              quantity: 1,
              productId: product.id,
              message: `1-klik so‘rov: ${product.title} (${product.sku})`,
              type: 'ONE_CLICK',
            }),
          })
        : await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName: name,
              customerPhone: phone.replace(/\s/g, ''),
              region: 'Toshkent shahri',
              city: '',
              address: '1-klik buyurtma',
              deliveryType: 'COURIER',
              paymentMethod: 'CASH',
              locale: lang,
              idempotencyKey: `oneclick_${Date.now()}_${product.id}`,
              items: [{ productId: product.id, quantity: 1 }],
              notes: `1-klik buyurtma: ${product.title} (${product.sku})`,
            }),
          });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccess(true);
        trackEvent(askPrice ? 'generate_lead' : 'one_click_order', {
          item_id: product.id,
          price: product.price,
          lead_type: askPrice ? 'ONE_CLICK' : undefined,
        });
      } else {
        setError(
          data.error ||
            (lang === 'ru'
              ? 'Не удалось отправить. Проверьте номер телефона и попробуйте снова.'
              : 'Yuborib bo‘lmadi. Telefon raqamini tekshirib, qayta urinib ko‘ring.')
        );
      }
    } catch (err) {
      console.error(err);
      setError(
        lang === 'ru'
          ? 'Нет связи с сервером. Попробуйте ещё раз или позвоните нам.'
          : 'Server bilan aloqa yo‘q. Qayta urinib ko‘ring yoki qo‘ng‘iroq qiling.'
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSuccess(false);
    setError('');
    setName('');
    setPhone('+998');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={reset} title={lang === 'ru' ? 'Заказ в 1 клик' : '1-klikda buyurtma'}>
      {success ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-[20px] bg-emerald-100 text-emerald-600 border flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-ink">
              {askPrice
                ? lang === 'ru'
                  ? 'Заявка принята!'
                  : 'So‘rov qabul qilindi!'
                : lang === 'ru'
                ? 'Заказ принят!'
                : 'Buyurtma qabul qilindi!'}
            </h4>
            <p className="text-sm text-ink-soft mt-1">
              {lang === 'ru' ? 'Оператор свяжется с вами в течение 15 минут.' : 'Operator 15 daqiqa ichida siz bilan bog‘lanadi.'}
            </p>
          </div>
          <Button onClick={reset} className="w-full rounded-[16px]">
            {lang === 'ru' ? 'Отлично' : 'Tushunarli'}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-[16px] bg-surface-soft border border-line flex items-center gap-3">
            <div className="w-12 h-12 rounded-[16px] bg-surface-soft flex items-center justify-center text-[12px] font-semibold text-ink-sub">
              SPS
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-ink truncate">{product.title}</div>
              <div className="text-xs text-ink-sub">
                SKU: {product.sku} •{' '}
                {askPrice ? (lang === 'ru' ? 'Цена по запросу' : 'Narx so‘rash') : formatPrice(product.price, lang)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-ink-sub" />
              {lang === 'ru' ? 'Ваше имя' : 'Ismingiz'} *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jasur"
              className="w-full px-5 py-3 rounded-full bg-surface-soft text-[16px] md:text-sm focus:bg-white focus:ring-1 focus:ring-line outline-none min-h-[48px]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-ink-sub" />
              {lang === 'ru' ? 'Телефон' : 'Telefon'} *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="+998 90 123 45 67"
              className="w-full px-5 py-3 rounded-full bg-surface-soft text-[16px] md:text-sm focus:bg-white focus:ring-1 focus:ring-line outline-none min-h-[48px]"
            />
          </div>

          {error && (
            <div className="p-3 rounded-[14px] bg-[#FEF0F0] text-brand-red text-[12px] font-medium" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" isLoading={loading} className="w-full rounded-[16px] min-h-[48px] font-bold gap-2">
            <ShoppingBag className="w-4 h-4" />
            {askPrice
              ? lang === 'ru'
                ? 'Отправить заявку'
                : 'So‘rov yuborish'
              : lang === 'ru'
              ? 'Заказать'
              : 'Buyurtma berish'}
          </Button>

          <p className="text-xs text-ink-sub text-center">
            {askPrice
              ? lang === 'ru'
                ? 'Оператор перезвонит и назовёт цену'
                : 'Operator qo‘ng‘iroq qilib, narxni aytadi'
              : lang === 'ru'
              ? 'Без предоплаты, оплата при получении'
              : 'Oldindan to‘lovsiz, qabul qilganda to‘laysiz'}
          </p>
        </form>
      )}
    </Modal>
  );
};
