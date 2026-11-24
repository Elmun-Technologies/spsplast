import Image from 'next/image';
import { readyCatalogKey } from '@/lib/catalogPdf';
import { notFound } from 'next/navigation';
import { patternStyle } from '@/lib/patterns';
import { isValidLocale, locales, pluralCategory, type Locale } from '@/lib/i18n';
import { getPages } from '@/lib/pages';
import { getUi } from '@/lib/ui';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import {
  getActiveReadySections,
  getReadyCounts,
  getReadyModels,
  getTotalCount,
  modelImage,
  sectionCoverImage,
  sectionLabel,
  sectionPath,
} from '@/lib/catalog2027';
import { JsonLd } from '@/components/site/JsonLd';
import { CatalogHead } from '@/components/catalog2027/CatalogHead';
import { CatalogClient } from '@/components/catalog2027/CatalogClient';
import { Icon } from '@/components/site/icons';
import { jsonLdBreadcrumb, noindexMetadata, pageMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

/**
 * Tayyor mahsulotlar (ikkinchi yo'nalish, qaror 2026-11-17): fasad plitkasi, termopanel, skameyka, yevrozabor —
 * qolip emas, zavoddan tayyor holda. Mahsulotlar admin'da "Tayyor mahsulotlar" turidagi bo'limlarga qo'shiladi.
 * Mahsulot yo'q paytda sahifa halol "tayyorlanmoqda" holatida va `noindex` (bo'sh sahifa indekslanmaydi).
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  const lang = (isValidLocale(langParam) ? langParam : 'uz') as Locale;
  const r = getPages(lang).ready;
  const models = getReadyModels();
  if (!models.length) return { ...noindexMetadata(lang, r.seoTitle), description: r.lead };
  return pageMetadata({
    lang,
    path: '/ready',
    title: r.seoTitle,
    description: r.lead,
    image: models.map((m) => modelImage(m)).find(Boolean) ?? undefined,
  });
}

export default async function ReadyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const p = getPages(lang);
  const r = p.ready;
  const t = getUi(lang);
  const models = getReadyModels();
  const sections = getActiveReadySections();
  const counts = getReadyCounts();
  const crumbs = jsonLdBreadcrumb(lang, [
    { name: 'SPS', path: '' },
    { name: r.title, path: '/ready' },
  ]);

  const contacts = (
    <>
      <a className="sps-btn sps-btn--primary" href={`/${lang}/request`}>
        {r.cta}
      </a>
      <a
        className="sps-btn sps-btn--outline"
        href={`${CONTACTS_2027.whatsappUrl}?text=${encodeURIComponent(r.waText)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        WhatsApp
      </a>
      <a className="sps-btn sps-btn--outline" href={CONTACTS_2027.telegramUrl} target="_blank" rel="noopener noreferrer">
        {r.ctaTelegram}
      </a>
    </>
  );

  if (!models.length) {
    return (
      <section className="ct-sec pat pat--fade-x pat--ink" style={patternStyle('charogon')}>
        <JsonLd data={crumbs} />
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <nav className="crumbs" aria-label="breadcrumb">
              <a href={`/${lang}`}>{p.model.breadcrumbHome}</a>
              <span>/</span>
              <span>{r.title}</span>
            </nav>
            <p className="sps-eyebrow">
              <b>SPS Plast</b> · {r.eyebrow}
            </p>
            <h1 className="disp-l">{r.title}</h1>
            <p className="body muted">{r.lead}</p>
          </div>
          <div className="ct-note">
            <b>{r.emptyTitle}</b>
            <span>{r.emptyText}</span>
            {contacts}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <JsonLd data={crumbs} />
      <CatalogHead
        lang={lang}
        crumbs={[{ href: `/${lang}`, label: p.model.breadcrumbHome }, { label: r.title }]}
        title={r.title}
        lead={r.lead}
        catalog={readyCatalogKey()}
        pattern="charogon"
      />
      {sections.length > 1 ? (
        <section className="sec" aria-labelledby="rd-secs">
          <div className="wrap hm-stack">
            <h2 className="h2" id="rd-secs">
              {r.sectionsTitle}
            </h2>
            <div className="hm-secs hm-secs--ready">
              {sections.map((s, i) => {
                const cover = sectionCoverImage(s);
                return (
                  <a key={s} className="hm-sec" href={`/${lang}${sectionPath(s)}`}>
                    <span className={`hm-sec__media${cover.fit === 'contain' ? ' hm-sec__media--cutout' : ''}`}>
                      <Image src={cover.src} alt="" fill sizes="(max-width: 760px) 50vw, 300px" loading="lazy" />
                    </span>
                    <span className="hm-sec__body">
                      <span className="hm-sec__n">{String(i + 1).padStart(2, '0')}</span>
                      <b>{sectionLabel(s, lang)}</b>
                      <span className="hm-sec__count">
                        {counts[s]} {pluralCategory(lang, counts[s], r.productForms)}
                      </span>
                    </span>
                    <span className="hm-sec__go" aria-hidden="true">
                      <Icon.arrowRight width={18} height={18} strokeWidth={2} />
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}
      <div className={`wrap sec${sections.length > 1 ? ' rd-all' : ''}`}>
        <h2 className="h2" style={{ marginBottom: 'var(--space-5)' }}>
          {r.allTitle}
        </h2>
        <CatalogClient lang={lang} models={models} variant="catalog" searchPlaceholder={r.searchPlaceholder} foundLabel={r.foundLabel} total={models.length} />
      </div>
      <section className="sec sec-alt">
        <div className="wrap ct-note">
          <b>{r.priceNote}</b>
          <span>
            {r.moldsCross}{' '}
            <a href={`/${lang}/catalog`}>
              {r.moldsLink} · {getTotalCount()} {t.models.many}
            </a>
          </span>
          {contacts}
        </div>
      </section>
    </>
  );
}
