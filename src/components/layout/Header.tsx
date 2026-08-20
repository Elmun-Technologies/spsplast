import React from 'react';
import { getCategoryTree } from '@/lib/services/categoryService';
import { HeaderClient } from './HeaderClient';
import { Locale } from '@/lib/i18n';

interface HeaderProps {
  lang: Locale;
}

export async function Header({ lang }: HeaderProps) {
  let categories: any[] = [];
  try {
    categories = await getCategoryTree(lang);
  } catch (error) {
    console.error('Failed to load categories for header:', error);
  }

  return <HeaderClient lang={lang} categories={categories} />;
}
