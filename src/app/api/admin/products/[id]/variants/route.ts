import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession, createAuditLog } from '@/lib/auth';
import { checkVariantCombinationUniqueness, generateVariantCombinationKey } from '@/lib/services/attributeService';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const variants = await db.productVariant.findMany({
      where: { productId: id },
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
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ variants });
  } catch (error) {
    return NextResponse.json({ error: 'Variantlarni yuklashda xatolik' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { sku, price, compareAtPrice, stockQty, status, optionIds, mediaUrls } = body;

    if (!sku || !price) {
      return NextResponse.json({ error: 'SKU va narx talab qilinadi' }, { status: 400 });
    }

    const existingSku = await db.productVariant.findUnique({ where: { sku } });
    if (existingSku) {
      return NextResponse.json({ error: 'Bu SKU allaqachon mavjud' }, { status: 400 });
    }

    if (optionIds && optionIds.length > 0) {
      const isUnique = await checkVariantCombinationUniqueness(id, optionIds);
      if (!isUnique) {
        return NextResponse.json({ error: 'Bu kombinatsiya allaqachon mavjud' }, { status: 400 });
      }
    }

    const variant = await db.$transaction(async (tx) => {
      const created = await tx.productVariant.create({
        data: {
          productId: id,
          sku,
          price: Math.round(price),
          compareAtPrice: compareAtPrice ? Math.round(compareAtPrice) : null,
          stockQty: stockQty || 10,
          status: status || 'ACTIVE',
          options: optionIds
            ? {
                create: optionIds.map((optionId: string) => ({
                  optionId,
                })),
              }
            : undefined,
          media: mediaUrls
            ? {
                create: mediaUrls.map((m: any, idx: number) => ({
                  type: m.type || 'GALLERY',
                  url: m.url,
                  alt: m.alt,
                  sortOrder: idx,
                })),
              }
            : undefined,
        },
        include: {
          options: { include: { option: true } },
          media: true,
        },
      });

      return created;
    });

    await createAuditLog(session.adminId, 'VARIANT_CREATE', 'ProductVariant', variant.id, { sku });

    return NextResponse.json({ success: true, variant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server xatosi' }, { status: 500 });
  }
}
