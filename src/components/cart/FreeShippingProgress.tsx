'use client';

import React from 'react';
import { Truck, Gift } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { Locale } from '@/lib/i18n';

interface FreeShippingProgressProps {
  total: number;
  lang: Locale;
  freeThreshold?: number;
}

export const FreeShippingProgress: React.FC<FreeShippingProgressProps> = ({
  total,
  lang,
  freeThreshold = 1000000,
}) => {
  const progress = Math.min(100, Math.round((total / freeThreshold) * 100));
  const remaining = Math.max(0, freeThreshold - total);
  const isFree = total >= freeThreshold;

  return (
    <div className={`p-4 rounded-xl border-2 ${isFree ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200'}`}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isFree ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
          {isFree ? <Gift className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
        </div>
        <div>
          <div className={`text-sm font-bold ${isFree ? 'text-emerald-900' : 'text-blue-900'}`}>
            {isFree
              ? lang === 'ru' ? 'Бесплатная доставка!' : 'Yetkazib berish bepul!'
              : lang === 'ru' ? `До бесплатной доставки осталось` : `Bepul yetkazishgacha`}
          </div>
          <div className={`text-xs ${isFree ? 'text-emerald-700' : 'text-blue-700'}`}>
            {isFree
              ? lang === 'ru' ? 'Ваш заказ доставляется бесплатно' : 'Buyurtmangiz bepul yetkaziladi'
              : `${formatPrice(remaining, lang)} ${lang === 'ru' ? 'добавьте' : 'qo‘shing'}`}
          </div>
        </div>
      </div>

      <div className="w-full h-2.5 bg-white rounded-full border border-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isFree ? 'bg-emerald-600' : 'bg-blue-600'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-1.5 font-medium">
        <span>{formatPrice(total, lang)}</span>
        <span>{formatPrice(freeThreshold, lang)}</span>
      </div>
    </div>
  );
};
