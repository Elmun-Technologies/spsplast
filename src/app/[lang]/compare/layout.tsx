import React from 'react';
import { Locale } from '@/lib/i18n';
import { noindexMetadata } from '@/lib/seo';

/**
 * Bu sahifa foydalanuvchining shaxsiy holatiga bog'liq (savat/solishtirish/
 * saralanganlar), shuning uchun qidiruvga indekslanmaydi — aks holda har bir
 * foydalanuvchi uchun bir xil "bo'sh" sahifalar indeksga tushadi.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  return noindexMetadata(lang, lang === 'ru' ? 'Сравнение' : 'Solishtirish');
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
