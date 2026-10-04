'use client';

import React, { useState } from 'react';
import { Star, Check, X, Trash2, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

export interface AdminReview {
  id: string;
  name: string;
  phone: string | null;
  rating: number;
  text: string;
  status: string;
  createdAt: string;
  productName: string;
  productSlug: string | null;
}

interface ReviewModerationListProps {
  reviews: AdminReview[];
}

const STATUS_STYLES: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  PENDING: {
    label: 'Kutilmoqda',
    icon: <Clock className="w-3 h-3" />,
    className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  APPROVED: {
    label: 'Tasdiqlangan',
    icon: <CheckCircle2 className="w-3 h-3" />,
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  REJECTED: {
    label: 'Rad etilgan',
    icon: <XCircle className="w-3 h-3" />,
    className: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
};

/**
 * Sharhlarni moderatsiya qilish ro'yxati.
 *
 * Har bir amal `/api/admin/reviews/:id` ga yuboriladi — bu yo'l `middleware.ts`
 * dagi CSRF tekshiruvidan o'tadi, sessiya esa API tomonda qayta tekshiriladi.
 * Muvaffaqiyatli javobdan keyin ro'yxat lokal holatda yangilanadi (sahifa
 * qayta yuklanmaydi).
 */
export default function ReviewModerationList({ reviews }: ReviewModerationListProps) {
  const [items, setItems] = useState<AdminReview[]>(reviews);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [error, setError] = useState<string | null>(null);

  const visibleItems = filter === 'ALL' ? items : items.filter((r) => r.status === filter);

  const counts = {
    ALL: items.length,
    PENDING: items.filter((r) => r.status === 'PENDING').length,
    APPROVED: items.filter((r) => r.status === 'APPROVED').length,
    REJECTED: items.filter((r) => r.status === 'REJECTED').length,
  };

  async function updateStatus(id: string, status: 'APPROVED' | 'REJECTED' | 'PENDING') {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Amalni bajarib bo‘lmadi');
      setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (e: any) {
      setError(e?.message || 'Xatolik yuz berdi');
    } finally {
      setBusyId(null);
    }
  }

  async function removeReview(id: string) {
    if (!window.confirm('Bu sharh butunlay o‘chiriladi. Davom etilsinmi?')) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'O‘chirib bo‘lmadi');
      setItems((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      setError(e?.message || 'Xatolik yuz berdi');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtr tablari */}
      <div className="flex flex-wrap items-center gap-2">
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
              filter === key
                ? 'bg-brand-red/20 border-brand-red/40 text-white'
                : 'bg-brand-card border-brand-border text-gray-400 hover:text-white'
            }`}
          >
            {key === 'ALL' ? 'Barchasi' : STATUS_STYLES[key].label}
            <span className="ml-2 text-[10px] text-gray-400">{counts[key]}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium">
          {error}
        </div>
      )}

      {visibleItems.length === 0 ? (
        <div className="bg-brand-card border border-brand-border rounded-2xl p-10 text-center">
          <p className="text-sm font-bold text-white">Bu bo‘limda sharh yo‘q</p>
          <p className="text-xs text-gray-400 mt-1">
            Mijoz sharh yozganda shu yerda paydo bo‘ladi va Telegram orqali xabar keladi.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((review) => {
            const statusStyle = STATUS_STYLES[review.status] || STATUS_STYLES.PENDING;
            const isBusy = busyId === review.id;

            return (
              <div
                key={review.id}
                className="bg-brand-card border border-brand-border rounded-2xl p-5 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{review.name}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusStyle.className}`}
                      >
                        {statusStyle.icon}
                        {statusStyle.label}
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(review.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      <span className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </span>
                      <span className="text-brand-red font-semibold">{review.productName}</span>
                      {review.phone && <span className="font-mono text-gray-500">{review.phone}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isBusy && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    {review.status !== 'APPROVED' && (
                      <button
                        onClick={() => updateStatus(review.id, 'APPROVED')}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 disabled:opacity-50 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Tasdiqlash
                      </button>
                    )}
                    {review.status !== 'REJECTED' && (
                      <button
                        onClick={() => updateStatus(review.id, 'REJECTED')}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold hover:bg-amber-500/25 disabled:opacity-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Rad etish
                      </button>
                    )}
                    <button
                      onClick={() => removeReview(review.id)}
                      disabled={isBusy}
                      aria-label="Sharhni o‘chirish"
                      className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{review.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
