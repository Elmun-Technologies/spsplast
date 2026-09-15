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

        const controller = new AbortController();

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const categoryParam = selectedCategorySlug ? `&category=${encodeURIComponent(selectedCategorySlug)}` : '';
                const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}${categoryParam}`, {
                    signal: controller.signal,
                });
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions({
                        products: data.products || [],
                        categories: data.categories || [],
                    });
                    setShowSuggestions(true);
                }
            } catch (err) {
                // Aborted requests are expected (typing fast / navigation) — stay silent
                if ((err as Error)?.name !== 'AbortError') {
                    console.error('Search suggestion error:', err);
                }
            } finally {
                setIsSearching(false);
            }
        }, 250);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
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
        <header className="sticky top-0 z-50 w-full bg-surface text-ink border-b border-line">
            {/* 1. TOP UTILITY STRIP */}
            <div className="bg-surface-page py-2 px-4 sm:px-6 lg:px-10 text-[12px] border-b border-line">
                <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                    {/* Left Trust Indicator */}
                    <div className="flex items-center gap-3 font-medium text-ink-soft">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{lang === 'ru' ? 'Завод-производитель' : 'Ishlab chiqaruvchi zavod'}</span>
                        </div>
                        <span className="hidden sm:inline text-[#D7DEE8]">|</span>
                        <div className="hidden sm:flex items-center gap-1.5 text-ink-sub">
                            <Truck className="w-3.5 h-3.5" />
                            <span>{lang === 'ru' ? 'Доставка по Узбекистану' : 'O‘zbekiston bo‘ylab yetkazish'}</span>
                        </div>
                    </div>

                    {/* Right: Phone & Language */}
                    <div className="flex items-center gap-3">
                        {hasPhone && (
                            <a
                                href={`tel:${COMPANY_CONTACTS.phoneRaw}`}
                                onClick={() => trackEvent('phone_click', { location: 'topbar' })}
                                aria-label="Call SPS"
                                className="hidden sm:flex items-center gap-1.5 text-ink-soft hover:text-brand-red transition-colors font-semibold"
                            >
                                <Phone className="w-3.5 h-3.5" />
                                <span>{COMPANY_CONTACTS.phoneDisplay}</span>
                            </a>
                        )}

                        <Link
                            href={switchLangUrl}
                            className="px-3 py-1 rounded-full bg-surface border border-line hover:border-brand-red hover:text-brand-red text-ink-soft transition-colors text-[12px] font-semibold"
                        >
                            {currentOtherLang.toUpperCase()}
                        </Link>
                    </div>
                </div>
            </div>

            {/* 2. MAIN HEADER BAR */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-3.5">
                <div className="flex items-center justify-between gap-4 md:gap-6">
                    {/* LEFT: SPS Brand */}
                    <Link href={`/${lang}`} className="flex items-center gap-2.5 shrink-0 group">
                        <div className="w-10 h-10 rounded-[14px] bg-brand-red flex items-center justify-center font-bold text-white text-[13px] tracking-tight group-hover:bg-brand-red-dark transition-colors">
                            SPS
                        </div>
                        <div className="hidden xs:flex sm:flex flex-col">
                            <span className="font-bold text-[17px] tracking-[-0.02em] leading-none text-ink">
                                SPS Plast
                            </span>
                            <span className="text-[10px] tracking-[0.06em] text-ink-sub mt-1">
                                Qoliplar va fasad dekor
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
                        <div className="relative w-full flex items-center bg-surface-soft border border-transparent rounded-full overflow-hidden focus-within:bg-surface focus-within:border-line focus-within:shadow-card transition-all">
                            {/* Category Filter Selector inside Search */}
                            <div className="relative shrink-0 hidden lg:block">
                                <label htmlFor="cat-filter" className="sr-only">Category</label>
                                <select
                                    id="cat-filter"
                                    value={selectedCategorySlug}
                                    onChange={(e) => setSelectedCategorySlug(e.target.value)}
                                    className="bg-transparent text-[13px] font-medium text-ink-soft py-3 pl-5 pr-8 focus:outline-none cursor-pointer appearance-none min-w-[150px]"
                                >
                                    <option value="">{lang === 'ru' ? 'Все категории' : 'Barcha bo‘limlar'}</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={getCategorySlug(cat)}>
                                            {getCategoryName(cat)}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-ink-sub absolute right-3.5 top-3.5 pointer-events-none" />
                            </div>

                            {/* Main Search Input */}
                            <div className="relative flex-1 flex items-center">
                                <Search className="w-4 h-4 text-ink-sub absolute left-4 pointer-events-none" />
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
                                    className="w-full bg-transparent text-ink text-sm py-3 pl-11 pr-10 focus:outline-none placeholder:text-ink-sub"
                                />
                                {isSearching ? (
                                    <div className="absolute right-3 w-4 h-4 border-2 border-[#DDE3EB] border-t-brand-red rounded-full animate-spin" />
                                ) : searchQuery ? (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 p-1 text-ink-sub hover:text-ink-soft rounded-full hover:bg-surface-soft"
                                        aria-label="Clear search"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                ) : null}
                            </div>

                            {/* Search Submit Button */}
                            <button
                                type="submit"
                                className="m-1.5 w-11 h-11 shrink-0 rounded-full bg-ink hover:bg-black text-white transition-colors flex items-center justify-center"
                                aria-label={lang === 'ru' ? 'Найти' : 'Qidirish'}
                            >
                                <Search className="w-[18px] h-[18px]" />
                            </button>
                        </div>

                        {/* Search Suggestions Popup */}
                        {showSuggestions && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-line rounded-[20px] shadow-pop z-50 overflow-hidden text-sm">
                                {!searchQuery.trim() ? (
                                    <div className="p-4 space-y-3">
                                        <div className="text-xs font-bold text-ink-sub uppercase tracking-wider">
                                            {lang === 'ru' ? 'Популярные запросы' : 'Ommabop qidiruvlar'}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {POPULAR_SEARCHES.map((term) => (
                                                <button
                                                    key={term}
                                                    type="button"
                                                    onClick={() => handlePopularClick(term)}
                                                    className="px-3 py-1.5 rounded-full bg-surface-soft hover:bg-[#FEF0F0] hover:text-brand-red text-ink-soft font-medium transition-colors text-xs"
                                                >
                                                    {term}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        {suggestions.categories.length > 0 && (
                                            <div className="p-2 border-b border-line-soft">
                                                <div className="text-[11px] font-bold text-ink-sub uppercase tracking-wider mb-1 px-2">
                                                    {lang === 'ru' ? 'Категории' : 'Kategoriyalar'}
                                                </div>
                                                {suggestions.categories.map((c, idx) => (
                                                    <Link
                                                        key={c.id}
                                                        href={`/${lang}/catalog?category=${c.slug}`}
                                                        onClick={() => setShowSuggestions(false)}
                                                        className={`flex items-center gap-2 p-2 rounded-[16px] hover:bg-surface-soft text-ink font-semibold text-sm ${selectedIndex === idx ? 'bg-surface-soft' : ''}`}
                                                    >
                                                        <Folder className="w-4 h-4 text-brand-red" />
                                                        <span>{c.name}</span>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}

                                        {suggestions.products.length > 0 ? (
                                            <div>
                                                <div className="p-2 px-3 border-b border-line-soft text-[11px] font-bold text-ink-sub uppercase tracking-wider">
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
                                                            className={`flex items-center gap-3 p-3 hover:bg-surface-soft transition-colors border-b border-line-soft last:border-0 ${selectedIndex === globalIdx ? 'bg-surface-soft' : ''}`}
                                                        >
                                                            <div className="w-11 h-11 relative bg-surface-soft rounded-[16px] shrink-0 p-1">
                                                                {image ? (
                                                                    <Image src={image} alt={title} fill sizes="44px" className="object-contain p-0.5" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-ink-sub">SPS</div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="text-sm font-semibold text-ink truncate">{title}</div>
                                                                <div className="text-[11px] text-ink-sub">SKU: {p.sku}</div>
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
                                                <div className="text-sm text-ink font-medium">Natija topilmadi</div>
                                                <div className="text-xs text-ink-sub mt-1">Qidiruv so'zini o'zgartirib ko'ring</div>
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
                            className="relative hidden sm:flex items-center justify-center w-11 h-11 rounded-full bg-surface-soft text-ink-soft hover:bg-[#E9EDF3] hover:text-ink transition-colors"
                            aria-label="Compare"
                        >
                            <ArrowRightLeft className="w-[18px] h-[18px]" />
                            {compareCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-ink text-white text-[11px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white px-0.5">
                                    {compareCount}
                                </span>
                            )}
                        </Link>

                        <Link
                            href={`/${lang}/wishlist`}
                            className="relative flex items-center justify-center w-11 h-11 rounded-full bg-surface-soft text-ink-soft hover:bg-[#E9EDF3] hover:text-brand-red transition-colors"
                            aria-label="Wishlist"
                        >
                            <Heart className={`w-[18px] h-[18px] ${wishlistCount > 0 ? 'fill-brand-red text-brand-red' : ''}`} />
                            {wishlistCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-brand-red text-white text-[11px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white px-0.5">
                                    {wishlistCount}
                                </span>
                            )}
                        </Link>

                        <button
                            onClick={toggleCart}
                            className="flex items-center gap-2 px-4 sm:px-5 h-11 bg-brand-red hover:bg-brand-red-dark text-white rounded-full transition-colors font-semibold text-sm shadow-[0_8px_20px_-10px_rgba(230,28,36,0.8)]"
                            aria-label={dict.cart.title}
                        >
                            <div className="relative">
                                <ShoppingBag className="w-[18px] h-[18px]" />
                                {cartTotalItems > 0 && (
                                    <span className="absolute -top-2.5 -right-2.5 bg-surface text-brand-red text-[11px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-0.5">
                                        {cartTotalItems}
                                    </span>
                                )}
                            </div>
                            <span className="hidden sm:inline">{lang === 'ru' ? 'Корзина' : 'Savat'}</span>
                        </button>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden w-11 h-11 rounded-full bg-surface-soft text-ink-soft hover:text-ink flex items-center justify-center"
                            aria-label="Toggle Menu"
                        >
                            {mobileMenuOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
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
                            className="w-full bg-surface-soft text-ink text-sm py-3 pl-11 pr-14 rounded-full focus:outline-none focus:bg-surface focus:ring-1 focus:ring-line min-h-[46px] placeholder:text-ink-sub"
                        />
                        <Search className="w-4 h-4 text-ink-sub absolute left-4" />
                        <button
                            type="submit"
                            className="absolute right-1 w-9 h-9 rounded-full bg-ink text-white flex items-center justify-center"
                            aria-label={lang === 'ru' ? 'Найти' : 'Qidirish'}
                        >
                            <Search className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </div>

            {/* 3. CATEGORY NAV BAR */}
            <div className="border-t border-line bg-surface relative" ref={megaMenuRef}>
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between">
                    <div className="flex items-center gap-2 py-2.5 overflow-x-auto no-scrollbar">
                        {/* MEGA MENU TRIGGER */}
                        <button
                            onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                            className="flex items-center gap-2 px-5 h-10 bg-ink hover:bg-black text-white font-semibold text-sm transition-colors cursor-pointer rounded-full shrink-0"
                            aria-expanded={megaMenuOpen}
                            aria-label="Katalog"
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span>{lang === 'ru' ? 'Каталог' : 'Katalog'}</span>
                            <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* CATEGORY LINKS CHIPS */}
                        <nav className="flex items-center gap-1 text-sm font-medium text-ink-soft shrink-0">
                            {categories.slice(0, 6).map((cat) => {
                                const slug = getCategorySlug(cat);
                                const name = getCategoryName(cat);
                                return (
                                    <Link
                                        key={cat.id}
                                        href={`/${lang}/catalog/${slug}`}
                                        className="hover:text-brand-red hover:bg-surface-soft px-3 py-2 rounded-full transition-colors whitespace-nowrap"
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
                    <div className="absolute top-full left-0 right-0 bg-surface border-b border-line shadow-pop z-50 animate-in fade-in duration-150">
                        <div className="max-w-[1400px] mx-auto p-5 sm:p-7">
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
                                                    className="flex items-center gap-2 font-semibold text-sm text-ink hover:text-brand-red transition-colors pb-2 border-b border-line group"
                                                >
                                                    {cat.image && (
                                                        <div className="w-8 h-8 relative rounded-[16px] bg-surface-soft overflow-hidden shrink-0">
                                                            <Image
                                                                src={cat.image}
                                                                alt={parentName}
                                                                fill
                                                                sizes="28px"
                                                                className="object-contain p-1"
                                                            />
                                                        </div>
                                                    )}
                                                    <span>{parentName}</span>
                                                    <ArrowRight className="w-4 h-4 text-ink-sub group-hover:text-brand-red group-hover:translate-x-0.5 transition-all ml-auto" />
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
                                                                        className="text-[13px] text-ink-soft hover:text-brand-red transition-colors block py-1.5"
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
                                    <div className="col-span-full py-6 text-center text-sm text-ink-sub">
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
                <div className="md:hidden bg-surface border-t border-line px-4 py-5 space-y-4 shadow-pop max-h-[70vh] overflow-y-auto">
                    <div className="font-bold text-xs uppercase tracking-wider text-ink-sub pb-2 border-b border-line">
                        {lang === 'ru' ? 'Категории' : 'Kategoriyalar'}
                    </div>
                    <nav className="flex flex-col space-y-2 text-sm">
                        {categories.map((cat) => {
                            const slug = getCategorySlug(cat);
                            const name = getCategoryName(cat);
                            return (
                                <div key={cat.id} className="border-b border-line-soft pb-2">
                                    <Link
                                        href={`/${lang}/catalog/${slug}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="font-semibold text-ink hover:text-brand-red transition-colors flex items-center justify-between py-2"
                                    >
                                        <span>{name}</span>
                                        <ArrowRight className="w-4 h-4 text-ink-sub" />
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
                                                        className="block text-[13px] text-ink-soft hover:text-brand-red py-1.5"
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
                    <div className="pt-4 border-t border-line">
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
