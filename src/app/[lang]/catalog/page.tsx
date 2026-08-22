import React from 'react';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { getProductsServer } from '@/lib/services/productService';
import { ProductCard } from '@/components/product/ProductCard';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { SlidersHorizontal, Search, Layers, X, ChevronRight } from 'lucide-react';

interface CatalogPageProps {
  params: { lang: Locale };
  searchParams: {
    category?: string;
    search?: string;
    inStock?: string;
    isNew?: string;
    isBestseller?: string;
    sort?: string;
  };
}

export default async function CatalogPage({
  params: { lang },
  searchParams,
}: CatalogPageProps) {
  const dict = getDictionary(lang);

  const products = await getProductsServer({
    locale: lang,
    categorySlug: searchParams.category,
    search: searchParams.search,
    inStock: searchParams.inStock === 'true',
    isNew: searchParams.isNew === 'true',
    isBestseller: searchParams.isBestseller === 'true',
    sort: searchParams.sort,
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
    <div className="bg-[#F8F9FA] min-h-screen py-6 text-gray-900">
      <Container>
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 font-medium">
          <Link href={`/${lang}`} className="hover:text-brand-red transition-colors">
            {dict.nav.home}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-900 font-semibold">{dict.nav.catalog}</span>
          {selectedCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-brand-red font-semibold">{selectedCategory.name}</span>
            </>
          )}
        </nav>

        {/* Page Title & Active Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {selectedCategory ? selectedCategory.name : dict.nav.catalog}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Jami topilgan mahsulotlar: <span className="text-gray-900 font-bold">{products.length}</span> ta
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {searchParams.search && (
              <Badge variant="red" className="gap-1 normal-case font-normal text-xs py-1 px-2.5">
                <Search className="w-3 h-3" />
                <span>"{searchParams.search}"</span>
                <Link href={`/${lang}/catalog`} className="ml-1 hover:text-white">
                  <X className="w-3 h-3" />
                </Link>
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="dark" className="gap-1 normal-case font-normal text-xs py-1 px-2.5">
                <span>{selectedCategory.name}</span>
                <Link href={`/${lang}/catalog`} className="ml-1 hover:text-red-400">
                  <X className="w-3 h-3" />
                </Link>
              </Badge>
            )}
            {searchParams.inStock === 'true' && (
              <Badge variant="green" className="normal-case font-normal text-xs py-1 px-2.5">
                Faqat mavjud
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar Filter */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                  <SlidersHorizontal className="w-4 h-4 text-brand-red" />
                  <span>Filtrlar</span>
                </div>
                <Link
                  href={`/${lang}/catalog`}
                  className="text-[11px] text-gray-500 hover:text-brand-red transition-colors"
                >
                  Tozalash
                </Link>
              </div>

              {/* Categories Navigation Tree */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Kategoriyalar
                </h4>
                <ul className="space-y-1 text-xs font-medium">
                  <li>
                    <Link
                      href={`/${lang}/catalog`}
                      className={`block px-2.5 py-1.5 rounded-lg transition-colors ${
                        !searchParams.category
                          ? 'bg-brand-red text-white font-bold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Barchasi
                    </Link>
                  </li>
                  {categories.map((cat) => {
                    const isSelected = searchParams.category === cat.slug;
                    return (
                      <li key={cat.id}>
                        <Link
                          href={`/${lang}/catalog?category=${cat.slug}`}
                          className={`block px-2.5 py-1.5 rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-brand-red text-white font-bold'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {cat.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Quick Status Toggles */}
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Status
                </h4>
                <div className="space-y-2 text-xs text-gray-700 font-medium">
                  <Link
                    href={`/${lang}/catalog?${new URLSearchParams({
                      ...searchParams,
                      inStock: searchParams.inStock === 'true' ? 'false' : 'true',
                    }).toString()}`}
                    className="flex items-center gap-2 cursor-pointer hover:text-gray-900"
                  >
                    <input
                      type="checkbox"
                      checked={searchParams.inStock === 'true'}
                      readOnly
                      className="rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span>Faqat omborda mavjud</span>
                  </Link>

                  <Link
                    href={`/${lang}/catalog?${new URLSearchParams({
                      ...searchParams,
                      isNew: searchParams.isNew === 'true' ? 'false' : 'true',
                    }).toString()}`}
                    className="flex items-center gap-2 cursor-pointer hover:text-gray-900"
                  >
                    <input
                      type="checkbox"
                      checked={searchParams.isNew === 'true'}
                      readOnly
                      className="rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span>Yangi kelgan mahsulotlar</span>
                  </Link>

                  <Link
                    href={`/${lang}/catalog?${new URLSearchParams({
                      ...searchParams,
                      isBestseller: searchParams.isBestseller === 'true' ? 'false' : 'true',
                    }).toString()}`}
                    className="flex items-center gap-2 cursor-pointer hover:text-gray-900"
                  >
                    <input
                      type="checkbox"
                      checked={searchParams.isBestseller === 'true'}
                      readOnly
                      className="rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span>Eng ko‘p sotilgan (Top)</span>
                  </Link>
                </div>
              </div>

            </div>
          </aside>

          {/* Right Product Grid */}
          <main className="lg:col-span-3">
            {products.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto text-gray-400">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Mahsulotlar topilmadi</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Siz tanlagan mezonlarga mos mahsulotlar topilmadi. Qidiruv so‘zini yoki filtrlarni o‘zgartirib ko‘ring.
                </p>
                <Link
                  href={`/${lang}/catalog`}
                  className="inline-block px-4 py-2 bg-brand-red text-white text-xs font-bold rounded-lg shadow-xs hover:bg-brand-red-dark transition-colors"
                >
                  Filtrlarni tozalash
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} lang={lang} />
                ))}
              </div>
            )}
          </main>
        </div>
      </Container>
    </div>
  );
}
