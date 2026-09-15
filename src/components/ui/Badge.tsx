import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'red' | 'green' | 'blue' | 'amber' | 'gray' | 'dark' | 'redSoft' | 'greenSoft';
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Rounded pills, sentence case, no heavy borders — the badge vocabulary of the
 * new design language. `redSoft` is used for "already discounted" info, `red`
 * for the discount badge itself.
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'red',
  size = 'sm',
  className,
}) => {
  const styles = {
    red: 'bg-brand-red text-white',
    redSoft: 'bg-[#FEF0F0] text-[#C4141B]',
    green: 'bg-emerald-600 text-white',
    greenSoft: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-600 text-white',
    amber: 'bg-amber-50 text-amber-700',
    gray: 'bg-surface-soft text-ink-soft',
    dark: 'bg-ink text-white',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-[11px]',
    md: 'px-3 py-1.5 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold leading-none tracking-tight whitespace-nowrap',
        styles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};
