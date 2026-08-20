import React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';

export default function TermsPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 text-gray-300 text-sm leading-relaxed">
      <h1 className="text-3xl font-black text-white">{dict.footer.terms}</h1>
      <p className="text-xs text-gray-400">Ommaviy Shartnoma-Oferta</p>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">1. Shartnoma obyekti</h2>
        <p>
          SPS PLAST (Sotuvchi) ushbu internet-magazin orqali Xaridorga plastik qoliplar va qurilish mahsulotlarini sotish va yetkazib berish xizmatini ko‘rsatadi.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">2. Buyurtma berish va To‘lov</h2>
        <p>
          Xaridor buyurtmani sayt orqali rasmiylashtiradi. Narxlar so‘mda ko‘rsatilgan. To‘lov naqd, Click/Payme yoki bank o‘tkazmasi orqali amalga oshiriladi.
        </p>
      </section>
    </div>
  );
}
