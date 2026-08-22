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
    Truck,
    Folder,
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

const POPULAR_SEARCHES = ['Bruschatka 30x30', 'Termopanel', '3D Panel', 'Dekorativ g\'isht', 'Bordyur qolipi'];

export const HeaderClient: React.FC<HeaderClientProps> = ({ lang, categories }) => {
    const pathname = usePathname();
    const router = useRouter();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [megaMenuOpen, setMegaMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategorySlug, setSelectedCategorySlug] = useState('');
    const [suggestions, setSuggestions] = useState<{ products: any[]; categories: any[] }>({ products: [], categories: [] });
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
            setSuggestions({ products: [], categories: [] });
            setIsSearching(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const categoryParam = selectedCategorySlug ? `&category=${encodeURIComponent(selectedCategorySlug)}` : '';
                const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}${categoryParam}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions({
                        products: data.products || [],
                        categories: data.categories || [],
                    });
                    setShowSuggestions(true);
                }
            } catch (err) {
                console.error('Search suggestion error:', err);
            } finally {
                setIsSearching(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedCategorySlug]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        trackEvent('search', { search_term: searchQuery, category: selectedCategorySlug });
        setShowSuggestions(false);
        const categoryParam = selectedCategorySlug ? `&category=${encodeURIComponent(selectedCategorySlug)}` : '';
        router.push(`/${lang}/search?q=${encodeURIComponent(searchQuery.trim())}${categoryParam}`);
        setMobileMenuOpen(false);
    };

    const handlePopularClick = (term: string) => {
        setSearchQuery(term);
        setShowSuggestions(false);
        router.push(`/${lang}/search?q=${encodeURIComponent(term)}`);
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
        <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md text-gray-900 border-b border-gray-200/80 shadow-xs">
            {/* 1. TOP UTILITY STRIP */}
            <div className="bg-[#1A1D24] text-gray-300 py-1 px-4 sm:px-6 lg:px-8 text-xs border-b border-gray-800">
                <div className="max-w-[1440px] mx-auto flex items-center justify-between">
                    {/* Left Trust Indicator */}
                    <div className="flex items-center gap-3 text-[11px] font-medium text-gray-300">
                        <div className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-brand-red shrink-0" />
                            <span>SPS Plast — Ishlab chiqaruvchi zavod</span>
                        </div>
                        <span className="hidden sm:inline text-gray-600">|</span>
                        <div className="hidden sm:flex items-center gap-1 text-gray-400">
                            <Truck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>O‘zbekiston bo‘ylab arzon va tezkor yetkazish</span>
                        </div>
                    </div>

                    {/* Right: Phone & Language */}
                    <div className="flex items-center gap-4 text-xs">
                        {hasPhone && (
                            <a
                                href={`tel:${COMPANY_CONTACTS.phoneRaw}`}
                                onClick={() => trackEvent('phone_click', { location: 'topbar' })}
                                aria-label="Call SPS Plast"
                                className="hidden sm:flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors font-mono text-[11px]"
                            >
                                <Phone className="w-3 h-3 text-brand-red" />
                                <span>{COMPANY_CONTACTS.phoneDisplay}</span>
                            </a>
                        )}

                        <Link
                            href={switchLangUrl}
                            className="px-2 py-0.5 border border-gray-700 hover:border-brand-red text-gray-300 hover:text-white transition-colors uppercase font-mono text-[11px] font-bold tracking-wider rounded"
                        >
                            {currentOtherLang.toUpperCase()}
                        </Link>
                    </div>
                </div>
            </div>

            {/* 2. MAIN HEADER BAR */}
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between gap-4 md:gap-6">
                    {/* LEFT: SPS Plast Brand */}
                    <Link href={`/${lang}`} className="flex items-center gap-2.5 shrink-0 group">
                        <div className="w-9 h-9 bg-brand-red flex items-center justify-center font-black text-white text-sm tracking-tight rounded-lg group-hover:bg-brand-red-dark transition-colors shadow-xs">
                            SPS
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-lg tracking-tight leading-none text-gray-900 uppercase font-sans">
                                SPS PLAST
                            </span>
                            <span className="text-[9px] font-mono tracking-wider text-gray-500 uppercase mt-0.5">
                                QOLIPLAR ZAVODI
                            </span>
                        </div>
                    </Link>

                    {/* CENTER: ADVANCED E-COMMERCE SEARCH BAR */}
                    <form
                        ref={searchRef}
                        onSubmit={handleSearchSubmit}
                        className="hidden md:flex flex-1 max-w-[620px] relative items-center"
                    >
                        <div className="relative w-full flex items-center bg-[#F8F9FA] border border-gray-300 rounded-lg overflow-hidden focus-within:border-brand-red focus-within:bg-white transition-colors">
                            {/* Category Filter Selector inside Search */}
                            <div className="relative border-r border-gray-200 shrink-0">
                                <select
                                    value={selectedCategorySlug}
                                    onChange={(e) => setSelectedCategorySlug(e.target.value)}
                                    className="bg-transparent text-xs font-semibold text-gray-700 py-2.5 pl-3 pr-6 focus:outline-none cursor-pointer appearance-none"
                                >
                                    <option value="">{lang === 'ru' ? 'Все категории' : 'Barcha bo‘limlar'}</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={getCategorySlug(cat)}>
                                            {getCategoryName(cat)}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3 h-3 text-gray-400 absolute right-1.5 top-3.5 pointer-events-none" />
                            </div>

                            {/* Main Search Input */}
                            <div className="relative flex-1 flex items-center">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                    placeholder={lang === 'ru' ? 'Поиск по названию, артикулу или размеру...' : 'Mahsulot nomi, SKU yoki o‘lcham bo‘yicha qidiruv...'}
                                    className="w-full bg-transparent text-gray-900 text-xs py-2.5 pl-9 pr-8 focus:outline-none"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 text-gray-400 hover:text-gray-700"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Search Submit Button */}
                            <button
                                type="submit"
                                className="px-4 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1"
                            >
                                <span>QIDIRISH</span>
                            </button>
                        </div>

                        {/* Search Suggestions Popup */}
                        {showSuggestions && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden text-xs">
                                {!searchQuery.trim() ? (
                                    /* Popular search chips when query is empty */
                                    <div className="p-3.5 space-y-2">
                                        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                            {lang === 'ru' ? 'Популярные запросы' : 'Ommabop qidiruvlar'}
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {POPULAR_SEARCHES.map((term) => (
                                                <button
                                                    key={term}
                                                    type="button"
                                                    onClick={() => handlePopularClick(term)}
                                                    className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-red-50 hover:text-brand-red border border-gray-200 text-gray-700 font-medium transition-colors"
                                                >
                                                    {term}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    /* Live Search Results */
                                    <div>
                                        {/* Categories Match */}
                                        {suggestions.categories.length > 0 && (
                                            <div className="p-2 border-b border-gray-100 bg-gray-50">
                                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">
                                                    Kategoriyalar
                                                </div>
                                                {suggestions.categories.map((c) => (
                                                    <Link
                                                        key={c.id}
                                                        href={`/${lang}/catalog?category=${c.slug}`}
                                                        onClick={() => setShowSuggestions(false)}
                                                        className="flex items-center gap-2 p-1.5 rounded hover:bg-white text-gray-900 font-semibold"
                                                    >
                                                        <Folder className="w-3.5 h-3.5 text-brand-red" />
                                                        <span>{c.name}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}

                                        {/* Products Match */}
                                        {suggestions.products.length > 0 ? (
                                            <div>
                                                <div className="p-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                                    Mahsulotlar
                                                </div>
                                                {suggestions.products.map((p) => {
                                                    const title = lang === 'ru' ? p.titleRu : p.titleUz;
                                                    const image = p.images?.[0]?.url;
                                                    return (
                                                        <Link
                                                            key={p.id}
                                                            href={`/${lang}/product/${p.slug}`}
                                                            onClick={() => setShowSuggestions(false)}
                                                            className="flex items-center gap-3 p-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                                                        >
                                                            <div className="w-10 h-10 relative bg-[#F8F9FA] rounded border border-gray-200 shrink-0 p-1">
                                                                {image ? (
                                                                    <Image src={image} alt={title} fill className="object-contain p-0.5" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-gray-400">
                                                                        SPS
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-xs font-semibold text-gray-900 truncate">{title}</div>
                                                                <div className="text-[10px] font-mono text-gray-500">SKU: {p.sku}</div>
                                                            </div>
                                                            <div className="text-xs font-bold text-brand-red shrink-0">
                                                                {p.price?.toLocaleString()} so‘m
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-4 text-center text-gray-500 text-xs">
                                                Natija topilmadi
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </form>

                    {/* RIGHT: Actions */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <button
                            onClick={toggleCart}
                            className="flex items-center gap-2 px-3.5 py-2 bg-brand-red hover:bg-brand-red-dark text-white rounded-lg transition-colors font-bold text-xs uppercase tracking-wider shadow-xs"
                            aria-label="Cart"
                        >
                            <div className="relative">
                                <ShoppingBag className="w-4 h-4" />
                                {cartTotalItems > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                                        {cartTotalItems}
                                    </span>
                                )}
                            </div>
                            <span className="hidden sm:inline">SAVAT</span>
                        </button>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-gray-700 hover:text-brand-red bg-gray-100 border border-gray-200 rounded-lg"
                            aria-label="Toggle Menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Search Input */}
                <div className="mt-2.5 md:hidden">
                    <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Mahsulot nomi yoki SKU qidiring..."
                            className="w-full bg-[#F8F9FA] border border-gray-300 text-gray-900 text-xs py-2 pl-8 pr-18 rounded-lg focus:outline-none focus:border-brand-red"
                        />
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5" />
                        <button
                            type="submit"
                            className="absolute right-1 px-2.5 py-1 bg-brand-red text-white text-[10px] font-bold uppercase rounded"
                        >
                            Qidirish
                        </button>
                    </form>
                </div>
            </div>

            {/* 3. CATEGORY NAV BAR */}
            <div className="border-t border-b border-gray-200 bg-[#F8F9FA] relative" ref={megaMenuRef}>
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4 py-1.5 overflow-x-auto no-scrollbar">
                        {/* MEGA MENU TRIGGER */}
                        <button
                            onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                            className="flex items-center gap-2 px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer rounded-md shrink-0"
                        >
                            <LayoutGrid className="w-3.5 h-3.5 text-brand-red" />
                            <span>KATALOG</span>
                            <ChevronDown
                                className={`w-3 h-3 transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* CATEGORY LINKS CHIPS */}
                        <nav className="flex items-center gap-2 text-xs font-semibold text-gray-700 shrink-0">
                            {categories.slice(0, 6).map((cat) => {
                                const slug = getCategorySlug(cat);
                                const name = getCategoryName(cat);
                                return (
                                    <Link
                                        key={cat.id}
                                        href={`/${lang}/catalog/${slug}`}
                                        className="hover:text-brand-red hover:bg-white px-2.5 py-1 rounded border border-transparent hover:border-gray-200 transition-colors whitespace-nowrap"
                                    >
                                        {name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* MEGA MENU DROPDOWN PANEL */}
                {megaMenuOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50 animate-in fade-in duration-150">
                        <div className="max-w-[1440px] mx-auto p-5 sm:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {categories.length > 0 ? (
                                    categories.map((cat) => {
                                        const parentSlug = getCategorySlug(cat);
                                        const parentName = getCategoryName(cat);
                                        const children = cat.children || [];

                                        return (
                                            <div key={cat.id} className="space-y-2">
                                                <Link
                                                    href={`/${lang}/catalog/${parentSlug}`}
                                                    onClick={() => setMegaMenuOpen(false)}
                                                    className="flex items-center gap-2 font-bold text-xs sm:text-sm text-gray-900 hover:text-brand-red transition-colors pb-1.5 border-b border-gray-200 uppercase tracking-wide group"
                                                >
                                                    {cat.image && (
                                                        <div className="w-6 h-6 relative rounded bg-gray-50 overflow-hidden shrink-0 border border-gray-200">
                                                            <Image
                                                                src={cat.image}
                                                                alt={parentName}
                                                                fill
                                                                className="object-contain p-0.5"
                                                            />
                                                        </div>
                                                    )}
                                                    <span>{parentName}</span>
                                                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-brand-red group-hover:translate-x-0.5 transition-all ml-auto" />
                                                </Link>

                                                {children.length > 0 && (
                                                    <ul className="space-y-1 pl-1">
                                                        {children.map((child) => {
                                                            const childSlug = getCategorySlug(child);
                                                            const childName = getCategoryName(child);
                                                            return (
                                                                <li key={child.id}>
                                                                    <Link
                                                                        href={`/${lang}/catalog/${childSlug}`}
                                                                        onClick={() => setMegaMenuOpen(false)}
                                                                        className="text-xs text-gray-600 hover:text-brand-red transition-colors block py-0.5 font-medium"
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
                                    <div className="col-span-full py-4 text-center text-xs text-gray-500 font-mono">
                                        Kategoriyalar mavjud emas
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MOBILE DRAWER MENU */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-gray-200 px-4 py-5 space-y-3 shadow-lg">
                    <div className="font-bold text-xs uppercase tracking-wider text-gray-500 pb-1.5 border-b border-gray-200">
                        Kategoriyalar
                    </div>
                    <nav className="flex flex-col space-y-1.5 text-xs">
                        {categories.map((cat) => {
                            const slug = getCategorySlug(cat);
                            const name = getCategoryName(cat);
                            return (
                                <div key={cat.id} className="border-b border-gray-100 pb-1.5">
                                    <Link
                                        href={`/${lang}/catalog/${slug}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="font-bold text-gray-900 hover:text-brand-red transition-colors flex items-center justify-between py-1"
                                    >
                                        <span>{name}</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                                    </Link>

                                    {cat.children && cat.children.length > 0 && (
                                        <div className="pl-3 mt-0.5 space-y-1">
                                            {cat.children.map((child) => {
                                                const childSlug = getCategorySlug(child);
                                                const childName = getCategoryName(child);
                                                return (
                                                    <Link
                                                        key={child.id}
                                                        href={`/${lang}/catalog/${childSlug}`}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className="block text-xs text-gray-600 hover:text-brand-red py-0.5"
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
