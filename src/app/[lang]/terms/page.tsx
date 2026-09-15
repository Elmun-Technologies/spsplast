import React from 'react';
import { getDictionary, Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function TermsPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = getDictionary(lang);

  return (
    <div className="bg-surface-page min-h-screen text-ink py-8">
      <Container>
        <Breadcrumbs lang={lang} items={[{ label: dict.footer.terms, active: true }]} className="mb-6" />
        <div className="max-w-3xl bg-surface border border-line rounded-[20px] p-6 sm:p-8 shadow-card space-y-6">
          <div>
            <h1 className="text-[30px] sm:text-[38px] font-bold text-ink tracking-[-0.03em] leading-[1.15]">{dict.footer.terms}</h1>
            <p className="text-xs text-ink-sub mt-1">Ommaviy Shartnoma-Oferta</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">1. Shartnoma obyekti</h2>
            <p className="text-sm text-ink-soft leading-relaxed">
              SPS (Sotuvchi) ushbu internet-magazin orqali Xaridorga plastik qoliplar va qurilish mahsulotlarini sotish va yetkazib berish xizmatini ko‘rsatadi.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">2. Buyurtma berish va To‘lov</h2>
            <p className="text-sm text-ink-soft leading-relaxed">
              Xaridor buyurtmani sayt orqali rasmiylashtiradi. Narxlar so‘mda ko‘rsatilgan. To‘lov naqd, Click/Payme yoki bank o‘tkazmasi orqali amalga oshiriladi.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-ink">3. Yetkazib berish</h2>
            <p className="text-sm text-ink-soft leading-relaxed">
              Yetkazib berish 1-3 kun ichida, Toshkent bo‘ylab kuryer, viloyatlarga pochta/yuk. 1,000,000 so‘mdan yuqori buyurtmalar bepul.
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
