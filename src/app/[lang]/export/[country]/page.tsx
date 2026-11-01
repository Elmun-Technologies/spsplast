import Image from 'next/image';
import { notFound } from 'next/navigation';
import { SECTION_SLUGS, getPopular, getTotalCount, modelImage, modelName, modelPerM2, modelThickness } from '@/lib/catalog2027';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { getPages } from '@/lib/pages';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import { EXPORT_COUNTRIES, isExportCountry } from '@/lib/seoPages';
import { CountriesStrip } from '@/components/seo2028/SeoBlocks';
import { PartnersForm } from '@/components/partners2027/PartnersForm';
import { Icon } from '@/components/site/icons';
import { JsonLd } from '@/components/site/JsonLd';
import { jsonLdBreadcrumb, jsonLdFaq, jsonLdItemList, pageMetadata } from '@/lib/seo';
import { seoOverride } from '@/lib/seoOverrides';

/**
 * Eksport (geo) sahifasi: `/{lang}/export/{country}` — SPS eksport xaritasidagi 8 davlat
 * (docs/SEO-2028-RU.md 2-bo'lim). Faqat tasdiqlangan faktlar: zavod Toshkentda, eksport
 * hujjatlari (invoys, qadoqlash ro'yxati) bizda; narx/muddat/valyuta — menejer bilan kelishiladi.
 */
type Params = { lang: string; country: string };

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((lang) => EXPORT_COUNTRIES.map((c) => ({ lang, country: c.key })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { lang, country } = await params;
  const locale = isValidLocale(lang) ? (lang as Locale) : 'uz';
  if (!isExportCountry(country)) return { title: 'SPS' };
  const g = getPages(locale).seo.geo;
  const c = g.countries[country];
  return pageMetadata({
    lang: locale,
    path: `/export/${country}`,
    title: g.title(c.to),
    description: g.description(c.to, getTotalCount()),
    image: '/images/site/map-uz.webp',
  });
}

export default async function ExportCountryPage({ params }: { params: Promise<Params> }) {
  const { lang: langParam, country } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  if (!isExportCountry(country)) notFound();

  const t = getUi(lang);
  const p = getPages(lang);
  const g = p.seo.geo;
  const c = g.countries[country];
  const total = getTotalCount();
  const faq = g.faq(c);
  const models = getPopular(40)
    .filter((m) => m.images.scene)
    .slice(0, 8);
  const path = `/export/${country}`;
  // Admin → SEO → Sahifalar: H1 va kirish matni (davlatga noyob matn shu yerdan).
  const o = seoOverride(lang, path);

  return (
    <>
      <JsonLd
        data={[
          jsonLdBreadcrumb(lang, [
            { name: 'SPS', path: '' },
            { name: g.crumb, path: '/production' },
            { name: c.name, path },
          ]),
          jsonLdItemList(
            lang,
            models.map((m) => ({
              name: `${m.code ? `№ ${m.code} ` : ''}${modelName(m, lang)}`,
              path: `/catalog/${SECTION_SLUGS[m.section]}/${m.slug}`,
              image: modelImage(m),
            })),
          ),
          jsonLdFaq(faq),
        ]}
      />

      {/* Hero (qorong'i): matn + eksport xaritasi */}
      <section className="sec-ink geo-hero">
        <div className="wrap geo-hero__grid">
          <div className="geo-hero__text">
            <nav aria-label="breadcrumb">
              <ol className="crumbs">
                <li>
                  <a href={`/${lang}`}>{p.model.breadcrumbHome}</a>
                </li>
                <li>
                  <a href={`/${lang}/production#eksport`}>{g.crumb}</a>
                </li>
                <li aria-current="page">{c.name}</li>
              </ol>
            </nav>
            <h1 className="geo-hero__h">{o?.h1 || g.h1(c.to)}</h1>
            <p className="geo-hero__lead">{o?.intro || g.lead(c.to, total)}</p>
            <div className="cta-row row">
              <a className="sps-btn sps-btn--primary sps-btn--lg" href="#sorov">
                {g.ctaLead}
              </a>
              <a className="sps-btn sps-btn--on-ink sps-btn--lg" href={CONTACTS_2027.whatsappUrl} target="_blank" rel="noopener noreferrer">
                {g.ctaWhatsapp}
              </a>
            </div>
          </div>
          <figure className="geo-hero__map">
            <Image src="/images/site/map-uz.webp" alt={p.production.mapAlt} width={1280} height={832} priority sizes="(max-width: 760px) 100vw, 520px" />
          </figure>
        </div>
      </section>

      {/* Qanday ishlaymiz — ulgurji sahifasidagi 5 qadam (bitta manba) */}
      <section className="sec">
        <div className="wrap hm-stack">
          <h2 className="h1">{g.stepsTitle}</h2>
          <ol className="geo-steps">
            {p.partners.steps.map((s) => (
              <li key={s.n}>
                <span className="hm-steps__n">{s.n}</span>
                <b>{s.title}</b>
                <span className="muted">{s.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Ko'p so'raladigan qoliplar */}
      <section className="sec sec-alt">
        <div className="wrap hm-stack">
          <div className="hm-head">
            <h2 className="h1">{g.modelsTitle}</h2>
            <a className="hm-link" href={`/${lang}/catalog`}>
              {g.allModels} · {total}
              <Icon.arrowRight width={18} height={18} strokeWidth={2} aria-hidden="true" />
            </a>
          </div>
          <div className="rel">
            {models.map((m) => {
              const img = modelImage(m);
              const th = modelThickness(m);
              const per = modelPerM2(m);
              return (
                <a className="rc" key={m.slug} href={`/${lang}/catalog/${SECTION_SLUGS[m.section]}/${m.slug}`}>
                  {img ? <Image src={m.images.sceneSm || img} alt={`${modelName(m, lang)} — ${t.alt.scene}`} width={400} height={300} sizes="(max-width: 640px) 50vw, (max-width: 1100px) 25vw, 300px" loading="lazy" /> : null}
                  <div>
                    <span className="mono">{m.code ? `№ ${m.code}` : ''}</span>
                    <b>{modelName(m, lang)}</b>
                    <span className="mono">
                      {[m.tiles[0]?.size, th ? `${th} ${t.catalog.mm}` : null, per ? `${per} ${t.catalog.dona}/m²` : null].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Savollar + forma */}
      <section className="sec" id="sorov">
        <div className="wrap geo-form">
          <div className="hm-stack">
            <h2 className="h1">{g.faqTitle}</h2>
            <div>
              {faq.map((f, i) => (
                <div className="faq" key={f.q} style={i === faq.length - 1 ? { borderBottom: '1px solid var(--line)' } : undefined}>
                  <h3 className="h3">{f.q}</h3>
                  <p className="body muted">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="hm-stack">
            <h2 className="h1">{g.formTitle}</h2>
            <PartnersForm lang={lang} defaultCountry={c.name} phonePrefix={EXPORT_COUNTRIES.find((x) => x.key === country)?.phone} />
          </div>
        </div>
      </section>

      <CountriesStrip lang={lang} exclude={country} title={g.otherTitle} />
    </>
  );
}
