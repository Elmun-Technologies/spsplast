import { notFound } from 'next/navigation';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getPages } from '@/lib/pages';
import { getUi } from '@/lib/ui';
import { CompareClient } from '@/components/compare2027/CompareClient';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? (lang as Locale) : 'uz';
  const p = getPages(locale);
  return { title: `${p.compare.title} — ${getUi(locale).header.catalog} · SPS`, description: p.compare.emptyText };
}

export default async function ComparePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const pages = getPages(lang);
  return <CompareClient lang={lang} t={getUi(lang)} p={{ compare: pages.compare, model: pages.model }} />;
}
