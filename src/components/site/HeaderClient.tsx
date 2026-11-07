'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useCompareList, useRequestList } from '@/lib/store/spsLists';
import { getUi } from '@/lib/ui';
import { type Locale } from '@/lib/i18n';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import { LangSwitch } from '@/components/site/LangSwitch';
import { Icon } from '@/components/site/icons';

/** `match` — faol holat uchun yo'l prefiksi ('' — hech qachon faol emas, masalan #eksport). */
type NavItem = { href: string; match: string; label: string; count?: number };

const isActive = (pathname: string, match: string) =>
  Boolean(match) && (pathname === match || pathname.startsWith(`${match}/`));

export function HeaderClient({
  lang,
  sections,
  total,
  nav,
  pdfHref,
}: {
  lang: Locale;
  sections: NavItem[];
  /** Katalogdagi barcha modellar (yashirin bo'limlar ham) — sarlavhadagi "119 model" bilan bir xil. */
  total: number;
  nav: NavItem[];
  pdfHref: string;
}) {
  const t = getUi(lang);
  const pathname = usePathname() || `/${lang}`;
  const request = useRequestList();
  const compare = useCompareList();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const burgerRef = useRef<HTMLAnchorElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    closeRef.current?.focus();
    // Fokus tuzog'i (audit 2026-11-02): modal ochiqda Tab/Shift+Tab panel ichidagi
    // havolalar/tugmalar orasida aylanadi, ortidagi sahifaga chiqib ketmaydi.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        burgerRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      ).filter((el) => el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const catalogHref = `/${lang}/catalog`;
  // "Katalog" tabi faqat umumiy katalogda faol; bo'lim sahifasida bo'lim tabi faol.
  const catalogActive = pathname === catalogHref;
  const tabs = [
    { href: catalogHref, label: t.header.catalog, count: total, active: catalogActive },
    ...sections.map((s) => ({ href: s.href, label: s.label, count: s.count, active: isActive(pathname, s.match) })),
  ];

  return (
    <>
      <header className="hd">
        {/* Utilita qatori (≥761px): kompaniya havolalari, telefon, ish vaqti, PDF, til */}
        <div className="hd-util">
          <div className="wrap hd-util__in">
            <nav className="hd-util__nav" aria-label={t.a11y.companyNav}>
              {nav.map((n) => (
                <a key={n.href} href={n.href} aria-current={isActive(pathname, n.match) ? 'page' : undefined}>
                  {n.label}
                </a>
              ))}
            </nav>
            <div className="hd-util__aside">
              <a className="hd-util__phone" href={`tel:${CONTACTS_2027.mainPhoneRaw}`}>
                {CONTACTS_2027.mainPhone}
              </a>
              <span className="hd-util__hours">{t.header.hours}</span>
              <a className="hd-util__pdf" href={pdfHref}>
                <Icon.download width={14} height={14} strokeWidth={2} aria-hidden="true" />
                {t.menu.pdf}
              </a>
              <LangSwitch lang={lang} className="hd-lang" label={t.a11y.langNavHeader} />
            </div>
          </div>
        </div>

        <div className="wrap hd-main">
          <a className="hd-logo" href={`/${lang}`} aria-label="SPS Stone Profy Servise">
            <Image src="/images/brand/logo-ink.webp" alt="" width={62} height={38} priority />
          </a>

          <nav className={`hd-tabs${lang === 'ru' ? ' hd-tabs--ru' : ''}`} aria-label={t.a11y.sectionsNav}>
            {tabs.map((tab) => (
              <a key={tab.href} href={tab.href} aria-current={tab.active ? 'page' : undefined}>
                {tab.label}
                <span className="num">{tab.count}</span>
              </a>
            ))}
          </nav>

          <form className="hd-search" role="search" action={catalogHref} method="GET">
            <Icon.search width={18} height={18} strokeWidth={1.75} aria-hidden="true" />
            <input type="search" name="q" placeholder={t.header.searchPlaceholder} aria-label={t.header.searchLabel} />
          </form>

          <div className="hd-actions">
            <a className="hd-ic" href={`/${lang}/compare`} aria-label={`${t.header.compare}: ${compare.count}`}>
              <Icon.compare width={22} height={22} strokeWidth={1.75} aria-hidden="true" />
              <b className="hd-badge" data-zero={compare.count === 0} key={`c${compare.count}`}>
                {compare.count}
              </b>
            </a>
            <a className="hd-ic" href={`/${lang}/request`} aria-label={`${t.header.requestList}: ${request.items.length}`}>
              <Icon.list width={22} height={22} strokeWidth={1.75} aria-hidden="true" />
              <b className="hd-badge" data-zero={request.items.length === 0} key={`r${request.items.length}`}>
                {request.items.length}
              </b>
            </a>
            <a className="hd-ic hd-tel" href={`tel:${CONTACTS_2027.mainPhoneRaw}`} aria-label={t.header.call}>
              <Icon.phone width={21} height={21} strokeWidth={1.75} aria-hidden="true" />
            </a>
            <a className="sps-btn sps-btn--primary hd-cta" href={`/${lang}/request`}>
              {t.header.cta}
            </a>
            <a
              ref={burgerRef}
              className="hd-ic hd-burger"
              href="#menyu"
              aria-label={t.header.menu}
              aria-expanded={menuOpen}
              aria-controls="sps-mobile-menu"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(true);
              }}
            >
              <Icon.menu width={20} height={20} strokeWidth={2} aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      {/*
        Panel ichidagi tugunlar faqat ochilganda montaj qilinadi: `hidden` panel
        har sahifada SSR + gidratatsiya qilinardi (~60 tugun: logo, til, nav,
        kontaktlar) — TBT ga hissa qo'shadi (CI Lighthouse mobil TBT 350 ms).
        Tashqi `div` (role/hidden/ref) doim qoladi, shuning uchun ochilganda
        semantika va fokus oqimi o'zgarmaydi.
      */}
      <div className="mm" id="sps-mobile-menu" hidden={!menuOpen} role="dialog" aria-modal="true" aria-label={t.header.menu} ref={panelRef}>
        {menuOpen ? (
          <>
            <div className="mm-head">
              <Image src="/images/brand/logo-ink.webp" alt="SPS" width={52} height={32} />
              <LangSwitch lang={lang} label={t.a11y.langNavMenu} />
              <button
                ref={closeRef}
                className="mm-close"
                type="button"
                aria-label={t.a11y.close}
                onClick={() => {
                  setMenuOpen(false);
                  burgerRef.current?.focus();
                }}
              >
                <Icon.close width={20} height={20} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
            <nav className="mm-nav" aria-label={t.a11y.mobileNav}>
              {tabs.map((tab) => (
                <a key={tab.href} className="mm-link" href={tab.href} aria-current={tab.active ? 'page' : undefined}>
                  {tab.label} <span className="mono">{tab.count}</span>
                </a>
              ))}
              <div className="mm-sub">
                <a href={`/${lang}/request`}>
                  <span>{t.header.requestList}</span>
                  <b className="mm-bdg" data-zero={request.items.length === 0}>
                    {request.items.length}
                  </b>
                </a>
                <a href={`/${lang}/compare`}>
                  <span>{t.header.compare}</span>
                  <b className="mm-bdg mm-bdg--ink" data-zero={compare.count === 0}>
                    {compare.count}
                  </b>
                </a>
                <a href={`/${lang}/partners`}>{t.nav.partners}</a>
                <a href={`/${lang}/production`}>{t.menu.productionExport}</a>
                <a href={`/${lang}/contact`}>{t.nav.contact}</a>
                <a href={pdfHref}>{t.menu.pdf}</a>
              </div>
            </nav>
            <div className="mm-foot">
              <div className="mm-foot__phone">
                <a className="mono" href={`tel:${CONTACTS_2027.mainPhoneRaw}`}>
                  {CONTACTS_2027.mainPhone}
                </a>
                <span className="sps-help">{t.header.hours}</span>
              </div>
              <div className="mm-foot__row">
                <a className="sps-btn sps-btn--outline" href={CONTACTS_2027.telegramUrl}>
                  {t.menu.telegram}
                </a>
                <a className="sps-btn sps-btn--outline" href={CONTACTS_2027.whatsappUrl}>
                  {t.menu.whatsapp}
                </a>
              </div>
              <a className="sps-btn sps-btn--primary sps-btn--lg" href={`/${lang}/request`}>
                {t.header.cta}
              </a>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
