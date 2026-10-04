import React from 'react';
import { Locale } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo';

/**
 * Kontakt sahifasi `'use client'` komponenti bo'lgani uchun o'zi metadata
 * eksport qila olmaydi — shuning uchun sarlavha/tavsif shu server layout'da
 * beriladi (P0-11: ilgari bu sahifa bosh sahifa sarlavhasini meros olardi).
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  const isRu = lang === 'ru';
  return pageMetadata({
    lang,
    path: '/contact',
    title: isRu ? 'Контакты — адрес, телефон, время работы | SPS' : 'Kontaktlar — manzil, telefon, ish vaqti | SPS',
    description: isRu
      ? 'Адрес завода SPS в Ташкенте, телефоны отдела продаж и склада, время работы, реквизиты для юридических лиц и карта проезда.'
      : 'SPS zavodining Toshkentdagi manzili, savdo va ombor raqamlari, ish vaqti, yuridik shaxslar uchun rekvizitlar va xarita.',
  });
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
