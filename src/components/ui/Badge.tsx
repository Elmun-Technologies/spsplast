import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'red' | 'green' | 'blue' | 'amber' | 'gray' | 'dark';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'red',
  size = 'sm',
  className,
}) => {
  const styles = {
    red: 'bg-brand-red text-white border-transparent',
    green: 'bg-emerald-600 text-white border-transparent',
    blue: 'bg-blue-600 text-white border-transparent',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    dark: 'bg-gray-900 text-white border-transparent',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] font-bold tracking-tight rounded-md',
    md: 'px-2.5 py-1 text-xs font-bold tracking-tight rounded-md',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center border font-medium uppercase leading-none select-none',
        styles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};
