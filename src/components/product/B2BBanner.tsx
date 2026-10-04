'use client';

import React, { useState } from 'react';
import { Building2, ArrowRight, CheckCircle2, Phone } from 'lucide-react';
import { Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { LeadModal } from '@/components/lead/LeadModal';
import { Container } from '@/components/ui/Container';
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';

/**
 * B2B banneri (bosh sahifa).
 *
 * P0-8 qoidasi: isbotlanmagan chegirma raqamlari yozilmaydi. Ilgari bu yerda
 * "100+ dona −5%", "500+ dona −10%" kabi da'volar bor edi — bunday shkala
 * narx siyosatida tasdiqlanmagan, shuning uchun hajm bo'yicha individual
 * shartlar tili ishlatiladi.
 */
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
                {lang === 'ru'
                  ? 'Оптовые условия для цехов и производителей'
                  : 'Sex va ishlab chiqaruvchilar uchun ulgurji shartlar'}
              </h2>

              <p className="text-sm text-ink-soft leading-relaxed">
                {lang === 'ru'
                  ? 'Для цехов брусчатки и бетонных изделий: условия зависят от объёма, модели и материала (PP/ABS). Договор, счёт-фактура и доставка по Узбекистану.'
                  : 'Bruschatka sexlari va beton mahsulotlari uchun: shartlar hajm, model va materialga (PP/ABS) bog‘liq. Shartnoma, hisob-faktura va O‘zbekiston bo‘ylab yetkazib berish.'}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface text-emerald-700 text-[12px] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {lang === 'ru' ? 'Цена зависит от объёма' : 'Narx hajmga bog‘liq'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface text-ink-soft text-[12px] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {lang === 'ru' ? 'Договор и счёт-фактура' : 'Shartnoma va hisob-faktura'}
                </span>
              </div>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
              <Button onClick={() => setOpen(true)} size="lg" className="gap-2">
                <span>{lang === 'ru' ? 'Запросить оптовые условия' : 'Ulgurji shartlarni so‘rash'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <a
                href={`tel:${COMPANY_CONTACTS.phoneRaw}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-surface text-ink font-semibold text-sm hover:bg-[#F7F8FA] transition-colors min-h-[48px]"
              >
                <Phone className="w-4 h-4" />
                <span>{COMPANY_CONTACTS.phoneDisplay}</span>
              </a>
            </div>
          </div>
        </Container>
      </section>

      {open && <LeadModal isOpen onClose={() => setOpen(false)} lang={lang} type="B2B_WHOLESALE" />}
    </>
  );
};
