'use client';

import React, { useState } from 'react';
import { Star, User, CheckCircle2 } from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';

interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
  verified?: boolean;
}

const MOCK_REVIEWS: Review[] = [
  { id: '1', name: 'Sardor A.', rating: 5, text: 'Qoliplar sifati zo‘r, 200 martadan ortiq quydim, hali ham yaxshi holatda. Tavsiya qilaman!', date: '2026-08-10', verified: true },
  { id: '2', name: 'Jasur B.', rating: 5, text: 'Zavoddan to‘g‘ridan-to‘g‘ri oldim, narxi arzon, yetkazib berish tez.', date: '2026-08-05', verified: true },
  { id: '3', name: 'Aziz R.', rating: 4, text: 'Bruschatka qoliplari aniq o‘lchamda, beton oson ajraladi. 4 yulduz.', date: '2026-07-28' },
];

interface ProductReviewsProps {
  lang: Locale;
  productId: string;
}

export const ProductReviews: React.FC<ProductReviewsProps> = ({ lang, productId }) => {
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const avg = reviews.reduce((a, b) => a + b.rating, 0) / reviews.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReview: Review = {
      id: Date.now().toString(),
      name,
      rating,
      text,
      date: new Date().toISOString().slice(0, 10),
    };
    setReviews([newReview, ...reviews]);
    setSubmitted(true);
    setName('');
    setText('');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{lang === 'ru' ? 'Отзывы покупателей' : 'Xaridorlar sharhlari'}</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className={`w-4 h-4 ${i <= Math.round(avg) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="text-sm font-bold text-gray-900">{avg.toFixed(1)}</span>
            <span className="text-sm text-gray-500">({reviews.length} ta sharh)</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="p-4 rounded-xl bg-[#F8F9FA] border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                  {r.name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-gray-900">{r.name}</span>
                    {r.verified && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Tasdiqlangan
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={`w-3 h-3 ${i <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-500">{r.date}</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{r.text}</p>
          </div>
        ))}
      </div>

      <div className="pt-5 border-t border-gray-100">
        <h4 className="font-bold text-gray-900 text-sm mb-3">{lang === 'ru' ? 'Оставить отзыв' : 'Sharh qoldirish'}</h4>
        {submitted && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
            {lang === 'ru' ? 'Спасибо за отзыв!' : 'Sharh uchun rahmat! Tez orada e’lon qilinadi.'}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={lang === 'ru' ? 'Ваше имя' : 'Ismingiz'}
              className="px-4 py-3 rounded-xl border border-gray-300 text-sm focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 outline-none min-h-[44px]"
            />
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-300 bg-white">
              <span className="text-xs font-semibold text-gray-600 mr-2">{lang === 'ru' ? 'Оценка' : 'Baholash'}:</span>
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} type="button" onClick={() => setRating(i)} className="p-1">
                  <Star className={`w-5 h-5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
                </button>
              ))}
            </div>
          </div>
          <textarea
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={lang === 'ru' ? 'Ваш отзыв...' : 'Sharhingizni yozing...'}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:border-brand-red focus:ring-2 focus:ring-brand-red/20 outline-none"
          />
          <Button type="submit" className="rounded-xl font-bold">
            {lang === 'ru' ? 'Отправить отзыв' : 'Sharhni yuborish'}
          </Button>
        </form>
      </div>
    </div>
  );
};
