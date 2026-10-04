import React from 'react';
import { getCategoryTree } from '@/lib/catalog';
import { HeaderClient } from './HeaderClient';
import { Locale } from '@/lib/i18n';

interface HeaderProps {
  lang: Locale;
}

/**
 * Navigatsiya kategoriyalari statik katalogdan keladi — baza yoki tarmoq
 * xatosi bu yerda mumkin emas, shuning uchun avvalgi try/catch zaxirasi ham
 * kerak emas.
 */
export async function Header({ lang }: HeaderProps) {
  const categories = getCategoryTree(lang);
  return <HeaderClient lang={lang} categories={categories} />;
}
