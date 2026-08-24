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
          <div className="relative overflow-hidden bg-gray-900 rounded-2xl border border-gray-800 p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 border border-white/20 text-white text-xs font-semibold tracking-wide">
                <Building2 className="w-4 h-4 text-brand-red" />
                B2B Wholesale
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                {lang === 'ru' ? 'Оптовые цены для цехов и производителей' : 'Sex va ishlab chiqaruvchilar uchun ulgurji narxlar'}
              </h2>

              <p className="text-sm text-gray-300 leading-relaxed">
                {lang === 'ru'
                  ? 'Для цехов брусчатки и бетонных изделий — индивидуальные скидки от 100 шт, договор, счет-фактура и быстрая доставка по Узбекистану.'
                  : 'Bruschatka sexlari va beton mahsulotlari uchun — 100 donadan boshlab individual chegirmalar, shartnoma, hisob-faktura va tezkor yetkazib berish.'}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 100+ dona -5%
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-red/10 border border-brand-red/20 text-red-300 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 500+ dona -10%
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Shartnoma + Hisob-faktura
                </span>
              </div>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
              <Button onClick={() => setOpen(true)} size="lg" className="rounded-xl gap-2 font-bold min-h-[48px] bg-white text-black hover:bg-gray-100">
                <span>{lang === 'ru' ? 'Запросить оптовую цену' : 'Ulgurji narx so‘rash'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <a
                href="tel:+998901234567"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/15 transition-colors min-h-[48px]"
              >
                <Phone className="w-4 h-4" />
                <span>+998 (90) 123-45-67</span>
              </a>
            </div>
          </div>
        </Container>
      </section>

      <B2BModal isOpen={open} onClose={() => setOpen(false)} lang={lang} />
    </>
  );
};
