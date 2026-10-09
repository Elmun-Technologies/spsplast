import { notFound } from 'next/navigation';
import {
  getModelBySlug,
  getModels,
  modelImage,
  modelPerM2,
  modelThickness,
  relatedModels,
  SECTION_SLUGS,
  sectionFromSlug,
  localizedText,
  modelName,
} from '@/lib/catalog2027';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { getPages } from '@/lib/pages';
import { ModelClient } from '@/components/model2027/ModelClient';
import { JsonLd } from '@/components/site/JsonLd';
import { jsonLdBreadcrumb, jsonLdFaq, jsonLdProduct, pageMetadata } from '@/lib/seo';

type Params = { lang: string; section: string; slug: string };

/** Noma'lum slug uchun qattiq 404 (soft-404 emas). */
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((lang) =>
    getModels().map((m) => ({ lang, section: SECTION_SLUGS[m.section], slug: m.slug })),
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { lang, section, slug } = await params;
  const locale = isValidLocale(lang) ? (lang as Locale) : 'uz';
  const sec = sectionFromSlug(section);
  const model = getModelBySlug(slug);
  if (!sec || !model || model.section !== sec) return { title: 'SPS' };
  const name = modelName(model, locale);
  const subtitle = localizedText(model.subtitle, locale) || localizedText(model.note, locale);
  const size = model.tiles[0]?.size || model.molds[0]?.size;
  return pageMetadata({
    lang: locale,
    path: `/catalog/${section}/${model.slug}`,
    title: `${model.code ? `№ ${model.code} ` : ''}${name} — ${getUi(locale).sections[model.section]}`,
    description:
      subtitle ||
      `${getUi(locale).sections[model.section]}${size ? ` · ${size} mm` : ''}. ${getUi(locale).seo.leadCta}`,
    image: modelImage(model) ?? undefined,
    imageAlt: name,
  });
}

export default async function ModelPage({ params }: { params: Promise<Params> }) {
  const { lang: langParam, section, slug } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const sec = sectionFromSlug(section);
  const model = getModelBySlug(slug);
  if (!sec || !model || model.section !== sec) notFound();

  const p = getPages(lang);
  const t = getUi(lang);
  const name = modelName(model, lang);
  const path = `/catalog/${SECTION_SLUGS[model.section]}/${model.slug}`;
  const thickness = modelThickness(model);
  const per = modelPerM2(model);

  return (
    <>
      <JsonLd
        data={[
          jsonLdBreadcrumb(lang, [
            { name: 'SPS', path: '' },
            { name: t.header.catalog, path: '/catalog' },
            { name: t.sections[model.section], path: `/catalog/${SECTION_SLUGS[model.section]}` },
            { name: `${model.code ? `№ ${model.code} ` : ''}${name}`, path },
          ]),
          jsonLdProduct({
            lang,
            path,
            name,
            description: localizedText(model.subtitle, lang) || localizedText(model.note, lang),
            image: modelImage(model),
            sku: model.code,
            category: t.sections[model.section],
            extra: {
              additionalProperty: [
                ...(model.tiles[0]?.size
                  ? [{ '@type': 'PropertyValue', name: p.model.spec.tile, value: model.tiles[0].size }]
                  : []),
                ...(thickness
                  ? [{ '@type': 'PropertyValue', name: p.compare.rows.thickness, value: `${thickness} mm` }]
                  : []),
                ...(per
                  ? [{ '@type': 'PropertyValue', name: p.model.spec.per, value: `${per} ${p.model.keyPerUnit}` }]
                  : []),
                ...(model.kg
                  ? [{ '@type': 'PropertyValue', name: p.model.spec.kgM2, value: `${model.kg} ${p.model.keyKg}` }]
                  : []),
                ...(model.molds[0]?.g
                  ? [{ '@type': 'PropertyValue', name: p.model.spec.moldWeight, value: `${model.molds[0].g} ${p.model.keyGram}` }]
                  : []),
              ],
            },
          }),
          jsonLdFaq(p.model.faq),
        ]}
      />
      <ModelClient lang={lang} model={model} related={relatedModels(model, 4)} />
    </>
  );
}
