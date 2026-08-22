import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { getProductsServer } from '@/lib/services/productService';
import { ProductCard } from '@/components/product/ProductCard';
import { Container } from '@/components/ui/Container';
import { Search, Layers, ChevronRight } from 'lucide-react';

interface SearchPageProps {
    params: { lang: Locale };
    searchParams: { q?: string; category?: string; sort?: string };
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
    const query = searchParams.q || '';
    return {
        title: query ? `Qidiruv: "${query}" | SPS PLAST` : 'Qidiruv | SPS PLAST',
        robots: {
            index: false,
            follow: true,
        },
    };
}

export default async function SearchPage({
    params: { lang },
    searchParams,
}: SearchPageProps) {
    const dict = getDictionary(lang);
    const query = searchParams.q?.trim() || '';
    const categorySlug = searchParams.category?.trim();

    const products = query
        ? await getProductsServer({
            locale: lang,
            search: query,
            categorySlug,
            sort: searchParams.sort,
        })
        : [];

    const rawCategories = await db.category.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { sortOrder: 'asc' },
        take: 6,
        include: {
            translations: { where: { locale: lang } },
        },
    });

    return (
        <div className="bg-[#F8F9FA] min-h-screen py-8 text-gray-900">
            <Container>
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 font-medium">
                    <Link href={`/${lang}`} className="hover:text-brand-red transition-colors">
                        {dict.nav.home}
                    </Link>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-900 font-semibold">Qidiruv</span>
                </nav>

                {/* Header Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-brand-red shrink-0">
                            <Search className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                                {query ? `Qidiruv natijalari: "${query}"` : 'Mahsulot qidirish'}
                            </h1>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {query
                                    ? `Topilgan mahsulotlar: ${products.length} dona`
                                    : 'Qidiruv kalit so‘zini kiriting'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Grid or Empty State */}
                {products.length === 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl p-10 sm:p-12 text-center space-y-4 shadow-xs">
                        <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto text-gray-400">
                            <Layers className="w-7 h-7 text-brand-red" />
                        </div>

                        <div className="space-y-1 max-w-md mx-auto">
                            <h3 className="text-base font-bold text-gray-900">
                                {query ? `"${query}" bo‘yicha hech narsa topilmadi` : 'Qidiruv so‘zini kiriting'}
                            </h3>
                            <p className="text-xs text-gray-500">
                                Mahsulot nomi, SKU kodi yoki o‘lchamlarini tekshirib ko‘ring yoki ommabop kategoriyalardan birini tanlang.
                            </p>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                                Ommabop kategoriyalar
                            </h4>
                            <div className="flex flex-wrap justify-center gap-2">
                                {rawCategories.map((c) => {
                                    const name = c.translations[0]?.name || c.id;
                                    const slug = c.translations[0]?.slug || c.id;
                                    return (
                                        <Link
                                            key={c.id}
                                            href={`/${lang}/catalog?category=${slug}`}
                                            className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-white border border-gray-200 text-xs font-medium text-gray-700 hover:text-brand-red transition-colors"
                                        >
                                            {name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} lang={lang} />
                        ))}
                    </div>
                )}
            </Container>
        </div>
    );
}
