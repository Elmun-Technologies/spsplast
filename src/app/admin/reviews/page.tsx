import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import ReviewModerationList, { AdminReview } from '@/components/admin/ReviewModerationList';

export const dynamic = 'force-dynamic';

/**
 * Sharhlar moderatsiyasi (docs/MADANI-RAQOBAT-AUDITI.md, P0-4).
 *
 * Saytda faqat `APPROVED` sharhlar ko'rinadi; bu sahifa esa navbatni ko'rsatadi:
 * tasdiqlash, rad etish yoki spamni o'chirish.
 */
export default async function AdminReviewsPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const reviews = await db.productReview.findMany({
    orderBy: { createdAt: 'desc' },
    take: 300,
    include: {
      product: {
        select: {
          sku: true,
          translations: { select: { locale: true, name: true, slug: true } },
        },
      },
    },
  });

  const mapped: AdminReview[] = reviews.map((review) => {
    const uz = review.product?.translations.find((t) => t.locale === 'uz');
    const fallback = review.product?.translations[0];

    return {
      id: review.id,
      name: review.name,
      phone: review.phone,
      rating: review.rating,
      text: review.text,
      status: review.status,
      createdAt: review.createdAt.toISOString(),
      productName: uz?.name || fallback?.name || review.product?.sku || 'Mahsulot',
      productSlug: uz?.slug || fallback?.slug || null,
    };
  });

  const pendingCount = mapped.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Mijoz sharhlari</h1>
          <p className="text-xs text-gray-400 mt-1">
            Jami {mapped.length} ta sharh
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                {pendingCount} ta moderatsiya kutmoqda
              </span>
            )}
          </p>
        </div>
        <Link
          href="/uz"
          target="_blank"
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Saytda qanday ko‘rinadi →
        </Link>
      </div>

      <div className="bg-brand-card/50 border border-brand-border rounded-2xl p-4">
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Tasdiqlangan sharhlar mahsulot sahifasida ko‘rinadi va <span className="text-gray-200">AggregateRating</span>{' '}
          (yulduzli reyting) schema.org belgisiga qo‘shiladi. Mijoz telefon raqami faqat shu sahifada
          ko‘rinadi — saytda hech qachon chiqmaydi.
        </p>
      </div>

      <ReviewModerationList reviews={mapped} />
    </div>
  );
}
