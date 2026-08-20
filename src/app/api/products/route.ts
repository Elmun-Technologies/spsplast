import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession, createAuditLog } from '@/lib/auth';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'uz';

  try {
    const products = await db.product.findMany({
      where: { status: 'ACTIVE' },
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat etilmagan (Unauthorized)' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      sku,
      titleUz,
      titleRu,
      price,
      oldPrice,
      categoryId,
      descriptionUz,
      descriptionRu,
      yieldPerCast,
      durabilityCasts,
      moldImageUrl,
      resultImageUrl,
    } = body;

    if (!sku || !titleUz || !price) {
      return NextResponse.json({ error: 'SKU, Nomi va Narxi kiritilishi shart' }, { status: 400 });
    }

    const slugUz = titleUz.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slugRu = (titleRu || titleUz).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const product = await db.product.create({
      data: {
        sku,
        status: 'ACTIVE',
        basePrice: Math.round(Number(price)),
        compareAtPrice: oldPrice ? Math.round(Number(oldPrice)) : null,
        yieldPerCast: yieldPerCast ? Number(yieldPerCast) : null,
        durabilityCasts: durabilityCasts ? Number(durabilityCasts) : null,
        translations: {
          create: [
            {
              locale: 'uz',
              name: titleUz,
              slug: slugUz,
              description: descriptionUz || '',
            },
            {
              locale: 'ru',
              name: titleRu || titleUz,
              slug: slugRu,
              description: descriptionRu || descriptionUz || '',
            },
          ],
        },
        categories: categoryId
          ? {
              create: [{ categoryId }],
            }
          : undefined,
        media: {
          create: [
            ...(moldImageUrl ? [{ type: 'MOLD', url: moldImageUrl, sortOrder: 1 }] : []),
            ...(resultImageUrl ? [{ type: 'FINISHED_RESULT', url: resultImageUrl, sortOrder: 2 }] : []),
          ],
        },
      },
      include: { translations: true, media: true },
    });

    await createAuditLog(session.adminId, 'PRODUCT_CREATE', 'Product', product.id, { sku: product.sku });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Product Creation Error:', error);
    return NextResponse.json({ error: error.message || 'Server xatosi' }, { status: 500 });
  }
}
