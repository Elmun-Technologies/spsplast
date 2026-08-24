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
    <div className={cn('flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7', className)}>
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-gray-900" />
          {badge && (
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.15em] text-brand-red">
              {badge}
            </span>
          )}
          {subtitle && (
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 hidden sm:inline">
              / {subtitle}
            </span>
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-[-0.025em] leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-500 font-medium sm:hidden">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {children}
        {linkText && linkHref && (
          <Link
            href={linkHref}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors group btn-press min-h-[36px]"
          >
            <span>{linkText}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </div>
  );
};
