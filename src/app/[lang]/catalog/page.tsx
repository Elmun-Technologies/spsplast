import React from 'react';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { ProductCard } from '@/components/product/ProductCard';
import Link from 'next/link';
import { SlidersHorizontal, Search, Layers, X } from 'lucide-react';

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

  // Build Prisma filter query
  const where: any = {};

  if (searchParams.category) {
    const cat = await db.category.findUnique({
      where: { slug: searchParams.category },
    });
    if (cat) {
      where.categoryId = cat.id;
    }
  }

  if (searchParams.search) {
    const q = searchParams.search.trim();
    where.OR = [
      { titleUz: { contains: q } },
      { titleRu: { contains: q } },
      { sku: { contains: q } },
      { descriptionUz: { contains: q } },
    ];
  }

  if (searchParams.inStock === 'true') {
    where.inStock = true;
  }

  if (searchParams.isNew === 'true') {
    where.isNew = true;
  }

  if (searchParams.isBestseller === 'true') {
    where.isBestseller = true;
  }

  let orderBy: any = { createdAt: 'desc' };
  if (searchParams.sort === 'price-asc') orderBy = { price: 'asc' };
  if (searchParams.sort === 'price-desc') orderBy = { price: 'desc' };

  const categories = await db.category.findMany({ orderBy: { sortOrder: 'asc' } });

  const products = await db.product.findMany({
    where,
    include: { images: true },
    orderBy,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-6">
        <Link href={`/${lang}`} className="hover:text-white">
          {dict.nav.home}
        </Link>
        <span>/</span>
        <span className="text-white font-medium">{dict.nav.catalog}</span>
      </div>

      {/* Catalog Title & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-brand-border">
        <div>
          <h1 className="text-3xl font-black text-white">{dict.nav.catalog}</h1>
          <p className="text-xs text-gray-400 mt-1">
            Topilgan mahsulotlar soni: <span className="text-brand-red font-bold">{products.length}</span> dona
          </p>
        </div>

        {/* Search Query Indicator */}
        {searchParams.search && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-card border border-brand-red text-xs text-white">
            <Search className="w-3.5 h-3.5 text-brand-red" />
            <span>Qidiruv: "{searchParams.search}"</span>
            <Link href={`/${lang}/catalog`} className="p-0.5 hover:text-brand-red">
              <X className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar Filter */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-6">
            <div className="flex items-center gap-2 font-bold text-white text-base pb-3 border-b border-brand-border">
              <SlidersHorizontal className="w-4 h-4 text-brand-red" />
              <span>Filtrlash</span>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">
                Kategoriyalar
              </h4>
              <ul className="space-y-1 text-xs">
                <li>
                  <Link
                    href={`/${lang}/catalog`}
                    className={`block px-3 py-2 rounded-lg font-medium transition-colors ${
                      !searchParams.category
                        ? 'bg-brand-red text-white font-bold'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    Barcha kategoriyalar
                  </Link>
                </li>
                {categories.map((cat) => {
                  const isSelected = searchParams.category === cat.slug;
                  return (
                    <li key={cat.id}>
                      <Link
                        href={`/${lang}/catalog?category=${cat.slug}`}
                        className={`block px-3 py-2 rounded-lg font-medium transition-colors ${
                          isSelected
                            ? 'bg-brand-red text-white font-bold'
                            : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        {lang === 'ru' ? cat.nameRu : cat.nameUz}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Quick Status Checkboxes */}
            <div className="space-y-2 pt-4 border-t border-brand-border">
              <h4 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">
                Status bo‘yicha
              </h4>

              <div className="space-y-2 text-xs text-gray-300 font-medium">
                <Link
                  href={`/${lang}/catalog?inStock=${searchParams.inStock === 'true' ? 'false' : 'true'}`}
                  className="flex items-center gap-2 cursor-pointer hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={searchParams.inStock === 'true'}
                    readOnly
                    className="rounded border-brand-border bg-brand-dark text-brand-red focus:ring-brand-red"
                  />
                  <span>Faqat mavjud mahsulotlar</span>
                </Link>

                <Link
                  href={`/${lang}/catalog?isNew=${searchParams.isNew === 'true' ? 'false' : 'true'}`}
                  className="flex items-center gap-2 cursor-pointer hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={searchParams.isNew === 'true'}
                    readOnly
                    className="rounded border-brand-border bg-brand-dark text-brand-red focus:ring-brand-red"
                  />
                  <span>Yangi kelganlar (New)</span>
                </Link>

                <Link
                  href={`/${lang}/catalog?isBestseller=${searchParams.isBestseller === 'true' ? 'false' : 'true'}`}
                  className="flex items-center gap-2 cursor-pointer hover:text-white"
                >
                  <input
                    type="checkbox"
                    checked={searchParams.isBestseller === 'true'}
                    readOnly
                    className="rounded border-brand-border bg-brand-dark text-brand-red focus:ring-brand-red"
                  />
                  <span>Bestsellerlar</span>
                </Link>
              </div>
            </div>

            {/* Reset Filters */}
            <div className="pt-2">
              <Link
                href={`/${lang}/catalog`}
                className="block text-center text-xs text-gray-400 hover:text-brand-red underline font-medium"
              >
                Filtrlarni tozalash
              </Link>
            </div>

          </div>
        </aside>

        {/* Right Product Grid */}
        <main className="lg:col-span-3">
          {products.length === 0 ? (
            <div className="bg-brand-card border border-brand-border rounded-2xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-brand-dark border border-brand-border flex items-center justify-center mx-auto text-gray-500">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Mahsulot topilmadi</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Siz kiritgan filtrlarga mos mahsulotlar topilmadi. Qidiruv so‘zini o‘zgartirib ko‘ring.
              </p>
              <Link
                href={`/${lang}/catalog`}
                className="inline-block px-4 py-2 bg-brand-red text-white text-xs font-bold rounded-lg"
              >
                Barcha mahsulotlarni ko‘rish
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} lang={lang} />
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
