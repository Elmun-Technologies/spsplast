import { notFound } from 'next/navigation';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { pageMetadata } from '@/lib/seo';
import { CATALOG_PDFS } from '@/lib/catalogPdf';
import { FlipBook } from '@/components/flip2027/FlipBook';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? (lang as Locale) : 'uz';
  const t = getUi(locale);
  return pageMetadata({ lang: locale, path: '/catalog/flip', title: t.flip.title, description: t.flip.lead, noindex: true });
}

/** Varaqlanadigan kataloglar (flipbook) + PDF yuklab olish. */
export default async function FlipPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const t = getUi(lang);
  const cats = CATALOG_PDFS.map((c) => ({ key: c.key, file: c.file, label: t.flip.tabs[c.key] }));
  return (
    <section className="sec flip-sec">
      <div className="wrap">
        <h1 className="h1">{t.flip.title}</h1>
        <p className="lead muted">{t.flip.lead}{t.flip.note ? ` ${t.flip.note}` : ''}</p>
        <FlipBook cats={cats} initial="trotuar" t={t.flip} />
      </div>
    </section>
  );
}
