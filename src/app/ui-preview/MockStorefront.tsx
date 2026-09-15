'use client';

import React, { useState } from 'react';
import { HeaderClient, CategoryTreeItem } from '@/components/layout/HeaderClient';
import { Footer } from '@/components/layout/Footer';
import { StickyMobileContact } from '@/components/layout/StickyMobileContact';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { DeferredWidgets } from '@/components/layout/DeferredWidgets';
import { ProductCard, ProductCardData } from '@/components/product/ProductCard';
import { ProductDetailClient } from '@/app/[lang]/product/[slug]/ProductDetailClient';
import { Container } from '@/components/ui/Container';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useCartStore } from '@/lib/store/cartStore';
import { Locale } from '@/lib/i18n';

const categories: CategoryTreeItem[] = [
  {
    id: 'c1',
    parentId: null,
    image: '/catalog/catalog-001.jpg',
    translations: [
      { locale: 'uz', name: 'Bruschatka qoliplari', slug: 'bruschatka-qoliplari' },
      { locale: 'ru', name: 'Формы для брусчатки', slug: 'bruschatka-qoliplari' },
    ],
    children: [
      {
        id: 'c1-1',
        parentId: 'c1',
        image: null,
        translations: [
          { locale: 'uz', name: '30x30 “8 kirpich”', slug: 'bruschatka-30x30' },
          { locale: 'ru', name: '30x30 «8 кирпичей»', slug: 'bruschatka-30x30' },
        ],
      },
      {
        id: 'c1-2',
        parentId: 'c1',
        image: null,
        translations: [
          { locale: 'uz', name: '40x40 plitka', slug: 'bruschatka-40x40' },
          { locale: 'ru', name: '40x40 плитка', slug: 'bruschatka-40x40' },
        ],
      },
    ],
  },
  {
    id: 'c2',
    parentId: null,
    image: '/catalog/catalog-014.jpg',
    translations: [
      { locale: 'uz', name: 'Fasad dekor', slug: 'fasad-dekor' },
      { locale: 'ru', name: 'Фасадный декор', slug: 'fasad-dekor' },
    ],
    children: [],
  },
  {
    id: 'c3',
    parentId: null,
    image: '/catalog/catalog-022.jpg',
    translations: [
      { locale: 'uz', name: 'Bordyur qoliplari', slug: 'bordyur-qoliplari' },
      { locale: 'ru', name: 'Формы для бордюра', slug: 'bordyur-qoliplari' },
    ],
    children: [],
  },
  {
    id: 'c4',
    parentId: null,
    image: '/catalog/catalog-031.jpg',
    translations: [
      { locale: 'uz', name: 'Trotuar plitka', slug: 'plitka-qoliplari' },
      { locale: 'ru', name: 'Тротуарная плитка', slug: 'plitka-qoliplari' },
    ],
    children: [],
  },
];

function makeProduct(index: number, overrides: Partial<ProductCardData> = {}): ProductCardData {
  const img = `/catalog/catalog-${String(index).padStart(3, '0')}.jpg`;
  return {
    id: `p${index}`,
    slug: `bruschatka-qolipi-${index}`,
    sku: `SPS-${1000 + index}`,
    titleUz: `Bruschatka qolipi 30x30 “8 kirpich” №${index}`,
    titleRu: `Форма для брусчатки 30x30 «8 кирпичей» №${index}`,
    price: 185000 + index * 7000,
    oldPrice: index % 3 === 0 ? 225000 + index * 7000 : null,
    dimensions: '30x30x6 sm',
    inStock: index % 5 !== 0,
    isNew: index % 4 === 0,
    isBestseller: index % 3 === 1,
    images: [
      { url: img, altText: 'Qolip', type: 'MOLD' },
      { url: `/catalog/catalog-${String(index + 1).padStart(3, '0')}.jpg`, altText: 'Natija', type: 'FINISHED_RESULT' },
    ],
    ...overrides,
  };
}

const demoProducts: ProductCardData[] = [
  makeProduct(1),
  makeProduct(2, { price: 0 }), // price on request -> B2B path
  makeProduct(3, { hasVariants: true }),
  makeProduct(6, { oldPrice: null, inStock: false }),
];

const detailProduct = {
  id: 'detail-1',
  sku: 'SPS-2001',
  slug: 'bruschatka-qolipi-detail',
  titleUz: 'Bruschatka qolipi 30x30 “8 kirpich” — plastik qolip',
  titleRu: 'Форма для брусчатки 30x30 «8 кирпичей»',
  descriptionUz:
    'Chidamli polipropilendan tayyorlangan, 300+ martagacha quyishga mo‘ljallangan professional qolip. Bitta quyishda 8 dona bruschatka chiqadi.',
  descriptionRu: 'Профессиональная форма из прочного полипропилена, ресурс 300+ заливок.',
  price: 189000,
  oldPrice: 235000,
  inStock: true,
  isBestseller: true,
  isNew: false,
  yieldPerCast: 8,
  durabilityCasts: 300,
  dimensions: '30x30x6 sm',
  material: 'Polipropilen',
  weight: '1.4 kg',
  images: [
    { url: '/catalog/catalog-003.jpg', altText: 'Qolip' },
    { url: '/catalog/catalog-004.jpg', altText: 'Qolip yon tomondan' },
    { url: '/catalog/catalog-005.jpg', altText: 'Natija' },
  ],
  moldImage: '/catalog/catalog-003.jpg',
  resultImage: '/catalog/catalog-006.jpg',
  videoUrl: null,
  category: 'bruschatka-qoliplari',
};

export const MockStorefront: React.FC = () => {
  const [lang, setLang] = useState<Locale>('uz');
  const addItem = useCartStore((s) => s.addItem);

  const seedCart = () => {
    demoProducts.slice(0, 3).forEach((p, i) => {
      addItem({
        productId: p.id,
        title: lang === 'ru' ? p.titleRu : p.titleUz,
        sku: p.sku,
        price: p.price || 189000,
        image: p.images[0]?.url || '',
        quantity: i + 1,
        dimensions: p.dimensions || undefined,
      });
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-dark text-white font-sans antialiased selection:bg-brand-red selection:text-white">
      <HeaderClient lang={lang} categories={categories} />
      <CartDrawer lang={lang} />

      <main className="flex-1 pb-24 lg:pb-0 bg-[#F8F9FA] text-gray-900">
        <div className="bg-white border-b border-gray-200">
          <Container>
            <div className="py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-lg font-bold text-gray-900">UI optimizatsiya — preview</h1>
                <p className="text-sm text-gray-500">
                  Real komponentlar, mock ma’lumot bilan. Baza (DB) ulanmagan muhitda UX/UI tekshirish uchun.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setLang(lang === 'uz' ? 'ru' : 'uz')}
                  className="px-3 py-2 rounded-xl border border-gray-300 text-sm font-semibold hover:bg-gray-50"
                >
                  Til: {lang.toUpperCase()}
                </button>
                <button
                  onClick={seedCart}
                  className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-black"
                >
                  Savatga 3 mahsulot qo‘shish
                </button>
              </div>
            </div>
          </Container>
        </div>

        <section className="py-6">
          <Container>
            <SectionHeader
              title="ProductCard — katalog / bosh sahifa"
              subtitle="Hover (pointer) yoki doimiy ko‘rinadigan (touch) amallar, lazy modal, hover rasm faqat hover’da yuklanadi"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {demoProducts.map((p) => (
                <ProductCard key={p.id} product={p} lang={lang} />
              ))}
            </div>
          </Container>
        </section>

        <section className="py-6">
          <Container>
            <SectionHeader
              title="Mahsulot sahifasi — sticky ATC, gallery, kalkulyator"
              subtitle="Rasm o‘lchamlari (sizes) tuzatildi, sticky bar endi header bilan to‘qnashmaydi"
            />
            <ProductDetailClient product={detailProduct} lang={lang} />
          </Container>
        </section>
      </main>

      <StickyMobileContact lang={lang} />
      <Footer lang={lang} />
      <DeferredWidgets lang={lang} />
    </div>
  );
};
