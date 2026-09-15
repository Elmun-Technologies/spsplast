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
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Price } from '@/components/ui/Price';
import { StockBadge } from '@/components/ui/StockBadge';
import { CategoryCard } from '@/components/product/CategoryCard';

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
    <div className="min-h-screen flex flex-col bg-surface-page text-ink font-sans antialiased selection:bg-brand-red selection:text-white">
      <HeaderClient lang={lang} categories={categories} />
      <CartDrawer lang={lang} />

      <main className="flex-1 pb-24 lg:pb-0 bg-surface-page text-ink">
        <div className="bg-surface border-b border-line">
          <Container>
            <div className="py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-[22px] font-bold text-ink tracking-[-0.02em]">Dizayn tizimi — preview</h1>
                <p className="text-sm text-ink-sub">
                  Real komponentlar, mock ma’lumot bilan. Baza (DB) ulanmagan muhitda UX/UI tekshirish uchun.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setLang(lang === 'uz' ? 'ru' : 'uz')}
                  className="px-4 py-2.5 rounded-full bg-surface-soft text-sm font-semibold text-ink-soft hover:text-ink transition-colors min-h-[44px]"
                >
                  Til: {lang.toUpperCase()}
                </button>
                <button
                  onClick={seedCart}
                  className="px-4 py-2.5 rounded-full bg-ink text-white text-sm font-semibold hover:bg-black transition-colors min-h-[44px]"
                >
                  Savatga 3 mahsulot qo‘shish
                </button>
              </div>
            </div>
          </Container>
        </div>

        <section className="py-8">
          <Container>
            <SectionHeader
              title="ProductCard — katalog / bosh sahifa"
              subtitle="Hover (pointer) yoki doimiy ko‘rinadigan (touch) amallar, lazy modal, hover rasm faqat hover’da yuklanadi"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {demoProducts.map((p) => (
                <ProductCard key={p.id} product={p} lang={lang} />
              ))}
            </div>
          </Container>
        </section>

        <section className="py-8">
          <Container>
            <SectionHeader
              title="Mahsulot sahifasi — sticky ATC, gallery, kalkulyator"
              subtitle="Rasm o‘lchamlari (sizes) tuzatildi, sticky bar endi header bilan to‘qnashmaydi"
            />
            <ProductDetailClient product={detailProduct} lang={lang} />
          </Container>
        </section>

        <section className="py-8">
          <Container>
            <SectionHeader
              title="Dizayn tizimi — asosiy elementlar"
              subtitle="Oq kartalar, yumshoq soyalar, pill tugmalar va katta radiuslar (yangi tokenlar)"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mb-5">
              <div className="bg-surface rounded-[20px] p-6 shadow-card">
                <p className="text-[12px] font-semibold text-ink-sub mb-3">Ranglar</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['brand-red', 'bg-brand-red'],
                    ['ink', 'bg-ink'],
                    ['ink-soft', 'bg-ink-soft'],
                    ['ink-sub', 'bg-ink-sub'],
                    ['surface-soft', 'bg-surface-soft border border-line'],
                    ['line', 'bg-line'],
                  ].map(([label, cls]) => (
                    <span key={label} className="flex items-center gap-2 text-[12px] text-ink-soft">
                      <span className={`w-5 h-5 rounded-full ${cls}`} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-surface rounded-[20px] p-6 shadow-card">
                <p className="text-[12px] font-semibold text-ink-sub mb-3">Tugmalar</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm">Savatga</Button>
                  <Button variant="secondary" size="sm">Batafsil</Button>
                  <Button variant="outline" size="sm">Taqqoslash</Button>
                  <Button variant="ghost" size="sm">Bekor qilish</Button>
                </div>
              </div>

              <div className="bg-surface rounded-[20px] p-6 shadow-card">
                <p className="text-[12px] font-semibold text-ink-sub mb-3">Nishonlar</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>-20%</Badge>
                  <Badge variant="redSoft">Aksiya</Badge>
                  <Badge variant="greenSoft">Yangi</Badge>
                  <Badge variant="gray">Top</Badge>
                  <StockBadge inStock lang={lang} />
                  <StockBadge inStock={false} lang={lang} />
                </div>
                <div className="mt-4">
                  <Price price={189000} oldPrice={236000} lang={lang} size="md" showDiscountBadge />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {categories.slice(0, 3).map((c) => (
                <CategoryCard
                  key={c.id}
                  lang={lang}
                  category={{
                    id: c.id,
                    slug: c.translations[0].slug,
                    nameUz: c.translations[0].name,
                    nameRu: c.translations[1]?.name || c.translations[0].name,
                    image: c.image,
                    _count: { products: c.children?.length ? c.children.length * 4 : 6 },
                  }}
                />
              ))}
              <div className="bg-surface rounded-[20px] p-5 shadow-lift col-span-1 sm:col-span-3 flex items-center gap-3">
                <span className="text-[12px] font-semibold text-ink-sub">shadow-lift — hover holati</span>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <StickyMobileContact lang={lang} />
      <Footer lang={lang} />
      <DeferredWidgets lang={lang} />
    </div>
  );
};
