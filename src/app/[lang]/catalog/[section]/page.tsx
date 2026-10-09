import { notFound } from 'next/navigation';
import { getModelsBySection, SECTIONS, SECTION_SLUGS, sectionFromSlug, getTotalCount } from '@/lib/catalog2027';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getUi, pluralModels } from '@/lib/ui';
import { CatalogClient } from '@/components/catalog2027/CatalogClient';

// `dynamicParams = false` + searchParams o'qimaslik: noma'lum bo'lim uchun
// Next qattiq 404 qaytarishi kerak (soft-404 emas). Filtrlar mijoz tomonida
// URL'dan o'qiladi (CatalogClient).
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((lang) =>
    SECTIONS.map((s) => ({ lang, section: SECTION_SLUGS[s] })),
  );
}


export async function generateMetadata({ params }: { params: Promise<{ lang: string; section: string }> }) {
  const { lang, section } = await params;
  const sec = sectionFromSlug(section);
  const locale = isValidLocale(lang) ? (lang as Locale) : 'uz';
  if (!sec) return { title: 'SPS' };
  const count = getModelsBySection(sec).length;
  return {
    title: `${getUi(locale).sections[sec]} · ${count} ${pluralModels(locale, count)} — SPS`,
  };
}

export default async function SectionPage({ params }: { params: Promise<{ lang: string; section: string }> }) {
  const { lang: langParam, section } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const sec = sectionFromSlug(section);
  if (!sec) notFound();

  const models = getModelsBySection(sec);
  const t = getUi(lang);

  return (
    <div className="wrap sec">
      <nav aria-label="breadcrumb">
        <ol className="crumbs">
          <li>
            <a href={`/${lang}/catalog`}>{t.header.catalog}</a>
          </li>
          <li aria-current="page">{t.sections[sec]}</li>
        </ol>
      </nav>
      <div className="sps-section-head" style={{ marginBlock: 'var(--space-4) var(--space-5)' }}>
        <div>
          <h1 className="h1">{t.sections[sec]}</h1>
          <p className="lead muted">
            {models.length} {pluralModels(lang, models.length)} · {t.header.catalog} {getTotalCount()}
          </p>
        </div>
      </div>
      <CatalogClient lang={lang} models={models} variant="catalog" />
    </div>
  );
}
