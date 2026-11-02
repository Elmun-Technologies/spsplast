import Image from 'next/image';
import { notFound } from 'next/navigation';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { getPages } from '@/lib/pages';
import { PDF_CATALOG_HREF } from '@/components/site/SiteHeader';
import { PartnersForm } from '@/components/partners2027/PartnersForm';
import { JsonLd } from '@/components/site/JsonLd';
import { jsonLdBreadcrumb, jsonLdFaq, pageMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? (lang as Locale) : 'uz';
  const p = getPages(locale);
  return pageMetadata({
    lang: locale,
    path: '/partners',
    title: getUi(locale).nav.partners,
    description: p.partners.lead,
    image: '/images/site/factory.webp',
  });
}

/** Ulgurji va hamkorlik (Partners.dc.html). */
export default async function PartnersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const t = getUi(lang);
  const p = getPages(lang);
  // Rasm qoidasi (Redesign 2028): faqat SPS'ning haqiqiy materiallari — studiyadagi qolip
  // suratlari (oq fon → multiply) va terilgan plitka sahnasi. Stok odam/ombor suratlari yo'q.
  const moldWall = [1, 9, 4, 10, 5, 3, 8, 7, 2].map((n) => `/images/site/molds/mold-${n}.webp`);
  const whoMedia: ({ molds: string[] } | { scene: string })[] = [
    { molds: ['/images/site/molds/mold-1.webp', '/images/site/molds/mold-2.webp', '/images/site/molds/mold-3.webp'] },
    { molds: ['/images/site/molds/mold-4.webp', '/images/site/molds/mold-5.webp', '/images/site/molds/mold-6.webp'] },
    { scene: '/catalog/2027/trotuar-56-buxoro-scene-sm.webp' },
  ];

  return (
    <>
      <JsonLd
        data={[
          jsonLdBreadcrumb(lang, [
            { name: 'SPS', path: '' },
            { name: t.nav.partners, path: '/partners' },
          ]),
          jsonLdFaq(p.partners.faq),
        ]}
      />
      <section className="ph-hero">
        <div>
          <nav className="crumbs" aria-label="breadcrumb">
            <a href={`/${lang}`}>{p.model.breadcrumbHome}</a>
            <span>/</span>
            <span>{t.nav.partners}</span>
          </nav>
          <h1 className="disp-l">{p.partners.title}</h1>
          <p className="lead muted">{p.partners.lead}</p>
          <div className="row">
            <a className="sps-btn sps-btn--primary sps-btn--lg" href="#sorov">
              {p.partners.cta}
            </a>
            <a className="sps-btn sps-btn--outline sps-btn--lg" href={PDF_CATALOG_HREF} download>
              {p.partners.pdf}
            </a>
          </div>
        </div>
        {/* `fill` rasm uchun konteyner position:relative va aniq balandlikka ega
            bo'lishi shart (aks holda rasm eng yaqin joylashgan ota-elementga nisbatan
            mutlaq joylashadi). Nisbat dizayndagi .ph-hero katakchasidan olingan:
            520px min balandlik, mobil 240px — rasm 2:3 (portret)formatida. */}
        <div className="pt-wall" role="img" aria-label={p.partners.heroImg}>
          {moldWall.map((src, i) => (
            <span key={src}>
              <Image src={src} alt="" width={200} height={200} priority={i < 3} />
            </span>
          ))}
        </div>
      </section>

      {/* Kim bilan ishlaymiz */}
      <section className="sec">
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="sps-section-head">
            <div>
              <p className="sps-eyebrow">
                <b>{p.partners.whoEyebrow}</b>
              </p>
              <h2 className="h1">{p.partners.whoTitle}</h2>
            </div>
          </div>
          <div className="g3">
            {p.partners.who.map((w, i) => (
              <div className={`who${i === 1 ? ' who-on' : ''}`} key={w.n}>
                {'molds' in whoMedia[i] ? (
                  <span className="who-media hm-who__molds" role="img" aria-label={w.img}>
                    {(whoMedia[i] as { molds: string[] }).molds.map((src) => (
                      <span key={src}>
                        <Image src={src} alt="" width={160} height={160} loading="lazy" />
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="who-media hm-who__scene">
                    <Image src={(whoMedia[i] as { scene: string }).scene} alt={w.img} fill sizes="(max-width: 760px) 100vw, 420px" loading="lazy" className="cover" />
                  </span>
                )}
                <span className="step-n">{w.n}</span>
                <h3 className="h2">{w.title}</h3>
                <p className="body muted">{w.text}</p>
                <table className="sps-spec">
                  <tbody>
                    {w.rows.map((r) => (
                      <tr key={r.k}>
                        <th>{r.k}</th>
                        <td className={r.v.startsWith('[') ? 'ph-in' : undefined}>{r.v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Besh qadam */}
      <section className="sec sec-alt">
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="split" style={{ alignItems: 'end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <p className="sps-eyebrow">
                <b>{p.home.stepsEyebrowLabel}</b> {p.partners.stepsEyebrow}
              </p>
              <h2 className="h1">{p.partners.stepsTitle}</h2>
            </div>
            <p className="lead muted">{p.partners.stepsLead}</p>
          </div>
          <div className="steps">
            {p.partners.steps.map((s) => (
              <div key={s.n}>
                <span className="step-n">{s.n}</span>
                <h3 className="h3">{s.title}</h3>
                <p className="body muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eksport */}
      <section className="sec">
        <div className="wrap g2" style={{ gap: 'var(--space-8)', alignItems: 'center' }}>
          {/* SPS eksport xaritasi (stok konteyner surati o'rniga, audit 2026-11-02). */}
          <div style={{ background: 'var(--surface-alt)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
            <Image src="/images/site/map-uz.webp" alt={p.production.mapAlt} width={1280} height={832} sizes="(max-width: 1100px) 100vw, 520px" style={{ width: '100%', height: 'auto' }} loading="lazy" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <p className="sps-eyebrow">
              <b>{t.nav.export ?? 'EKSPORT'}</b> {p.partners.exportEyebrow}
            </p>
            <h2 className="h1">{p.partners.exportTitle}</h2>
            <table className="sps-spec">
              <tbody>
                {p.partners.exportRows.map((r) => (
                  <tr key={r.k}>
                    <th>{r.k}</th>
                    <td className={r.v.includes('[') ? 'ph-in' : undefined}>{r.v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Zayafka formasi */}
      <section className="sec sec-alt" id="sorov">
        <div className="wrap split">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <p className="sps-eyebrow">
              <b>{p.home.stepsEyebrowLabel}</b> {p.partners.formEyebrow}
            </p>
            <h2 className="h1">{p.partners.formTitle}</h2>
            <p className="lead muted">{p.partners.formLead}</p>
          </div>
          <PartnersForm lang={lang} />
        </div>
      </section>

      {/* FAQ */}
      <section className="sec" id="faq">
        <div className="wrap split">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p className="sps-eyebrow">
              <b>{p.partners.faqEyebrow}</b>
            </p>
            <h2 className="h1">{p.partners.faqTitle}</h2>
          </div>
          <div>
            {p.partners.faq.map((f, i) => (
              <div className="faq" key={f.q} style={i === p.partners.faq.length - 1 ? { borderBottom: '1px solid var(--line)' } : undefined}>
                <h3 className="h3">{f.q}</h3>
                <p className="body muted">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
