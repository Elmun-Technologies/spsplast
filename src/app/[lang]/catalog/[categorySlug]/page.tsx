import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Container } from '@/components/ui/Container';
import { FaqAccordion } from '@/components/ui/FaqAccordion';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProductCard } from '@/components/product/ProductCard';
import { LeadButton } from '@/components/lead/LeadButton';
import { categories, categoryTranslation, getCategoryBySlug, getProductsServer } from '@/lib/catalog';
import { CATEGORY_SEO } from '@/lib/categoryContent';
import { faqItems, faqJsonLd } from '@/lib/faq';
import { getDictionary, Locale } from '@/lib/i18n';
import { pageMetadata } from '@/lib/seo';
import { ArrowRight } from 'lucide-react';

/**
 * Kategoriya sahifasi (P1-7).
 *
 * Ilgari bu marshrut faqat `/catalog?category=…` ga redirect qilardi — ya'ni
 * qidiruv tizimlari uchun kategoriyaning o'z manzili, sarlavhasi va matni
 * yo'q edi. Endi har bir kategoriya uchun statik sahifa yasaladi: mahsulot
 * to'ri, 300+ so'zlik SEO matn va FAQ (ko'rinadigan + JSON-LD ko'rinishida).
 */

interface CategoryPageProps {
  params: Promise<{ lang: Locale; categorySlug: string }>;
}

/** 3 kategoriya × 2 til — barchasi build vaqtida tayyorlanadi. */
export function generateStaticParams() {
  return categories.flatMap((category) =>
    category.translations.map((translation) => ({ lang: translation.locale, categorySlug: translation.slug }))
  );
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { lang, categorySlug } = await params;
  const category = getCategoryBySlug(lang, categorySlug);
  const trans = category ? categoryTranslation(category, lang) : null;
  if (!category || !trans) return {};

  const seo = CATEGORY_SEO[category.id]?.[lang];
  const title =
    lang === 'ru'
      ? `${trans.name} — купить формы от завода SPS`
      : `${trans.name} — zavoddan sotib olish`;

  return pageMetadata({
    lang,
    path: `/catalog/${categorySlug}`,
    title,
    description: seo?.lead || trans.description || trans.name,
    image: category.image || undefined,
    imageAlt: trans.name,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { lang, categorySlug } = await params;
  const category = getCategoryBySlug(lang, categorySlug);
  const trans = category ? categoryTranslation(category, lang) : null;
  if (!category || !trans) notFound();

  const dict = getDictionary(lang);
  const seo = CATEGORY_SEO[category.id]?.[lang];
  const { products, total } = getProductsServer({ locale: lang, categorySlug, pageSize: 12 });

  const otherCategories = categories
    .filter((entry) => entry.id !== category.id)
    .map((entry) => {
      const translation = categoryTranslation(entry, lang);
      return { id: entry.id, name: translation.name, slug: translation.slug, image: entry.image };
    });

  const breadcrumbs = [
    { label: dict.nav.catalog, href: `/${lang}/catalog` },
    { label: trans.name, active: true },
  ];

  return (
    <div className="bg-surface-page text-ink min-h-screen pb-16">
      {seo && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(seo.faq, lang)) }}
        />
      )}

      <Container className="pt-6">
        <Breadcrumbs lang={lang} items={breadcrumbs} />

        {/* Kategoriya sarlavhasi + kirish */}
        <header className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <p className="text-xs font-bold tracking-[0.14em] text-brand-red uppercase">
              {lang === 'ru' ? 'Категория' : 'Kategoriya'} · {total} {lang === 'ru' ? 'товаров' : 'mahsulot'}
            </p>
            <h1 className="text-[28px] sm:text-4xl font-bold tracking-[-0.03em] leading-tight">{trans.name}</h1>
            {seo?.lead && <p className="text-[15px] sm:text-base text-ink-soft leading-relaxed">{seo.lead}</p>}
            <div className="flex flex-wrap gap-3 pt-1">
              <LeadButton lang={lang} type="CONSULTATION" className="!px-6 !py-3 !text-sm">
                {lang === 'ru' ? 'Оставить заявку' : 'Zayafka berish'}
              </LeadButton>
              <Link
                href={`/${lang}/catalog?category=${categorySlug}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-[16px] bg-surface border border-line text-sm font-bold text-ink hover:border-brand-red transition-colors"
              >
                {lang === 'ru' ? 'Смотреть с фильтрами' : 'Filtrlar bilan ko‘rish'}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {category.image && (
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden bg-surface-soft shadow-card">
                <Image
                  src={category.image}
                  alt={trans.name}
                  fill
                  sizes="(min-width: 1024px) 420px, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}
        </header>

        {/* Mahsulot to'ri */}
        <section className="mt-12">
          <SectionHeader
            title={lang === 'ru' ? 'Популярные модели категории' : 'Kategoriyaning mashhur modellari'}
            subtitle={
              lang === 'ru'
                ? 'Цена зависит от модели и объёма — уточняйте по заявке'
                : 'Narx model va hajmga bog‘liq — zayafka orqali aniqlashtiring'
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} lang={lang} />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Link
              href={`/${lang}/catalog?category=${categorySlug}`}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-[16px] bg-brand-red text-white text-sm font-bold hover:bg-brand-red-dark transition-colors"
            >
              {lang === 'ru' ? `Все модели (${total})` : `Barcha modellar (${total})`}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* SEO matn: 300+ so'z */}
        {seo && (
          <section className="mt-14 bg-surface rounded-[24px] p-6 sm:p-9 shadow-card">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-6">
                {seo.body.map((block) => (
                  <div key={block.heading}>
                    <h2 className="text-[20px] sm:text-[22px] font-bold text-ink tracking-[-0.02em]">{block.heading}</h2>
                    <p className="mt-2 text-sm sm:text-[15px] text-ink-soft leading-[1.75]">{block.text}</p>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-5">
                <div className="bg-surface-soft rounded-[20px] p-5 sm:p-6">
                  <h3 className="font-bold text-ink text-base">
                    {lang === 'ru' ? 'Что учесть при выборе' : 'Tanlashda nimalarga e’tibor berish'}
                  </h3>
                  <ul className="mt-4 space-y-3">
                    {seo.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3 text-sm text-ink-soft leading-relaxed">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-red shrink-0" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        {seo && (
          <section className="mt-14">
            <SectionHeader title={dict.home.faqTitle} />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7">
                <FaqAccordion items={faqItems(seo.faq, lang)} />
              </div>
              <div className="lg:col-span-5">
                <div className="bg-surface rounded-[24px] p-6 shadow-card">
                  <h3 className="font-bold text-ink text-base">
                    {lang === 'ru' ? 'Другие категории' : 'Boshqa kategoriyalar'}
                  </h3>
                  <div className="mt-4 space-y-3">
                    {otherCategories.map((entry) => (
                      <Link
                        key={entry.id}
                        href={`/${lang}/catalog/${entry.slug}`}
                        className="flex items-center justify-between gap-3 p-3 rounded-[16px] bg-surface-soft hover:bg-[#FEF0F0] transition-colors text-sm font-semibold text-ink"
                      >
                        <span>{entry.name}</span>
                        <ArrowRight className="w-4 h-4 text-brand-red" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </Container>
    </div>
  );
}
