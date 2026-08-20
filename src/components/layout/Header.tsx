'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, ShoppingCart, Phone, Menu, X, Globe, Layers, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { Button } from '@/components/ui/Button';
import { getDictionary, Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';

interface HeaderProps {
  lang: Locale;
}

export const Header: React.FC<HeaderProps> = ({ lang }) => {
  const dict = getDictionary(lang);
  const pathname = usePathname();
  const router = useRouter();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const cartTotalItems = useCartStore((s) => s.getTotalItems());
  const toggleCart = useCartStore((s) => s.toggleCart);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    trackEvent('search', { search_term: searchQuery });
    router.push(`/${lang}/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setMobileMenuOpen(false);
  };

  const currentOtherLang = lang === 'uz' ? 'ru' : 'uz';
  const switchLangUrl = pathname.replace(`/${lang}`, `/${currentOtherLang}`);

  return (
    <header className="sticky top-0 z-40 w-full bg-brand-dark/95 backdrop-blur-md border-b border-brand-border text-white">
      {/* Top Bar for Phone & B2B Contacts */}
      <div className="hidden lg:block bg-black/40 border-b border-white/5 py-1.5 px-4 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              SPS PLAST — Ishlab chiqarish zavodi va rasmiy do‘kon
            </span>
            <span>Toshkent, O‘zbekiston</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="tel:+998901234567"
              onClick={() => trackEvent('phone_click', { location: 'topbar' })}
              className="flex items-center gap-1.5 hover:text-brand-red font-medium transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-brand-red" />
              +998 (90) 123-45-67
            </a>
            <Link
              href={`/${lang}/projects`}
              className="hover:text-white transition-colors"
            >
              {dict.nav.projects}
            </Link>
            <Link
              href={`/${lang}/delivery-payment`}
              className="hover:text-white transition-colors"
            >
              {dict.nav.delivery}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo */}
          <Link href={`/${lang}`} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-red to-brand-red-light flex items-center justify-center shadow-red group-hover:scale-105 transition-transform">
              <span className="font-extrabold text-xl text-white tracking-tighter">SPS</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight text-white group-hover:text-brand-red transition-colors">
                SPS PLAST
              </span>
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold -mt-1">
                Industrial Molds
              </span>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md relative items-center"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Qidiruv: 6 ta g‘isht qolip, termopanel, sku..."
              className="w-full bg-brand-card/80 border border-brand-border focus:border-brand-red text-white text-sm rounded-full py-2.5 pl-10 pr-10 focus:outline-none transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5" />
            <button
              type="submit"
              className="absolute right-2.5 p-1 rounded-full bg-brand-red text-white hover:bg-brand-red-dark transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Desktop Right Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Language Switcher */}
            <Link
              href={switchLangUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border bg-brand-card hover:border-brand-red text-xs font-semibold uppercase text-gray-300 hover:text-white transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-brand-red" />
              {currentOtherLang}
            </Link>

            {/* Cart Trigger */}
            <button
              onClick={toggleCart}
              className="relative p-2.5 rounded-xl border border-brand-border bg-brand-card hover:border-brand-red text-white transition-all group"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5 text-gray-300 group-hover:text-brand-red transition-colors" />
              {cartTotalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-brand-red text-white rounded-full text-xs font-bold flex items-center justify-center shadow-red animate-bounce">
                  {cartTotalItems}
                </span>
              )}
            </button>

            {/* Catalog CTA Button */}
            <Link href={`/${lang}/catalog`}>
              <Button size="md" className="gap-2">
                <Layers className="w-4 h-4" />
                {dict.nav.viewCatalog}
              </Button>
            </Link>
          </div>

          {/* Mobile Right Actions */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-gray-300 hover:text-white"
            >
              <Search className="w-5 h-5" />
            </button>

            <button
              onClick={toggleCart}
              className="relative p-2 text-gray-300 hover:text-white"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartTotalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-red text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {cartTotalItems}
                </span>
              )}
            </button>

            <Link
              href={switchLangUrl}
              className="px-2 py-1 border border-brand-border rounded text-xs font-bold uppercase text-gray-300"
            >
              {currentOtherLang}
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 py-3 border-t border-brand-border/50 text-sm font-medium text-gray-300">
          <Link
            href={`/${lang}/catalog`}
            className="text-white hover:text-brand-red font-semibold transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-brand-red" />
            {dict.nav.catalog}
          </Link>
          <Link href={`/${lang}/catalog/termopanel`} className="hover:text-white transition-colors">
            {dict.nav.termopanel}
          </Link>
          <Link href={`/${lang}/catalog/bruschatka-qoliplari`} className="hover:text-white transition-colors">
            {dict.nav.bruschatka}
          </Link>
          <Link href={`/${lang}/catalog/bordyur-qoliplari`} className="hover:text-white transition-colors">
            {dict.nav.bordyur}
          </Link>
          <Link href={`/${lang}/about`} className="hover:text-white transition-colors">
            {dict.nav.about}
          </Link>
          <Link href={`/${lang}/production`} className="hover:text-white transition-colors">
            {dict.nav.production}
          </Link>
          <Link href={`/${lang}/blog`} className="hover:text-white transition-colors">
            {dict.nav.blog}
          </Link>
          <Link href={`/${lang}/contact`} className="hover:text-white transition-colors">
            {dict.nav.contact}
          </Link>
        </nav>

        {/* Mobile Search Input Popup */}
        {searchOpen && (
          <div className="md:hidden py-3 border-t border-brand-border">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Mahsulot qidirish..."
                className="w-full bg-brand-card border border-brand-border text-white text-sm rounded-lg py-2 pl-9 pr-4 focus:outline-none focus:border-brand-red"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </form>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-brand-dark border-t border-brand-border px-4 py-6 space-y-4 animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-3 font-medium text-base text-gray-200">
            <Link
              href={`/${lang}/catalog`}
              onClick={() => setMobileMenuOpen(false)}
              className="text-brand-red font-bold flex items-center justify-between py-2 border-b border-brand-border/30"
            >
              <span>{dict.nav.catalog}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={`/${lang}/catalog/termopanel`}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              {dict.nav.termopanel}
            </Link>
            <Link
              href={`/${lang}/catalog/bruschatka-qoliplari`}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              {dict.nav.bruschatka}
            </Link>
            <Link
              href={`/${lang}/catalog/bordyur-qoliplari`}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              {dict.nav.bordyur}
            </Link>
            <Link
              href={`/${lang}/about`}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              {dict.nav.about}
            </Link>
            <Link
              href={`/${lang}/production`}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              {dict.nav.production}
            </Link>
            <Link
              href={`/${lang}/projects`}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              {dict.nav.projects}
            </Link>
            <Link
              href={`/${lang}/blog`}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              {dict.nav.blog}
            </Link>
            <Link
              href={`/${lang}/contact`}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-white"
            >
              {dict.nav.contact}
            </Link>
          </nav>

          <div className="pt-4 border-t border-brand-border flex flex-col gap-3">
            <a
              href="tel:+998901234567"
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-brand-card border border-brand-border text-white font-bold"
            >
              <Phone className="w-4 h-4 text-brand-red" />
              +998 (90) 123-45-67
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
