import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createAuditLog, getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Bitta sharhni moderatsiya qilish.
 *
 * PATCH — holatni o'zgartirish (tasdiqlash / rad etish / qaytarish).
 * DELETE — butunlay o'chirish (spam, haqorat).
 *
 * `/api/admin/*` yo'llari `src/middleware.ts` dagi CSRF darvozasidan o'tadi,
 * shuning uchun bu yerda qo'shimcha origin tekshiruvi kerak emas; sessiya esa
 * har bir so'rovda qayta o'qiladi.
 */

const patchSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED'], {
    errorMap: () => ({ message: 'Holat PENDING, APPROVED yoki REJECTED bo‘lishi kerak' }),
  }),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat etilmagan (Unauthorized)' }, { status: 401 });
  }

  const { id } = await params;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'So‘rov formati noto‘g‘ri (JSON kutilgan)' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Holat noto‘g‘ri' },
      { status: 400 }
    );
  }

  const { status } = parsed.data;

  try {
    const review = await db.productReview.update({
      where: { id },
      data: {
        status,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        rejectedAt: status === 'REJECTED' ? new Date() : null,
      },
    });

    await createAuditLog(session.adminId, `REVIEW_${status}`, 'ProductReview', review.id, {
      productId: review.productId,
      rating: review.rating,
    });

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    // Prisma P2025 = yozuv topilmadi (o'chirilgan yoki noto'g'ri id).
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Sharh topilmadi' }, { status: 404 });
    }
    console.error('Review PATCH Error:', error);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Ruxsat etilmagan (Unauthorized)' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const review = await db.productReview.delete({ where: { id } });
    await createAuditLog(session.adminId, 'REVIEW_DELETE', 'ProductReview', id, {
      productId: review.productId,
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Sharh topilmadi' }, { status: 404 });
    }
    console.error('Review DELETE Error:', error);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
