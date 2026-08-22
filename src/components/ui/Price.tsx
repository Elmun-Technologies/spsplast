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

  const sizeStyles = {
    sm: {
      current: 'text-sm font-bold',
      old: 'text-xs text-gray-400 line-through',
    },
    md: {
      current: 'text-base font-bold',
      old: 'text-xs text-gray-400 line-through',
    },
    lg: {
      current: 'text-lg sm:text-xl font-extrabold',
      old: 'text-xs sm:text-sm text-gray-400 line-through',
    },
    xl: {
      current: 'text-2xl sm:text-3xl font-extrabold',
      old: 'text-sm sm:text-base text-gray-400 line-through',
    },
  };

  return (
    <div className={cn('flex flex-wrap items-baseline gap-1.5', className)}>
      <span className={cn('text-gray-900 tracking-tight', sizeStyles[size].current)}>
        {formatPrice(price, lang)}
      </span>
      {hasDiscount && oldPrice && (
        <span className={cn(sizeStyles[size].old)}>
          {formatPrice(oldPrice, lang)}
        </span>
      )}
      {hasDiscount && showDiscountBadge && (
        <span className="bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
          -{discountPercent}%
        </span>
      )}
    </div>
  );
};
