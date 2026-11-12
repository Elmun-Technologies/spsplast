'use client';

import dynamic from 'next/dynamic';
import { type Locale } from '@/lib/i18n';
import { useCompareList } from '@/lib/store/spsLists';

/**
 * Har sahifada (layout) turadi, lekin to'liq katalog ma'lumotini (`models2027`, ~20 KB gzip)
 * o'zi import qilmaydi: panel faqat solishtirish ro'yxati bo'sh bo'lmaganda dinamik yuklanadi.
 * Aks holda "Maxfiylik" kabi katalogsiz sahifalar ham butun katalogni yuklardi (2026-11-12,
 * katalog 216 modelga o'sganda sahifa og'irligi 200 KB chegarasidan oshdi).
 */
const Panel = dynamic(() => import('./CompareBarPanel'), { ssr: false });

export function CompareBar({ lang }: { lang: Locale }) {
  const compare = useCompareList();
  if (compare.slugs.length === 0) return null;
  return <Panel lang={lang} />;
}
