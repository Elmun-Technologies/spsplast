import React from 'react';
import { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface StockBadgeProps {
  inStock: boolean;
  lang?: Locale;
  quantity?: number | null;
  className?: string;
}

export const StockBadge: React.FC<StockBadgeProps> = ({
  inStock,
  lang = 'uz',
  quantity,
  className,
}) => {
  if (inStock) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60',
          className
        )}
      >
        <Check className="w-3 h-3 text-emerald-600" />
        <span>
          {lang === 'ru' ? 'В наличии' : 'Mavjud'}
          {typeof quantity === 'number' && quantity > 0 ? ` (${quantity})` : ''}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200',
        className
      )}
    >
      <X className="w-3 h-3 text-gray-400" />
      <span>{lang === 'ru' ? 'Нет в наличии' : 'Mavjud emas'}</span>
    </span>
  );
};
