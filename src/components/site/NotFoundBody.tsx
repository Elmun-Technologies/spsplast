'use client';

import Image from 'next/image';
import { SECTIONS, SECTION_SLUGS, getSectionCounts, sectionCover } from '@/lib/catalog2027';
import type { Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { getPages } from '@/lib/pages';
import { CONTACTS_2027 } from '@/lib/contacts2027';

/**
 * 404 tanasi (NotFound.dc.html): katta "404" (o'rtadagi 0 qizil), qidiruv,
 * 5 bo'lim chipi, CTA va Monako sahnasi. Qidiruv JS'siz ishlaydi:
 * form action = katalog, input name = q.
 *
 * 'use client': `not-found.tsx` chegarasiga Next `params` uzatmaydi, shuning
 * uchun til `useParams()` orqali olinadi (server komponentda bu iloji yo'q).
 */
export function NotFoundBody({ lang }: { lang: Locale }) {
  const t = getUi(lang);
  const p = getPages(lang);
  const counts = getSectionCounts();

  return (
    <>
      <section className="nf-sec">
        <div className="wrap nf">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="nf-num" aria-hidden="true">
              4<span>0</span>4
            </div>
            <h1 className="h1">{p.notfound.title}</h1>
            <p className="lead muted">{p.notfound.text}</p>

            <form className="srch" action={`/${lang}/catalog`} method="get" role="search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
              <input type="search" name="q" placeholder={t.header.searchPlaceholder} aria-label={t.header.searchLabel} />
              <button className="sps-btn sps-btn--dark sps-btn--sm" type="submit">
                {p.notfound.search}
              </button>
            </form>

            <div className="chips">
              {SECTIONS.map((s) => (
                <a className="chip-a" key={s} href={`/${lang}/catalog/${SECTION_SLUGS[s]}`}>
                  {t.sections[s]} <i>{counts[s]}</i>
                </a>
              ))}
            </div>

            <div className="cta-row row" style={{ paddingTop: 8 }}>
              <a className="sps-btn sps-btn--primary sps-btn--lg" href={`/${lang}/catalog`}>
                {p.notfound.openCatalog}
              </a>
              <a className="sps-btn sps-btn--outline sps-btn--lg" href={`/${lang}`}>
                {p.notfound.home}
              </a>
            </div>
          </div>

          <div className="nf-img">
            <Image src={sectionCover('trotuar')} alt={p.notfound.img} fill sizes="(max-width: 900px) 100vw, 620px" priority />
          </div>
        </div>
      </section>

      <section style={{ paddingBlock: 'var(--space-8)' }}>
        <div
          className="wrap"
          style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <b style={{ font: '600 20px/28px var(--font-sans)' }}>{p.notfound.helpTitle}</b>
            <span className="body muted">{p.notfound.helpText}</span>
          </div>
          <div className="cta-row row">
            <a className="sps-btn sps-btn--outline" href={CONTACTS_2027.telegramUrl} target="_blank" rel="noopener noreferrer">
              Telegram · {CONTACTS_2027.telegramHandle}
            </a>
            <a className="sps-btn sps-btn--outline" href={`tel:${CONTACTS_2027.mainPhoneRaw}`}>
              {CONTACTS_2027.mainPhone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
