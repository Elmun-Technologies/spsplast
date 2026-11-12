import { getModels, getTotalCount, getActiveSections, sectionLabel, sectionShortLabel } from '@/lib/catalog2027';
import { catalogSeoTitle } from '@/lib/seoTitles';
import { isValidLocale, type Locale } from '@/lib/i18n';
import { getUi, pluralModels } from '@/lib/ui';
import { CatalogClient } from '@/components/catalog2027/CatalogClient';
import { CatalogHead } from '@/components/catalog2027/CatalogHead';
import { JsonLd } from '@/components/site/JsonLd';
import { jsonLdBreadcrumb, pageMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return ['uz', 'ru', 'en'].map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? (lang as Locale) : 'uz';
  const t = getUi(locale);
  const total = getTotalCount();
  return pageMetadata({
    lang: locale,
    path: '/catalog',
    title: catalogSeoTitle(locale, total),
    // Qisqa bo'lim nomlari: 7 bo'lim to'liq nomi bilan description 200+ belgi bo'lib, SERP'da kesilardi.
    description: `${getActiveSections().map((x) => sectionShortLabel(x, locale)).join(', ')} — ${total} ${pluralModels(locale, total)}. ${t.seo.leadCta}`,
  });
}

// `searchParams` server tomonda O'QILMAYDI: u sahifani stream qilib, metadata
// (title/description/canonical) `<head>` o'rniga `<body>` ga tushib qolardi —
// Lighthouse buni "meta description yo'q" deb baholagan (SEO 92). Filtrlar
// mijoz tomonida `window.location.search` dan o'qiladi (bo'lim sahifalari kabi).
export default async function CatalogPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;

  const t = getUi(lang);
  const total = getTotalCount();
  const lead = t.catalog.headLead
    .replace('{n}', String(total))
    .replace('{models}', pluralModels(lang, total))
    .replace('{s}', String(getActiveSections().length));

  return (
    <>
      <JsonLd
        data={jsonLdBreadcrumb(lang, [
          { name: 'SPS', path: '' },
          { name: t.header.catalog, path: '/catalog' },
        ])}
      />
      <CatalogHead
        lang={lang}
        crumbs={[{ href: `/${lang}`, label: 'SPS' }, { label: t.header.catalog }]}
        title={t.seo.catalogTitle}
        lead={lead}
      />
      <div className="wrap sec">
        <CatalogClient lang={lang} models={getModels()} variant="catalog" />
      </div>
    </>
  );
}
