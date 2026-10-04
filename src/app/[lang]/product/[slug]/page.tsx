import React from 'react';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { catalog, getProductTranslation, getProductsServer } from '@/lib/catalog';
import { getDictionary, Locale } from '@/lib/i18n';
import { ProductDetailClient } from './ProductDetailClient';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { RecentlyViewed, RecentlyViewedTracker } from '@/components/product/RecentlyViewed';
import { ProductCard } from '@/components/product/ProductCard';
import { SectionHeader } from '@/components/ui/SectionHeader';

// Below-the-fold widget: separate chunk, still server-rendered for SEO.
const MoldResultShowcase = dynamic(() => import('@/components/product/MoldResultShowcase').then((m) => m.MoldResultShowcase));

interface ProductPageProps {
  params: Promise<{ lang: Locale; slug: string }>;
}

/**
 * Barcha mahsulot sahifalarini build vaqtida prerender qilamiz: katalog statik
 * faylda saqlanadi, shuning uchun 192 mahsulot × 2 til tayyor HTML bo'lib
 * CDN'dan beriladi (serverless render ham, sovuq start ham yo'q).
 */
export function generateStaticParams() {
  return catalog.products.flatMap((product) =>
    product.translations.map((translation) => ({ lang: translation.locale, slug: translation.slug }))
  );
}

export async function generateMetadata({ params }: ProductPageProps) {
  const { lang, slug } = await params;
  const trans = getProductTranslation(lang, slug);

  if (!trans) return {};

  // Har bir til o'z slug'iga ega — canonical va hreflang havolalari shuni
  // hisobga oladi, aks holda qidiruv tizimlari uz/ru sahifalarni dublikat deb
  // hisoblaydi.
  const languages: Record<string, string> = {};
  for (const t of trans.product.translations) {
    languages[t.locale] = `/${t.locale}/product/${t.slug}`;
  }
  // x-default: til aniqlanmagan foydalanuvchi uchun o'zbek (asosiy) variant.
  if (languages.uz) languages['x-default'] = languages.uz;

  const image = trans.product.media[0]?.url;

  return {
    title: `${trans.name} | SPS`,
    description: (trans.shortDescription || trans.description || '').slice(0, 160),
    alternates: {
      canonical: `/${lang}/product/${trans.slug}`,
      languages,
    },
    openGraph: {
      title: `${trans.name} | SPS`,
      description: (trans.shortDescription || trans.description || '').slice(0, 160),
      url: `/${lang}/product/${trans.slug}`,
      type: 'website',
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: ProductPageProps) {
  const { lang, slug } = await params;
  const dict = getDictionary(lang);

  const trans = getProductTranslation(lang, slug);

  if (!trans || !trans.product) {
    notFound();
  }

  const product = trans.product;
  // Kategoriya tarjimasi aynan shu til uchun olinadi: slug va nom uz/ru da
  // farq qiladi, aks holda breadcrumb rus sahifasida o'zbekcha chiqadi.
  const categoryTranslations = product.categories[0]?.category?.translations || [];
  const categoryTrans =
    categoryTranslations.find((t: { locale: string }) => t.locale === lang) || categoryTranslations[0];

  const moldMedia = product.media.find((m) => m.type === 'MOLD') || product.media[0];
  const resultMedia = product.media.find((m) => m.type === 'FINISHED_RESULT');

  /**
   * Variant opsiyalari (material / plastik qalinligi / …).
   *
   * Faqat shu mahsulot variantlarida haqiqatan mavjud bo'lgan qiymatlar
   * chiqariladi, shuning uchun variantsiz mahsulotda tanlagich umuman
   * ko'rinmaydi.
   */
  const optionGroupOrder: string[] = [];
  const optionGroups = new Map<string, { code: string; name: string; sortOrder: number; values: Map<string, string> }>();

  for (const variant of product.variants) {
    for (const variantOption of variant.options) {
      const option = variantOption.option;
      const attribute = option.attribute;
      const groupCode = attribute.code;

      if (!optionGroups.has(groupCode)) {
        optionGroups.set(groupCode, {
          code: groupCode,
          name: attribute.translations[0]?.name || groupCode,
          sortOrder: attribute.sortOrder,
          values: new Map(),
        });
        optionGroupOrder.push(groupCode);
      }

      const group = optionGroups.get(groupCode)!;
      if (!group.values.has(option.code)) {
        group.values.set(option.code, option.translations[0]?.label || option.code);
      }
    }
  }

  const mappedOptionGroups = optionGroupOrder
    .map((code) => optionGroups.get(code)!)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((group) => ({
      code: group.code,
      name: group.name,
      values: Array.from(group.values.entries()).map(([valueCode, label]) => ({ code: valueCode, label })),
    }));

  const mappedVariants = product.variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    price: variant.price,
    stockQty: variant.stockQty,
    optionCodes: variant.options.map((variantOption) => variantOption.option.code),
  }));

  const mappedProduct = {
    id: product.id,
    sku: product.sku,
    slug: trans.slug,
    titleUz: trans.name,
    titleRu: trans.name,
    descriptionUz: trans.description || '',
    descriptionRu: trans.description || '',
    price: product.basePrice,
    oldPrice: product.compareAtPrice,
    inStock: product.inStock,
    isBestseller: product.isBestseller,
    isNew: product.isNew,
    yieldPerCast: product.yieldPerCast,
    durabilityCasts: product.durabilityCasts,
    dimensions: product.attributeValues.find((a) => a.attribute.code === 'dimensions')?.textValue || null,
    material: product.attributeValues.find((a) => a.attribute.code === 'material')?.textValue || null,
    weight: product.attributeValues.find((a) => a.attribute.code === 'weight')?.textValue || null,
    images: product.media.map((m) => ({ url: m.url, altText: m.alt })),
    moldImage: moldMedia?.url || null,
    resultImage: resultMedia?.url || null,
    videoUrl: product.videoUrl || null,
    optionGroups: mappedOptionGroups,
    variants: mappedVariants,
  };

  const breadcrumbItems = [
    { label: dict.nav.catalog, href: `/${lang}/catalog` },
    ...(categoryTrans ? [{ label: categoryTrans.name, href: `/${lang}/catalog/${categoryTrans.slug}` }] : []),
    { label: trans.name, active: true },
  ];

  const jsonLdProduct = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: trans.name,
    image: product.media.map((img) => img.url),
    description: trans.description || '',
    sku: product.sku,
    brand: { '@type': 'Brand', name: 'SPS' },
    /**
     * P0-8: narx saytda ko'rsatilmaydi (uni menejer tasdiqlaydi), shuning uchun
     * `offers` ham, `availability` ham berilmaydi. Ilgari bu yerda
     * `price: product.basePrice` (0 so'm) va ombor qoldig'iga asoslangan
     * `InStock` turardi — Google uchun noto'g'ri ma'lumot.
     *
     * Sharhlar tizimi ham olib tashlangan, shuning uchun `aggregateRating` yo'q:
     * bo'sh/soxta reyting "spam structured data" hisoblanadi.
     */
  };

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: dict.nav.home, item: `/${lang}` },
      { '@type': 'ListItem', position: 2, name: dict.nav.catalog, item: `/${lang}/catalog` },
      ...(categoryTrans
        ? [{ '@type': 'ListItem', position: 3, name: categoryTrans.name, item: `/${lang}/catalog/${categoryTrans.slug}` }]
        : []),
      { '@type': 'ListItem', position: categoryTrans ? 4 : 3, name: trans.name },
    ],
  };

  return (
    <div className="bg-surface-page min-h-screen py-6 text-ink space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProduct) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />

      <RecentlyViewedTracker
        product={{
          id: mappedProduct.id,
          slug: mappedProduct.slug,
          title: trans.name,
          price: mappedProduct.price,
          image: mappedProduct.images[0]?.url || '',
          sku: mappedProduct.sku,
        }}
      />

      <Container>
        <Breadcrumbs lang={lang} items={breadcrumbItems} className="mb-5" />

        <ProductDetailClient product={mappedProduct} lang={lang} />

        {mappedProduct.resultImage && mappedProduct.moldImage && (
          <section className="pt-6">
            <MoldResultShowcase
              moldImage={mappedProduct.moldImage}
              resultImage={mappedProduct.resultImage}
              moldTitle={trans.name}
              resultTitle={lang === 'ru' ? 'Готовый образец' : 'Tayyor mahsulot namunasi'}
              productSlug={mappedProduct.slug}
              productPrice={mappedProduct.price || undefined}
              lang={lang}
            />
          </section>
        )}

        <section className="mt-8 bg-surface border border-line rounded-[20px] p-6 sm:p-8 space-y-6 shadow-card">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">{dict.product.howItWorks}</h3>
            <p className="text-sm text-ink-sub mt-2">{lang === 'ru' ? 'Технология заливки бетона' : 'Beton quyish texnologiyasi va bosqichlari'}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {[
              { step: 1, title: dict.product.step1, desc: lang === 'ru' ? 'Смешайте бетон с пластификатором в правильной пропорции.' : 'Beton va plastifikatorni to‘g‘ri nisbatda aralashtiring.' },
              { step: 2, title: dict.product.step2, desc: lang === 'ru' ? 'Смажьте форму маслом и залейте равномерно.' : 'Qolipni maxsus moy bilan surtib, tekis quying.' },
              { step: 3, title: dict.product.step3, desc: lang === 'ru' ? 'Сушите 24 часа в тени.' : '24 soat davomida soyada quriting.' },
              { step: 4, title: dict.product.step4, desc: lang === 'ru' ? 'Легко извлеките готовое изделие.' : 'Tayyor mahsulotni qolipdan osongina ajratib oling.' },
            ].map((item) => (
              <div key={item.step} className="p-5 rounded-[16px] bg-surface-soft border border-line space-y-3 hover:border-[#DDE3EB] transition-colors">
                <span className="w-8 h-8 rounded-full bg-brand-red text-white text-sm font-bold flex items-center justify-center shadow-red">
                  {item.step}
                </span>
                <h4 className="font-bold text-ink text-sm">{item.title}</h4>
                <p className="text-sm text-ink-soft leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <RecentlyViewed lang={lang} currentProductId={mappedProduct.id} />

        {/* Related Products */}
        <RelatedProducts lang={lang} categorySlug={categoryTrans?.slug} currentProductId={mappedProduct.id} />
      </Container>
    </div>
  );
}

async function RelatedProducts({ lang, categorySlug, currentProductId }: { lang: Locale; categorySlug?: string; currentProductId: string }) {
  if (!categorySlug) return null;
  try {
    const data = getProductsServer({ locale: lang, categorySlug, limit: 8 });
    const related = data.products.filter((p: any) => p.id !== currentProductId).slice(0, 4);
    if (related.length === 0) return null;
    return (
      <section className="pt-6">
        <SectionHeader
          title={lang === 'ru' ? 'Похожие товары' : 'O‘xshash mahsulotlar'}
          subtitle={lang === 'ru' ? 'Вам также может подойти' : 'Sizga ham mos kelishi mumkin'}
          linkText={lang === 'ru' ? 'Все' : 'Barchasi'}
          linkHref={categorySlug ? `/${lang}/catalog/${categorySlug}` : `/${lang}/catalog`}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {related.map((p: any) => (
            <ProductCard key={p.id} product={p} lang={lang} />
          ))}
        </div>
      </section>
    );
  } catch {
    return null;
  }
}
