import React from 'react';
import { Locale } from '@/lib/i18n';
import { getPages } from '@/lib/pages';
import { noindexMetadata } from '@/lib/seo';

/**
 * Tayyor mahsulotlar: ma'lumotlar hali kiritilmagan, shuning uchun sahifa `noindex, follow` va sitemap'da yo'q.
 * Mahsulotlar qo'shilganda: bu layout'ni o'chiring, page.tsx'ga `pageMetadata()` qo'shing,
 * `sitePaths.ts` FIXED ro'yxatiga `/ready` ni kiriting, testdagi `noindexPaths`dan olib tashlang.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const r = getPages(lang).ready;
  return { ...noindexMetadata(lang, r.seoTitle), description: r.lead };
}

export default function ReadyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
