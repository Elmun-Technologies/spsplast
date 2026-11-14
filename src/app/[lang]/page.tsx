import Image from 'next/image';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getUi, pluralModels } from '@/lib/ui';
import { getPages } from '@/lib/pages';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import {
  SECTION_SLUGS,
  calcMolds,
  calcWeight,
  getActiveSections,
  getPopular,
  getSectionCounts,
  getTotalCount,
  modelName,
  modelPerM2,
  modelTileSize,
  sectionCoverImage,
  sectionLabel,
} from '@/lib/catalog2027';
import { CatalogClient } from '@/components/catalog2027/CatalogClient';
import { Icon } from '@/components/site/icons';
import { jsonLdReview, pageMetadata } from '@/lib/seo';
import { JsonLd } from '@/components/site/JsonLd';
import { PDF_CATALOG_HREF } from '@/components/site/SiteHeader';
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
const modelHref = (lang: Locale, m: { section: string; slug: string }) => `/${lang}/catalog/${SECTION_SLUGS[m.section]}/${m.slug}`;

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
  { molds: ['/images/site/molds/mold-1.webp', '/images/site/molds/mold-2.webp', '/images/site/molds/mold-3.webp'] },
  { molds: ['/images/site/molds/mold-4.webp', '/images/site/molds/mold-5.webp', '/images/site/molds/mold-6.webp'] },
  { scene: '/catalog/2027/trotuar-56-buxoro-scene-sm.webp' },
];

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const t = getUi(lang);
  const p = getPages(lang);
  const counts = getSectionCounts();
  const total = getTotalCount();
  const sections = getActiveSections();
  const popular = getPopular(12);

  // Hero va kalkulyator misoli: sahna + qolip surati bor eng mashhur model (hozir № 01 Monako).
  const featured = getPopular(40).find((m) => m.images.scene && m.images.molds.A) ?? popular[0];
  const featuredName = featured ? modelName(featured, lang) : '';
  const featuredSize = featured ? modelTileSize(featured) : null;
  const featuredPer = featured ? modelPerM2(featured) : null;
  const exMolds = featured ? calcMolds(featured, CALC_EXAMPLE_M2) : null;
  const exWeight = featured ? calcWeight(featured, CALC_EXAMPLE_M2) : null;
  const testimonials = getTestimonials();

  return (
    <>
      {testimonials.length ? (
        <JsonLd
          data={testimonials.map((item) =>
            jsonLdReview({ authorName: testimonialAuthorName(item, lang), reviewBody: testimonialText(item, lang), rating: item.rating }),
          )}
        />
      ) : null}
      {/* 1. Hero (A — yorug'): matn + terilgan plitka surati ustida spec karta, ostida raqamlar */}
      <section className="hm-hero">
        <div className="wrap">
          <div className="hm-hero__grid">
            <div className="hm-hero__text">
              <p className="sps-eyebrow">
                <b>SPS Plast</b> · {p.home.eyebrow}
              </p>
              <h1 className="hm-hero__h">{p.home.h1(total)}</h1>
              <p className="hm-hero__lead">{p.home.lead}</p>
              <div className="hm-hero__cta">
                <a className="sps-btn sps-btn--primary sps-btn--lg" href={`/${lang}/request`}>
                  {t.header.cta}
                  <Icon.arrowRight width={18} height={18} strokeWidth={2} aria-hidden="true" />
                </a>
                <a className="sps-btn sps-btn--outline sps-btn--lg" href={`/${lang}/catalog`}>
                  {p.home.catalogAll} · {total} {pluralModels(lang, total)}
                </a>
              </div>
              <p className="hm-hero__contact">
                <a href={`tel:${CONTACTS_2027.mainPhoneRaw}`}>
                  <Icon.phone width={16} height={16} strokeWidth={2} aria-hidden="true" />
                  {CONTACTS_2027.mainPhone}
                </a>
                <a href={`${CONTACTS_2027.whatsappUrl}?text=${encodeURIComponent(t.menu.waText)}`} target="_blank" rel="noopener noreferrer">
                  <Icon.whatsapp width={16} height={16} strokeWidth={2} aria-hidden="true" />
                  WhatsApp
                </a>
                <a href={CONTACTS_2027.telegramUrl} target="_blank" rel="noopener noreferrer">
                  <Icon.telegram width={16} height={16} strokeWidth={2} aria-hidden="true" />
                  Telegram
                </a>
                <span>{t.header.hours}</span>
              </p>
            </div>

            {featured?.images.scene ? (
              <div className="hm-hero__media">
                <Image
                  src={featured.images.scene}
                  alt={`${featuredName} — ${t.alt.scene}`}
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 760px) 100vw, 640px"
                  className="hm-hero__img"
                />
                <a className="hm-spec" href={modelHref(lang, featured)}>
                  {featured.images.molds.A ? (
                    <span className="hm-spec__mold">
                      <Image src={featured.images.molds.A} alt={`${featuredName} — ${t.alt.mold}`} width={84} height={84} />
                    </span>
                  ) : null}
                  <span className="hm-spec__body">
                    <span className="hm-spec__code">
                      {featured.code ? `№ ${featured.code} · ` : ''}
                      {sectionLabel(featured.section, lang)}
                    </span>
                    <b>{featuredName}</b>
                    <span className="hm-spec__meta">
                      {[featuredSize ? `${featuredSize} ${t.catalog.mm}` : null, featuredPer ? `${t.catalog.mPer} ${featuredPer} ${t.catalog.dona}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </span>
                </a>
              </div>
            ) : null}
          </div>

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

      {/* 2. Bo'limlar + maslahat kartochkasi */}
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
                    <span className="hm-sec__count">
                      {counts[s]} {pluralModels(lang, counts[s])}
                    </span>
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
                <a className="sps-btn hm-btn-light" href={CONTACTS_2027.telegramUrl} target="_blank" rel="noopener noreferrer">
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

      {/* 3. Katalog bloki — 12 ta mashhur model */}
      <section className="sec sec-alt">
        <div className="wrap hm-stack">
          <div className="hm-head">
            <div>
              <p className="sps-eyebrow">
                <b>{t.header.catalog}</b> · {p.home.catalogEyebrow}
              </p>
              <h2 className="h1">{p.home.catalogTitle}</h2>
            </div>
            <a className="sps-btn sps-btn--outline hide-m" href={`/${lang}/catalog`}>
              {p.home.catalogAll} · {total} {pluralModels(lang, total)}
            </a>
          </div>
          <CatalogClient lang={lang} models={popular} variant="home" />
        </div>
      </section>

      {/* 4. Uch qadamda narx + kalkulyator misoli */}
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
              <a className="sps-btn sps-btn--outline sps-btn--lg" href={CONTACTS_2027.telegramUrl} target="_blank" rel="noopener noreferrer">
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

      {/* 5. O'z zavodimiz (qorong'i) */}
      <section className="sec sec-ink">
        <div className="wrap hm-factory">
          <div className="hm-factory__media">
            <Image src="/images/site/factory.webp" alt={p.home.wholesaleImg1} fill sizes="(max-width: 760px) 100vw, 720px" loading="lazy" className="cover" />
            <span className="hm-factory__inset">
              {/* Faqat haqiqiy SPS materiali (stok konteyner surati olib tashlandi, audit 2026-11-02). */}
              <Image src="/images/site/molds/mold-1.webp" alt={p.home.wholesaleImg2} fill sizes="240px" loading="lazy" style={{ objectFit: 'contain', padding: '10%' }} />
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

      {/* 6. Ulgurji va hamkorlik */}
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
            <a className="hm-link" href={PDF_CATALOG_HREF} download>
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
                      <Image src={media.scene} alt="" fill sizes="(max-width: 760px) 100vw, 420px" loading="lazy" className="cover" />
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
