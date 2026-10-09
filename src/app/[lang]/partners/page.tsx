import Image from 'next/image';
import { notFound } from 'next/navigation';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { getPages } from '@/lib/pages';
import { PDF_CATALOG_HREF } from '@/components/site/SiteHeader';
import { PartnersForm } from '@/components/partners2027/PartnersForm';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? (lang as Locale) : 'uz';
  const p = getPages(locale);
  return { title: `${getUi(locale).nav.partners} — SPS`, description: p.partners.lead };
}

/** Ulgurji va hamkorlik (Partners.dc.html). */
export default async function PartnersPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const t = getUi(lang);
  const p = getPages(lang);
  const whoImages = ['/images/site/master-pouring.webp', '/images/site/distribyutor-ombor.webp', '/images/site/qurilish-obyekti.webp'];

  return (
    <>
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
        <div>
          <Image src="/images/site/master-laying.webp" alt={p.partners.heroImg} fill sizes="(max-width: 1100px) 100vw, 44vw" priority />
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
                <Image className="who-img" src={whoImages[i]} alt={w.img} width={640} height={360} loading="lazy" />
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
          <div style={{ aspectRatio: '4 / 3', overflow: 'hidden', position: 'relative', borderRadius: 'var(--radius-card)' }}>
            <Image src="/images/site/containers.webp" alt={p.partners.exportImg} fill sizes="(max-width: 1100px) 100vw, 520px" loading="lazy" />
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
