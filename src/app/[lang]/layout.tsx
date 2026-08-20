import React from 'react';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StickyMobileContact } from '@/components/layout/StickyMobileContact';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { isValidLocale, Locale } from '@/lib/i18n';

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  if (!isValidLocale(params.lang)) {
    notFound();
  }

  const lang = params.lang as Locale;

  return (
    <div className="min-h-screen flex flex-col bg-brand-dark text-white font-sans antialiased selection:bg-brand-red selection:text-white">
      <Header lang={lang} />
      <CartDrawer lang={lang} />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <StickyMobileContact />
      <Footer lang={lang} />
    </div>
  );
}
