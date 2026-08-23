import React from 'react';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StickyMobileContact } from '@/components/layout/StickyMobileContact';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CompareBar } from '@/components/product/CompareBar';
import { PWAInstallBanner } from '@/components/layout/PWAInstallBanner';
import { AIAssistant } from '@/components/ui/AIAssistant';
import { SWRegister } from '@/components/layout/SWRegister';
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
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] px-4 py-2 bg-brand-red text-white rounded-xl text-sm font-bold">
        {lang === 'ru' ? 'Перейти к содержимому' : 'Asosiy kontentga o‘tish'}
      </a>
      <SWRegister />
      <Header lang={lang} />
      <CartDrawer lang={lang} />
      <CompareBar lang={lang} />
      <PWAInstallBanner />
      <AIAssistant lang={lang} />
      <main id="main-content" className="flex-1 pb-24 lg:pb-0">{children}</main>
      <StickyMobileContact lang={lang} />
      <Footer lang={lang} />
    </div>
  );
}
