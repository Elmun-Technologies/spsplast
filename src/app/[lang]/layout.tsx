import React from 'react';
import nextDynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { StickyMobileContact } from '@/components/layout/StickyMobileContact';
import { DeferredWidgets } from '@/components/layout/DeferredWidgets';
import { SWCleanup } from '@/components/layout/SWCleanup';
import { HtmlLangSync } from '@/components/layout/HtmlLangSync';
import { isValidLocale, locales, Locale } from '@/lib/i18n';
import { getCategoriesWithMeta } from '@/lib/catalog';

// Footer is below the fold on every page: keep it out of the initial bundle
// (it is still server-rendered, so crawlers and no-JS users see it).
const Footer = nextDynamic(() => import('@/components/layout/Footer').then((m) => m.Footer));

/**
 * The locale set is closed (uz/ru), so enumerate it for the router.
 *
 * Without this, every `/[lang]/...` segment is unknown at build time and Next
 * has to server-render each marketing page (about, terms, privacy, production,
 * delivery-payment, returns, projects, blog) per request. With it, those pages
 * are prerendered as static HTML for both locales and served straight from the
 * CDN — which matters because the layout is on every storefront route.
 */
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

/**
 * Noma'lum til prefiksi (`/zzz`, `/en/...`) render qilinmaydi — Next darhol
 * 404 qaytaradi. Ilgari bu holatda `notFound()` oqim ichida chaqirilib,
 * productionda **500** berardi (o'lchandi: `/zzz` → 500, sabab — status
 * allaqachon yuborilgan bo'ladi).
 */
export const dynamicParams = false;

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;

  if (!isValidLocale(langParam)) {
    notFound();
  }

  const lang = langParam as Locale;

  // Footer'dagi kategoriya havolalari — haqiqiy slug'lar bilan (404 bo'lmasin).
  const catalogLinks = getCategoriesWithMeta(lang).map((category) => ({
    id: category.id,
    slug: category.slug,
    name: lang === 'ru' ? category.nameRu : category.nameUz,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-surface-page text-ink font-sans antialiased selection:bg-brand-red selection:text-white">
      {/* Til atributini faol lokalga moslashtiradi (batafsil: HtmlLangSync.tsx) */}
      <HtmlLangSync lang={lang} />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] px-4 py-2 bg-brand-red text-white rounded-[16px] text-sm font-bold">
        {lang === 'ru' ? 'Перейти к содержимому' : 'Asosiy kontentga o‘tish'}
      </a>
      {/* Unregister legacy PWA service workers / caches (see SWCleanup.tsx) */}
      <SWCleanup />
      <Header lang={lang} />
      <main id="main-content" className="flex-1 pb-24 lg:pb-0">{children}</main>
      <StickyMobileContact lang={lang} />
      <Footer lang={lang} catalogLinks={catalogLinks} />
      {/* AI assistant, PWA prompt & compare bar are code-split and mounted after idle */}
      <DeferredWidgets lang={lang} />
    </div>
  );
}
