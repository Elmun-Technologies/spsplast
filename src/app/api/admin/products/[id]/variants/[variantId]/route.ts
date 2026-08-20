import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession, createAuditLog } from '@/lib/auth';
import { checkVariantCombinationUniqueness } from '@/lib/services/attributeService';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const { variantId } = await params;

  try {
    const variant = await db.productVariant.findUnique({
      where: { id: variantId },
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
    });

    if (!variant) {
      return NextResponse.json({ error: 'Variant topilmadi' }, { status: 404 });
    }

    return NextResponse.json({ variant });
  } catch (error) {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 401 });
  }

  const { id, variantId } = await params;

  try {
    const body = await req.json();
    const { sku, price, compareAtPrice, stockQty, status, optionIds, mediaUrls } = body;

    if (optionIds && optionIds.length > 0) {
      const isUnique = await checkVariantCombinationUniqueness(id, optionIds, variantId);
      if (!isUnique) {
        return NextResponse.json({ error: 'Bu kombinatsiya allaqachon mavjud' }, { status: 400 });
      }
    }

    const variant = await db.$transaction(async (tx) => {
      if (optionIds) {
        await tx.productVariantOption.deleteMany({ where: { variantId } });
        await tx.productVariantOption.createMany({
          data: optionIds.map((optionId: string) => ({
            variantId,
            optionId,
          })),
        });
      }

      if (mediaUrls) {
        await tx.productMedia.deleteMany({ where: { variantId } });
        await tx.productMedia.createMany({
          data: mediaUrls.map((m: any, idx: number) => ({
            productId: id,
            variantId,
            type: m.type || 'GALLERY',
            url: m.url,
            alt: m.alt,
            sortOrder: idx,
          })),
        });
      }

      const updateData: any = {};
      if (sku !== undefined) updateData.sku = sku;
      if (price !== undefined) updateData.price = Math.round(price);
      if (compareAtPrice !== undefined) updateData.compareAtPrice = compareAtPrice ? Math.round(compareAtPrice) : null;
      if (stockQty !== undefined) updateData.stockQty = stockQty;
      if (status !== undefined) updateData.status = status;

      return await tx.productVariant.update({
        where: { id: variantId },
        data: updateData,
        include: {
          options: { include: { option: true } },
          media: true,
        },
      });
    });

    await createAuditLog(session.adminId, 'VARIANT_UPDATE', 'ProductVariant', variantId, { sku: variant.sku });

    return NextResponse.json({ success: true, variant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server xatosi' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat etilmagan' }, { status: 401 });
  }

  const { variantId } = await params;

  try {
    const orderItemsCount = await db.orderItem.count({ where: { variantId } });

    if (orderItemsCount > 0) {
      await db.productVariant.update({
        where: { id: variantId },
        data: { status: 'ARCHIVED' },
      });
      return NextResponse.json({ success: true, archived: true });
    }

    await db.productVariant.delete({ where: { id: variantId } });
    await createAuditLog(session.adminId, 'VARIANT_DELETE', 'ProductVariant', variantId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server xatosi' }, { status: 500 });
  }
}
