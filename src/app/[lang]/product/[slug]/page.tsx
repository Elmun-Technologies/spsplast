import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { ProductCard } from '@/components/product/ProductCard';
import { MoldResultShowcase } from '@/components/product/MoldResultShowcase';
import { ProductDetailClient } from './ProductDetailClient';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Link href={`/${lang}`} className="hover:text-white">
          {dict.nav.home}
        </Link>
        <span>/</span>
        <Link href={`/${lang}/catalog`} className="hover:text-white">
          {dict.nav.catalog}
        </Link>
        {categoryTrans && (
          <>
            <span>/</span>
            <Link
              href={`/${lang}/catalog?category=${categoryTrans.slug}`}
              className="hover:text-white"
            >
              {categoryTrans.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-white font-medium truncate max-w-xs">{trans.name}</span>
      </div>

      {/* Interactive Main Product View Client Component */}
      <ProductDetailClient product={mappedProduct} lang={lang} />

      {/* USP Mold Result Showcase Block */}
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

      {/* How it works 4 Steps Infographic */}
      <section className="bg-brand-card/70 border border-brand-border rounded-3xl p-8 space-y-6">
        <div className="text-center max-w-lg mx-auto">
          <h3 className="text-xl sm:text-2xl font-black text-white">
            {dict.product.howItWorks}
          </h3>
          <p className="text-xs text-gray-400 mt-1">Beton quyish texnologiyasi va foydalanish bosqichlari</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          <div className="p-4 rounded-xl bg-brand-dark border border-brand-border space-y-2">
            <span className="w-8 h-8 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center">1</span>
            <h4 className="font-bold text-white text-sm">{dict.product.step1}</h4>
            <p className="text-xs text-gray-400">Beton va plastifikatorni to‘g‘ri nisbatda aralashtiring.</p>
          </div>

          <div className="p-4 rounded-xl bg-brand-dark border border-brand-border space-y-2">
            <span className="w-8 h-8 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center">2</span>
            <h4 className="font-bold text-white text-sm">{dict.product.step2}</h4>
            <p className="text-xs text-gray-400">Qolipni maxsus moy bilan surtib, qolipga tekis quying.</p>
          </div>

          <div className="p-4 rounded-xl bg-brand-dark border border-brand-border space-y-2">
            <span className="w-8 h-8 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center">3</span>
            <h4 className="font-bold text-white text-sm">{dict.product.step3}</h4>
            <p className="text-xs text-gray-400">24 soat davomida soyada quriting.</p>
          </div>

          <div className="p-4 rounded-xl bg-brand-dark border border-brand-border space-y-2">
            <span className="w-8 h-8 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center">4</span>
            <h4 className="font-bold text-white text-sm">{dict.product.step4}</h4>
            <p className="text-xs text-gray-400">Qolipdan osongina tayyor mahsulotni ajratib oling.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
