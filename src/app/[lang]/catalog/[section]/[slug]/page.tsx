import { notFound } from 'next/navigation';
import {
  getModelBySlug,
  getModels,
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
  return {
    title: `${model.code ? `№ ${model.code} ` : ''}${name} — ${getUi(locale).sections[model.section]} · SPS`,
    description: subtitle || getPages(locale).home.lead,
  };
}

export default async function ModelPage({ params }: { params: Promise<Params> }) {
  const { lang: langParam, section, slug } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const sec = sectionFromSlug(section);
  const model = getModelBySlug(slug);
  if (!sec || !model || model.section !== sec) notFound();

  return <ModelClient lang={lang} model={model} related={relatedModels(model, 4)} />;
}
