import React from 'react';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { CompareBar } from '@/components/catalog2027/CompareBar';
import { SWCleanup } from '@/components/layout/SWCleanup';
import { HtmlLangSync } from '@/components/layout/HtmlLangSync';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';

/**
 * Til to'plami yopiq (uz/ru/en) — router build paytida bilishi uchun
 * enumerate qilamiz: barcha /[lang]/... sahifalari statik prerender bo'ladi.
 */
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;

  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const t = getUi(lang);

  return (
    <>
      <HtmlLangSync lang={lang} />
      <a href="#main-content" className="skip-link">
        {t.a11y.skip}
      </a>
      {/* Eski PWA service worker'larni o'chirish (qaytgan foydalanuvchilar uchun) */}
      <SWCleanup />
      <SiteHeader lang={lang} />
      <main id="main-content">{children}</main>
      <CompareBar lang={lang} />
      <SiteFooter lang={lang} />
    </>
  );
}
