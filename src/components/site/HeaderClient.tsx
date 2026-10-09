'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useCompareList, useRequestList } from '@/lib/store/spsLists';
import { getUi } from '@/lib/ui';
import { type Locale } from '@/lib/i18n';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import { LangSwitch } from '@/components/site/LangSwitch';
import { Icon } from '@/components/site/icons';

type NavItem = { href: string; label: string; count?: number; current?: boolean };

export function HeaderClient({
  lang,
  sections,
  nav,
  pdfHref,
}: {
  lang: Locale;
  sections: NavItem[];
  nav: NavItem[];
  pdfHref: string;
}) {
  const t = getUi(lang);
  const request = useRequestList();
  const compare = useCompareList();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const burgerRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        burgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <header className="hd">
        <div className="wrap">
          <div className="hd-top">
            <a className="hd-logo" href={`/${lang}`} aria-label="SPS Stone Profy Servise">
              <Image src="/images/brand/logo-ink.webp" alt="" width={62} height={38} priority />
            </a>
            <a className="hd-cat" href={`/${lang}/catalog`}>
              <Icon.grid width={18} height={18} strokeWidth={1.5} aria-hidden="true" />
              <span>
                {t.header.catalog} · {sections.reduce((s, i) => s + (i.count || 0), 0)}
              </span>
            </a>
            <form className="hd-search" role="search" action={`/${lang}/catalog`} method="GET">
              <Icon.search width={18} height={18} strokeWidth={1.5} aria-hidden="true" />
              <input type="search" name="q" placeholder={t.header.searchPlaceholder} aria-label={t.header.searchLabel} />
              <button className="sps-btn sps-btn--dark sps-btn--sm" type="submit" style={{ height: 34 }}>
                {t.header.search}
              </button>
            </form>
            <div className="hd-phone">
              <span className="mono">{CONTACTS_2027.mainPhone}</span>
              <span>{t.header.hours}</span>
            </div>
            <LangSwitch lang={lang} className="hd-lang" />
            <a
              className="hd-ic sps-iconbtn"
              href={`/${lang}/compare`}
              aria-label={`${t.header.compare}: ${compare.count}`}
            >
              <Icon.compare width={20} height={20} strokeWidth={1.5} aria-hidden="true" />
              <b className="hd-badge" data-zero={compare.count === 0}>
                {compare.count}
              </b>
            </a>
            <a
              className="hd-ic sps-iconbtn"
              href={`/${lang}/request`}
              aria-label={`${t.header.requestList}: ${request.items.length}`}
            >
              <Icon.list width={20} height={20} strokeWidth={1.5} aria-hidden="true" />
              <b className="hd-badge" data-zero={request.items.length === 0}>
                {request.items.length}
              </b>
            </a>
            <a className="hd-ic sps-iconbtn hd-tel" href={`tel:${CONTACTS_2027.mainPhoneRaw}`} aria-label={t.header.call}>
              <Icon.phone width={20} height={20} strokeWidth={1.5} aria-hidden="true" />
            </a>
            <a className="sps-btn sps-btn--primary hd-cta" href={`/${lang}/request`}>
              {t.header.cta}
            </a>
            <a
              ref={burgerRef}
              className="hd-ic sps-iconbtn hd-burger"
              href="#menyu"
              aria-label={t.header.menu}
              aria-expanded={menuOpen}
              aria-controls="sps-mobile-menu"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(true);
              }}
            >
              <Icon.menu width={20} height={20} strokeWidth={1.5} aria-hidden="true" />
            </a>
          </div>
          <nav className={`hd-nav${lang === 'ru' ? ' hd-nav--ru' : ''}`} aria-label={t.a11y.sectionsNav}>
            {sections.map((s) => (
              <a key={s.href} href={s.href} aria-current={s.current ? 'page' : undefined}>
                {s.label}
                <span className="num">{s.count}</span>
              </a>
            ))}
            <i className="sep" aria-hidden="true" />
            {nav.map((n) =>
              n.href ? (
                <a key={n.label} href={n.href} aria-current={n.current ? 'page' : undefined}>
                  {n.label}
                </a>
              ) : null,
            )}
            <a className="pdf" href={pdfHref} style={{ marginLeft: 'auto', color: 'var(--red-ink)' }}>
              {t.header.pdf}
            </a>
          </nav>
        </div>
      </header>

      <div className="mm" id="sps-mobile-menu" hidden={!menuOpen} role="dialog" aria-modal="true" aria-label={t.header.menu}>
        <div className="mm-head">
          <Image src="/images/brand/logo-ink.webp" alt="SPS" width={52} height={32} />
          <LangSwitch lang={lang} />
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
            <Icon.close width={20} height={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <nav className="mm-nav" aria-label={t.a11y.sectionsNav}>
          {sections.map((s) => (
            <a key={s.href} className="mm-link" href={s.href}>
              {s.label} <span className="mono">{s.count}</span>
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
          <span className="sps-label">{t.menu.sales}</span>
          <span className="mono">{CONTACTS_2027.mainPhone}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <a className="sps-btn sps-btn--outline" href={CONTACTS_2027.telegramUrl} style={{ flex: 1 }}>
              {t.menu.telegram}
            </a>
            <a className="sps-btn sps-btn--outline" href={CONTACTS_2027.whatsappUrl} style={{ flex: 1 }}>
              {t.menu.whatsapp}
            </a>
          </div>
          <a className="sps-btn sps-btn--primary sps-btn--lg" href={`/${lang}/request`}>
            {t.header.cta}
          </a>
        </div>
      </div>
    </>
  );
}
