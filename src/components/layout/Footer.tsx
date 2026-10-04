'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, Send, ArrowUpRight, ShieldCheck, CreditCard, Truck, Clock, FileDown } from 'lucide-react';
import { getDictionary, Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';

interface FooterProps {
  lang: Locale;
}

const CATALOG_LINKS = [
  { slug: 'bruschatka-qoliplari', uz: 'Bruschatka qoliplari', ru: 'Формы для брусчатки' },
  { slug: 'plitka-qoliplari', uz: 'Plitka qoliplari', ru: 'Формы для плитки' },
  { slug: 'bordyur-qoliplari', uz: 'Bordyur qoliplari', ru: 'Формы для бордюров' },
  { slug: 'fasad-dekor', uz: 'Fasad dekor', ru: 'Фасадный декор' },
];

/**
 * Light footer: same surface language as the rest of the storefront (white
 * panel on the grey page, hairline divider, quiet link colours) instead of the
 * previous all-black industrial block.
 */
export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const dict = getDictionary(lang);

  return (
    <footer className="bg-surface border-t border-line pt-14 pb-10 mt-2">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-10">

        {/* Top row: brand + primary contacts */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-10 border-b border-line gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo-96.png"
                alt="SPS — Stone Profy Servise"
                width={40}
                height={40}
                className="w-10 h-10 rounded-[10px] object-cover"
              />
              <div>
                <div className="text-[17px] font-bold text-ink leading-none">SPS</div>
                <div className="text-[12px] text-ink-sub mt-1">Stone Profy Servise</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-soft text-[12px] text-ink-soft">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {lang === 'ru' ? 'Качественное сырьё' : 'Sifatli xomashyo'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-soft text-[12px] text-ink-soft">
                <Truck className="w-3.5 h-3.5 text-ink-sub" />
                {lang === 'ru' ? 'Доставка по стране' : 'O‘zbekiston bo‘ylab yetkazish'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-soft text-[12px] text-ink-soft">
                <CreditCard className="w-3.5 h-3.5 text-ink-sub" />
                Click / Payme / {lang === 'ru' ? 'наличные' : 'naqd'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <a
              href={`tel:${COMPANY_CONTACTS.phoneRaw}`}
              onClick={() => trackEvent('phone_click', { location: 'footer' })}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-ink text-white font-semibold text-sm hover:bg-black transition-colors rounded-full min-h-[48px]"
            >
              <Phone className="w-4 h-4" />
              <span>{COMPANY_CONTACTS.phoneDisplay}</span>
            </a>
            <a
              href={COMPANY_CONTACTS.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('telegram_click', { location: 'footer' })}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-surface-soft text-ink font-semibold text-sm hover:bg-[#E9EDF3] transition-colors rounded-full min-h-[48px]"
            >
              <Send className="w-4 h-4" />
              <span>Telegram</span>
              <ArrowUpRight className="w-4 h-4 text-ink-sub" />
            </a>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 py-10 border-b border-line">

          <div className="lg:col-span-2 space-y-4">
            <p className="text-[12px] font-bold text-ink-sub uppercase tracking-wider">
              {lang === 'ru' ? 'О компании' : 'Ishlab chiqaruvchi'}
            </p>
            <p className="text-sm text-ink-soft leading-relaxed max-w-md">{dict.footer.desc}</p>
            <div className="pt-1 text-sm text-ink-soft space-y-2.5">
              <a
                href={COMPANY_CONTACTS.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 hover:text-brand-red transition-colors"
              >
                <MapPin className="w-4 h-4 text-ink-sub shrink-0 mt-0.5" />
                <span>{lang === 'ru' ? COMPANY_CONTACTS.addressRu : COMPANY_CONTACTS.addressUz}</span>
              </a>
              <a
                href={`mailto:${COMPANY_CONTACTS.email}`}
                className="flex items-center gap-2.5 hover:text-brand-red transition-colors"
              >
                <Mail className="w-4 h-4 text-ink-sub shrink-0" />
                <span>{COMPANY_CONTACTS.email}</span>
              </a>
              <p className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-ink-sub shrink-0" />
                <span>{lang === 'ru' ? COMPANY_CONTACTS.workHoursRu : COMPANY_CONTACTS.workHoursUz}</span>
              </p>

              {/* Barcha raqamlar: ilgari faqat bitta raqam ko'rinardi, mijoz
                  ombor/savdo raqamini topa olmasdi (P0-3). */}
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-ink-sub shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {COMPANY_CONTACTS.phones.map((phone) => (
                    <a
                      key={phone.raw}
                      href={`tel:${phone.raw}`}
                      onClick={() => trackEvent('phone_click', { location: 'footer_list' })}
                      className="flex flex-wrap items-baseline gap-x-2 hover:text-brand-red transition-colors"
                    >
                      <span className="font-semibold text-ink">{phone.display}</span>
                      <span className="text-[12px] text-ink-sub">
                        {lang === 'ru' ? phone.label.ru : phone.label.uz}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-ink uppercase tracking-wider">
              {dict.footer.catalog}
            </h3>
            <ul className="space-y-2.5 text-sm text-ink-soft">
              <li>
                <Link href={`/${lang}/catalog`} className="hover:text-brand-red transition-colors">
                  {lang === 'ru' ? 'Все товары' : 'Barcha mahsulotlar'}
                </Link>
              </li>
              {CATALOG_LINKS.map((item) => (
                <li key={item.slug}>
                  <Link href={`/${lang}/catalog?category=${item.slug}`} className="hover:text-brand-red transition-colors">
                    {lang === 'ru' ? item.ru : item.uz}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Katalog raqibda "yuklab olish" deb yozilgan, lekin PDF bermaydi.
                Bizda fayl haqiqiy va hajmi oldindan aytilgan (P0-7). */}
            <a
              href="/catalog/pdf/sps-qoliplar-katalogi-2026.pdf"
              download
              onClick={() => trackEvent('catalog_pdf_download', { location: 'footer' })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-surface-soft text-ink text-[13px] font-semibold hover:bg-[#E9EDF3] transition-colors"
            >
              <FileDown className="w-4 h-4 text-brand-red" />
              <span>{dict.footer.downloadCatalog}</span>
            </a>
            <p className="text-[11px] text-ink-sub">{dict.footer.catalogPdfMeta}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-ink uppercase tracking-wider">
              {dict.footer.company}
            </h3>
            <ul className="space-y-2.5 text-sm text-ink-soft">
              <li><Link href={`/${lang}/about`} className="hover:text-brand-red transition-colors">{dict.nav.about}</Link></li>
              <li><Link href={`/${lang}/production`} className="hover:text-brand-red transition-colors">{dict.nav.production}</Link></li>
              <li><Link href={`/${lang}/contact`} className="hover:text-brand-red transition-colors">{dict.nav.contact}</Link></li>
              <li><Link href={`/${lang}/blog`} className="hover:text-brand-red transition-colors">{dict.nav.blog}</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-[12px] font-bold text-ink uppercase tracking-wider">
              {dict.footer.legal}
            </h3>
            <ul className="space-y-2.5 text-sm text-ink-soft">
              <li><Link href={`/${lang}/privacy`} className="hover:text-brand-red transition-colors">{dict.footer.privacy}</Link></li>
              <li><Link href={`/${lang}/terms`} className="hover:text-brand-red transition-colors">{dict.footer.terms}</Link></li>
              <li><Link href={`/${lang}/how-to-order`} className="hover:text-brand-red transition-colors">{dict.footer.howToOrder}</Link></li>
              <li><Link href={`/${lang}/delivery-payment`} className="hover:text-brand-red transition-colors">{dict.footer.deliveryTerms}</Link></li>
              <li><Link href={`/${lang}/returns`} className="hover:text-brand-red transition-colors">{dict.footer.returns}</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col lg:flex-row items-center justify-between gap-4 text-[12px] text-ink-sub">
          <p>© {new Date().getFullYear()} Stone Profy Servise. {dict.footer.rights}</p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {/* To'lov belgilari faqat haqiqatda mavjud usullar: checkout faqat
                naqd, Click/Payme va bank o'tkazmasini qabul qiladi. Ilgari bu
                yerda "UZUM" ham bor edi — mavjud bo'lmagan usul (P0-8). */}
            {['CLICK', 'PAYME', 'NAQD'].map((p) => (
              <span key={p} className="px-3 py-1.5 bg-surface-soft rounded-full text-[11px] font-semibold text-ink-soft">
                {p}
              </span>
            ))}
            <span className="text-[#D7DEE8]">|</span>
            <span>{lang === 'ru' ? 'Ташкент, Узбекистан' : 'Toshkent, O‘zbekiston'}</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
