'use client';

import React, { useState } from 'react';
import { Star, CheckCircle2, Loader2 } from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';

/**
 * Tasdiqlangan sharh — server komponentdan keladi (faqat `APPROVED` holati).
 * Telefon raqami hech qachon bu yerga uzatilmaydi.
 */
export interface PublicReview {
  id: string;
  name: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface ProductReviewsProps {
  lang: Locale;
  productId: string;
  initialReviews: PublicReview[];
}

const COPY = {
  uz: {
    title: 'Xaridorlar sharhlari',
    count: (n: number) => `${n} ta sharh`,
    empty: 'Hozircha sharh yo‘q',
    emptyHint: 'Bu mahsulotni ishlatgan bo‘lsangiz — birinchi bo‘lib fikringizni yozing. Har bir sharh moderatsiyadan o‘tadi.',
    verified: 'Tekshirilgan mijoz',
    formTitle: 'Sharh qoldirish',
    namePlaceholder: 'Ismingiz',
    phonePlaceholder: 'Telefon (ixtiyoriy, saytda ko‘rinmaydi)',
    textPlaceholder: 'Qolip sifati, beton ajralishi va xizmat haqida yozing...',
    rating: 'Baholash',
    submit: 'Sharhni yuborish',
    sending: 'Yuborilmoqda...',
    success:
      'Rahmat! Sharhingiz qabul qilindi va moderatsiyadan keyin e’lon qilinadi.',
    errorGeneric: 'Sharhni yuborib bo‘lmadi. Keyinroq qayta urinib ko‘ring.',
    note: 'Sharh matni tekshirilgach e’lon qilinadi — bu soxta sharhlardan himoya.',
  },
  ru: {
    title: 'Отзывы покупателей',
    count: (n: number) => `${n} отзыв(ов)`,
    empty: 'Пока нет отзывов',
    emptyHint: 'Если вы уже работали с этим товаром — напишите первым. Каждый отзыв проходит модерацию.',
    verified: 'Проверенный клиент',
    formTitle: 'Оставить отзыв',
    namePlaceholder: 'Ваше имя',
    phonePlaceholder: 'Телефон (необязательно, не публикуется)',
    textPlaceholder: 'Напишите о качестве формы, отделении бетона и сервисе...',
    rating: 'Оценка',
    submit: 'Отправить отзыв',
    sending: 'Отправка...',
    success: 'Спасибо! Отзыв принят и будет опубликован после модерации.',
    errorGeneric: 'Не удалось отправить отзыв. Попробуйте позже.',
    note: 'Отзыв публикуется после проверки — это защита от фейков.',
  },
} as const;

/**
 * Mahsulot sharhlari.
 *
 * MUHIM: bu komponent hech qanday "namuna" sharh ko'rsatmaydi. Ro'yxat faqat
 * serverdan kelgan tasdiqlangan sharhlardan iborat; yangi sharh esa avval
 * moderatsiyaga tushadi (docs/MADANI-RAQOBAT-AUDITI.md, P0-4).
 */
export const ProductReviews: React.FC<ProductReviewsProps> = ({
  lang,
  productId,
  initialReviews,
}) => {
  const t = COPY[lang];

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  // Honeypot: odam ko'rmaydi, bot to'ldiradi (server bunday so'rovni tashlab yuboradi).
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = initialReviews.length;
  const avg =
    count > 0 ? initialReviews.reduce((acc, review) => acc + review.rating, 0) / count : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, name, phone, rating, text, website }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || t.errorGeneric);
      }

      setSubmitted(true);
      setName('');
      setPhone('');
      setText('');
      setRating(5);
    } catch (err: any) {
      setError(err?.message || t.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface border border-line rounded-[20px] p-6 sm:p-7 shadow-card space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line-soft pb-5">
        <div>
          <h3 className="text-lg font-bold text-ink">{t.title}</h3>
          {count > 0 ? (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-[#DDE3EB]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-ink">{avg.toFixed(1)}</span>
              <span className="text-sm text-ink-sub">({t.count(count)})</span>
            </div>
          ) : (
            <p className="text-sm text-ink-sub mt-1">{t.empty}</p>
          )}
        </div>
      </div>

      {count === 0 ? (
        <div className="p-5 rounded-[16px] bg-surface-soft border border-line text-sm text-ink-soft leading-relaxed">
          {t.emptyHint}
        </div>
      ) : (
        <div className="space-y-4">
          {initialReviews.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-[16px] bg-surface-soft border border-line space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-surface border border-line text-ink flex items-center justify-center text-[13px] font-semibold">
                    {review.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-bold text-ink">{review.name}</span>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> {t.verified}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-[#DDE3EB]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-ink-sub shrink-0">
                  {new Date(review.createdAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uz-UZ')}
                </span>
              </div>
              <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-line">
                {review.text}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="pt-5 border-t border-line-soft">
        <h4 className="font-bold text-ink text-sm mb-1">{t.formTitle}</h4>
        <p className="text-xs text-ink-sub mb-3">{t.note}</p>

        {submitted && (
          <div className="mb-3 p-3 rounded-[16px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
            {t.success}
          </div>
        )}
        {error && (
          <div className="mb-3 p-3 rounded-[16px] bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.namePlaceholder}
              aria-label={t.namePlaceholder}
              className="px-4 py-3 rounded-[16px] border border-[#DDE3EB] text-sm focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 outline-none min-h-[44px]"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.phonePlaceholder}
              aria-label={t.phonePlaceholder}
              className="px-4 py-3 rounded-[16px] border border-[#DDE3EB] text-sm focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 outline-none min-h-[44px]"
            />
          </div>

          {/* Honeypot — ekrandan yashirilgan, foydalanuvchi ko'rmaydi */}
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          <div className="flex items-center gap-1 px-3 py-2 rounded-[16px] border border-[#DDE3EB] bg-surface w-fit">
            <span className="text-xs font-semibold text-ink-soft mr-2">{t.rating}:</span>
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                aria-label={`${t.rating}: ${i}`}
                className="p-1"
              >
                <Star
                  className={`w-5 h-5 ${
                    i <= rating ? 'fill-amber-400 text-amber-400' : 'text-[#DDE3EB] hover:text-amber-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <textarea
            required
            minLength={10}
            maxLength={1200}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.textPlaceholder}
            aria-label={t.textPlaceholder}
            rows={3}
            className="w-full px-4 py-3 rounded-[16px] border border-[#DDE3EB] text-sm focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 outline-none"
          />

          <Button type="submit" className="rounded-[16px] font-bold" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t.sending}
              </>
            ) : (
              t.submit
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
