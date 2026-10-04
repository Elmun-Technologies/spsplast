import React from 'react';
import { notFound } from 'next/navigation';
import { ProductCard, ProductCardData } from '@/components/product/ProductCard';
import catalog2026 from '../../../data/molds-2026.json';

export const metadata = {
  title: 'Yangi katalog 2026 — kontent ko‘rigi | SPS',
  robots: { index: false, follow: false },
};

type Catalog = typeof catalog2026;
type CatalogProduct = Catalog['products'][number];

const CATEGORY_LABELS: Record<string, { uz: string; ru: string }> = {
  'devor-panel': { uz: 'Devor va to‘siq panellari qoliplari', ru: 'Формы стеновых и заборных панелей' },
  fasad: { uz: 'Fasad dekor qoliplari', ru: 'Формы фасадного декора' },
  bruschatka: { uz: 'Bruschatka qoliplari', ru: 'Формы для брусчатки' },
  plitka: { uz: 'Trotuar plitka qoliplari', ru: 'Формы для тротуарной плитки' },
  bordyur: { uz: 'Bordyur qoliplari', ru: 'Формы для бордюров' },
  termopanel: { uz: 'Fasad termopanellari', ru: 'Фасадные термопанели' },
};

const TEXTURE_LABELS: Record<string, string> = {
  stone: 'Tosh',
  brick: 'G‘isht',
  smooth: 'Silliq',
  '3d': '3D relef',
  faceted: 'Qirrali',
  gloss: 'Yaltiroq',
};

function toCardData(product: CatalogProduct): ProductCardData {
  return {
    id: product.sku,
    slug: product.slugUz,
    sku: product.sku,
    titleUz: product.nameUz,
    titleRu: product.nameRu,
    price: product.price,
    dimensions: product.dimensionsConfirmed ? product.dimensions : `${product.dimensions}*`,
    inStock: true,
    isNew: product.isNew,
    hasVariants: (product.options?.length || 0) > 0,
    images: [{ url: product.image, altText: product.nameUz }],
  };
}

/**
 * Content review page for the 2026 studio series (white-background photos).
 *
 * It renders the real `ProductCard` with the data that `prisma/seed.js` writes
 * to the database, so the catalogue can be proof-read (names, sizes, options,
 * photos) before seeding — and without a database connection.
 * Development only, exactly like `/ui-preview`.
 */
export default function CatalogPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  const products = catalog2026.products as CatalogProduct[];
  const axes = catalog2026.optionAxes as Record<
    string,
    { nameUz: string; nameRu: string; values: Array<{ code: string; labelUz: string; labelRu: string; noteUz: string; noteRu: string }> }
  >;

  const byCategory = new Map<string, CatalogProduct[]>();
  for (const product of products) {
    const list = byCategory.get(product.category) || [];
    list.push(product);
    byCategory.set(product.category, list);
  }

  const unconfirmed = products.filter((p) => !p.dimensionsConfirmed).length;

  return (
    <div className="min-h-screen bg-surface-page text-ink font-sans antialiased">
      <header className="border-b border-line bg-surface">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF0F0] text-brand-red text-xs font-bold uppercase tracking-wider">
            Kontent ko‘rigi · faqat dev
          </div>
          <h1 className="text-[28px] sm:text-[36px] font-bold tracking-[-0.03em] leading-tight">
            Yangi katalog — 2026 studiya seriyasi
          </h1>
          <p className="text-ink-soft max-w-3xl text-sm sm:text-base leading-relaxed">
            2026-09-27 kuni yuklangan oq fondagi studiya suratlaridan tayyorlangan{' '}
            <strong>{products.length} ta mahsulot kartasi</strong>. Ma‘lumot manbai —{' '}
            <code className="px-1.5 py-0.5 rounded bg-surface-soft text-[13px]">prisma/data/molds-2026.json</code>,
            xuddi shu ma‘lumot <code className="px-1.5 py-0.5 rounded bg-surface-soft text-[13px]">npm run db:seed</code>{' '}
            orqali bazaga yoziladi.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1.5 rounded-full bg-surface-soft border border-line">
              {byCategory.size} ta kategoriya
            </span>
            <span className="px-3 py-1.5 rounded-full bg-surface-soft border border-line">
              Har bir mahsulotda {Object.keys(axes).length} ta opsiya o‘qi ·{' '}
              {Object.values(axes).reduce((n, axis) => n * axis.values.length, 1)} ta variant
            </span>
            <span className="px-3 py-1.5 rounded-full bg-surface-soft border border-line">
              Narx: 0 → «Narx so‘rash»
            </span>
            {unconfirmed > 0 && (
              <span className="px-3 py-1.5 rounded-full bg-[#FEF0F0] text-brand-red font-semibold">
                {unconfirmed} ta o‘lcham tasdiqlanishi kerak (*)
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-10 space-y-14">
        <section className="rounded-[20px] border border-line bg-surface p-6">
          <h2 className="text-lg font-bold mb-4">Har bir kartadagi opsiyalar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(axes).map(([code, axis]) => (
              <div key={code} className="rounded-[16px] bg-surface-soft p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-ink-sub mb-2">
                  {axis.nameUz} · {axis.nameRu}
                </div>
                <ul className="space-y-1.5">
                  {axis.values.map((value) => (
                    <li key={value.code} className="text-sm">
                      <span className="font-semibold">{value.labelUz}</span>
                      <span className="text-ink-sub"> — {value.noteUz}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {Array.from(byCategory.entries()).map(([category, items]) => (
          <section key={category} className="space-y-5">
            <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
              <h2 className="text-xl sm:text-2xl font-bold tracking-[-0.02em]">
                {CATEGORY_LABELS[category]?.uz || category}
              </h2>
              <span className="text-sm text-ink-sub">{items.length} ta</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {items.map((product) => (
                <ProductCard key={product.sku} product={toCardData(product)} lang="uz" />
              ))}
            </div>

            <div className="overflow-x-auto rounded-[16px] border border-line bg-surface">
              <table className="w-full text-sm">
                <thead className="bg-surface-soft text-ink-sub">
                  <tr>
                    <th className="text-left font-semibold px-4 py-2.5">SKU</th>
                    <th className="text-left font-semibold px-4 py-2.5">Nomi</th>
                    <th className="text-left font-semibold px-4 py-2.5">O‘lchami</th>
                    <th className="text-left font-semibold px-4 py-2.5">Tekstura</th>
                    <th className="text-left font-semibold px-4 py-2.5">Uyacha</th>
                    <th className="text-left font-semibold px-4 py-2.5">Manba surat</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((product) => (
                    <tr key={product.sku} className="border-t border-line-soft align-top">
                      <td className="px-4 py-2.5 font-mono text-[12px] whitespace-nowrap">{product.sku}</td>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold">{product.nameUz}</div>
                        <div className="text-ink-sub text-[13px]">{product.nameRu}</div>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {product.dimensions}
                        {!product.dimensionsConfirmed && <span className="text-brand-red font-bold">*</span>}
                      </td>
                      <td className="px-4 py-2.5">{TEXTURE_LABELS[product.texture] || product.texture}</td>
                      <td className="px-4 py-2.5">{product.cavities}</td>
                      <td className="px-4 py-2.5 text-[11px] text-ink-sub break-all max-w-[240px]">
                        {product.sourcePhoto}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <footer className="text-sm text-ink-sub border-t border-line pt-6 space-y-1">
          <p>
            <strong className="text-brand-red">*</strong> — o‘lcham oila standarti bo‘yicha berilgan va
            buyurtmada tasdiqlanadi (2026 katalogdagi bilan bir xil belgi). Aniq o‘lchamlar berilsa,{' '}
            <code>prisma/data/molds-2026.json</code> faylida yangilanadi.
          </p>
          <p>Narxlar katalogda ko‘rsatilmagan, shuning uchun kartalar «Narx so‘rash» rejimida ishlaydi.</p>
        </footer>
      </main>
    </div>
  );
}
