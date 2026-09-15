import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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

/**
 * Section title row: big, tight heading on the left, quiet text link on the
 * right (reference style) — no pill button, no mono flourishes.
 */
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
    <div className={cn('flex items-end justify-between gap-4 mb-6 sm:mb-7', className)}>
      <div className="min-w-0">
        {badge && (
          <span className="inline-block mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-red">
            {badge}
          </span>
        )}
        <h2 className="text-[22px] sm:text-[28px] font-bold text-ink tracking-[-0.025em] leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-ink-sub mt-1.5 line-clamp-2">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {children}
        {linkText && linkHref && (
          <Link
            href={linkHref}
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-brand-red transition-colors whitespace-nowrap"
          >
            <span>{linkText}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </div>
  );
};
