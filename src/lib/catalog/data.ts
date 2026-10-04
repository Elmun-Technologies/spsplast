import catalogJson from '@/data/catalog.json';
import type { StaticBlogPost, StaticCatalogFile, StaticCategory, StaticProduct } from './types';

/**
 * Statik katalog fayli — `node scripts/build-static-catalog.js` bilan yasaladi
 * va git'da saqlanadi. Build ham, runtime ham faqat shu faylni o'qiydi, shuning
 * uchun `DATABASE_URL` umuman bo'lmasa ham sayt to'liq ishlaydi.
 */
export const catalog = catalogJson as unknown as StaticCatalogFile;

export const products: StaticProduct[] = catalog.products;
export const categories: StaticCategory[] = catalog.categories;
export const blogPosts: StaticBlogPost[] = catalog.blog;

const productById = new Map(products.map((product) => [product.id, product]));
const productBySku = new Map(products.map((product) => [product.sku, product]));

/** Til + slug bo'yicha mahsulot indeksi: "uz:g001-floriya" -> mahsulot. */
const productBySlug = new Map<string, StaticProduct>();
for (const product of products) {
  for (const translation of product.translations) {
    productBySlug.set(`${translation.locale}:${translation.slug}`, product);
  }
}

const categoryById = new Map(categories.map((category) => [category.id, category]));
const categoryBySlug = new Map<string, StaticCategory>();
for (const category of categories) {
  for (const translation of category.translations) {
    categoryBySlug.set(`${translation.locale}:${translation.slug}`, category);
  }
}

/** Mahsulot tarjimasi (locale bo'yicha), topilmasa — birinchi mavjud tarjima. */
export function translationFor(product: StaticProduct, locale: string) {
  return (
    product.translations.find((translation) => translation.locale === locale) || product.translations[0] || null
  );
}

export function productLocaleSlug(product: StaticProduct, locale: string): string {
  return translationFor(product, locale)?.slug || product.sku.toLowerCase();
}

export function getProductBySlug(locale: string, slug: string): StaticProduct | null {
  return productBySlug.get(`${locale}:${slug}`) || null;
}

export function getProductById(id: string): StaticProduct | null {
  return productById.get(id) || null;
}

export function getProductBySku(sku: string): StaticProduct | null {
  return productBySku.get(sku) || null;
}

export function getCategoryById(id: string): StaticCategory | null {
  return categoryById.get(id) || null;
}

export function getCategoryBySlug(locale: string, slug: string): StaticCategory | null {
  return categoryBySlug.get(`${locale}:${slug}`) || null;
}

/** Kategoriyaning joriy tildagi nomi/slug'i (yo'q bo'lsa — birinchisi). */
export function categoryTranslation(category: StaticCategory, locale: string) {
  return (
    category.translations.find((translation) => translation.locale === locale) || category.translations[0] || null
  );
}
