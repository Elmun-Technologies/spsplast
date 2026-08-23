'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X, ChevronDown, Grid, List, Search } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

interface CatalogClientProps {
  lang: Locale;
  products: any[];
  categories: { id: string; slug: string; name: string }[];
  selectedCategory?: { slug: string; name: string };
  total: number;
  totalPages: number;
  currentPage: number;
  searchParams: Record<string, string | undefined>;
}

const SORT_OPTIONS = [
  { value: '', labelUz: 'Tartiblash', labelRu: 'Сортировка' },
  { value: 'newest', labelUz: 'Yangi → Eski', labelRu: 'Сначала новые' },
  { value: 'price-asc', labelUz: 'Arzon → Qimmat', labelRu: 'Цена: по возрастанию' },
  { value: 'price-desc', labelUz: 'Qimmat → Arzon', labelRu: 'Цена: по убыванию' },
  { value: 'bestseller', labelUz: 'Ommabop', labelRu: 'Популярные' },
];

export const CatalogClient: React.FC<CatalogClientProps> = ({
  lang,
  products,
  categories,
  selectedCategory,
  total,
  totalPages,
  currentPage,
  searchParams,
}) => {
  const router = useRouter();
  const sp = useSearchParams();
  const [priceMin, setPriceMin] = useState(searchParams.minPrice || '');
  const [priceMax, setPriceMax] = useState(searchParams.maxPrice || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (products.length > 0) {
      trackEvent('view_item_list', {
        item_list_name: selectedCategory?.name || 'catalog',
        item_list_id: selectedCategory?.slug || 'all',
        items: products.slice(0, 10).map((p: any) => ({ item_id: p.id, item_name: p.titleUz || p.titleRu })),
      });
    }
  }, [products, selectedCategory]);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(sp.toString());
    if (value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    if (key !== 'page') params.delete('page');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handlePriceFilter = () => {
    const params = new URLSearchParams(sp.toString());
    if (priceMin) params.set('minPrice', priceMin);
    else params.delete('minPrice');
    if (priceMax) params.set('maxPrice', priceMax);
    else params.delete('maxPrice');
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  const breadcrumbs = [
    { label: lang === 'ru' ? 'Каталог' : 'Katalog', href: `/${lang}/catalog`, active: !selectedCategory },
    ...(selectedCategory ? [{ label: selectedCategory.name, active: true }] : []),
  ];

  return (
    <div className="bg-[#F8F9FA] min-h-screen py-6 text-gray-900">
      <Container>
        <Breadcrumbs lang={lang} items={breadcrumbs} className="mb-4" />

        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {selectedCategory ? selectedCategory.name : lang === 'ru' ? 'Каталог товаров' : 'Mahsulotlar katalogi'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {lang === 'ru' ? 'Найдено' : 'Topildi'}: <span className="text-gray-900 font-bold">{total}</span> {lang === 'ru' ? 'товаров' : 'ta mahsulot'} • {totalPages} {lang === 'ru' ? 'стр.' : 'sahifa'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sort */}
            <div className="relative">
              <select
                value={searchParams.sort || ''}
                onChange={(e) => updateParam('sort', e.target.value || null)}
                className="appearance-none bg-[#F8F9FA] border border-gray-300 rounded-xl pl-4 pr-9 py-2.5 text-sm font-medium text-gray-900 focus:outline-none focus:border-brand-red focus:bg-white min-h-[44px]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {lang === 'ru' ? opt.labelRu : opt.labelUz}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>

            {/* View toggle */}
            <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 ${viewMode === 'grid' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                aria-label="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 ${viewMode === 'list' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Active filters */}
            <div className="flex flex-wrap items-center gap-2">
              {searchParams.search && (
                <Badge variant="red" className="gap-1 normal-case font-medium text-xs py-1.5 px-3 rounded-full">
                  <Search className="w-3 h-3" />
                  "{searchParams.search}"
                  <button onClick={() => updateParam('search', null)} className="ml-1 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="dark" className="gap-1 normal-case font-medium text-xs py-1.5 px-3 rounded-full">
                  {selectedCategory.name}
                  <button onClick={() => updateParam('category', null)} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {(searchParams.inStock === 'true' || searchParams.minPrice || searchParams.maxPrice) && (
                <Link href={`/${lang}/catalog`} className="text-xs font-semibold text-brand-red hover:underline px-2">
                  {lang === 'ru' ? 'Сбросить фильтры' : 'Filtrlarni tozalash'}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-6 shadow-sm lg:sticky lg:top-24">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <SlidersHorizontal className="w-5 h-5 text-brand-red" />
                  <span>{lang === 'ru' ? 'Фильтры' : 'Filtrlar'}</span>
                </div>
                <Link href={`/${lang}/catalog`} className="text-xs font-semibold text-gray-500 hover:text-brand-red">
                  {lang === 'ru' ? 'Сбросить' : 'Tozalash'}
                </Link>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{lang === 'ru' ? 'Категории' : 'Kategoriyalar'}</h4>
                <ul className="space-y-1">
                  <li>
                    <button
                      onClick={() => updateParam('category', null)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${!searchParams.category ? 'bg-brand-red text-white shadow-red' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      {lang === 'ru' ? 'Все' : 'Barchasi'}
                    </button>
                  </li>
                  {categories.map((cat) => {
                    const isSelected = searchParams.category === cat.slug;
                    return (
                      <li key={cat.id}>
                        <button
                          onClick={() => updateParam('category', cat.slug)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isSelected ? 'bg-brand-red text-white shadow-red' : 'text-gray-700 hover:bg-gray-100'}`}
                        >
                          {cat.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Price */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{lang === 'ru' ? 'Цена (UZS)' : 'Narx (UZS)'}</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-brand-red focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:border-brand-red focus:outline-none"
                  />
                </div>
                <button onClick={handlePriceFilter} className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors">
                  {lang === 'ru' ? 'Применить' : 'Qo‘llash'}
                </button>
              </div>

              {/* Material */}
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">{lang === 'ru' ? 'Материал' : 'Material'}</h4>
                <div className="space-y-1.5">
                  {[
                    { value: '', label: lang === 'ru' ? 'Все' : 'Barchasi' },
                    { value: 'ABS', label: 'ABS Plastik' },
                    { value: 'polipropilen', label: 'Polipropilen' },
                    { value: 'silikon', label: 'Silikon' },
                  ].map((mat) => (
                    <button
                      key={mat.value}
                      onClick={() => updateParam('material', mat.value || null)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${searchParams.material === mat.value || (!searchParams.material && mat.value === '') ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      {mat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</h4>
                <div className="space-y-2.5">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={searchParams.inStock === 'true'}
                      onChange={() => updateParam('inStock', searchParams.inStock === 'true' ? null : 'true')}
                      className="w-4 h-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{lang === 'ru' ? 'Только в наличии' : 'Faqat omborda'}</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={searchParams.isNew === 'true'}
                      onChange={() => updateParam('isNew', searchParams.isNew === 'true' ? null : 'true')}
                      className="w-4 h-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{lang === 'ru' ? 'Новинки' : 'Yangi mahsulotlar'}</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={searchParams.isBestseller === 'true'}
                      onChange={() => updateParam('isBestseller', searchParams.isBestseller === 'true' ? null : 'true')}
                      className="w-4 h-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{lang === 'ru' ? 'Хиты' : 'Top mahsulotlar'}</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          {/* Products */}
          <main className="lg:col-span-3 space-y-6">
            {products.length === 0 ? (
              <EmptyState lang={lang} type="catalog" />
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'grid grid-cols-1 gap-3'}>
                  {products.map((product: any) => (
                    <ProductCard key={product.id} product={product} lang={lang} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-6">
                    <button
                      disabled={currentPage <= 1}
                      onClick={() => updateParam('page', String(currentPage - 1))}
                      className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      ← {lang === 'ru' ? 'Назад' : 'Oldingi'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;

                        return (
                          <button
                            key={pageNum}
                            onClick={() => updateParam('page', String(pageNum))}
                            className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${currentPage === pageNum ? 'bg-brand-red text-white shadow-red' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      disabled={currentPage >= totalPages}
                      onClick={() => updateParam('page', String(currentPage + 1))}
                      className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      {lang === 'ru' ? 'Вперед' : 'Keyingi'} →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </Container>
    </div>
  );
};
