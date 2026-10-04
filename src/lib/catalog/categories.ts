import { catalog, categoryTranslation, getCategoryById, getCategoryBySlug } from './data';
import type { StaticCategory } from './types';

/**
 * Kategoriya so'rovlari (statik).
 *
 * Eslatma: katalogda faqat uchta asosiy bo'lim bor (bruschatka/plitka/panel),
 * ost-kategoriyalar ishlatilmaydi — shuning uchun daraxt bir darajali, lekin
 * interfeys `children` maydonini saqlaydi (kelajakda kengaytirish uchun).
 */

export interface CategoryTreeItem {
  id: string;
  parentId: string | null;
  image: string | null;
  sortOrder: number;
  status: string;
  translations: { locale: string; name: string; slug: string; description?: string | null }[];
  children: CategoryTreeItem[];
}

function toTreeItem(category: StaticCategory): CategoryTreeItem {
  return {
    id: category.id,
    parentId: category.parentId,
    image: category.image,
    sortOrder: category.sortOrder,
    status: category.status,
    translations: category.translations,
    children: [],
  };
}

/** Header navigatsiyasi uchun daraxt. */
export function getCategoryTree(locale: string = 'uz'): CategoryTreeItem[] {
  return catalog.categories
    .filter((category) => category.status === 'ACTIVE' && !category.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => {
      const item = toTreeItem(category);
      item.translations = category.translations.filter((t) => t.locale === locale || !locale);
      return item;
    });
}

/** Katalog filtri uchun tekis ro'yxat: id, slug, nom. */
export function getCategoryOptions(locale: string = 'uz') {
  return catalog.categories
    .filter((category) => category.status === 'ACTIVE')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => {
      const trans = categoryTranslation(category, locale);
      return {
        id: category.id,
        slug: trans?.slug || category.id,
        name: trans?.name || category.id,
      };
    });
}

/** Bosh sahifa kartalari uchun: tavsif va mahsulot soni bilan. */
export function getCategoriesWithMeta(locale: string = 'uz') {
  return catalog.categories
    .filter((category) => category.status === 'ACTIVE')
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => {
      const trans = categoryTranslation(category, locale) || { name: '', slug: category.id, description: '' };
      return {
        id: category.id,
        slug: trans.slug,
        nameUz: trans.name,
        nameRu: trans.name,
        descriptionUz: trans.description || '',
        descriptionRu: trans.description || '',
        image: category.image,
        _count: { products: category.productCount },
      };
    });
}

export { getCategoryById, getCategoryBySlug };
