import { notFound } from 'next/navigation';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getPages } from '@/lib/pages';
import { getUi } from '@/lib/ui';
import { RequestClient } from '@/components/request2027/RequestClient';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? (lang as Locale) : 'uz';
  const p = getPages(locale);
  return { title: `${p.request.title} — SPS`, description: p.request.note };
}

export default async function RequestPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const pages = getPages(lang);
  return <RequestClient lang={lang} t={getUi(lang)} p={{ model: pages.model, request: pages.request }} />;
}
