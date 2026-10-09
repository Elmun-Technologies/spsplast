import { getModels, getTotalCount } from '@/lib/catalog2027';
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
    description: `${t.sections.trotuar}, ${t.sections.fasad}, ${t.sections.zabor}, ${t.sections.dekor}, ${t.sections.skameyka} — ${total} ${pluralModels(locale, total)}.`,
  });
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang: langParam } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams)) {
    if (typeof v === 'string') sp.set(k, v);
  }

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
      <CatalogClient lang={lang} models={getModels()} initialQuery={sp.toString()} variant="catalog" />
    </div>
  );
}
