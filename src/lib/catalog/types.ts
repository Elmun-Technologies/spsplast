/**
 * Statik katalog tiplari.
 *
 * Shakl ilgari Prisma qaytargan obyektlarga yaqinlashtirilgan: sahifalar
 * `translations`, `media`, `attributeValues`, `variants` kabi maydonlarni
 * ishlatadi. Shu tufayli backendsiz arxitekturaga o'tish sahifa kodini
 * deyarli o'zgartirmasdan amalga oshdi.
 */

export type Locale = 'uz' | 'ru';

export interface StaticTranslation {
  locale: Locale | string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  description?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface StaticMedia {
  type: 'MAIN' | 'MOLD' | 'FINISHED_RESULT' | 'USAGE' | string;
  sortOrder: number;
  url: string;
  alt?: string | null;
}

export interface StaticAttributeValue {
  attribute: {
    code: string;
    sortOrder: number;
    translations: { locale: string; name: string }[];
  };
  textValue: string | null;
  option: {
    code: string;
    translations: { locale: string; label: string }[];
  } | null;
}

export interface StaticVariantOption {
  option: {
    code: string;
    attribute: {
      code: string;
      sortOrder: number;
      translations: { locale: string; name: string }[];
    };
    translations: { locale: string; label: string }[];
  };
}

export interface StaticVariant {
  id: string;
  sku: string;
  price: number;
  stockQty: number;
  status: string;
  options: StaticVariantOption[];
}

export interface StaticCategory {
  id: string;
  parentId: string | null;
  image: string | null;
  sortOrder: number;
  status: string;
  section: string;
  productCount: number;
  translations: {
    locale: string;
    name: string;
    slug: string;
    description?: string | null;
  }[];
}

export interface StaticProduct {
  id: string;
  sku: string;
  status: string;
  basePrice: number;
  compareAtPrice: number | null;
  currency: string;
  inStock: boolean;
  stockQty: number;
  isBestseller: boolean;
  isNew: boolean;
  yieldPerCast: number | null;
  durabilityCasts: number | null;
  videoUrl: string | null;
  updatedAt: string;
  categoryId: string;
  translations: StaticTranslation[];
  media: StaticMedia[];
  attributeValues: StaticAttributeValue[];
  variants: StaticVariant[];
}

export interface StaticBlogPost {
  id: string;
  coverImage: string;
  author: string;
  isPublished: boolean;
  publishedAt: string;
  updatedAt: string;
  sortOrder: number;
  translations: {
    locale: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
  }[];
}

export interface StaticProject {
  id: string;
  slug: string;
  beforeImage: string | null;
  afterImage: string;
  location: string;
  productUsed: string;
  sortOrder: number;
  titleUz: string;
  titleRu: string;
  descriptionUz: string;
  descriptionRu: string;
}

export interface StaticCatalogFile {
  version: string;
  catalogDate: string;
  currency: string;
  categories: StaticCategory[];
  attributes: { id: string; code: string; sortOrder: number; translations: { locale: string; name: string }[] }[];
  products: StaticProduct[];
  blog: StaticBlogPost[];
  projects: StaticProject[];
}
