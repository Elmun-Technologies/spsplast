import type { ReactNode } from 'react';
import { noindexMetadata } from '@/lib/seo';
import { isValidLocale, type Locale } from '@/lib/i18n';
import { getPages } from '@/lib/pages';

/**
 * Zayafka ro'yxati foydalanuvchi holatiga bog'liq (localStorage) — qidiruvda
 * indekslanmaydi, aks holda har bir mijoz uchun "bo'sh" sahifa duplikat bo'ladi.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? (lang as Locale) : 'uz';
  return noindexMetadata(locale, getPages(locale).request.title);
}

export default function RequestLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
