import React from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getDictionary, Locale } from '@/lib/i18n';
import { getProductsServer } from '@/lib/services/productService';
import { ProductCard } from '@/components/product/ProductCard';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { EmptyState } from '@/components/ui/EmptyState';
import { Search } from 'lucide-react';

interface SearchPageProps {
    params: { lang: Locale };
    searchParams: { q?: string; category?: string; sort?: string; page?: string };
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
    const query = searchParams.q || '';
    return {
        title: query ? `Qidiruv: "${query}" | SPS` : 'Qidiruv | SPS',
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
    const page = parseInt(searchParams.page || '1', 10) || 1;

    const data = query
        ? await getProductsServer({
            locale: lang,
            search: query,
            categorySlug,
            sort: searchParams.sort,
            page,
            pageSize: 24,
        })
        : { products: [], total: 0, totalPages: 0 };

    const products = data.products;
    const total = data.total;

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
                <Breadcrumbs
                    lang={lang}
                    items={[
                        { label: lang === 'ru' ? 'Поиск' : 'Qidiruv', active: true },
                    ]}
                    className="mb-4"
                />

                <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-brand-red shrink-0">
                            <Search className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                {query ? `Qidiruv: "${query}"` : lang === 'ru' ? 'Поиск товаров' : 'Mahsulot qidirish'}
                            </h1>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {query ? `${total} ta mahsulot topildi` : lang === 'ru' ? 'Введите запрос' : 'Kalit so‘z kiriting'}
                            </p>
                        </div>
                    </div>
                </div>

                {products.length === 0 ? (
                    <EmptyState lang={lang} type="search" query={query} />
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} lang={lang} />
                        ))}
                    </div>
                )}
            </Container>
        </div>
    );
}
