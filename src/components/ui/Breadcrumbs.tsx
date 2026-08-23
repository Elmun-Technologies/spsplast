'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Locale } from '@/lib/i18n';

export interface Crumb {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbsProps {
  lang: Locale;
  items: Crumb[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ lang, items, className }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-sm text-gray-500 ${className || ''}`}>
      <Link href={`/${lang}`} className="flex items-center gap-1 hover:text-brand-red transition-colors">
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">{lang === 'ru' ? 'Главная' : 'Bosh sahifa'}</span>
      </Link>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
          {item.href && !item.active ? (
            <Link href={item.href} className="hover:text-brand-red transition-colors font-medium truncate max-w-[150px]">
              {item.label}
            </Link>
          ) : (
            <span className={`truncate max-w-[200px] ${item.active ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
