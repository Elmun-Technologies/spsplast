/**
 * Statik katalog moduli.
 *
 * Sayt backendsiz ishlaydi: sahifalar shu modul orqali `src/data/catalog.json`
 * dan o'qiydi (`node scripts/build-static-catalog.js` bilan yasaladi).
 * Prisma/DATABASE_URL talab qilinmaydi.
 */

export * from './types';
export {
  catalog,
  products,
  categories,
  blogPosts,
  translationFor,
  productLocaleSlug,
  getProductBySlug,
  getProductById,
  getProductBySku,
  getCategoryById,
  getCategoryBySlug,
  categoryTranslation,
} from './data';
export { getProductsServer, mapProduct, getProductTranslation, getProductByIdWithTranslations } from './products';
export type { ProductQuery, MappedProduct } from './products';
export { getCategoryTree, getCategoryOptions, getCategoriesWithMeta, getCategoryUrl } from './categories';
export type { CategoryTreeItem } from './categories';
export { getBlogPosts, getBlogPostBySlug, getRelatedBlogPosts, getBlogAlternates, getBlogTranslation, getProjects } from './content';
export type { BlogPostView } from './content';
