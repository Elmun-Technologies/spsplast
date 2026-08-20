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

export async function getProductById(id: string, locale: string = 'uz') {
  const product = await db.product.findUnique({
    where: { id },
    include: {
      translations: true,
      categories: {
        include: {
          category: {
            include: { translations: true },
          },
        },
      },
      variants: {
        include: {
          options: {
            include: {
              option: {
                include: { translations: true },
              },
            },
          },
          media: true,
        },
      },
      attributeValues: {
        include: {
          attribute: {
            include: { translations: true },
          },
          option: {
            include: { translations: true },
          },
        },
      },
      media: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return product;
}

export async function getProductsAdmin(params?: {
  search?: string;
  status?: string;
  categoryId?: string;
  isBestseller?: boolean;
  isNew?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}) {
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (params?.search) {
    const q = params.search.trim();
    where.OR = [
      { sku: { contains: q } },
      {
        translations: {
          some: {
            OR: [
              { name: { contains: q } },
              { slug: { contains: q } },
            ],
          },
        },
      },
    ];
  }

  if (params?.status && params.status !== 'ALL') {
    where.status = params.status;
  }

  if (params?.categoryId) {
    where.categories = { some: { categoryId: params.categoryId } };
  }

  if (params?.isBestseller !== undefined) {
    where.isBestseller = params.isBestseller;
  }

  if (params?.isNew !== undefined) {
    where.isNew = params.isNew;
  }

  let orderBy: any = { createdAt: 'desc' };
  if (params?.sortBy) {
    const order = params.sortOrder || 'desc';
    orderBy = { [params.sortBy]: order };
  }

  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        translations: { where: { locale: 'uz' } },
        categories: {
          include: {
            category: {
              include: { translations: { where: { locale: 'uz' } } },
            },
          },
        },
        media: {
          where: { OR: [{ type: 'MOLD' }, { type: 'MAIN' }] },
          take: 1,
        },
        _count: { select: { variants: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.translations[0]?.name || p.sku,
      slug: p.translations[0]?.slug || '',
      basePrice: p.basePrice,
      compareAtPrice: p.compareAtPrice,
      status: p.status,
      inStock: p.inStock,
      stockQty: p.stockQty,
      isBestseller: p.isBestseller,
      isNew: p.isNew,
      categories: p.categories.map((c) => ({
        id: c.category.id,
        name: c.category.translations[0]?.name || '',
      })),
      thumbnail: p.media[0]?.url || null,
      variantCount: p._count.variants,
      createdAt: p.createdAt,
    })),
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export async function updateProduct(id: string, data: any) {
  return await db.$transaction(async (tx) => {
    if (data.translations) {
      for (const trans of data.translations) {
        await tx.productTranslation.upsert({
          where: { productId_locale: { productId: id, locale: trans.locale } },
          update: {
            name: trans.name,
            slug: trans.slug,
            shortDescription: trans.shortDescription,
            description: trans.description,
            metaTitle: trans.metaTitle,
            metaDescription: trans.metaDescription,
          },
          create: { productId: id, ...trans },
        });
      }
    }

    if (data.categories !== undefined) {
      await tx.productCategory.deleteMany({ where: { productId: id } });
      if (data.categories.length > 0) {
        await tx.productCategory.createMany({
          data: data.categories.map((categoryId: string) => ({
            productId: id,
            categoryId,
          })),
        });
      }
    }

    if (data.attributeValues !== undefined) {
      await tx.productAttributeValue.deleteMany({ where: { productId: id } });
      for (const attr of data.attributeValues) {
        await tx.productAttributeValue.create({
          data: {
            productId: id,
            attributeId: attr.attributeId,
            textValue: attr.textValue || null,
            numberValue: attr.numberValue || null,
            booleanValue: attr.booleanValue || null,
            optionId: attr.optionId || null,
          },
        });
      }
    }

    const updateData: any = {};
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.basePrice !== undefined) updateData.basePrice = data.basePrice;
    if (data.compareAtPrice !== undefined) updateData.compareAtPrice = data.compareAtPrice;
    if (data.inStock !== undefined) updateData.inStock = data.inStock;
    if (data.stockQty !== undefined) updateData.stockQty = data.stockQty;
    if (data.trackInventory !== undefined) updateData.trackInventory = data.trackInventory;
    if (data.allowBackorder !== undefined) updateData.allowBackorder = data.allowBackorder;
    if (data.isBestseller !== undefined) updateData.isBestseller = data.isBestseller;
    if (data.isNew !== undefined) updateData.isNew = data.isNew;
    if (data.yieldPerCast !== undefined) updateData.yieldPerCast = data.yieldPerCast;
    if (data.durabilityCasts !== undefined) updateData.durabilityCasts = data.durabilityCasts;
    if (data.videoUrl !== undefined) updateData.videoUrl = data.videoUrl;

    const product = await tx.product.update({
      where: { id },
      data: updateData,
      include: { translations: true },
    });

    return product;
  });
}

export async function archiveProduct(id: string) {
  return await db.product.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  });
}

export async function restoreProduct(id: string) {
  return await db.product.update({
    where: { id },
    data: { status: 'ACTIVE' },
  });
}

export async function deleteProduct(id: string) {
  const orderItemsCount = await db.orderItem.count({
    where: { productId: id },
  });

  if (orderItemsCount > 0) {
    await db.product.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    throw new Error('Mahsulot buyurtmalarda mavjud. Arxivlandi.');
  }

  await db.product.delete({ where: { id } });
}
