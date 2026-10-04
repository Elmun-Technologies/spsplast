import React from 'react';
import { Locale } from '@/lib/i18n';
import { noindexMetadata } from '@/lib/seo';

/** Buyurtma berish sahifasi indekslanmaydi (shaxsiy bosqich). */
export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  return noindexMetadata(lang, lang === 'ru' ? 'Оформление заказа' : 'Buyurtmani rasmiylashtirish');
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
