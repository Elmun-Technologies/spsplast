import { catalog, getCategoryBySlug, getProductBySlug, getProductById, products as allProducts, translationFor } from './data';
import type { StaticProduct } from './types';

/**
 * Mahsulot so'rovlari — ilgari `src/lib/services/productService.ts` Prisma
 * orqali bajargan ishlarni endi xotirada, statik katalog ustida bajaradi.
 *
 * Qaytariladigan obyekt shakli o'zgarmagan (ProductCard kutgan maydonlar),
 * shuning uchun sahifalar faqat import manzilini almashtirdi.
 */

export interface ProductQuery {
  locale?: string;
  categorySlug?: string;
  search?: string;
  inStock?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  sort?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
  minPrice?: number;
  maxPrice?: number;
  material?: string;
}

export interface MappedProduct {
  id: string;
  sku: string;
  titleUz: string;
  titleRu: string;
  slug: string;
  price: number;
  oldPrice: number | null;
  dimensions: string | null;
  material: string | null;
  inStock: boolean;
  isBestseller: boolean;
  isNew: boolean;
  hasVariants: boolean;
  yieldPerCast: number | null;
  durabilityCasts: number | null;
  moldImage: string | null;
  resultImage: string | null;
  images: { url: string; type: string; alt?: string | null }[];
  category: { slug: string; nameUz: string } | null;
}

function attributeText(product: StaticProduct, code: string): string | null {
  return product.attributeValues.find((value) => value.attribute.code === code)?.textValue || null;
}

export function mapProduct(product: StaticProduct, locale: string): MappedProduct {
  const trans = translationFor(product, locale);
  const category = catalog.categories.find((c) => c.id === product.categoryId) || null;
  const categoryTrans = category?.translations.find((t) => t.locale === locale) || category?.translations[0] || null;

  const moldMedia = product.media.find((m) => m.type === 'MOLD') || product.media[0];
  const resultMedia = product.media.find((m) => m.type === 'FINISHED_RESULT');

  return {
    id: product.id,
    sku: product.sku,
    titleUz: trans?.name || product.sku,
    titleRu: trans?.name || product.sku,
    slug: trans?.slug || product.sku.toLowerCase(),
    price: product.basePrice,
    oldPrice: product.compareAtPrice,
    dimensions: attributeText(product, 'dimensions'),
    material: attributeText(product, 'material'),
    inStock: product.inStock,
    isBestseller: product.isBestseller,
    isNew: product.isNew,
    hasVariants: product.variants.length > 0,
    yieldPerCast: product.yieldPerCast,
    durabilityCasts: product.durabilityCasts,
    moldImage: moldMedia?.url || null,
    resultImage: resultMedia?.url || null,
    images: product.media.map((m) => ({ url: m.url, type: m.type, alt: m.alt })),
    category: categoryTrans ? { slug: categoryTrans.slug, nameUz: categoryTrans.name } : null,
  };
}

function matchesSearch(product: StaticProduct, query: string): boolean {
  const needle = query.toLowerCase();
  if (product.sku.toLowerCase().includes(needle)) return true;

  return product.translations.some(
    (translation) =>
      translation.name.toLowerCase().includes(needle) ||
      (translation.description || '').toLowerCase().includes(needle) ||
      (translation.shortDescription || '').toLowerCase().includes(needle)
  );
}

function compare(a: StaticProduct, b: StaticProduct, sort?: string): number {
  switch (sort) {
    case 'price-asc':
      return a.basePrice - b.basePrice;
    case 'price-desc':
      return b.basePrice - a.basePrice;
    case 'bestseller':
      return Number(b.isBestseller) - Number(a.isBestseller);
    case 'name-asc':
      return a.sku.localeCompare(b.sku);
    case 'newest':
      // Statik manbada `createdAt` yo'q: yangi mahsulotlar avval chiqadi,
      // keyin katalog tartibi (barqaror va oldindan aytib bo'ladigan).
      return Number(b.isNew) - Number(a.isNew);
    default:
      return 0;
  }
}

export function getProductsServer(query: ProductQuery = {}) {
  const locale = query.locale || 'uz';
  const pageSize = query.limit || query.pageSize || 24;
  const page = query.page || 1;

  let list = allProducts.filter((product) => product.status === 'ACTIVE');

  if (query.categorySlug) {
    const category = getCategoryBySlug(locale, query.categorySlug) || getCategoryBySlug('uz', query.categorySlug);
    list = category ? list.filter((product) => product.categoryId === category.id) : [];
  }

  if (query.search) {
    const search = query.search.trim();
    if (search) list = list.filter((product) => matchesSearch(product, search));
  }

  if (query.inStock) list = list.filter((product) => product.inStock);
  if (query.isNew) list = list.filter((product) => product.isNew);
  if (query.isBestseller) list = list.filter((product) => product.isBestseller);

  if (query.minPrice !== undefined) list = list.filter((product) => product.basePrice >= query.minPrice!);
  if (query.maxPrice !== undefined) list = list.filter((product) => product.basePrice <= query.maxPrice!);

  if (query.material) {
    const material = query.material.toLowerCase();
    list = list.filter(
      (product) => (attributeText(product, 'material') || '').toLowerCase().includes(material)
    );
  }

  // Saralash barqaror bo'lishi uchun massiv nusxasida ishlaymiz.
  if (query.sort) list = [...list].sort((a, b) => compare(a, b, query.sort));

  const total = list.length;
  const take = query.limit || pageSize;
  const start = query.limit ? 0 : (page - 1) * pageSize;
  const paged = list.slice(start, start + take);

  return {
    products: paged.map((product) => mapProduct(product, locale)),
    total,
    totalPages: Math.max(1, Math.ceil(total / take)),
    page,
    pageSize: take,
  };
}

/**
 * Mahsulot sahifasi va uning metadata'si uchun: til bo'yicha slug bo'yicha
 * tarjima + mahsulotning to'liq shakli (media, kategoriya, atribut, variantlar).
 */
export function getProductTranslation(locale: string, slug: string) {
  const product = getProductBySlug(locale, slug);
  if (!product || product.status !== 'ACTIVE') return null;

  const trans = translationFor(product, locale);
  if (!trans) return null;

  const category = catalog.categories.find((c) => c.id === product.categoryId) || null;

  return {
    ...trans,
    product: {
      ...product,
      translations: product.translations.map(({ locale: l, slug: s }) => ({ locale: l, slug: s })),
      categories: category
        ? [
            {
              categoryId: category.id,
              category: {
                id: category.id,
                translations: category.translations,
              },
            },
          ]
        : [],
    },
  };
}

export function getProductByIdWithTranslations(id: string) {
  return getProductById(id);
}
