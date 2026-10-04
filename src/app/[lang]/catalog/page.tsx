import React from 'react';
import { Locale } from '@/lib/i18n';
import { hreflang } from '@/lib/seo';
import { getProductsServer, getCategoryOptions } from '@/lib/catalog';
import { CatalogClient } from '@/components/catalog/CatalogClient';

export const revalidate = 30;

/**
 * Filtrlangan URL'lar (`?category=...&sort=...`) alohida sahifa emas: canonical
 * har doim toza katalog manziliga ishora qiladi.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params;
  return {
    title: lang === 'ru' ? 'Каталог форм и фасадного декора | SPS' : 'Qoliplar va fasad dekor katalogi | SPS',
    alternates: {
      canonical: `/${lang}/catalog`,
      languages: hreflang('/catalog'),
    },
  };
}

interface CatalogPageProps {
  params: Promise<{ lang: Locale }>;
  searchParams: Promise<{
    category?: string;
    search?: string;
    inStock?: string;
    isNew?: string;
    isBestseller?: string;
    sort?: string;
    page?: string;
    minPrice?: string;
    maxPrice?: string;
    material?: string;
  }>;
}

export default async function CatalogPage({
  params,
  searchParams: searchParamsPromise,
}: CatalogPageProps) {
  const { lang } = await params;
  const searchParams = await searchParamsPromise;
  const page = parseInt(searchParams.page || '1', 10) || 1;
  const minPrice = searchParams.minPrice ? parseInt(searchParams.minPrice, 10) : undefined;
  const maxPrice = searchParams.maxPrice ? parseInt(searchParams.maxPrice, 10) : undefined;

  const { products, total, totalPages } = getProductsServer({
    locale: lang,
    categorySlug: searchParams.category,
    search: searchParams.search,
    inStock: searchParams.inStock === 'true',
    isNew: searchParams.isNew === 'true',
    isBestseller: searchParams.isBestseller === 'true',
    sort: searchParams.sort,
    page,
    pageSize: 24,
    minPrice,
    maxPrice,
    material: searchParams.material,
  });

  const categories = getCategoryOptions(lang);

  const selectedCategory = categories.find((c) => c.slug === searchParams.category);

  return (
    <CatalogClient
      lang={lang}
      products={products}
      categories={categories}
      selectedCategory={selectedCategory}
      total={total}
      totalPages={totalPages}
      currentPage={page}
      searchParams={searchParams as any}
    />
  );
}
