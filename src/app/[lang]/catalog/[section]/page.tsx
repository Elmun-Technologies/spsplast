import { notFound } from "next/navigation";
import { sectionSeoTitle } from '@/lib/seoTitles';
import {
  getModelsBySection,
  SECTIONS,
  SECTION_SLUGS,
  sectionFromSlug,
  getTotalCount,
  sectionLabel,
} from "@/lib/catalog2027";
import { isValidLocale, locales, type Locale } from "@/lib/i18n";
import { getUi, pluralModels } from "@/lib/ui";
import { CatalogClient } from "@/components/catalog2027/CatalogClient";
import { CatalogHead } from "@/components/catalog2027/CatalogHead";
import { JsonLd } from "@/components/site/JsonLd";
import { jsonLdBreadcrumb, pageMetadata } from "@/lib/seo";
import { seoOverride } from "@/lib/seoOverrides";
import { modelImage } from "@/lib/catalog2027";
import {
  CountriesStrip,
  ModelIndex,
  PavingGuide,
  TagChips,
} from "@/components/seo2028/SeoBlocks";

// `dynamicParams = false` + searchParams o'qimaslik: noma'lum bo'lim uchun
// Next qattiq 404 qaytarishi kerak (soft-404 emas). Filtrlar mijoz tomonida
// URL'dan o'qiladi (CatalogClient).
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((lang) =>
    SECTIONS.map((s) => ({ lang, section: SECTION_SLUGS[s] })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; section: string }>;
}) {
  const { lang, section } = await params;
  const sec = sectionFromSlug(section);
  const locale = isValidLocale(lang) ? (lang as Locale) : "uz";
  if (!sec) return { title: "SPS" };
  const models = getModelsBySection(sec);
  const count = models.length;
  const cover = models.map((m) => modelImage(m)).find(Boolean) ?? undefined;
  return pageMetadata({
    lang: locale,
    path: `/catalog/${section}`,
    title: sectionSeoTitle(sec, locale, count),
    description: `${sectionLabel(sec, locale)} — ${count} ${pluralModels(locale, count)}. ${getUi(locale).seo.leadCta}`,
    image: cover,
  });
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ lang: string; section: string }>;
}) {
  const { lang: langParam, section } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const sec = sectionFromSlug(section);
  if (!sec) notFound();

  const models = getModelsBySection(sec);
  const t = getUi(lang);
  // Admin → SEO → Sahifalar: H1 va kirish matni (bo'sh bo'lsa — bo'lim nomi).
  const o = seoOverride(lang, `/catalog/${SECTION_SLUGS[sec]}`);

  return (
    <>
      <JsonLd
        data={jsonLdBreadcrumb(lang, [
          { name: "SPS", path: "" },
          { name: t.header.catalog, path: "/catalog" },
          {
            name: sectionLabel(sec, lang),
            path: `/catalog/${SECTION_SLUGS[sec]}`,
          },
        ])}
      />
      <CatalogHead
        lang={lang}
        crumbs={[
          { href: `/${lang}/catalog`, label: t.header.catalog },
          { label: sectionLabel(sec, lang) },
        ]}
        title={o?.h1 || sectionLabel(sec, lang)}
        intro={o?.intro}
        lead={`${models.length} ${pluralModels(lang, models.length)} · ${t.header.catalog} ${getTotalCount()}. ${t.seo.leadCta}`}
      />
      <div className="wrap sec">
        <TagChips lang={lang} section={sec} />
        <CatalogClient lang={lang} models={models} variant="catalog" />
      </div>
      {/* SEO: tanlash qo'llanmasi (asosiy so'rov — trotuar plitkasi) va eksport sahifalariga havolalar */}
      {sec === "trotuar" ? <PavingGuide lang={lang} /> : null}
      <ModelIndex lang={lang} section={sec} />
      <CountriesStrip lang={lang} />
    </>
  );
}
