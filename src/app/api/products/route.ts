import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get('categoryId');

  const where: any = {};
  if (categoryId) where.categoryId = categoryId;

  const products = await db.product.findMany({
    where,
    include: { category: true, images: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      titleUz,
      titleRu,
      sku,
      slug,
      price,
      oldPrice,
      categoryId,
      descriptionUz,
      descriptionRu,
      dimensions,
      thickness,
      material,
      weight,
      yieldPerCast,
      durabilityCasts,
      isBestseller,
      isNew,
      inStock,
      resultImage,
      images,
    } = body;

    const product = await db.product.create({
      data: {
        titleUz,
        titleRu,
        sku,
        slug: slug || sku.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        categoryId,
        descriptionUz: descriptionUz || '',
        descriptionRu: descriptionRu || '',
        dimensions,
        thickness,
        material,
        weight,
        yieldPerCast: yieldPerCast ? Number(yieldPerCast) : null,
        durabilityCasts: durabilityCasts ? Number(durabilityCasts) : null,
        isBestseller: !!isBestseller,
        isNew: !!isNew,
        inStock: !!inStock,
        resultImage,
        images: {
          create: (images || []).map((url: string, index: number) => ({
            url,
            order: index,
          })),
        },
      },
      include: { images: true },
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Product Create error:', error);
    return NextResponse.json({ error: error.message || 'Error creating product' }, { status: 500 });
  }
}
