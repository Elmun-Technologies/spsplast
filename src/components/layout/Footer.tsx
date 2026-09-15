'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Send, ArrowUpRight, ShieldCheck, CreditCard, Truck } from 'lucide-react';
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
              <div className="w-10 h-10 rounded-[14px] bg-brand-red flex items-center justify-center font-bold text-white text-[13px]">
                SPS
              </div>
              <div>
                <div className="text-[17px] font-bold text-ink leading-none">SPS Plast</div>
                <div className="text-[12px] text-ink-sub mt-1">
                  {lang === 'ru' ? 'Формы и фасадный декор' : 'Qoliplar va fasad dekor'}
                </div>
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
              <p className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-ink-sub shrink-0" />
                <span>{lang === 'ru' ? COMPANY_CONTACTS.addressRu : COMPANY_CONTACTS.addressUz}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-ink-sub shrink-0" />
                <span>{COMPANY_CONTACTS.email}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-ink-sub shrink-0" />
                <span>{COMPANY_CONTACTS.phoneDisplay}</span>
              </p>
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
              <li><Link href={`/${lang}/delivery-payment`} className="hover:text-brand-red transition-colors">{dict.footer.deliveryTerms}</Link></li>
              <li><Link href={`/${lang}/returns`} className="hover:text-brand-red transition-colors">{dict.footer.returns}</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom row */}
        <div className="pt-8 flex flex-col lg:flex-row items-center justify-between gap-4 text-[12px] text-ink-sub">
          <p>© {new Date().getFullYear()} SPS Plast. {dict.footer.rights}</p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {['CLICK', 'PAYME', 'UZUM'].map((p) => (
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
