'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Send, Instagram, ArrowUpRight, ShieldCheck, CreditCard, Truck } from 'lucide-react';
import { getDictionary, Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';

interface FooterProps {
  lang: Locale;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const dict = getDictionary(lang);

  return (
    <footer className="bg-brand-darker text-neutral-400 border-t border-neutral-800 pt-16 pb-12">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10">

        {/* Top Dominant Branding Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end pb-12 border-b border-neutral-800 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-brand-red flex items-center justify-center font-mono font-bold text-white text-sm rounded-lg">
                SPS
              </div>
              <span className="font-mono text-xs text-neutral-400 tracking-widest uppercase">
                MANUFACTURING & INDUSTRIAL SUPPLY
              </span>
            </div>
            <h2 className="text-4xl sm:text-7xl font-black text-white uppercase tracking-tighter font-sans leading-none">
              SPS PLAST
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                300+ quyish kafolati
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
                <Truck className="w-3.5 h-3.5 text-brand-red" />
                O'zbekiston bo'ylab yetkazish
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                Click / Payme / Naqd
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <a
              href={`tel:${COMPANY_CONTACTS.phoneRaw}`}
              onClick={() => trackEvent('phone_click', { location: 'footer' })}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-black font-bold text-sm uppercase tracking-wider hover:bg-brand-red hover:text-white transition-colors rounded-xl"
            >
              <Phone className="w-4 h-4" />
              <span>{COMPANY_CONTACTS.phoneDisplay}</span>
            </a>
            <a
              href={COMPANY_CONTACTS.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('telegram_click', { location: 'footer' })}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-neutral-900 border border-neutral-700 text-white font-bold text-sm uppercase tracking-wider hover:border-white transition-colors rounded-xl"
            >
              <Send className="w-4 h-4 text-brand-red" />
              <span>Telegram</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Multi-column Editorial Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 py-12 border-b border-neutral-800/80">

          {/* Col 1: About */}
          <div className="lg:col-span-2 space-y-4">
            <p className="text-xs font-mono text-neutral-300 uppercase tracking-wider">
              {lang === 'ru' ? 'О КОМПАНИИ' : 'ISHLAB CHIQARUVCHI'}
            </p>
            <p className="text-sm text-neutral-400 leading-relaxed font-sans max-w-md">
              {dict.footer.desc}
            </p>
            <div className="pt-3 text-sm text-neutral-300 space-y-2.5">
              <p className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-brand-red shrink-0" />
                <span>{lang === 'ru' ? COMPANY_CONTACTS.addressRu : COMPANY_CONTACTS.addressUz}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-red shrink-0" />
                <span>{COMPANY_CONTACTS.email}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-red shrink-0" />
                <span>{COMPANY_CONTACTS.phoneDisplay}</span>
              </p>
            </div>
          </div>

          {/* Col 2: Catalog */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest border-b border-neutral-800 pb-2">
              {dict.footer.catalog}
            </h3>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <Link href={`/${lang}/catalog`} className="hover:text-white transition-colors">
                  {lang === 'ru' ? 'Все товары' : 'Barcha mahsulotlar'}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/catalog?category=bruschatka-qoliplari`} className="hover:text-white transition-colors">
                  Bruschatka qoliplari
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/catalog?category=termopanel`} className="hover:text-white transition-colors">
                  Termopanellar
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/catalog?category=bordyur-qoliplari`} className="hover:text-white transition-colors">
                  Bordyur qoliplari
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Company */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest border-b border-neutral-800 pb-2">
              {dict.footer.company}
            </h3>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <Link href={`/${lang}/about`} className="hover:text-white transition-colors">
                  {dict.nav.about}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/production`} className="hover:text-white transition-colors">
                  {dict.nav.production}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/contact`} className="hover:text-white transition-colors">
                  {dict.nav.contact}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/blog`} className="hover:text-white transition-colors">
                  {dict.nav.blog}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Legal & Services */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest border-b border-neutral-800 pb-2">
              {dict.footer.legal}
            </h3>
            <ul className="space-y-2.5 text-sm text-neutral-400">
              <li>
                <Link href={`/${lang}/privacy`} className="hover:text-white transition-colors">
                  {dict.footer.privacy}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/terms`} className="hover:text-white transition-colors">
                  {dict.footer.terms}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/delivery-payment`} className="hover:text-white transition-colors">
                  {dict.footer.deliveryTerms}
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/returns`} className="hover:text-white transition-colors">
                  {dict.footer.returns}
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Rights + Payments */}
        <div className="pt-8 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-400">
          <p>© {new Date().getFullYear()} SPS PLAST. {dict.footer.rights}</p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px]">CLICK</span>
              <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px]">PAYME</span>
              <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px]">UZUM</span>
            </div>
            <span className="hidden sm:inline">|</span>
            <span>Toshkent, O‘zbekiston</span>
            <span className="text-brand-red">● ONLINE STORE</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
