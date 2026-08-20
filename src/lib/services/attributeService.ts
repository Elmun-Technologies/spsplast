import { db } from '@/lib/db';

export type AttributeType = 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT' | 'MULTISELECT';

export interface AttributeWithTranslations {
  id: string;
  code: string;
  type: AttributeType;
  unit: string | null;
  filterable: boolean;
  searchable: boolean;
  variantAxis: boolean;
  sortOrder: number;
  translations: Array<{
    locale: string;
    name: string;
  }>;
  options?: Array<{
    id: string;
    code: string;
    sortOrder: number;
    translations: Array<{
      locale: string;
      label: string;
    }>;
  }>;
}

export async function getAllAttributes(locale: string = 'uz'): Promise<AttributeWithTranslations[]> {
  const attributes = await db.attributeDefinition.findMany({
    include: {
      translations: true,
      options: {
        include: { translations: true },
        orderBy: { sortOrder: 'asc' },
      },
      _count: { select: { categories: true, values: true } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  return attributes.map((attr) => ({
    id: attr.id,
    code: attr.code,
    type: attr.type as AttributeType,
    unit: attr.unit,
    filterable: attr.filterable,
    searchable: attr.searchable,
    variantAxis: attr.variantAxis,
    sortOrder: attr.sortOrder,
    translations: attr.translations,
    options: attr.options.map((opt) => ({
      id: opt.id,
      code: opt.code,
      sortOrder: opt.sortOrder,
      translations: opt.translations,
    })),
    _count: attr._count,
  }));
}

export async function getAttributeByCode(code: string) {
  return await db.attributeDefinition.findUnique({
    where: { code },
    include: {
      translations: true,
      options: {
        include: { translations: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
}

export async function getAttributeById(id: string) {
  return await db.attributeDefinition.findUnique({
    where: { id },
    include: {
      translations: true,
      options: {
        include: { translations: true },
        orderBy: { sortOrder: 'asc' },
      },
      categories: {
        include: {
          category: {
            include: { translations: true },
          },
        },
      },
    },
  });
}

export async function createAttribute(data: {
  code: string;
  type?: AttributeType;
  unit?: string;
  filterable?: boolean;
  searchable?: boolean;
  variantAxis?: boolean;
  sortOrder?: number;
  translations: Array<{
    locale: string;
    name: string;
  }>;
  options?: Array<{
    code: string;
    sortOrder?: number;
    translations: Array<{
      locale: string;
      label: string;
    }>;
  }>;
}) {
  const existing = await db.attributeDefinition.findUnique({
    where: { code: data.code },
  });

  if (existing) {
    throw new Error(`Kod "${data.code}" bilan atribut allaqachon mavjud`);
  }

  const attribute = await db.attributeDefinition.create({
    data: {
      code: data.code,
      type: data.type || 'TEXT',
      unit: data.unit || null,
      filterable: data.filterable ?? true,
      searchable: data.searchable ?? true,
      variantAxis: data.variantAxis ?? false,
      sortOrder: data.sortOrder ?? 0,
      translations: {
        create: data.translations,
      },
      options: data.options
        ? {
            create: data.options.map((opt) => ({
              code: opt.code,
              sortOrder: opt.sortOrder ?? 0,
              translations: {
                create: opt.translations,
              },
            })),
          }
        : undefined,
    },
    include: {
      translations: true,
      options: { include: { translations: true } },
    },
  });

  return attribute;
}

export async function updateAttribute(
  id: string,
  data: {
    code?: string;
    type?: AttributeType;
    unit?: string;
    filterable?: boolean;
    searchable?: boolean;
    variantAxis?: boolean;
    sortOrder?: number;
    translations?: Array<{
      locale: string;
      name: string;
    }>;
  }
) {
  return await db.$transaction(async (tx) => {
    if (data.code) {
      const existing = await tx.attributeDefinition.findFirst({
        where: { code: data.code, NOT: { id } },
      });
      if (existing) {
        throw new Error(`Kod "${data.code}" bilan atribut allaqachon mavjud`);
      }
    }

    if (data.translations) {
      for (const trans of data.translations) {
        await tx.attributeTranslation.upsert({
          where: { attributeId_locale: { attributeId: id, locale: trans.locale } },
          update: { name: trans.name },
          create: { attributeId: id, ...trans },
        });
      }
    }

    const updateData: any = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.filterable !== undefined) updateData.filterable = data.filterable;
    if (data.searchable !== undefined) updateData.searchable = data.searchable;
    if (data.variantAxis !== undefined) updateData.variantAxis = data.variantAxis;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    const attribute = await tx.attributeDefinition.update({
      where: { id },
      data: updateData,
      include: {
        translations: true,
        options: { include: { translations: true } },
      },
    });

    return attribute;
  });
}

export async function deleteAttribute(id: string) {
  const valuesCount = await db.productAttributeValue.count({
    where: { attributeId: id },
  });

  if (valuesCount > 0) {
    throw new Error('Atributni o\'chirib bo\'lmaydi: mahsulotlarda qiymatlar mavjud');
  }

  await db.attributeDefinition.delete({ where: { id } });
}

export async function addAttributeOption(
  attributeId: string,
  data: {
    code: string;
    sortOrder?: number;
    translations: Array<{
      locale: string;
      label: string;
    }>;
  }
) {
  const existing = await db.attributeOption.findUnique({
    where: { attributeId_code: { attributeId, code: data.code } },
  });

  if (existing) {
    throw new Error(`Kod "${data.code}" bilan variant allaqachon mavjud`);
  }

  return await db.attributeOption.create({
    data: {
      attributeId,
      code: data.code,
      sortOrder: data.sortOrder ?? 0,
      translations: {
        create: data.translations,
      },
    },
    include: { translations: true },
  });
}

export async function updateAttributeOption(
  optionId: string,
  data: {
    code?: string;
    sortOrder?: number;
    translations?: Array<{
      locale: string;
      label: string;
    }>;
  }
) {
  return await db.$transaction(async (tx) => {
    if (data.translations) {
      for (const trans of data.translations) {
        await tx.attributeOptionTranslation.upsert({
          where: { optionId_locale: { optionId, locale: trans.locale } },
          update: { label: trans.label },
          create: { optionId, ...trans },
        });
      }
    }

    const updateData: any = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    const option = await tx.attributeOption.update({
      where: { id: optionId },
      data: updateData,
      include: { translations: true },
    });

    return option;
  });
}

export async function deleteAttributeOption(optionId: string) {
  const variantOptionsCount = await db.productVariantOption.count({
    where: { optionId },
  });

  if (variantOptionsCount > 0) {
    throw new Error('Variantni o\'chirib bo\'lmaydi: mahsulot variantlarida ishlatilgan');
  }

  await db.attributeOption.delete({ where: { id: optionId } });
}

export async function getAttributesByCategory(categoryId: string, locale: string = 'uz') {
  const categoryAttrs = await db.categoryAttribute.findMany({
    where: { categoryId },
    include: {
      attribute: {
        include: {
          translations: { where: { locale } },
          options: {
            include: { translations: { where: { locale } } },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  return categoryAttrs.map((ca) => ({
    id: ca.attribute.id,
    code: ca.attribute.code,
    type: ca.attribute.type,
    unit: ca.attribute.unit,
    required: ca.required,
    sortOrder: ca.sortOrder,
    name: ca.attribute.translations[0]?.name || ca.attribute.code,
    options: ca.attribute.options.map((opt) => ({
      id: opt.id,
      code: opt.code,
      label: opt.translations[0]?.label || opt.code,
    })),
  }));
}

export function generateVariantCombinationKey(optionIds: string[]): string {
  return optionIds.sort().join('_');
}

export async function checkVariantCombinationUniqueness(
  productId: string,
  optionIds: string[],
  excludeVariantId?: string
): Promise<boolean> {
  const combinationKey = generateVariantCombinationKey(optionIds);

  const variants = await db.productVariant.findMany({
    where: {
      productId,
      ...(excludeVariantId ? { NOT: { id: excludeVariantId } } : {}),
    },
    include: {
      options: true,
    },
  });

  for (const variant of variants) {
    const existingKey = generateVariantCombinationKey(variant.options.map((o) => o.optionId));
    if (existingKey === combinationKey) {
      return false;
    }
  }

  return true;
}
