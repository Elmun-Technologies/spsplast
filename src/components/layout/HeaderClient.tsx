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
    Heart,
    ArrowRightLeft,
} from 'lucide-react';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useCompareStore } from '@/lib/store/compareStore';
import { Locale, getDictionary } from '@/lib/i18n';
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
    const dict = getDictionary(lang);

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [megaMenuOpen, setMegaMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategorySlug, setSelectedCategorySlug] = useState('');
    const [suggestions, setSuggestions] = useState<{ products: any[]; categories: any[] }>({ products: [], categories: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const cartTotalItems = useCartStore((s) => s.getTotalItems());
    const toggleCart = useCartStore((s) => s.toggleCart);
    const wishlistCount = useWishlistStore((s) => s.getCount());
    const compareCount = useCompareStore((s) => s.getCount());

    const megaMenuRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLFormElement>(null);

    // Close menus when clicking outside + ESC + touchstart
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
                setMegaMenuOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setMegaMenuOpen(false);
                setShowSuggestions(false);
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
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
        <header className="sticky top-0 z-50 w-full bg-white text-gray-900 border-b border-gray-200 shadow-sm">
            {/* 1. TOP UTILITY STRIP */}
            <div className="bg-[#1A1D24] text-gray-300 py-1.5 px-4 sm:px-6 lg:px-8 text-xs border-b border-gray-800">
                <div className="max-w-[1440px] mx-auto flex items-center justify-between">
                    {/* Left Trust Indicator */}
                    <div className="flex items-center gap-3 text-xs font-medium text-gray-300">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-brand-red shrink-0" />
                            <span>{lang === 'ru' ? 'SPS Plast — завод производитель' : 'SPS Plast — Ishlab chiqaruvchi zavod'}</span>
                        </div>
                        <span className="hidden sm:inline text-gray-600">|</span>
                        <div className="hidden sm:flex items-center gap-1.5 text-gray-400">
                            <Truck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{lang === 'ru' ? 'Быстрая доставка по Узбекистану' : 'O‘zbekiston bo‘ylab arzon va tezkor yetkazish'}</span>
                        </div>
                    </div>

                    {/* Right: Phone & Language */}
                    <div className="flex items-center gap-4 text-xs">
                        {hasPhone && (
                            <a
                                href={`tel:${COMPANY_CONTACTS.phoneRaw}`}
                                onClick={() => trackEvent('phone_click', { location: 'topbar' })}
                                aria-label="Call SPS Plast"
                                className="hidden sm:flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors font-mono text-xs"
                            >
                                <Phone className="w-3 h-3 text-brand-red" />
                                <span>{COMPANY_CONTACTS.phoneDisplay}</span>
                            </a>
                        )}

                        <Link
                            href={switchLangUrl}
                            className="px-2.5 py-1 border border-gray-700 hover:border-brand-red text-gray-300 hover:text-white transition-colors uppercase font-mono text-xs font-bold tracking-wider rounded"
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
                        className="hidden md:flex flex-1 max-w-[640px] relative items-center"
                        role="search"
                    >
                        <div className="relative w-full flex items-center bg-[#F8F9FA] border border-gray-300 rounded-xl overflow-hidden focus-within:border-brand-red focus-within:bg-white transition-colors shadow-xs">
                            {/* Category Filter Selector inside Search */}
                            <div className="relative border-r border-gray-200 shrink-0">
                                <label htmlFor="cat-filter" className="sr-only">Category</label>
                                <select
                                    id="cat-filter"
                                    value={selectedCategorySlug}
                                    onChange={(e) => setSelectedCategorySlug(e.target.value)}
                                    className="bg-transparent text-sm font-semibold text-gray-700 py-3 pl-3 pr-7 focus:outline-none cursor-pointer appearance-none min-w-[140px]"
                                >
                                    <option value="">{lang === 'ru' ? 'Все категории' : 'Barcha bo‘limlar'}</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={getCategorySlug(cat)}>
                                            {getCategoryName(cat)}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-3.5 pointer-events-none" />
                            </div>

                            {/* Main Search Input */}
                            <div className="relative flex-1 flex items-center">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setShowSuggestions(true)}
                                    onKeyDown={(e) => {
                                        const total = suggestions.categories.length + suggestions.products.length;
                                        if (e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            setSelectedIndex((prev) => Math.min(prev + 1, total - 1));
                                        } else if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            setSelectedIndex((prev) => Math.max(prev - 1, -1));
                                        } else if (e.key === 'Enter' && selectedIndex >= 0) {
                                            const all = [...suggestions.categories.map(c => ({type:'cat', data:c})), ...suggestions.products.map(p => ({type:'prod', data:p}))];
                                            const sel = all[selectedIndex];
                                            if (sel) {
                                                e.preventDefault();
                                                if (sel.type === 'cat') {
                                                    router.push(`/${lang}/catalog?category=${sel.data.slug}`);
                                                } else {
                                                    router.push(`/${lang}/product/${sel.data.slug}`);
                                                }
                                                setShowSuggestions(false);
                                            }
                                        }
                                    }}
                                    placeholder={lang === 'ru' ? 'Поиск по названию, артикулу...' : 'Mahsulot nomi, SKU yoki o‘lcham...'}
                                    aria-label="Qidiruv"
                                    className="w-full bg-transparent text-gray-900 text-sm py-3 pl-9 pr-10 focus:outline-none"
                                />
                                {isSearching ? (
                                    <div className="absolute right-3 w-4 h-4 border-2 border-gray-300 border-t-brand-red rounded-full animate-spin" />
                                ) : searchQuery ? (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
                                        aria-label="Clear search"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                ) : null}
                            </div>

                            {/* Search Submit Button */}
                            <button
                                type="submit"
                                className="px-5 py-3 bg-brand-red hover:bg-brand-red-dark text-white text-sm font-bold uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1.5 min-h-[44px]"
                            >
                                <Search className="w-4 h-4 md:hidden" />
                                <span>{lang === 'ru' ? 'ПОИСК' : 'QIDIRISH'}</span>
                            </button>
                        </div>

                        {/* Search Suggestions Popup */}
                        {showSuggestions && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden text-sm">
                                {!searchQuery.trim() ? (
                                    <div className="p-4 space-y-3">
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {lang === 'ru' ? 'Популярные запросы' : 'Ommabop qidiruvlar'}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {POPULAR_SEARCHES.map((term) => (
                                                <button
                                                    key={term}
                                                    type="button"
                                                    onClick={() => handlePopularClick(term)}
                                                    className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-red-50 hover:text-brand-red border border-gray-200 text-gray-700 font-medium transition-colors text-xs"
                                                >
                                                    {term}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {suggestions.categories.length > 0 && (
                                            <div className="p-2 border-b border-gray-100 bg-gray-50">
                                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">
                                                    {lang === 'ru' ? 'Категории' : 'Kategoriyalar'}
                                                </div>
                                                {suggestions.categories.map((c, idx) => (
                                                    <Link
                                                        key={c.id}
                                                        href={`/${lang}/catalog?category=${c.slug}`}
                                                        onClick={() => setShowSuggestions(false)}
                                                        className={`flex items-center gap-2 p-2 rounded-lg hover:bg-white text-gray-900 font-semibold text-sm ${selectedIndex === idx ? 'bg-white ring-1 ring-brand-red/20' : ''}`}
                                                    >
                                                        <Folder className="w-4 h-4 text-brand-red" />
                                                        <span>{c.name}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}

                                        {suggestions.products.length > 0 ? (
                                            <div>
                                                <div className="p-2 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    {lang === 'ru' ? 'Товары' : 'Mahsulotlar'}
                                                </div>
                                                {suggestions.products.map((p, idx) => {
                                                    const title = lang === 'ru' ? p.titleRu : p.titleUz;
                                                    const image = p.images?.[0]?.url;
                                                    const globalIdx = suggestions.categories.length + idx;
                                                    return (
                                                        <Link
                                                            key={p.id}
                                                            href={`/${lang}/product/${p.slug}`}
                                                            onClick={() => setShowSuggestions(false)}
                                                            className={`flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${selectedIndex === globalIdx ? 'bg-red-50' : ''}`}
                                                        >
                                                            <div className="w-11 h-11 relative bg-[#F8F9FA] rounded-lg border border-gray-200 shrink-0 p-1">
                                                                {image ? (
                                                                    <Image src={image} alt={title} fill className="object-contain p-0.5" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-400">SPS</div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-semibold text-gray-900 truncate">{title}</div>
                                                                <div className="text-xs font-mono text-gray-500">SKU: {p.sku}</div>
                                                            </div>
                                                            <div className="text-sm font-bold text-brand-red shrink-0">
                                                                {p.price?.toLocaleString()} so'm
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        ) : !isSearching ? (
                                            <div className="p-6 text-center">
                                                <div className="text-sm text-gray-900 font-medium">Natija topilmadi</div>
                                                <div className="text-xs text-gray-500 mt-1">Qidiruv so'zini o'zgartirib ko'ring</div>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        )}
                    </form>

                    {/* RIGHT: Actions */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <Link
                            href={`/${lang}/compare`}
                            className="relative hidden sm:flex items-center justify-center w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 hover:text-gray-900 hover:border-gray-300 hover:bg-white transition-colors"
                            aria-label="Compare"
                        >
                            <ArrowRightLeft className="w-5 h-5" />
                            {compareCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-xs font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white px-0.5">
                                    {compareCount}
                                </span>
                            )}
                        </Link>

                        <Link
                            href={`/${lang}/wishlist`}
                            className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 hover:text-brand-red hover:border-red-200 hover:bg-red-50 transition-colors"
                            aria-label="Wishlist"
                        >
                            <Heart className={`w-5 h-5 ${wishlistCount > 0 ? 'fill-brand-red text-brand-red' : ''}`} />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-brand-red text-white text-xs font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white px-0.5">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>

                        <button
                            onClick={toggleCart}
                            className="flex items-center gap-2 px-4 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl transition-colors font-bold text-sm uppercase tracking-wider shadow-red min-h-[44px]"
                            aria-label={dict.cart.title}
                        >
                            <div className="relative">
                                <ShoppingBag className="w-5 h-5" />
                                {cartTotalItems > 0 && (
                                    <span className="absolute -top-2.5 -right-2.5 bg-gray-900 text-white text-xs font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white px-0.5">
                                        {cartTotalItems}
                                    </span>
                                )}
                            </div>
                            <span className="hidden sm:inline">{lang === 'ru' ? 'КОРЗИНА' : 'SAVAT'}</span>
                        </button>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2.5 text-gray-700 hover:text-brand-red bg-gray-100 border border-gray-200 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label="Toggle Menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Search Input */}
                <div className="mt-3 md:hidden">
                    <form onSubmit={handleSearchSubmit} className="relative flex items-center" role="search">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={lang === 'ru' ? 'Поиск товаров...' : 'Mahsulot nomi yoki SKU qidiring...'}
                            aria-label="Qidiruv"
                            className="w-full bg-[#F8F9FA] border border-gray-300 text-gray-900 text-sm py-3 pl-10 pr-20 rounded-xl focus:outline-none focus:border-brand-red focus:bg-white min-h-[44px]"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5" />
                        <button
                            type="submit"
                            className="absolute right-1.5 px-4 py-2 bg-brand-red text-white text-xs font-bold uppercase rounded-lg min-h-[36px]"
                        >
                            {lang === 'ru' ? 'Поиск' : 'Qidirish'}
                        </button>
                    </form>
                </div>
            </div>

            {/* 3. CATEGORY NAV BAR */}
            <div className="border-t border-b border-gray-200 bg-[#F8F9FA] relative" ref={megaMenuRef}>
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4 py-2 overflow-x-auto no-scrollbar">
                        {/* MEGA MENU TRIGGER */}
                        <button
                            onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer rounded-lg shrink-0 min-h-[36px]"
                            aria-expanded={megaMenuOpen}
                            aria-label="Katalog"
                        >
                            <LayoutGrid className="w-4 h-4 text-brand-red" />
                            <span>{lang === 'ru' ? 'КАТАЛОГ' : 'KATALOG'}</span>
                            <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* CATEGORY LINKS CHIPS */}
                        <nav className="flex items-center gap-2 text-sm font-semibold text-gray-700 shrink-0">
                            {categories.slice(0, 6).map((cat) => {
                                const slug = getCategorySlug(cat);
                                const name = getCategoryName(cat);
                                return (
                                    <Link
                                        key={cat.id}
                                        href={`/${lang}/catalog/${slug}`}
                                        className="hover:text-brand-red hover:bg-white px-3 py-1.5 rounded-lg border border-transparent hover:border-gray-200 transition-colors whitespace-nowrap"
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
                    <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-xl z-50 animate-in fade-in duration-150">
                        <div className="max-w-[1440px] mx-auto p-5 sm:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {categories.length > 0 ? (
                                    categories.map((cat) => {
                                        const parentSlug = getCategorySlug(cat);
                                        const parentName = getCategoryName(cat);
                                        const children = cat.children || [];

                                        return (
                                            <div key={cat.id} className="space-y-2.5">
                                                <Link
                                                    href={`/${lang}/catalog/${parentSlug}`}
                                                    onClick={() => setMegaMenuOpen(false)}
                                                    className="flex items-center gap-2 font-bold text-sm text-gray-900 hover:text-brand-red transition-colors pb-2 border-b border-gray-200 uppercase tracking-wide group"
                                                >
                                                    {cat.image && (
                                                        <div className="w-7 h-7 relative rounded-lg bg-gray-50 overflow-hidden shrink-0 border border-gray-200">
                                                            <Image
                                                                src={cat.image}
                                                                alt={parentName}
                                                                fill
                                                                className="object-contain p-1"
                                                            />
                                                        </div>
                                                    )}
                                                    <span>{parentName}</span>
                                                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-red group-hover:translate-x-0.5 transition-all ml-auto" />
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
                                                                        className="text-sm text-gray-600 hover:text-brand-red transition-colors block py-1 font-medium"
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
                                    <div className="col-span-full py-6 text-center text-sm text-gray-500">
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
                <div className="md:hidden bg-white border-t border-gray-200 px-4 py-5 space-y-4 shadow-xl max-h-[70vh] overflow-y-auto">
                    <div className="font-bold text-xs uppercase tracking-wider text-gray-500 pb-2 border-b border-gray-200">
                        {lang === 'ru' ? 'Категории' : 'Kategoriyalar'}
                    </div>
                    <nav className="flex flex-col space-y-2 text-sm">
                        {categories.map((cat) => {
                            const slug = getCategorySlug(cat);
                            const name = getCategoryName(cat);
                            return (
                                <div key={cat.id} className="border-b border-gray-100 pb-2">
                                    <Link
                                        href={`/${lang}/catalog/${slug}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="font-bold text-gray-900 hover:text-brand-red transition-colors flex items-center justify-between py-2"
                                    >
                                        <span>{name}</span>
                                        <ArrowRight className="w-4 h-4 text-gray-400" />
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
                                                        className="block text-sm text-gray-600 hover:text-brand-red py-1"
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
                    <div className="pt-4 border-t border-gray-200">
                        <a href={`tel:${COMPANY_CONTACTS.phoneRaw}`} className="flex items-center gap-2 text-sm font-bold text-brand-red">
                            <Phone className="w-4 h-4" />
                            {COMPANY_CONTACTS.phoneDisplay}
                        </a>
                    </div>
                </div>
            )}
        </header>
    );
};
