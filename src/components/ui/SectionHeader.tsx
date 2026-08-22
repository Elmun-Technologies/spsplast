import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  linkText?: string;
  linkHref?: string;
  className?: string;
  children?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  badge,
  linkText,
  linkHref,
  className,
  children,
}) => {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 pb-2 border-b border-gray-200/80', className)}>
      <div>
        {badge && (
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-brand-red mb-1">
            {badge}
          </span>
        )}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-500 mt-1 font-normal">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {children}
        {linkText && linkHref && (
          <Link
            href={linkHref}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-brand-red hover:text-brand-red-dark transition-colors group"
          >
            <span>{linkText}</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
};
