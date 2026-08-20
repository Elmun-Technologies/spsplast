'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    Search,
    ShoppingBag,
    Menu,
    X,
    ChevronDown,
    Phone,
    LayoutGrid,
    ArrowRight,
    ShieldCheck,
} from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { Locale } from '@/lib/i18n';
import { trackEvent } from '@/lib/analytics';
import { COMPANY_CONTACTS } from '@/lib/constants/contacts';

export interface CategoryTreeItem {
    id: string;
    parentId: string | null;
    image: string | null;
    translations: Array<{
        locale: string;
        name: string;
        slug: string;
    }>;
    children?: CategoryTreeItem[];
}

interface HeaderClientProps {
    lang: Locale;
    categories: CategoryTreeItem[];
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ lang, categories }) => {
    const pathname = usePathname();
    const router = useRouter();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [megaMenuOpen, setMegaMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const cartTotalItems = useCartStore((s) => s.getTotalItems());
    const toggleCart = useCartStore((s) => s.toggleCart);

    const megaMenuRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLFormElement>(null);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
                setMegaMenuOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle Search Input Change for Live Suggestions
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.trim().length < 2) {
            setSuggestions([]);
            setIsSearching(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.products?.slice(0, 5) || []);
                    setShowSuggestions(true);
                }
            } catch (err) {
                console.error('Search suggestion error:', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        trackEvent('search', { search_term: searchQuery });
        setShowSuggestions(false);
        router.push(`/${lang}/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setMobileMenuOpen(false);
    };

    const currentOtherLang = lang === 'uz' ? 'ru' : 'uz';
    const switchLangUrl = pathname.replace(`/${lang}`, `/${currentOtherLang}`);

    const getCategoryName = (cat: CategoryTreeItem) => {
        const trans = cat.translations.find((t) => t.locale === lang) || cat.translations[0];
        return trans?.name || 'Kategoriya';
    };

    const getCategorySlug = (cat: CategoryTreeItem) => {
        const trans = cat.translations.find((t) => t.locale === lang) || cat.translations[0];
        return trans?.slug || cat.id;
    };

    const hasPhone = Boolean(COMPANY_CONTACTS.phoneDisplay && COMPANY_CONTACTS.phoneRaw);

    return (
        <header className="sticky top-0 z-50 w-full bg-white text-[#111111] border-b border-neutral-200 shadow-xs">
            {/* 1. TOP STRIP — Very small height */}
            <div className="bg-[#111111] text-neutral-300 py-1 px-4 sm:px-8 text-xs">
                <div className="max-w-[1440px] mx-auto flex items-center justify-between">
                    {/* Left */}
                    <div className="flex items-center gap-2 text-[11px] font-medium text-neutral-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-brand-red shrink-0" />
                        <span>SPS Plast — ishlab chiqaruvchidan</span>
                    </div>

                    {/* Right: Phone (if configured) & UZ/RU */}
                    <div className="flex items-center gap-4 text-xs">
                        {hasPhone && (
                            <a
                                href={`tel:${COMPANY_CONTACTS.phoneRaw}`}
                                onClick={() => trackEvent('phone_click', { location: 'topbar' })}
                                aria-label="Call SPS Plast"
                                className="hidden sm:flex items-center gap-1.5 text-neutral-300 hover:text-white transition-colors font-mono text-[11px]"
                            >
                                <Phone className="w-3 h-3 text-brand-red" />
                                <span>{COMPANY_CONTACTS.phoneDisplay}</span>
                            </a>
                        )}

                        <Link
                            href={switchLangUrl}
                            className="px-2 py-0.5 border border-neutral-700 hover:border-brand-red text-neutral-300 hover:text-white transition-colors uppercase font-mono text-[11px] font-bold tracking-wider rounded-xs"
                        >
                            {currentOtherLang.toUpperCase()}
                        </Link>
                    </div>
                </div>
            </div>

            {/* 2. MAIN HEADER — ~70-80px */}
            <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-3.5">
                <div className="flex items-center justify-between gap-4 md:gap-8 h-[50px]">
                    {/* LEFT: SPS Plast Logo */}
                    <Link href={`/${lang}`} className="flex items-center gap-3 shrink-0 group">
                        <div className="w-10 h-10 bg-brand-red flex items-center justify-center font-black text-white text-base tracking-tight rounded-xs group-hover:bg-brand-red-dark transition-colors">
                            SPS
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-xl tracking-tight leading-none text-[#111111] uppercase font-sans">
                                SPS PLAST
                            </span>
                            <span className="text-[10px] font-mono tracking-widest text-[#667085] uppercase mt-0.5">
                                ISHLAB CHIQARISH ZAVODI
                            </span>
                        </div>
                    </Link>

                    {/* CENTER: LARGE E-COMMERCE SEARCH BAR (~45-55% desktop width) */}
                    <form
                        ref={searchRef}
                        onSubmit={handleSearchSubmit}
                        className="hidden md:flex flex-1 max-w-[55%] relative items-center"
                    >
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
                                placeholder="Mahsulot, kategoriya yoki SKU qidiring"
                                className="w-full bg-[#F6F7F8] border border-neutral-300 text-[#111111] text-sm placeholder:text-[#667085] py-2.5 pl-10 pr-28 rounded-xs focus:outline-none focus:border-brand-red focus:bg-white transition-all font-sans"
                            />
                            <Search className="w-4 h-4 text-[#667085] absolute left-3.5 top-3" />
                            <button
                                type="submit"
                                className="absolute right-1 top-1 bottom-1 px-4 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold uppercase tracking-wider rounded-xs transition-colors flex items-center justify-center"
                            >
                                <span>QIDIRISH</span>
                            </button>
                        </div>

                        {/* Instant Search Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xs shadow-lg z-50 overflow-hidden">
                                <div className="p-2 border-b border-neutral-100 text-[11px] font-mono uppercase text-[#667085]">
                                    Qidiruv natijalari
                                </div>
                                {suggestions.map((p) => {
                                    const title = lang === 'ru' ? p.titleRu : p.titleUz;
                                    const image = p.images?.[0]?.url;
                                    return (
                                        <Link
                                            key={p.id}
                                            href={`/${lang}/product/${p.slug}`}
                                            onClick={() => setShowSuggestions(false)}
                                            className="flex items-center gap-3 p-3 hover:bg-[#F6F7F8] transition-colors border-b border-neutral-100 last:border-0"
                                        >
                                            <div className="w-10 h-10 relative bg-[#F6F7F8] rounded-xs shrink-0 p-1 border border-neutral-200">
                                                {image ? (
                                                    <Image src={image} alt={title} fill className="object-contain" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-neutral-400">
                                                        SPS
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-[#111111] truncate">{title}</div>
                                                <div className="text-[11px] font-mono text-[#667085]">SKU: {p.sku}</div>
                                            </div>
                                            <div className="text-xs font-bold text-brand-red font-mono shrink-0">
                                                {p.price?.toLocaleString()} so‘m
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </form>

                    {/* RIGHT: Language, Cart & Mobile Menu */}
                    <div className="flex items-center gap-3 shrink-0">
                        <Link
                            href={switchLangUrl}
                            className="hidden sm:inline-flex px-2.5 py-2 border border-neutral-300 hover:border-brand-red text-[#111111] transition-colors font-mono text-xs font-bold uppercase rounded-xs"
                        >
                            {lang === 'uz' ? 'RU' : 'UZ'}
                        </Link>

                        <button
                            onClick={toggleCart}
                            className="flex items-center gap-2.5 px-4 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white rounded-xs transition-colors font-bold text-xs uppercase tracking-wider shadow-xs"
                            aria-label="Cart"
                        >
                            <div className="relative">
                                <ShoppingBag className="w-4 h-4" />
                                {cartTotalItems > 0 && (
                                    <span className="absolute -top-2.5 -right-2.5 bg-[#111111] text-white text-[10px] font-mono font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">
                                        {cartTotalItems}
                                    </span>
                                )}
                            </div>
                            <span className="hidden sm:inline font-bold">SAVAT</span>
                        </button>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-[#111111] hover:text-brand-red bg-[#F6F7F8] border border-neutral-300 rounded-xs"
                            aria-label="Toggle Menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Search Row */}
                <div className="mt-3 md:hidden">
                    <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Mahsulot, kategoriya yoki SKU qidiring"
                            className="w-full bg-[#F6F7F8] border border-neutral-300 text-[#111111] text-xs py-2 pl-9 pr-20 rounded-xs focus:outline-none focus:border-brand-red"
                        />
                        <Search className="w-4 h-4 text-[#667085] absolute left-2.5" />
                        <button
                            type="submit"
                            className="absolute right-1 px-3 py-1 bg-brand-red text-white text-[10px] font-bold uppercase rounded-xs"
                        >
                            Qidirish
                        </button>
                    </form>
                </div>
            </div>

            {/* 3. CATEGORY NAVIGATION ROW */}
            <div className="border-t border-b border-neutral-200 bg-[#F6F7F8] relative" ref={megaMenuRef}>
                <div className="max-w-[1440px] mx-auto px-4 sm:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        {/* KATALOG TRIGGER BUTTON — Visually Stronger */}
                        <button
                            onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                            className="flex items-center gap-2.5 px-5 py-3 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer rounded-xs my-1"
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span>KATALOG</span>
                            <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>

                        {/* TOP REAL DB CATEGORIES */}
                        <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-[#111111] uppercase tracking-wider">
                            {categories.slice(0, 6).map((cat) => {
                                const slug = getCategorySlug(cat);
                                const name = getCategoryName(cat);
                                return (
                                    <Link
                                        key={cat.id}
                                        href={`/${lang}/catalog/${slug}`}
                                        className="hover:text-brand-red transition-colors py-3 border-b-2 border-transparent hover:border-brand-red"
                                    >
                                        {name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Quick Contact Link if configured */}
                    {hasPhone && (
                        <div className="hidden xl:flex items-center gap-4 text-xs text-[#667085] font-mono">
                            <a
                                href={`tel:${COMPANY_CONTACTS.phoneRaw}`}
                                className="hover:text-brand-red transition-colors flex items-center gap-1.5 font-bold"
                            >
                                <Phone className="w-3.5 h-3.5 text-brand-red" />
                                <span>{COMPANY_CONTACTS.phoneDisplay}</span>
                            </a>
                        </div>
                    )}
                </div>

                {/* MEGA MENU DROPDOWN */}
                {megaMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border-b border-neutral-200 shadow-xl z-50 animate-in fade-in duration-150">
                        <div className="max-w-[1440px] mx-auto p-6 sm:p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                                {categories.length > 0 ? (
                                    categories.map((cat) => {
                                        const parentSlug = getCategorySlug(cat);
                                        const parentName = getCategoryName(cat);
                                        const children = cat.children || [];

                                        return (
                                            <div key={cat.id} className="space-y-3">
                                                <Link
                                                    href={`/${lang}/catalog/${parentSlug}`}
                                                    onClick={() => setMegaMenuOpen(false)}
                                                    className="flex items-center gap-2 font-bold text-sm text-[#111111] hover:text-brand-red transition-colors pb-2 border-b border-neutral-200 uppercase tracking-wide group"
                                                >
                                                    {cat.image && (
                                                        <div className="w-7 h-7 relative rounded-xs bg-[#F6F7F8] overflow-hidden shrink-0 border border-neutral-200">
                                                            <Image
                                                                src={cat.image}
                                                                alt={parentName}
                                                                fill
                                                                className="object-contain p-1"
                                                            />
                                                        </div>
                                                    )}
                                                    <span>{parentName}</span>
                                                    <ArrowRight className="w-3.5 h-3.5 text-[#667085] group-hover:text-brand-red group-hover:translate-x-0.5 transition-all ml-auto" />
                                                </Link>

                                                {children.length > 0 && (
                                                    <ul className="space-y-1.5 pl-1">
                                                        {children.map((child) => {
                                                            const childSlug = getCategorySlug(child);
                                                            const childName = getCategoryName(child);
                                                            return (
                                                                <li key={child.id}>
                                                                    <Link
                                                                        href={`/${lang}/catalog/${childSlug}`}
                                                                        onClick={() => setMegaMenuOpen(false)}
                                                                        className="text-xs text-[#667085] hover:text-brand-red transition-colors block py-0.5 font-medium"
                                                                    >
                                                                        {childName}
                                                                    </Link>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full py-6 text-center text-xs text-[#667085] font-mono">
                                        Kategoriyalar mavjud emas
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MOBILE DRAWER */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-neutral-200 px-4 py-6 space-y-4 shadow-lg">
                    <div className="font-bold text-xs uppercase tracking-wider text-[#667085] pb-2 border-b border-neutral-200">
                        Kategoriyalar
                    </div>
                    <nav className="flex flex-col space-y-2 text-sm">
                        {categories.map((cat) => {
                            const slug = getCategorySlug(cat);
                            const name = getCategoryName(cat);
                            return (
                                <div key={cat.id} className="border-b border-neutral-100 pb-2">
                                    <Link
                                        href={`/${lang}/catalog/${slug}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="font-bold text-[#111111] hover:text-brand-red transition-colors flex items-center justify-between py-1"
                                    >
                                        <span>{name}</span>
                                        <ArrowRight className="w-4 h-4 text-[#667085]" />
                                    </Link>

                                    {cat.children && cat.children.length > 0 && (
                                        <div className="pl-3 mt-1 space-y-1">
                                            {cat.children.map((child) => {
                                                const childSlug = getCategorySlug(child);
                                                const childName = getCategoryName(child);
                                                return (
                                                    <Link
                                                        key={child.id}
                                                        href={`/${lang}/catalog/${childSlug}`}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className="block text-xs text-[#667085] hover:text-brand-red py-1"
                                                    >
                                                        • {childName}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>
            )}
        </header>
    );
};
