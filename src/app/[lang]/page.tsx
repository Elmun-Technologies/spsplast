import Image from 'next/image';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { pluralModels } from '@/lib/ui';
import { getPages } from '@/lib/pages';
import {
  getModelsBySection,
  getPopular,
  getTotalCount,
  sectionCoverImage,
  sectionShortLabel,
} from '@/lib/catalog2027';
import { Icon } from '@/components/site/icons';
import { pageMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';

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

/**
 * Bosh sahifa = tanlov ekrani (qaror 2026-11-17): faqat ikki panel — «Qoliplar» va «Tayyor mahsulotlar».
 * Skroll yo'q: ikkala panel birinchi ekranga sig'adi. Eski bo'limlar (hero, raqamlar, kalkulyator, zavod,
 * ulgurji) git tarixida; zavod/ulgurji ma'lumoti `/production`, `/partners` sahifalarida.
 */
export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const p = getPages(lang);
  const total = getTotalCount();

  // Qoliplar paneli: ikkala yo'nalish qolipi — trotuar (bruschatka) va fasad — bitta kompozitsiyada.
  const paveMold = getPopular(60).find((m) => m.section === 'trotuar' && m.images.molds.A)?.images.molds.A ?? null;
  const facadeMold =
    getModelsBySection('fasad_dekor').find((m) => m.images.molds.A && !m.images.molds.A.includes('-3d'))?.images.molds.A ??
    getModelsBySection('fasad').find((m) => m.images.molds.A)?.images.molds.A ??
    null;
  const moldDuo =
    paveMold && facadeMold
      ? [
          { src: paveMold, label: sectionShortLabel('trotuar', lang) },
          { src: facadeMold, label: sectionShortLabel('fasad', lang) },
        ]
      : null;

  const panels = [
    {
      key: 'molds',
      href: `/${lang}/catalog`,
      label: p.home.split.moldsLabel,
      title: p.home.split.moldsTitle,
      text: p.home.split.moldsText,
      points: p.home.split.moldsPoints,
      cta: p.home.split.moldsCta,
      cover: sectionCoverImage('trotuar'),
      duo: moldDuo,
      meta: `${total} ${pluralModels(lang, total)}`,
    },
    {
      key: 'ready',
      href: `/${lang}/ready`,
      label: p.home.split.readyLabel,
      title: p.home.split.readyTitle,
      text: p.home.split.readyText,
      points: p.home.split.readyPoints,
      cta: p.home.split.readyCta,
      cover: sectionCoverImage('fasad'),
      duo: null,
      meta: '',
    },
  ];

  return (
    <section className="hm-fork" aria-label={p.home.split.eyebrow}>
      <div className="wrap">
        <h1 className="hm-fork__h">{p.home.h1(total)}</h1>
        <div className="hm-split">
          {panels.map((c) => (
            <a key={c.key} className={`hm-panel hm-panel--${c.key}`} href={c.href}>
              {c.duo ? (
                <span className="hm-panel__media hm-panel__media--duo">
                  {c.duo.map((d, i) => (
                    <span key={d.src} className={`hm-duo hm-duo--${i === 0 ? 'a' : 'b'}`}>
                      <Image src={d.src} alt="" fill sizes="(max-width: 760px) 45vw, 280px" priority={i === 0} />
                      <span className="hm-duo__chip">{d.label}</span>
                    </span>
                  ))}
                </span>
              ) : (
                <span className={`hm-panel__media${c.cover.fit === 'contain' ? ' hm-panel__media--cutout' : ''}`}>
                  <Image src={c.cover.src} alt="" fill sizes="(max-width: 760px) 100vw, 600px" priority={c.key === 'molds'} />
                </span>
              )}
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
  );
}

