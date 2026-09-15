import React from 'react';
import { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface StockBadgeProps {
  inStock: boolean;
  lang?: Locale;
  quantity?: number | null;
  className?: string;
}

/**
 * Stock state as a quiet dot + label instead of a bordered chip — it must not
 * compete with the price and the discount badge.
 */
export const StockBadge: React.FC<StockBadgeProps> = ({
  inStock,
  lang = 'uz',
  quantity,
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[12px] font-medium whitespace-nowrap',
        inStock ? 'text-emerald-600' : 'text-ink-sub',
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          inStock ? 'bg-emerald-500' : 'bg-[#C6CDD8]'
        )}
      />
      <span>
        {inStock ? (lang === 'ru' ? 'В наличии' : 'Mavjud') : lang === 'ru' ? 'Нет в наличии' : 'Mavjud emas'}
        {typeof quantity === 'number' && quantity > 0 ? ` · ${quantity}` : ''}
      </span>
    </span>
  );
};
