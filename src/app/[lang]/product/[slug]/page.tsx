import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { MoldResultShowcase } from '@/components/product/MoldResultShowcase';
import { ProductDetailClient } from './ProductDetailClient';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { RecentlyViewed, RecentlyViewedTracker } from '@/components/product/RecentlyViewed';
import { ProductReviews } from '@/components/product/ProductReviews';
import { ProductCard } from '@/components/product/ProductCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getProductsServer } from '@/lib/services/productService';

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
    title: `${trans.name} | SPS`,
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
    slug: trans.slug,
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
    weight: product.attributeValues.find((a) => a.attribute.code === 'weight')?.textValue || null,
    images: product.media.map((m) => ({ url: m.url, altText: m.alt })),
    moldImage: moldMedia?.url || null,
    resultImage: resultMedia?.url || null,
    videoUrl: product.videoUrl || null,
  };

  const breadcrumbItems = [
    { label: dict.nav.catalog, href: `/${lang}/catalog` },
    ...(categoryTrans ? [{ label: categoryTrans.name, href: `/${lang}/catalog?category=${categoryTrans.slug}` }] : []),
    { label: trans.name, active: true },
  ];

  const jsonLdProduct = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: trans.name,
    image: product.media.map((img) => img.url),
    description: trans.description || '',
    sku: product.sku,
    brand: { '@type': 'Brand', name: 'SPS' },
    offers: {
      '@type': 'Offer',
      price: product.basePrice,
      priceCurrency: 'UZS',
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'SPS' },
    },
  };

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: dict.nav.home, item: `/${lang}` },
      { '@type': 'ListItem', position: 2, name: dict.nav.catalog, item: `/${lang}/catalog` },
      ...(categoryTrans
        ? [{ '@type': 'ListItem', position: 3, name: categoryTrans.name, item: `/${lang}/catalog?category=${categoryTrans.slug}` }]
        : []),
      { '@type': 'ListItem', position: categoryTrans ? 4 : 3, name: trans.name },
    ],
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen py-6 text-gray-900 space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProduct) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />

      <RecentlyViewedTracker
        product={{
          id: mappedProduct.id,
          slug: mappedProduct.slug,
          title: trans.name,
          price: mappedProduct.price,
          image: mappedProduct.images[0]?.url || '',
          sku: mappedProduct.sku,
        }}
      />

      <Container>
        <Breadcrumbs lang={lang} items={breadcrumbItems} className="mb-5" />

        <ProductDetailClient product={mappedProduct} lang={lang} />

        {mappedProduct.resultImage && mappedProduct.moldImage && (
          <section className="pt-6">
            <MoldResultShowcase
              moldImage={mappedProduct.moldImage}
              resultImage={mappedProduct.resultImage}
              moldTitle={trans.name}
              resultTitle={lang === 'ru' ? 'Готовый образец' : 'Tayyor mahsulot namunasi'}
              lang={lang}
            />
          </section>
        )}

        <section className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{dict.product.howItWorks}</h3>
            <p className="text-sm text-gray-500 mt-2">{lang === 'ru' ? 'Технология заливки бетона' : 'Beton quyish texnologiyasi va bosqichlari'}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {[
              { step: 1, title: dict.product.step1, desc: lang === 'ru' ? 'Смешайте бетон с пластификатором в правильной пропорции.' : 'Beton va plastifikatorni to‘g‘ri nisbatda aralashtiring.' },
              { step: 2, title: dict.product.step2, desc: lang === 'ru' ? 'Смажьте форму маслом и залейте равномерно.' : 'Qolipni maxsus moy bilan surtib, tekis quying.' },
              { step: 3, title: dict.product.step3, desc: lang === 'ru' ? 'Сушите 24 часа в тени.' : '24 soat davomida soyada quriting.' },
              { step: 4, title: dict.product.step4, desc: lang === 'ru' ? 'Легко извлеките готовое изделие.' : 'Tayyor mahsulotni qolipdan osongina ajratib oling.' },
            ].map((item) => (
              <div key={item.step} className="p-5 rounded-xl bg-[#F8F9FA] border border-gray-200 space-y-3 hover:border-gray-300 transition-colors">
                <span className="w-8 h-8 rounded-full bg-brand-red text-white text-sm font-bold flex items-center justify-center shadow-red">
                  {item.step}
                </span>
                <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <RecentlyViewed lang={lang} currentProductId={mappedProduct.id} />

        {/* Reviews */}
        <section className="pt-4">
          <ProductReviews lang={lang} productId={mappedProduct.id} />
        </section>

        {/* Related Products */}
        <RelatedProducts lang={lang} categorySlug={categoryTrans?.slug} currentProductId={mappedProduct.id} />
      </Container>
    </div>
  );
}

async function RelatedProducts({ lang, categorySlug, currentProductId }: { lang: Locale; categorySlug?: string; currentProductId: string }) {
  if (!categorySlug) return null;
  try {
    const data = await getProductsServer({ locale: lang, categorySlug, limit: 8 });
    const related = data.products.filter((p: any) => p.id !== currentProductId).slice(0, 4);
    if (related.length === 0) return null;
    return (
      <section className="pt-6">
        <SectionHeader
          title={lang === 'ru' ? 'Похожие товары' : 'O‘xshash mahsulotlar'}
          subtitle={lang === 'ru' ? 'Вам также может подойти' : 'Sizga ham mos kelishi mumkin'}
          linkText={lang === 'ru' ? 'Все' : 'Barchasi'}
          linkHref={`/${lang}/catalog?category=${categorySlug}`}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {related.map((p: any) => (
            <ProductCard key={p.id} product={p} lang={lang} />
          ))}
        </div>
      </section>
    );
  } catch {
    return null;
  }
}
