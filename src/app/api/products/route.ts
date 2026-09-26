import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession, createAuditLog } from '@/lib/auth';
import { slugify } from '@/lib/slug';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') === 'ru' ? 'ru' : 'uz';

  // Bounded page size: an unbounded findMany over the whole catalog (with every
  // media row and category relation) is enough to OOM a serverless function.
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const rawTake = parseInt(searchParams.get('limit') || '48', 10);
  const take = Math.min(Math.max(1, Number.isFinite(rawTake) ? rawTake : 48), 100);
  const skip = (page - 1) * take;

  try {
    const [products, total] = await Promise.all([
      db.product.findMany({
        where: { status: 'ACTIVE' },
        include: {
          translations: { where: { locale } },
          media: { orderBy: { sortOrder: 'asc' }, take: 4 },
          categories: {
            include: {
              category: {
                include: { translations: { where: { locale } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      db.product.count({ where: { status: 'ACTIVE' } }),
    ]);

    return NextResponse.json({ products, total, page, pageSize: take });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

/** Slug that is unique for the locale, falling back to an SKU-derived suffix. */
async function uniqueSlug(locale: string, title: string, sku: string): Promise<string> {
  const base = slugify(title, slugify(sku, 'mahsulot'));

  const existing = await db.productTranslation.findFirst({
    where: { locale, slug: base },
    select: { id: true },
  });
  if (!existing) return base;

  const withSuffix = `${base}-${slugify(sku, Math.random().toString(36).slice(2, 8))}`;
  const clash = await db.productTranslation.findFirst({
    where: { locale, slug: withSuffix },
    select: { id: true },
  });
  return clash ? `${base}-${Date.now().toString(36)}` : withSuffix;
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

    // Transliteration-aware slugs: a Russian title used to collapse to ""
    // and blow up the @@unique([locale, slug]) index.
    const slugUz = await uniqueSlug('uz', titleUz, sku);
    const slugRu = await uniqueSlug('ru', titleRu || titleUz, sku);

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
