import React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function TermsPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);

  return (
    <div className="bg-[#F8F9FA] min-h-screen text-gray-900 py-8">
      <Container>
        <Breadcrumbs lang={lang} items={[{ label: dict.footer.terms, active: true }]} className="mb-6" />
        <div className="max-w-3xl bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{dict.footer.terms}</h1>
            <p className="text-xs text-gray-500 mt-1">Ommaviy Shartnoma-Oferta</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">1. Shartnoma obyekti</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              SPS (Sotuvchi) ushbu internet-magazin orqali Xaridorga plastik qoliplar va qurilish mahsulotlarini sotish va yetkazib berish xizmatini ko‘rsatadi.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">2. Buyurtma berish va To‘lov</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Xaridor buyurtmani sayt orqali rasmiylashtiradi. Narxlar so‘mda ko‘rsatilgan. To‘lov naqd, Click/Payme yoki bank o‘tkazmasi orqali amalga oshiriladi.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gray-900">3. Yetkazib berish</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Yetkazib berish 1-3 kun ichida, Toshkent bo‘ylab kuryer, viloyatlarga pochta/yuk. 1,000,000 so‘mdan yuqori buyurtmalar bepul.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
