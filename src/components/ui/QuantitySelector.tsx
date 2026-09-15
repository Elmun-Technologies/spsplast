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
        'inline-flex items-center rounded-full overflow-hidden select-none',
        isDark
          ? 'bg-ink/90 text-white'
          : 'bg-surface-soft text-ink',
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
            ? 'text-white/70 hover:text-white hover:bg-white/10'
            : 'text-ink-soft hover:text-ink hover:bg-white'
        )}
      >
        <Minus className="w-4 h-4" />
      </button>

      <span
        className={cn(
          'px-3 text-sm font-semibold min-w-[40px] text-center tabular-nums',
          isDark ? 'text-white' : 'text-ink'
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
            ? 'text-white/70 hover:text-white hover:bg-white/10'
            : 'text-ink-soft hover:text-ink hover:bg-white'
        )}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};
