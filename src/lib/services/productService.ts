import { db } from '@/lib/db';

export async function getProductsServer({
  locale = 'uz',
  categorySlug,
  search,
  inStock,
  isNew,
  isBestseller,
  sort,
  limit,
}: {
  locale?: string;
  categorySlug?: string;
  search?: string;
  inStock?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  sort?: string;
  limit?: number;
}) {
  const where: any = { status: 'ACTIVE' };

  if (categorySlug) {
    const categoryTrans = await db.categoryTranslation.findFirst({
      where: { slug: categorySlug, locale },
    });
    if (categoryTrans) {
      where.categories = {
        some: { categoryId: categoryTrans.categoryId },
      };
    }
  }

  if (search) {
    const q = search.trim();
    where.OR = [
      { sku: { contains: q } },
      {
        translations: {
          some: {
            OR: [
              { name: { contains: q } },
              { description: { contains: q } },
            ],
          },
        },
      },
    ];
  }

  if (inStock) where.inStock = true;
  if (isNew) where.isNew = true;
  if (isBestseller) where.isBestseller = true;

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price-asc') orderBy = { basePrice: 'asc' };
  if (sort === 'price-desc') orderBy = { basePrice: 'desc' };

  const products = await db.product.findMany({
    where,
    orderBy,
    take: limit,
    include: {
      translations: { where: { locale } },
      media: { orderBy: { sortOrder: 'asc' } },
      categories: {
        include: {
          category: {
            include: { translations: { where: { locale } } },
          },
        },
      },
      attributeValues: {
        include: {
          attribute: {
            include: { translations: { where: { locale } } },
          },
          option: {
            include: { translations: { where: { locale } } },
          },
        },
      },
    },
  });

  // Map to flat public data format for client components
  return products.map((p) => {
    const trans = p.translations[0] || {};
    const moldMedia = p.media.find((m) => m.type === 'MOLD') || p.media[0];
    const resultMedia = p.media.find((m) => m.type === 'FINISHED_RESULT');

    return {
      id: p.id,
      sku: p.sku,
      titleUz: trans.name || p.sku,
      titleRu: trans.name || p.sku,
      slug: trans.slug || p.sku.toLowerCase(),
      price: p.basePrice,
      oldPrice: p.compareAtPrice,
      dimensions: p.attributeValues.find((a) => a.attribute.code === 'dimensions')?.textValue || null,
      inStock: p.inStock,
      isBestseller: p.isBestseller,
      isNew: p.isNew,
      yieldPerCast: p.yieldPerCast,
      durabilityCasts: p.durabilityCasts,
      moldImage: moldMedia?.url || null,
      resultImage: resultMedia?.url || null,
      images: p.media.map((m) => ({ url: m.url, type: m.type, alt: m.alt })),
    };
  });
}
