import React from 'react';
import { Locale } from '@/lib/i18n';
import { noindexMetadata } from '@/lib/seo';

/**
 * Buyurtma tasdiqlanganidan keyingi shaxsiy sahifa: indekslanmaydi va
 * havolasi boshqa tilda qayta yozilmaydi (noindexMetadata canonical'ni
 * til boshiga qaratadi).
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  return noindexMetadata(lang, lang === 'ru' ? 'Заказ принят' : 'Buyurtma qabul qilindi');
}

export default function OrderSuccessLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
