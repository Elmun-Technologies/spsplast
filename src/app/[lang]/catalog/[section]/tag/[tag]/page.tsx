import { notFound } from 'next/navigation';
import { SECTION_SLUGS, modelImage, modelName, sectionFromSlug, sectionLabel } from '@/lib/catalog2027';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getUi, pluralModels } from '@/lib/ui';
import { getPages } from '@/lib/pages';
import { getSeoTags, isSeoTag, tagModels } from '@/lib/seoPages';
import { CatalogClient } from '@/components/catalog2027/CatalogClient';
import { CountriesStrip, PavingGuide, TagChips } from '@/components/seo2028/SeoBlocks';
import { JsonLd } from '@/components/site/JsonLd';
import { jsonLdBreadcrumb, jsonLdItemList, pageMetadata } from '@/lib/seo';

/**
 * Teg (SEO landing) sahifasi: `/{lang}/catalog/{section}/tag/{tag}` — bo'lim ichidagi
 * saralangan to'plam (docs/SEO-2028-RU.md 2-bo'lim). O'z URL, H1, matn, canonical;
 * `[slug]` (model) bilan to'qnashmaydi — statik `tag` segmenti ustun.
 */
type Params = { lang: string; section: string; tag: string };

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((lang) => getSeoTags().map((t) => ({ lang, section: SECTION_SLUGS[t.section], tag: t.tag })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { lang, section, tag } = await params;
  const locale = isValidLocale(lang) ? (lang as Locale) : 'uz';
  const sec = sectionFromSlug(section);
  if (!sec || !isSeoTag(sec, tag)) return { title: 'SPS' };
  const copy = getPages(locale).seo.tags[tag];
  const cover = tagModels(sec, tag).map((m) => modelImage(m)).find(Boolean) ?? undefined;
  return pageMetadata({
    lang: locale,
    path: `/catalog/${section}/tag/${tag}`,
    title: copy.title,
    description: copy.text,
    image: cover,
  });
}

export default async function TagPage({ params }: { params: Promise<Params> }) {
  const { lang: langParam, section, tag } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const sec = sectionFromSlug(section);
  if (!sec || !isSeoTag(sec, tag)) notFound();

  const t = getUi(lang);
  const s = getPages(lang).seo;
  const copy = s.tags[tag];
  const models = tagModels(sec, tag);
  const path = `/catalog/${section}/tag/${tag}`;

  return (
    <>
      <div className="wrap sec">
        <JsonLd
          data={[
            jsonLdBreadcrumb(lang, [
              { name: 'SPS', path: '' },
              { name: t.header.catalog, path: '/catalog' },
              { name: sectionLabel(sec, lang), path: `/catalog/${section}` },
              { name: copy.name, path },
            ]),
            jsonLdItemList(
              lang,
              models.slice(0, 24).map((m) => ({
                name: `${m.code ? `№ ${m.code} ` : ''}${modelName(m, lang)}`,
                path: `/catalog/${section}/${m.slug}`,
                image: modelImage(m),
              })),
            ),
          ]}
        />
        <nav aria-label="breadcrumb">
          <ol className="crumbs">
            <li>
              <a href={`/${lang}/catalog`}>{t.header.catalog}</a>
            </li>
            <li>
              <a href={`/${lang}/catalog/${section}`}>{sectionLabel(sec, lang)}</a>
            </li>
            <li aria-current="page">{copy.name}</li>
          </ol>
        </nav>
        <div className="sps-section-head seo-head">
          <div>
            <h1 className="h1">{copy.h1}</h1>
            <p className="lead muted">{copy.text}</p>
            <p className="seo-head__meta">
              <b>
                {models.length} {pluralModels(lang, models.length)}
              </b>{' '}
              · <a href={`/${lang}/catalog/${section}`}>{s.tagAllLink}</a>
            </p>
          </div>
        </div>
        <TagChips lang={lang} section={sec} current={tag} />
        <CatalogClient lang={lang} models={models} variant="catalog" />
      </div>
      {sec === 'trotuar' ? <PavingGuide lang={lang} /> : null}
      <CountriesStrip lang={lang} />
    </>
  );
}
