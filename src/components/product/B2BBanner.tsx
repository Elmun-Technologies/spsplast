'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, ArrowRight, CheckCircle2, Phone } from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { B2BModal } from './B2BModal';
import { Container } from '@/components/ui/Container';

interface B2BBannerProps {
  lang: Locale;
}

export const B2BBanner: React.FC<B2BBannerProps> = ({ lang }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="py-6">
        <Container>
          <div className="relative overflow-hidden rounded-[24px] bg-[#E9EDF6] p-6 sm:p-9 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="absolute -right-16 -top-20 w-80 h-80 rounded-full bg-surface/60 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface text-ink-soft text-[12px] font-semibold">
                <Building2 className="w-4 h-4 text-brand-red" />
                {lang === 'ru' ? 'Для бизнеса' : 'Biznes uchun'}
              </div>

              <h2 className="text-[24px] sm:text-[30px] font-bold text-ink tracking-[-0.025em] leading-tight">
                {lang === 'ru' ? 'Оптовые цены для цехов и производителей' : 'Sex va ishlab chiqaruvchilar uchun ulgurji narxlar'}
              </h2>

              <p className="text-sm text-ink-soft leading-relaxed">
                {lang === 'ru'
                  ? 'Для цехов брусчатки и бетонных изделий — индивидуальные скидки от 100 шт, договор, счет-фактура и быстрая доставка по Узбекистану.'
                  : 'Bruschatka sexlari va beton mahsulotlari uchun — 100 donadan boshlab individual chegirmalar, shartnoma, hisob-faktura va tezkor yetkazib berish.'}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface text-emerald-700 text-[12px] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100+ dona −5%
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface text-brand-red text-[12px] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 500+ dona −10%
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface text-ink-soft text-[12px] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Shartnoma + hisob-faktura
                </span>
              </div>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
              <Button onClick={() => setOpen(true)} size="lg" className="gap-2">
                <span>{lang === 'ru' ? 'Запросить оптовую цену' : 'Ulgurji narx so‘rash'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <a
                href="tel:+998983007772"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-surface text-ink font-semibold text-sm hover:bg-[#F7F8FA] transition-colors min-h-[48px]"
              >
                <Phone className="w-4 h-4" />
                <span>+998 (98) 300-77-72</span>
              </a>
            </div>
          </div>
        </Container>
      </section>

      <B2BModal isOpen={open} onClose={() => setOpen(false)} lang={lang} />
    </>
  );
};
