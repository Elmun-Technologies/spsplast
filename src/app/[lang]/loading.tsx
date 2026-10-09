import React from 'react';

/**
 * Yuklanish karkasi (skeleton).
 *
 * `loading.tsx` ga ham Next `params` uzatmaydi, shuning uchun bu yerda
 * lokalizatsiya qilinmaydi: faqat shakl (blok karkaslari). Skrinriyder uchun
 * `role="status"` + `aria-busy` qo'yildi, matn esa `sr-only` emas — chunki
 * til noma'lum. Karkas to'plamdagi eng og'ir sahifa (katalog setkasi)
 * siluetini takrorlaydi: sarlavha, promo qator, 2×4 (mobil) / 4×2 (desktop)
 * kartalar.
 */
export default function Loading() {
  return (
    <section className="skel-sec">
      <div className="wrap skel" role="status" aria-live="polite" aria-busy="true">
        <div className="skel-b skel-title" />
        <div className="skel-b skel-hero" />
        <div className="skel-row">
          {Array.from({ length: 8 }, (_, i) => (
            <div className="skel-b skel-card" key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
