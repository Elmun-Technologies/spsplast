'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantitySelectorProps {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  min?: number;
  max?: number;
  className?: string;
  variant?: 'light' | 'dark';
}

export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onDecrease,
  onIncrease,
  min = 1,
  max = 9999,
  className,
  variant = 'light',
}) => {
  const isDark = variant === 'dark';

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border overflow-hidden select-none',
        isDark
          ? 'border-brand-border bg-brand-card'
          : 'border-gray-300 bg-white shadow-xs',
        className
      )}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={quantity <= min}
        aria-label="Kamaytirish"
        className={cn(
          'p-2.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
          isDark
            ? 'text-gray-300 hover:text-white hover:bg-white/10'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        <Minus className="w-4 h-4" />
      </button>

      <span
        className={cn(
          'px-4 text-sm font-bold min-w-[44px] text-center tabular-nums',
          isDark ? 'text-white' : 'text-gray-900'
        )}
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        disabled={quantity >= max}
        aria-label="Oshirish"
        className={cn(
          'p-2.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
          isDark
            ? 'text-gray-300 hover:text-white hover:bg-white/10'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        )}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};
