'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';
import { CheckCircle2, Phone, User, Package, MessageSquare } from 'lucide-react';

/**
 * Yagona zayafka formasi (T3).
 *
 * Saytdagi barcha "Zayafka berish" / "Narx so‘rash" tugmalari shu modalni
 * ochadi. Maqsad — bitta kompakt forma: ism, telefon (+998 maskasi), miqdor va
 * izoh. Mahsulot sahifasida nom va SKU avtomatik qo'shiladi, shuning uchun
 * mijoz qayta yozmaydi.
 *
 * Yuborilgach xabar `/api/leads` orqali Telegram guruhiga tushadi; bazaga
 * hech narsa yozilmaydi. Honeypot maydoni botlarga qarshi (foydalanuvchi
 * ko'rmaydi).
 */

export interface LeadProduct {
  title: string;
  sku?: string;
}

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Locale;
  product?: LeadProduct;
  /** Mahsulot sahifasidagi tanlangan miqdor (kalkulyator yoki tanlagichdan). */
  defaultQuantity?: number;
  /** Forma turi: mahsulot zayafkasi, ulgurji so'rov yoki konsultatsiya. */
  type?: 'PRODUCT_REQUEST' | 'B2B_WHOLESALE' | 'CONSULTATION';
  title?: string;
}

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

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  lang,
  product,
  defaultQuantity,
  type = 'PRODUCT_REQUEST',
  title,
}) => {
  const isRu = lang === 'ru';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [quantity, setQuantity] = useState(defaultQuantity ? String(defaultQuantity) : '');
  const [comment, setComment] = useState('');
  // Honeypot: oddiy foydalanuvchi ko'rmaydi va to'ldirmaydi.
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const phoneDigits = phone.replace(/\D/g, '');
  const phoneValid = phoneDigits.length === 12 && phoneDigits.startsWith('998');

  const reset = () => {
    setSuccess(false);
    setError('');
    setName('');
    setPhone('+998');
    setQuantity(defaultQuantity ? String(defaultQuantity) : '');
    setComment('');
    setWebsite('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneValid) {
      setError(isRu ? 'Введите номер в формате +998 XX XXX XX XX' : 'Raqamni +998 XX XXX XX XX shaklida kiriting');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: phone.replace(/\s/g, ''),
          product: product?.title,
          productSku: product?.sku,
          quantity: quantity ? parseInt(quantity, 10) : undefined,
          message: comment || undefined,
          pageUrl: typeof window !== 'undefined' ? window.location.pathname + window.location.search : undefined,
          lang,
          type,
          website,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccess(true);
        trackEvent('generate_lead', {
          lead_type: type,
          item_id: product?.sku,
          item_name: product?.title,
        });
      } else {
        setError(
          data.error ||
            (isRu
              ? 'Не удалось отправить заявку. Проверьте номер и попробуйте снова.'
              : 'Zayafkani yuborib bo‘lmadi. Raqamni tekshirib, qayta urinib ko‘ring.')
        );
      }
    } catch {
      setError(
        isRu
          ? 'Нет связи с сервером. Попробуйте ещё раз или позвоните нам.'
          : 'Server bilan aloqa yo‘q. Qayta urinib ko‘ring yoki qo‘ng‘iroq qiling.'
      );
    } finally {
      setLoading(false);
    }
  };

  const defaultTitle = product
    ? isRu
      ? 'Заявка на форму'
      : 'Qolip uchun zayafka'
    : isRu
      ? 'Оставить заявку'
      : 'Zayafka qoldirish';

  return (
    <Modal isOpen={isOpen} onClose={reset} title={title || defaultTitle}>
      {success ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-ink">{isRu ? 'Заявка принята!' : 'Zayafka qabul qilindi!'}</h4>
            <p className="text-sm text-ink-soft">
              {isRu
                ? 'Менеджер свяжется с вами в рабочее время (пн–сб, 09:00–18:00) и подтвердит цену и наличие.'
                : 'Menejer ish vaqtida (dush–shan, 09:00–18:00) bog‘lanib, narx va mavjudlikni tasdiqlaydi.'}
            </p>
          </div>
          <Button onClick={reset} className="w-full">
            {isRu ? 'Понятно' : 'Tushunarli'}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {product && (
            <div className="p-3 rounded-[16px] bg-surface-soft border border-line flex items-center gap-3">
              <div className="w-10 h-10 rounded-[12px] bg-surface flex items-center justify-center text-ink-sub shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-ink truncate">{product.title}</div>
                {product.sku && <div className="text-xs text-ink-sub">SKU: {product.sku}</div>}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="lead-name" className="block text-sm font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-ink-sub" />
              {isRu ? 'Ваше имя' : 'Ismingiz'} *
            </label>
            <input
              id="lead-name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isRu ? 'Например: Сардор' : 'Masalan: Sardor'}
              className="w-full px-5 py-3 rounded-full bg-surface-soft text-[16px] md:text-sm focus:bg-white focus:ring-1 focus:ring-line outline-none min-h-[48px]"
            />
          </div>

          <div>
            <label htmlFor="lead-phone" className="block text-sm font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-ink-sub" />
              {isRu ? 'Телефон' : 'Telefon'} *
            </label>
            <input
              id="lead-phone"
              type="tel"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="+998 90 123 45 67"
              inputMode="tel"
              className="w-full px-5 py-3 rounded-full bg-surface-soft text-[16px] md:text-sm focus:bg-white focus:ring-1 focus:ring-line outline-none min-h-[48px]"
            />
            {!phoneValid && phoneDigits.length > 3 && (
              <p className="text-xs text-brand-red mt-1.5">
                {isRu ? 'Номер должен быть в формате +998 XX XXX XX XX' : 'Raqam +998 XX XXX XX XX shaklida bo‘lishi kerak'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="lead-quantity" className="block text-sm font-semibold text-ink-soft mb-1.5">
                {isRu ? 'Количество, шт' : 'Miqdor, dona'}
              </label>
              <input
                id="lead-quantity"
                type="number"
                inputMode="numeric"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={isRu ? 'Например: 10' : 'Masalan: 10'}
                className="w-full px-5 py-3 rounded-full bg-surface-soft text-[16px] md:text-sm focus:bg-white focus:ring-1 focus:ring-line outline-none min-h-[48px]"
              />
            </div>
            <div className="flex items-end">
              <p className="text-xs text-ink-sub pb-3">
                {isRu ? 'Можно указать позже — уточним по телефону.' : 'Keyinroq ham aytish mumkin — telefonda aniqlashtiramiz.'}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="lead-comment" className="block text-sm font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-ink-sub" />
              {isRu ? 'Комментарий' : 'Izoh'}
            </label>
            <textarea
              id="lead-comment"
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isRu
                  ? 'Город доставки, нужный размер, вопрос по цене...'
                  : 'Yetkazish shahri, kerakli o‘lcham, narx bo‘yicha savol...'
              }
              className="w-full px-5 py-3 rounded-[20px] bg-surface-soft text-[16px] md:text-sm focus:bg-white focus:ring-1 focus:ring-line outline-none"
            />
          </div>

          {/* Honeypot: ko'rinmas maydon. Botlar to'ldiradi, odamlar sezmaydi. */}
          <div className="hidden" aria-hidden="true">
            <label>
              Website
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>

          {error && (
            <div className="p-3 rounded-[14px] bg-[#FEF0F0] text-brand-red text-[12px] font-medium" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" isLoading={loading} className="w-full min-h-[48px] font-bold">
            {isRu ? 'Отправить заявку' : 'Zayafkani yuborish'}
          </Button>

          <p className="text-xs text-ink-sub text-center">
            {isRu
              ? 'Без предоплаты. Менеджер перезвонит и подтвердит цену.'
              : 'Oldindan to‘lovsiz. Menejer qo‘ng‘iroq qilib, narxni tasdiqlaydi.'}
          </p>
        </form>
      )}
    </Modal>
  );
};
