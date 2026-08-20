import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { getProductsServer } from '@/lib/services/productService';
import { ProductCard } from '@/components/product/ProductCard';
import { Search, Layers } from 'lucide-react';

interface SearchPageProps {
    params: { lang: Locale };
    searchParams: { q?: string; sort?: string };
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

    const products = query
        ? await getProductsServer({
            locale: lang,
            search: query,
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-gray-400">
                <Link href={`/${lang}`} className="hover:text-white">
                    {dict.nav.home}
                </Link>
                <span>/</span>
                <span className="text-white font-medium">Qidiruv</span>
            </div>

            {/* Header */}
            <div className="border-b border-brand-border pb-6 space-y-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-brand-red/10 border border-brand-red/30 text-brand-red">
                        <Search className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white">
                            {query ? `Qidiruv natijalari: "${query}"` : 'Mahsulot qidirish'}
                        </h1>
                        <p className="text-xs text-gray-400">
                            {query
                                ? `Topilgan mahsulotlar: ${products.length} dona`
                                : 'Qidiruv so‘zini kiriting'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Grid or Empty State */}
            {products.length === 0 ? (
                <div className="bg-brand-card border border-brand-border rounded-3xl p-12 text-center space-y-6">
                    <div className="w-16 h-16 rounded-full bg-brand-dark border border-brand-border flex items-center justify-center mx-auto text-gray-400">
                        <Layers className="w-8 h-8 text-brand-red" />
                    </div>

                    <div className="space-y-2 max-w-md mx-auto">
                        <h3 className="text-lg font-bold text-white">
                            {query ? `"${query}" bo‘yicha hech narsa topilmadi` : 'Qidiruv kalit so‘zini kiriting'}
                        </h3>
                        <p className="text-xs text-gray-400">
                            Mahsulot nomi, SKU kodi yoki o‘lchamlarini tekshirib ko‘ring yoki ommabop kategoriyalardan tanlang.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-brand-border/60">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
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
                                        className="px-4 py-2 rounded-xl bg-brand-dark border border-brand-border text-xs font-medium text-gray-300 hover:border-brand-red hover:text-white transition-colors"
                                    >
                                        {name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} lang={lang} />
                    ))}
                </div>
            )}
        </div>
    );
}
