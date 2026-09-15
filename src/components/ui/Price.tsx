import React from 'react';
import { formatPrice } from '@/lib/utils';
import { Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface PriceProps {
  price: number;
  oldPrice?: number | null;
  lang?: Locale;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showDiscountBadge?: boolean;
  className?: string;
}

/**
 * Price typography: the current price carries the weight, the old price is a
 * small grey strike-through, the discount is a solid red pill.
 */
export const Price: React.FC<PriceProps> = ({
  price,
  oldPrice,
  lang = 'uz',
  size = 'md',
  showDiscountBadge = false,
  className,
}) => {
  const hasDiscount = Boolean(oldPrice && oldPrice > price);
  const discountPercent = hasDiscount && oldPrice
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

  // Price not yet configured -> show "request a quote" instead of 0 so'm
  const askPrice = !price || price <= 0;

  const sizeStyles = {
    sm: {
      current: 'text-[15px] font-bold',
      old: 'text-[12px] text-ink-sub line-through',
      badge: 'text-[10px] px-2 py-0.5',
    },
    md: {
      current: 'text-[19px] font-extrabold',
      old: 'text-[13px] text-ink-sub line-through',
      badge: 'text-[11px] px-2 py-0.5',
    },
    lg: {
      current: 'text-xl sm:text-2xl font-extrabold',
      old: 'text-[13px] sm:text-sm text-ink-sub line-through',
      badge: 'text-[11px] px-2.5 py-1',
    },
    xl: {
      current: 'text-[28px] sm:text-[34px] font-extrabold',
      old: 'text-sm sm:text-base text-ink-sub line-through',
      badge: 'text-xs px-3 py-1',
    },
  };

  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-1', className)}>
      <span className={cn('text-ink tracking-[-0.02em]', sizeStyles[size].current)}>
        {askPrice ? (lang === 'ru' ? 'Цена по запросу' : 'Narx so‘rash') : formatPrice(price, lang)}
      </span>

      {hasDiscount && oldPrice && (
        <span className={cn(sizeStyles[size].old)}>{formatPrice(oldPrice, lang)}</span>
      )}

      {hasDiscount && showDiscountBadge && (
        <span
          className={cn(
            'inline-flex items-center rounded-full bg-brand-red text-white font-bold leading-none',
            sizeStyles[size].badge
          )}
        >
          -{discountPercent}%
        </span>
      )}
    </div>
  );
};
