import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Send, Instagram, ShieldCheck, Truck, Headphones } from 'lucide-react';
import { getDictionary, Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

interface FooterProps {
  lang: Locale;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const dict = getDictionary(lang);

  return (
    <footer className="bg-brand-dark border-t border-brand-border text-gray-400 text-sm">
      {/* Features Bar */}
      <div className="border-b border-brand-border/60 py-8 bg-brand-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-brand-red" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">O‘z Ishlab chiqarishimiz</h4>
              <p className="text-xs text-gray-400">Sifat nazorati va rasmiy kafolat</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6 text-brand-red" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">O‘zbekiston bo‘ylab yetkazish</h4>
              <p className="text-xs text-gray-400">Barcha viloyat va shaharlarga express pochta</p>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center shrink-0">
              <Headphones className="w-6 h-6 text-brand-red" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Mutaxassis Konsultatsiyasi</h4>
              <p className="text-xs text-gray-400">Bruschatka quyish va texnologiya bo‘yicha ko‘mak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        
        {/* Brand info */}
        <div className="lg:col-span-2 space-y-4">
          <Link href={`/${lang}`} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-red to-brand-red-light flex items-center justify-center shadow-red">
              <span className="font-extrabold text-xl text-white">SPS</span>
            </div>
            <span className="font-black text-2xl tracking-tight text-white">
              SPS PLAST
            </span>
          </Link>

          <p className="text-sm leading-relaxed text-gray-400 max-w-sm">
            {dict.footer.desc}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <a
              href="https://t.me/spsplast"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('telegram_click', { location: 'footer' })}
              className="w-10 h-10 rounded-lg bg-brand-card border border-brand-border hover:border-brand-red hover:text-brand-red flex items-center justify-center transition-colors"
              aria-label="Telegram"
            >
              <Send className="w-4 h-4" />
            </a>
            <a
              href="https://instagram.com/spsplast"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-lg bg-brand-card border border-brand-border hover:border-brand-red hover:text-brand-red flex items-center justify-center transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Catalog */}
        <div className="space-y-3">
          <h3 className="text-white font-bold text-base uppercase tracking-wider">
            {dict.footer.catalog}
          </h3>
          <ul className="space-y-2">
            <li>
              <Link href={`/${lang}/catalog/termopanel`} className="hover:text-white transition-colors">
                {dict.nav.termopanel}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/catalog/bruschatka-qoliplari`} className="hover:text-white transition-colors">
                {dict.nav.bruschatka}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/catalog/bordyur-qoliplari`} className="hover:text-white transition-colors">
                {dict.nav.bordyur}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/catalog/zina-va-beton-qoliplari`} className="hover:text-white transition-colors">
                Zina qoliplari
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/catalog/dekorativ-qoliplar`} className="hover:text-white transition-colors">
                Dekorativ qoliplar
              </Link>
            </li>
          </ul>
        </div>

        {/* Company */}
        <div className="space-y-3">
          <h3 className="text-white font-bold text-base uppercase tracking-wider">
            {dict.footer.company}
          </h3>
          <ul className="space-y-2">
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
              <Link href={`/${lang}/projects`} className="hover:text-white transition-colors">
                {dict.nav.projects}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/blog`} className="hover:text-white transition-colors">
                {dict.nav.blog}
              </Link>
            </li>
            <li>
              <Link href={`/${lang}/contact`} className="hover:text-white transition-colors">
                {dict.nav.contact}
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Contacts */}
        <div className="space-y-3">
          <h3 className="text-white font-bold text-base uppercase tracking-wider">
            {dict.footer.legal} & Aloqa
          </h3>
          <ul className="space-y-2">
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

          <div className="pt-2 space-y-1.5 text-xs">
            <p className="flex items-center gap-2 text-gray-300">
              <Phone className="w-3.5 h-3.5 text-brand-red shrink-0" />
              +998 (90) 123-45-67
            </p>
            <p className="flex items-center gap-2 text-gray-300">
              <Mail className="w-3.5 h-3.5 text-brand-red shrink-0" />
              info@spsplast.uz
            </p>
            <p className="flex items-center gap-2 text-gray-300">
              <MapPin className="w-3.5 h-3.5 text-brand-red shrink-0" />
              Toshkent, Sergeli sanoat zonasi, 4-bino
            </p>
          </div>
        </div>

      </div>

      {/* Copyright */}
      <div className="border-t border-brand-border py-6 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} SPS PLAST. {dict.footer.rights}</p>
      </div>
    </footer>
  );
};
