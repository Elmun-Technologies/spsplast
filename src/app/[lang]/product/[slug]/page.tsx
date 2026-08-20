import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { ProductCard } from '@/components/product/ProductCard';
import { MoldResultShowcase } from '@/components/product/MoldResultShowcase';
import { ProductDetailClient } from './ProductDetailClient';
import { CheckCircle2, ShieldCheck, Truck, Video } from 'lucide-react';

interface ProductPageProps {
  params: { lang: Locale; slug: string };
}

// Dynamic SEO metadata generator
export async function generateMetadata({ params: { lang, slug } }: ProductPageProps) {
  const product = await db.product.findUnique({
    where: { slug },
  });

  if (!product) return {};

  const title = lang === 'ru' ? product.titleRu : product.titleUz;
  const desc = lang === 'ru' ? product.descriptionRu : product.descriptionUz;

  return {
    title: `${title} | SPS PLAST`,
    description: desc.slice(0, 160),
    openGraph: {
      title,
      description: desc.slice(0, 160),
      images: product.resultImage ? [product.resultImage] : [],
    },
  };
}

export default async function ProductDetailPage({
  params: { lang, slug },
}: ProductPageProps) {
  const dict = getDictionary(lang);

  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { order: 'asc' } },
      attributes: true,
    },
  });

  if (!product) notFound();

  const relatedProducts = await db.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    include: { images: true },
    take: 3,
  });

  const title = lang === 'ru' ? product.titleRu : product.titleUz;
  const description = lang === 'ru' ? product.descriptionRu : product.descriptionUz;

  // JSON-LD structured data for Google Merchant / Rich Snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: title,
    image: product.images.map((img) => img.url),
    description: description,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: product.price,
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
        <span>/</span>
        <Link href={`/${lang}/catalog?category=${product.category.slug}`} className="hover:text-white">
          {lang === 'ru' ? product.category.nameRu : product.category.nameUz}
        </Link>
        <span>/</span>
        <span className="text-white font-medium truncate max-w-xs">{title}</span>
      </div>

      {/* Interactive Main Product View Component */}
      <ProductDetailClient product={product} lang={lang} />

      {/* USP Mold Result Showcase Block */}
      {product.resultImage && (
        <section className="pt-6">
          <MoldResultShowcase
            moldImage={product.images[0]?.url || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80'}
            resultImage={product.resultImage}
            moldTitle={title}
            resultTitle={product.resultTitleUz || 'Tayyor Mahsulot Namunasi'}
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

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6 pt-6">
          <h3 className="text-2xl font-black text-white">{dict.product.relatedProducts}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} lang={lang} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
