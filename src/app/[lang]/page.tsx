import Image from 'next/image';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getUi, pluralModels } from '@/lib/ui';
import { getPages } from '@/lib/pages';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import {
  SECTIONS,
  SECTION_SLUGS,
  getPopular,
  getSectionCounts,
  getTotalCount,
  sectionCover,
} from '@/lib/catalog2027';
import { CatalogClient } from '@/components/catalog2027/CatalogClient';
import { PDF_CATALOG_HREF } from '@/components/site/SiteHeader';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? (lang as Locale) : 'uz';
  const p = getPages(locale);
  const n = getTotalCount();
  return {
    title: p.home.h1(n).replace(/\.$/, '') + ' — SPS Plast',
    description: p.home.lead,
  };
}

/** Afzallik bloki ikonlari — Main.dc.html dagi chiziqli svg'lar. */
const USP_ICONS = [
  <svg key="1" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M3 21V9l6 3V9l6 3V5h6v16z" />
  </svg>,
  <svg key="2" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="3" y="3" width="8" height="8" />
    <rect x="13" y="13" width="8" height="8" />
    <path d="M13 7h8M3 17h8" />
  </svg>,
  <svg key="3" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="4" y="3" width="16" height="18" rx="1" />
    <path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2M8 18h8" />
  </svg>,
  <svg key="4" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </svg>,
];

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const t = getUi(lang);
  const p = getPages(lang);
  const counts = getSectionCounts();
  const total = getTotalCount();
  const tg = CONTACTS_2027.telegramUrl;
  const pdf = PDF_CATALOG_HREF;

  return (
    <>
      {/* 1. Hero */}
      <section className="sec-alt" style={{ paddingBlock: 'var(--space-7) var(--space-6)' }}>
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="band">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p className="sps-eyebrow">
                <b>SPS</b> {p.home.eyebrow}
              </p>
              <h1 className="disp-l hero-h">{p.home.h1(total)}</h1>
              <p className="lead hero-p muted">{p.home.lead}</p>
            </div>
            <div className="hs">
              {p.home.stats.map((s) => (
                <div key={s.label}>
                  <b>
                    {s.value}
                    {s.unit ? <small>{s.unit}</small> : null}
                  </b>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="secs" aria-label={p.home.sectionTiles}>
            {SECTIONS.map((s) => (
              <a key={s} className="st" href={`/${lang}/catalog/${SECTION_SLUGS[s]}`}>
                <Image src={sectionCover(s)} alt="" fill sizes="(max-width: 760px) 50vw, 260px" priority={s === 'trotuar'} />
                <div>
                  <b>{t.sections[s]}</b>
                  <span>
                    {counts[s]} {pluralModels(lang, counts[s])}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Katalog bloki — 12 ta mashhur model */}
      <section style={{ paddingBlock: 'var(--space-6) var(--space-9)' }}>
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 'var(--space-4)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p className="sps-eyebrow">
                <b>{t.header.catalog}</b> {p.home.catalogEyebrow}
              </p>
              <h2 className="h1">{p.home.catalogTitle}</h2>
            </div>
            <a className="sps-btn sps-btn--outline hide-m" href={`/${lang}/catalog`}>
              {p.home.catalogAll} · {total} {pluralModels(lang, total)}
            </a>
          </div>
          <CatalogClient lang={lang} models={getPopular(12)} variant="home" />
        </div>
      </section>

      {/* 3. Afzalliklar */}
      <section style={{ paddingBottom: 'var(--space-9)' }}>
        <div className="wrap">
          <div className="usp">
            {p.home.usp.map((u, i) => (
              <div key={u.title}>
                {USP_ICONS[i]}
                <div>
                  <b>{u.title}</b>
                  <p>{u.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Uch qadamda narx */}
      <section className="sec sec-alt">
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="split" style={{ alignItems: 'end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p className="sps-eyebrow">
                <b>{p.home.stepsEyebrowLabel}</b> {p.home.stepsEyebrow}
              </p>
              <h2 className="h1">{p.home.stepsTitle}</h2>
            </div>
            <p className="lead muted">{p.home.stepsLead}</p>
          </div>
          <div className="steps3">
            {p.home.steps.map((s) => (
              <div key={s.n}>
                <span className="step-n">{s.n}</span>
                <h3 className="h3">{s.title}</h3>
                <p className="body muted">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="cta-row row">
            <a className="sps-btn sps-btn--primary sps-btn--lg" href={`/${lang}/request`}>
              {t.header.cta}
            </a>
            <a className="sps-btn sps-btn--outline sps-btn--lg" href={tg} target="_blank" rel="noopener noreferrer">
              {p.home.stepsCtaTelegram}
            </a>
          </div>
        </div>
      </section>

      {/* 5. Ulgurji bloki */}
      <section className="sec">
        <div className="wrap g2" style={{ gap: 'var(--space-8)', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <p className="sps-eyebrow">
              <b>{p.home.wholesaleEyebrowLabel}</b> {p.home.wholesaleEyebrow}
            </p>
            <h2 className="h1">{p.home.wholesaleTitle}</h2>
            <p className="lead muted">{p.home.wholesaleLead}</p>
            <div className="cta-row row">
              <a className="sps-btn sps-btn--primary sps-btn--lg" href={`/${lang}/partners`}>
                {p.home.wholesaleCta}
              </a>
              <a className="sps-btn sps-btn--outline sps-btn--lg" href={pdf} download>
                {p.home.wholesalePdf}
              </a>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: 'var(--radius-card)', position: 'relative' }}>
              <Image src="/images/site/factory.webp" alt={p.home.wholesaleImg1} fill sizes="(max-width: 760px) 45vw, 300px" loading="lazy" />
            </div>
            <div style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: 'var(--radius-card)', position: 'relative' }}>
              <Image src="/images/site/containers.webp" alt={p.home.wholesaleImg2} fill sizes="(max-width: 760px) 45vw, 300px" loading="lazy" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
