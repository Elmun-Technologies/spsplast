import { getModels, getTotalCount, getActiveSections, sectionLabel } from '@/lib/catalog2027';
import { isValidLocale, type Locale } from '@/lib/i18n';
import { getUi, pluralModels } from '@/lib/ui';
import { CatalogClient } from '@/components/catalog2027/CatalogClient';
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
    title: `${t.header.catalog} · ${total} ${pluralModels(locale, total)}`,
    description: `${getActiveSections().map((x) => sectionLabel(x, locale)).join(', ')} — ${total} ${pluralModels(locale, total)}. ${t.seo.leadCta}`,
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

  return (
    <div className="wrap sec">
      <JsonLd
        data={jsonLdBreadcrumb(lang, [
          { name: 'SPS', path: '' },
          { name: getUi(lang).header.catalog, path: '/catalog' },
        ])}
      />
      <div className="sps-section-head" style={{ marginBottom: 'var(--space-5)' }}>
        <div>
          <p className="sps-eyebrow">
            <b>SPS</b> · {getUi(lang).header.catalog}
          </p>
          <h1 className="h1" style={{ marginTop: 'var(--space-3)' }}>
            {getUi(lang).header.catalog}
          </h1>
        </div>
      </div>
      <CatalogClient lang={lang} models={getModels()} variant="catalog" />
    </div>
  );
}
