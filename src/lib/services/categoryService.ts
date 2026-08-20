import { db } from '@/lib/db';

export interface CategoryWithTranslations {
  id: string;
  parentId: string | null;
  image: string | null;
  sortOrder: number;
  status: string;
  translations: Array<{
    locale: string;
    name: string;
    slug: string;
    description: string | null;
  }>;
  children?: CategoryWithTranslations[];
}

export async function getCategoryTree(locale: string = 'uz'): Promise<CategoryWithTranslations[]> {
  const categories = await db.category.findMany({
    where: { status: 'ACTIVE' },
    include: {
      translations: { where: { locale } },
      children: {
        include: {
          translations: { where: { locale } },
          children: {
            include: {
              translations: { where: { locale } },
            },
          },
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  const rootCategories = categories.filter((c) => !c.parentId);

  return rootCategories.map(mapCategoryWithChildren);
}

function mapCategoryWithChildren(category: any): CategoryWithTranslations {
  return {
    id: category.id,
    parentId: category.parentId,
    image: category.image,
    sortOrder: category.sortOrder,
    status: category.status,
    translations: category.translations,
    children: category.children?.map(mapCategoryWithChildren),
  };
}

export async function getCategoryById(id: string, locale: string = 'uz') {
  const category = await db.category.findUnique({
    where: { id },
    include: {
      translations: true,
      parent: {
        include: { translations: { where: { locale } } },
      },
      children: {
        include: { translations: { where: { locale } } },
        orderBy: { sortOrder: 'asc' },
      },
      attributes: {
        include: {
          attribute: {
            include: {
              translations: true,
              options: {
                include: { translations: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return category;
}

export async function getAllCategories(locale: string = 'uz') {
  const categories = await db.category.findMany({
    include: {
      translations: { where: { locale } },
      parent: {
        include: { translations: { where: { locale } } },
      },
      _count: { select: { products: true, children: true } },
    },
    orderBy: [
      { parentId: 'asc' },
      { sortOrder: 'asc' },
    ],
  });

  return categories.map((c) => ({
    id: c.id,
    parentId: c.parentId,
    name: c.translations[0]?.name || 'N/A',
    slug: c.translations[0]?.slug || '',
    parentName: c.parent?.translations[0]?.name || null,
    productCount: c._count.products,
    childrenCount: c._count.children,
    status: c.status,
    sortOrder: c.sortOrder,
  }));
}

export async function createCategory(data: {
  parentId?: string;
  image?: string;
  sortOrder?: number;
  translations: Array<{
    locale: string;
    name: string;
    slug: string;
    description?: string;
    metaTitle?: string;
    metaDescription?: string;
  }>;
}) {
  const category = await db.category.create({
    data: {
      parentId: data.parentId || null,
      image: data.image || null,
      sortOrder: data.sortOrder || 0,
      status: 'ACTIVE',
      translations: {
        create: data.translations,
      },
    },
    include: { translations: true },
  });

  return category;
}

export async function updateCategory(
  id: string,
  data: {
    parentId?: string;
    image?: string;
    sortOrder?: number;
    status?: string;
    translations?: Array<{
      locale: string;
      name: string;
      slug: string;
      description?: string;
      metaTitle?: string;
      metaDescription?: string;
    }>;
  }
) {
  return await db.$transaction(async (tx) => {
    if (data.translations) {
      for (const trans of data.translations) {
        await tx.categoryTranslation.upsert({
          where: { categoryId_locale: { categoryId: id, locale: trans.locale } },
          update: {
            name: trans.name,
            slug: trans.slug,
            description: trans.description || null,
            metaTitle: trans.metaTitle || null,
            metaDescription: trans.metaDescription || null,
          },
          create: {
            categoryId: id,
            ...trans,
          },
        });
      }
    }

    const updateData: any = {};
    if (data.parentId !== undefined) updateData.parentId = data.parentId || null;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.status !== undefined) updateData.status = data.status;

    const category = await tx.category.update({
      where: { id },
      data: updateData,
      include: { translations: true },
    });

    return category;
  });
}

export async function deleteCategory(id: string) {
  const childrenCount = await db.category.count({ where: { parentId: id } });
  if (childrenCount > 0) {
    throw new Error('Kategoriya o\'chirib bo\'lmaydi: ichida ost-kategoriyalar mavjud');
  }

  const productsCount = await db.productCategory.count({ where: { categoryId: id } });
  if (productsCount > 0) {
    throw new Error('Kategoriya o\'chirib bo\'lmaydi: ichida mahsulotlar mavjud');
  }

  await db.category.delete({ where: { id } });
}

export async function assignAttributeToCategory(data: {
  categoryId: string;
  attributeId: string;
  required?: boolean;
  sortOrder?: number;
}) {
  return await db.categoryAttribute.upsert({
    where: {
      categoryId_attributeId: {
        categoryId: data.categoryId,
        attributeId: data.attributeId,
      },
    },
    update: {
      required: data.required ?? false,
      sortOrder: data.sortOrder ?? 0,
    },
    create: {
      categoryId: data.categoryId,
      attributeId: data.attributeId,
      required: data.required ?? false,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

export async function removeAttributeFromCategory(categoryId: string, attributeId: string) {
  await db.categoryAttribute.delete({
    where: {
      categoryId_attributeId: { categoryId, attributeId },
    },
  });
}

export async function getCategoryAttributes(categoryId: string) {
  return await db.categoryAttribute.findMany({
    where: { categoryId },
    include: {
      attribute: {
        include: {
          translations: true,
          options: {
            include: { translations: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });
}
