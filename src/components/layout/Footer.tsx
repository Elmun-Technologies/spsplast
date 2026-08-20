'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Send, Instagram, ArrowUpRight } from 'lucide-react';
import { getDictionary, Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

interface FooterProps {
  lang: Locale;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const dict = getDictionary(lang);

  return (
    <footer className="bg-[#070707] text-neutral-400 border-t border-neutral-800 pt-16 pb-12">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10">

        {/* Top Dominant Branding Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end pb-12 border-b border-neutral-800 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-brand-red flex items-center justify-center font-mono font-bold text-white text-sm">
                SPS
              </div>
              <span className="font-mono text-xs text-neutral-400 tracking-widest uppercase">
                MANUFACTURING & INDUSTRIAL SUPPLY
              </span>
            </div>
            <h2 className="text-4xl sm:text-7xl font-black text-white uppercase tracking-tighter font-sans leading-none">
              SPS PLAST
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <a
              href="tel:+998901234567"
              onClick={() => trackEvent('phone_click', { location: 'footer' })}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-brand-red hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>+998 (90) 123-45-67</span>
            </a>
            <a
              href="https://t.me/spsplast"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('telegram_click', { location: 'footer' })}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-neutral-900 border border-neutral-700 text-white font-mono font-bold text-xs uppercase tracking-wider hover:border-white transition-colors"
            >
              <Send className="w-4 h-4 text-brand-red" />
              <span>Telegram Channel</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
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
            <div className="pt-2 text-xs font-mono text-neutral-300 space-y-2">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-red shrink-0" />
                <span>Toshkent, Sergeli sanoat zonasi, 4-bino</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-red shrink-0" />
                <span>info@spsplast.uz</span>
              </p>
            </div>
          </div>

          {/* Col 2: Catalog */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest border-b border-neutral-800 pb-2">
              {dict.footer.catalog}
            </h3>
            <ul className="space-y-2.5 text-xs font-mono uppercase text-neutral-400">
              <li>
                <Link href={`/${lang}/catalog/bruschatka-qoliplari`} className="hover:text-white transition-colors">
                  Bruschatka qoliplari
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/catalog/termopanel`} className="hover:text-white transition-colors">
                  Termopanellar
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/catalog/bordyur-qoliplari`} className="hover:text-white transition-colors">
                  Bordyur qoliplari
                </Link>
              </li>
              <li>
                <Link href={`/${lang}/catalog`} className="hover:text-white transition-colors">
                  Barcha mahsulotlar
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Company */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest border-b border-neutral-800 pb-2">
              {dict.footer.company}
            </h3>
            <ul className="space-y-2.5 text-xs font-mono uppercase text-neutral-400">
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
            </ul>
          </div>

          {/* Col 4: Legal & Services */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-widest border-b border-neutral-800 pb-2">
              {dict.footer.legal}
            </h3>
            <ul className="space-y-2.5 text-xs font-mono uppercase text-neutral-400">
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
            </ul>
          </div>

        </div>

        {/* Bottom Rights */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-neutral-400">
          <p>© {new Date().getFullYear()} SPS PLAST. {dict.footer.rights}</p>
          <div className="flex items-center gap-6 uppercase">
            <span>Toshkent, O‘zbekiston</span>
            <span className="text-brand-red">● ONLINE STORE</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
