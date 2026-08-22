import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { MoldResultShowcase } from '@/components/product/MoldResultShowcase';
import { ProductDetailClient } from './ProductDetailClient';
import { Container } from '@/components/ui/Container';
import { ChevronRight } from 'lucide-react';

interface ProductPageProps {
  params: { lang: Locale; slug: string };
}

export async function generateMetadata({ params: { lang, slug } }: ProductPageProps) {
  const trans = await db.productTranslation.findFirst({
    where: { slug, locale: lang },
    include: { product: { include: { media: true } } },
  });

  if (!trans) return {};

  return {
    title: `${trans.name} | SPS PLAST`,
    description: (trans.shortDescription || trans.description || '').slice(0, 160),
  };
}

export default async function ProductDetailPage({
  params: { lang, slug },
}: ProductPageProps) {
  const dict = getDictionary(lang);

  const trans = await db.productTranslation.findFirst({
    where: { slug, locale: lang },
    include: {
      product: {
        include: {
          media: { orderBy: { sortOrder: 'asc' } },
          categories: {
            include: {
              category: {
                include: { translations: { where: { locale: lang } } },
              },
            },
          },
          attributeValues: {
            include: {
              attribute: {
                include: { translations: { where: { locale: lang } } },
              },
              option: {
                include: { translations: { where: { locale: lang } } },
              },
            },
          },
        },
      },
    },
  });

  if (!trans || !trans.product || trans.product.status !== 'ACTIVE') {
    notFound();
  }

  const product = trans.product;
  const categoryTrans = product.categories[0]?.category?.translations[0];

  const moldMedia = product.media.find((m) => m.type === 'MOLD') || product.media[0];
  const resultMedia = product.media.find((m) => m.type === 'FINISHED_RESULT');

  const mappedProduct = {
    id: product.id,
    sku: product.sku,
    titleUz: trans.name,
    titleRu: trans.name,
    descriptionUz: trans.description || '',
    descriptionRu: trans.description || '',
    price: product.basePrice,
    oldPrice: product.compareAtPrice,
    inStock: product.inStock,
    isBestseller: product.isBestseller,
    isNew: product.isNew,
    yieldPerCast: product.yieldPerCast,
    durabilityCasts: product.durabilityCasts,
    dimensions: product.attributeValues.find((a) => a.attribute.code === 'dimensions')?.textValue || null,
    material: product.attributeValues.find((a) => a.attribute.code === 'material')?.textValue || null,
    images: product.media.map((m) => ({ url: m.url, altText: m.alt })),
    moldImage: moldMedia?.url || null,
    resultImage: resultMedia?.url || null,
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: trans.name,
    image: product.media.map((img) => img.url),
    description: trans.description || '',
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: product.basePrice,
      priceCurrency: 'UZS',
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen py-6 text-gray-900 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container>
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 font-medium">
          <Link href={`/${lang}`} className="hover:text-brand-red transition-colors">
            {dict.nav.home}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <Link href={`/${lang}/catalog`} className="hover:text-brand-red transition-colors">
            {dict.nav.catalog}
          </Link>
          {categoryTrans && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <Link
                href={`/${lang}/catalog?category=${categoryTrans.slug}`}
                className="hover:text-brand-red transition-colors"
              >
                {categoryTrans.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-900 font-semibold truncate max-w-xs">{trans.name}</span>
        </nav>

        {/* Product Interactive Main View */}
        <ProductDetailClient product={mappedProduct} lang={lang} />

        {/* Mold Result Showcase */}
        {mappedProduct.resultImage && mappedProduct.moldImage && (
          <section className="pt-6">
            <MoldResultShowcase
              moldImage={mappedProduct.moldImage}
              resultImage={mappedProduct.resultImage}
              moldTitle={trans.name}
              resultTitle="Tayyor Mahsulot Namunasi"
              lang={lang}
            />
          </section>
        )}

        {/* How it works Step Infographic */}
        <section className="mt-8 bg-white border border-gray-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="text-center max-w-lg mx-auto">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              {dict.product.howItWorks}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Beton quyish texnologiyasi va foydalanish bosqichlari</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-lg bg-[#F8F9FA] border border-gray-200 space-y-2">
              <span className="w-7 h-7 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center">1</span>
              <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{dict.product.step1}</h4>
              <p className="text-xs text-gray-600">Beton va plastifikatorni to‘g‘ri nisbatda aralashtiring.</p>
            </div>

            <div className="p-4 rounded-lg bg-[#F8F9FA] border border-gray-200 space-y-2">
              <span className="w-7 h-7 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center">2</span>
              <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{dict.product.step2}</h4>
              <p className="text-xs text-gray-600">Qolipni maxsus moy bilan surtib, qolipga tekis quying.</p>
            </div>

            <div className="p-4 rounded-lg bg-[#F8F9FA] border border-gray-200 space-y-2">
              <span className="w-7 h-7 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center">3</span>
              <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{dict.product.step3}</h4>
              <p className="text-xs text-gray-600">24 soat davomida soyada quriting.</p>
            </div>

            <div className="p-4 rounded-lg bg-[#F8F9FA] border border-gray-200 space-y-2">
              <span className="w-7 h-7 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center">4</span>
              <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{dict.product.step4}</h4>
              <p className="text-xs text-gray-600">Qolipdan osongina tayyor mahsulotni ajratib oling.</p>
            </div>
          </div>
        </section>
      </Container>
    </div>
  );
}
