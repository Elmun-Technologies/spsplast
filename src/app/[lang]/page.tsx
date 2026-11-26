import Image from 'next/image';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { getPages } from '@/lib/pages';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import {
  SECTION_SLUGS,
  calcMolds,
  calcWeight,
  getActiveSections,
  getPopular,
  getTotalCount,
  modelName,
  modelPerM2,
  sectionCoverImage,
  sectionLabel,
} from '@/lib/catalog2027';
import { CatalogClient } from '@/components/catalog2027/CatalogClient';
import { Icon } from '@/components/site/icons';
import { jsonLdReview, pageMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { flipHref } from '@/lib/catalogPdf';
import { patternStyle } from '@/lib/patterns';
import { notFound } from 'next/navigation';
import { Testimonials } from '@/components/site/Testimonials';
import { getTestimonials, testimonialAuthorName, testimonialText } from '@/lib/testimonials2027';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? (lang as Locale) : 'uz';
  const p = getPages(locale);
  return pageMetadata({
    lang: locale,
    path: '',
    // H1 (`p.home.h1`) maket matni — <title> uchun qisqa `seoTitle` ishlatiladi.
    title: p.home.seoTitle(getTotalCount()),
    description: p.home.lead,
  });
}

/** Model sahifasi manzili (ProductCard.productHref client modulda — server'dan chaqirib bo'lmaydi). */
const modelHref = (lang: Locale, m: { section: string; slug: string }) =>
  `/${lang}/catalog/${SECTION_SLUGS[m.section]}/${m.slug}`;

/** 1100 → "1 100" (formatNumber faqat o'nlik ajratgichni almashtiradi). */
const groupDigits = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');

/** Kalkulyator misoli uchun kunlik hajm (model sahifasidagi kalkulyator standarti ham 100). */
const CALC_EXAMPLE_M2 = 100;

/**
 * Ulgurji kartochkalari rasmi — faqat SPS'ning haqiqiy materiallari (Redesign 2028 rasm qoidasi):
 * studiyadagi qolip suratlari (oq fon, `mix-blend-mode: multiply`) yoki terilgan plitka sahnasi.
 * Stok odamlar/omborlar ishlatilmaydi.
 */
const WHOLESALE_MEDIA: ({ molds: string[] } | { scene: string })[] = [
  {
    molds: ['/images/site/molds/mold-1.webp', '/images/site/molds/mold-2.webp', '/images/site/molds/mold-3.webp'],
  },
  {
    molds: ['/images/site/molds/mold-4.webp', '/images/site/molds/mold-5.webp', '/images/site/molds/mold-6.webp'],
  },
  { scene: '/catalog/2027/trotuar-56-buxoro-scene-sm.webp' },
];

/**
 * Bosh sahifa (2026-11-23): birinchi ekran — tanlov bloki (qaror 2026-11-17: «Qoliplar» va «Tayyor mahsulotlar»),
 * undan keyin ishonch va konversiya bloklari: raqamlar, bo'limlar, yangi/ommabop modellar, "uch qadamda narx"
 * + kalkulyator misoli, zavod, mijozlar fikri (bo'sh bo'lsa chiqmaydi), ulgurji. Naqshlar — `src/lib/patterns.ts`.
 */
export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const t = getUi(lang);
  const p = getPages(lang);
  const total = getTotalCount();
  const sections = getActiveSections();
  const popular = getPopular(12);

  // Kalkulyator misoli: sahna + qolip surati bor eng mashhur model (hozir № 01 Monako).
  // Hisob chiqadigan (1 m² dagi soni aniq) birinchi model — "33 + 33" kabi to'plamlar hisoblanmaydi.
  const featured =
    getPopular(60).find(
      (m) => m.images.scene && m.images.molds.A && m.code && calcMolds(m, CALC_EXAMPLE_M2) !== null,
    ) ?? popular[0];
  const featuredName = featured ? modelName(featured, lang) : '';
  const featuredPer = featured ? modelPerM2(featured) : null;
  const exMolds = featured ? calcMolds(featured, CALC_EXAMPLE_M2) : null;
  const exWeight = featured ? calcWeight(featured, CALC_EXAMPLE_M2) : null;
  const testimonials = getTestimonials();

  // Ikki yo'nalish paneli: bir xil kompozitsiya — studiya fonida haqiqiy qolip (och) va tayyor mahsulot (grafit).
  // Rasmlar `public/images/site/home/*-hero.webp` (qolip/mahsulot kesmalaridan yig'ilgan, pastki qismi panel rangida).
  const panels = [
    {
      key: 'molds',
      href: `/${lang}/catalog`,
      label: p.home.split.moldsLabel,
      title: p.home.split.moldsTitle,
      text: p.home.split.moldsText,
      points: p.home.split.moldsPoints,
      cta: p.home.split.moldsCta,
      img: '/images/site/home/molds-hero.webp',
      meta: '',
    },
    {
      key: 'ready',
      href: `/${lang}/ready`,
      label: p.home.split.readyLabel,
      title: p.home.split.readyTitle,
      text: p.home.split.readyText,
      points: p.home.split.readyPoints,
      cta: p.home.split.readyCta,
      img: '/images/site/home/ready-hero.webp',
      meta: '',
    },
  ];

  return (
    <>
      {testimonials.length ? (
        <JsonLd
          data={testimonials.map((item) =>
            jsonLdReview({
              authorName: testimonialAuthorName(item, lang),
              reviewBody: testimonialText(item, lang),
              rating: item.rating,
            }),
          )}
        />
      ) : null}
      {/* 1. Tanlov bloki: Qoliplar / Tayyor mahsulotlar (girih naqshi fonida) */}
      <section className="hm-fork pat" style={patternStyle('girih')} aria-label={p.home.split.eyebrow}>
        <div className="wrap">
          <p className="sps-eyebrow hm-fork__eyebrow">{p.home.split.eyebrow}</p>
          <h1 className="hm-fork__h">{p.home.h1(total)}</h1>
          <div className="hm-split">
            {panels.map((c) => (
              <a key={c.key} className={`hm-panel hm-panel--${c.key}`} href={c.href}>
                <span className="hm-panel__media">
                  <Image src={c.img} alt="" fill sizes="(max-width: 760px) 100vw, 640px" priority={c.key === 'molds'} />
                </span>
                <span className="hm-panel__body">
                  <span className="hm-panel__label">
                    {c.label}
                    {c.meta ? ` · ${c.meta}` : ''}
                  </span>
                  <h2 className="hm-panel__title">{c.title}</h2>
                  <span className="hm-panel__text">{c.text}</span>
                  <ul className="hm-panel__list">
                    {c.points.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <span className="sps-btn sps-btn--primary hm-panel__cta">
                    {c.cta}
                    <Icon.arrowRight width={18} height={18} strokeWidth={2} aria-hidden="true" />
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Raqamlar bandi — qorong'i, yulduz naqshi bilan (raqamlar admin'dan, `{years}` … tokenlari) */}
      <section className="hm-band pat" style={patternStyle('yulduz', 'light')} aria-label={p.home.eyebrow}>
        <div className="wrap">
          <div className="hm-stats">
            {p.home.stats.map((s) => (
              <div key={s.label}>
                <b>
                  <span data-countup>{s.value}</span>
                  {s.unit ? <small>{s.unit}</small> : null}
                </b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Bo'limlar + maslahat kartochkasi */}
      <section className="sec">
        <div className="wrap hm-stack">
          <div className="hm-head">
            <div>
              <p className="sps-eyebrow">
                <b>{t.header.catalog}</b> · {p.home.sectionsEyebrow}
              </p>
              <h2 className="h1">{p.home.sectionsTitle}</h2>
            </div>
            <a className="hm-link" href={`/${lang}/catalog`}>
              {p.home.catalogAll}
              <Icon.arrowRight width={18} height={18} strokeWidth={2} aria-hidden="true" />
            </a>
          </div>
          <div className="hm-secs" aria-label={p.home.sectionTiles}>
            {sections.map((s, i) => {
              const cover = sectionCoverImage(s);
              return (
                <a key={s} className="hm-sec" href={`/${lang}/catalog/${SECTION_SLUGS[s]}`}>
                  <span className={`hm-sec__media${cover.fit === 'contain' ? ' hm-sec__media--cutout' : ''}`}>
                    <Image src={cover.src} alt="" fill sizes="(max-width: 760px) 50vw, 300px" loading="lazy" />
                  </span>
                  <span className="hm-sec__body">
                    <span className="hm-sec__n">{String(i + 1).padStart(2, '0')}</span>
                    <b>{sectionLabel(s, lang)}</b>
                  </span>
                  <span className="hm-sec__go" aria-hidden="true">
                    <Icon.arrowRight width={18} height={18} strokeWidth={2} />
                  </span>
                </a>
              );
            })}
            <div className="hm-help">
              <div>
                <span className="hm-help__label">{p.home.helpLabel}</span>
                <p className="hm-help__title">{p.home.helpTitle}</p>
                <p className="hm-help__text">{p.home.helpText}</p>
              </div>
              <div className="hm-help__cta">
                <a
                  className="sps-btn hm-btn-light"
                  href={CONTACTS_2027.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon.telegram width={18} height={18} strokeWidth={1.75} aria-hidden="true" />
                  {p.home.stepsCtaTelegram}
                </a>
                <a className="sps-btn sps-btn--on-ink" href={`tel:${CONTACTS_2027.mainPhoneRaw}`}>
                  {CONTACTS_2027.mainPhone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Katalog bloki — 12 ta mashhur model (mobilda 6: sahifa cho'zilib ketmasin) */}
      <section className="sec sec-alt hm-popular">
        <div className="wrap hm-stack">
          <div className="hm-head">
            <div>
              <p className="sps-eyebrow">
                <b>{t.header.catalog}</b> · {p.home.catalogEyebrow}
              </p>
              <h2 className="h1">{p.home.catalogTitle}</h2>
            </div>
            <a className="sps-btn sps-btn--outline hide-m" href={`/${lang}/catalog`}>
              {p.home.catalogAll}
            </a>
          </div>
          <CatalogClient lang={lang} models={popular} variant="home" total={total} />
        </div>
      </section>

      {/* 5. Uch qadamda narx + kalkulyator misoli */}
      <section className="sec">
        <div className="wrap hm-steps">
          <div className="hm-stack">
            <div>
              <p className="sps-eyebrow">
                <b>{p.home.stepsEyebrowLabel}</b> · {p.home.stepsEyebrow}
              </p>
              <h2 className="h1">{p.home.stepsTitle}</h2>
              <p className="lead muted" style={{ marginTop: 12 }}>
                {p.home.stepsLead}
              </p>
            </div>
            <ol className="hm-steps__list">
              {p.home.steps.map((s) => (
                <li key={s.n}>
                  <span className="hm-steps__n">{s.n}</span>
                  <h3 className="h3">{s.title}</h3>
                  <p className="body muted">{s.text}</p>
                </li>
              ))}
            </ol>
            <div className="cta-row row">
              <a className="sps-btn sps-btn--primary sps-btn--lg" href={`/${lang}/request`}>
                {t.header.cta}
              </a>
              <a
                className="sps-btn sps-btn--outline sps-btn--lg"
                href={CONTACTS_2027.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {p.home.stepsCtaTelegram}
              </a>
            </div>
          </div>
          {featured && exMolds ? (
            <aside className="hm-calc" aria-label={p.model.calcTitle}>
              <div className="hm-calc__head">
                <b>{p.model.calcTitle}</b>
                <span>
                  {p.home.calcExample}: {featured.code ? `№ ${featured.code} ` : ''}
                  {featuredName}
                </span>
              </div>
              <div className="hm-calc__in">
                <span>{p.model.calcVolume}</span>
                <b>{CALC_EXAMPLE_M2}</b>
              </div>
              <div className="hm-calc__out">
                <div className="hm-calc__dark">
                  <span>{p.model.calcMolds}</span>
                  <b>≈ {groupDigits(exMolds)}</b>
                </div>
                {exWeight ? (
                  <div>
                    <span>{p.model.calcKg}</span>
                    <b>
                      {groupDigits(Math.round(exWeight))} {lang === 'ru' ? 'кг' : 'kg'}
                    </b>
                  </div>
                ) : null}
              </div>
              <p className="sps-help">
                {CALC_EXAMPLE_M2} m² × {featuredPer} {t.catalog.dona}/m², {p.model.calcTurn}.
              </p>
              <a className="hm-link" href={modelHref(lang, featured)}>
                {p.home.calcMore}
                <Icon.arrowRight width={16} height={16} strokeWidth={2} aria-hidden="true" />
              </a>
            </aside>
          ) : null}
        </div>
      </section>

      {/* 6. O'z zavodimiz (qorong'i) */}
      <section className="sec sec-ink">
        <div className="wrap hm-factory">
          <div className="hm-factory__media">
            <Image
              src="/images/site/factory.webp"
              alt={p.home.wholesaleImg1}
              fill
              sizes="(max-width: 760px) 100vw, 720px"
              loading="lazy"
              className="cover"
            />
            <span className="hm-factory__inset">
              {/* Faqat haqiqiy SPS materiali (stok konteyner surati olib tashlandi, audit 2026-11-02). */}
              <Image
                src="/images/site/molds/mold-1.webp"
                alt={p.home.wholesaleImg2}
                fill
                sizes="240px"
                loading="lazy"
                style={{ objectFit: 'contain', padding: '10%' }}
              />
            </span>
          </div>
          <div className="hm-stack">
            <p className="sps-eyebrow muted-ink">
              <b>{p.home.productionEyebrow}</b>
            </p>
            <h2 className="h1">{p.home.productionTitle}</h2>
            <ul className="hm-checks">
              {p.home.usp.map((u) => (
                <li key={u.title}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                  <span>
                    <b>{u.title}.</b> {u.text}
                  </span>
                </li>
              ))}
            </ul>
            <a className="sps-btn sps-btn--on-ink sps-btn--lg hm-self-start" href={`/${lang}/production`}>
              {t.menu.productionExport}
              <Icon.arrowRight width={18} height={18} strokeWidth={2} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <Testimonials
        items={testimonials}
        lang={lang}
        eyebrowLabel={p.home.testimonialsEyebrowLabel}
        eyebrow={p.home.testimonialsEyebrow}
        title={p.home.testimonialsTitle}
      />

      {/* 7. Ulgurji va hamkorlik */}
      <section className="sec">
        <div className="wrap hm-stack">
          <div className="hm-head">
            <div>
              <p className="sps-eyebrow">
                <b>{p.home.wholesaleEyebrowLabel}</b> · {p.home.wholesaleEyebrow}
              </p>
              <h2 className="h1">{p.home.wholesaleTitle}</h2>
              <p className="lead muted" style={{ marginTop: 12 }}>
                {p.home.wholesaleLead}
              </p>
            </div>
            <a className="hm-link" href={flipHref(lang)}>
              <Icon.download width={18} height={18} strokeWidth={2} aria-hidden="true" />
              {p.home.wholesalePdf}
            </a>
          </div>
          <div className="hm-who">
            {p.partners.who.map((w, i) => {
              const media = WHOLESALE_MEDIA[i];
              return (
                <a key={w.title} className="hm-who__card" href={`/${lang}/partners`}>
                  {media && 'molds' in media ? (
                    <span className="hm-who__molds" aria-hidden="true">
                      {media.molds.map((src) => (
                        <span key={src}>
                          <Image src={src} alt="" width={160} height={160} loading="lazy" />
                        </span>
                      ))}
                    </span>
                  ) : media && 'scene' in media ? (
                    <span className="hm-who__scene">
                      <Image
                        src={media.scene}
                        alt=""
                        fill
                        sizes="(max-width: 760px) 100vw, 420px"
                        loading="lazy"
                        className="cover"
                      />
                    </span>
                  ) : null}
                  <span className="hm-who__body">
                    <b>{w.title}</b>
                    <span className="muted">{w.text}</span>
                    <span className="hm-who__more">
                      {p.home.wholesaleMore}
                      <Icon.arrowRight width={16} height={16} strokeWidth={2} aria-hidden="true" />
                    </span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
