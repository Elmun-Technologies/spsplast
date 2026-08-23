import React from 'react';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { getProductsServer } from '@/lib/services/productService';
import { CatalogClient } from '@/components/catalog/CatalogClient';

interface CatalogPageProps {
  params: { lang: Locale };
  searchParams: {
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
  };
}

export default async function CatalogPage({
  params: { lang },
  searchParams,
}: CatalogPageProps) {
  const dict = getDictionary(lang);

  const page = parseInt(searchParams.page || '1', 10) || 1;
  const minPrice = searchParams.minPrice ? parseInt(searchParams.minPrice, 10) : undefined;
  const maxPrice = searchParams.maxPrice ? parseInt(searchParams.maxPrice, 10) : undefined;

  const { products, total, totalPages } = await getProductsServer({
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

  const rawCategories = await db.category.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { sortOrder: 'asc' },
    include: {
      translations: { where: { locale: lang } },
    },
  });

  const categories = rawCategories.map((c) => ({
    id: c.id,
    slug: c.translations[0]?.slug || c.id,
    name: c.translations[0]?.name || c.id,
  }));

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
