import Image from 'next/image';
import { notFound } from 'next/navigation';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { getPages } from '@/lib/pages';
import { getTotalCount } from '@/lib/catalog2027';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? (lang as Locale) : 'uz';
  const p = getPages(locale);
  return { title: `${getUi(locale).nav.production} — SPS`, description: p.production.materialLead };
}

/** Ishlab chiqarish va eksport (Production.dc.html), `#eksport` anchori. */
export default async function ProductionPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const t = getUi(lang);
  const p = getPages(lang);
  const stepImages = [
    '/catalog/2027/trotuar-01-monako-mold-a.webp',
    '/images/site/master-pouring.webp',
    '/catalog/2027/trotuar-01-monako-tile-a.webp',
    '/catalog/2027/trotuar-01-monako-scene.webp',
  ];
  // 2-statistika: katalogdagi haqiqiy model soni (152 emas — data-questions)
  const stats = p.production.stats.map((s, i) => (i === 1 ? { ...s, value: String(getTotalCount()) } : s));

  return (
    <>
      <section className="pr-hero">
        <Image src="/images/site/factory.webp" alt={p.production.heroImg} fill sizes="100vw" priority />
        <div className="shade" style={{ background: 'linear-gradient(180deg, rgba(20,20,20,.55) 0%, rgba(20,20,20,.9) 100%)' }} />
        <div className="wrap">
          <nav className="crumbs" aria-label="breadcrumb" style={{ color: 'var(--on-ink-muted)' }}>
            <a href={`/${lang}`} style={{ color: 'var(--on-ink-muted)' }}>
              {p.model.breadcrumbHome}
            </a>
            <span>/</span>
            <span>{t.nav.production}</span>
          </nav>
          <h1 className="disp-l" style={{ color: 'var(--on-ink)', maxWidth: '18ch' }}>
            {p.production.title}
          </h1>
          <div className="sps-stats sps-stats--ink" style={{ maxWidth: 960 }}>
            {stats.map((s) => (
              <div className="sps-stat" key={s.label}>
                <b>
                  {s.value}
                  {s.unit ? <small>{s.unit}</small> : null}
                </b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Material: PP vs ABS */}
      <section className="sec">
        <div className="wrap split">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p className="sps-eyebrow">
              <b>{p.production.materialEyebrow}</b>
            </p>
            <h2 className="h1">{p.production.materialTitle}</h2>
            <p className="lead muted">{p.production.materialLead}</p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="cmp">
              <thead>
                <tr>
                  {p.production.materialHead.map((h, i) => (
                    <th key={i} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.production.materialRows.map((r) => (
                  <tr key={r.k}>
                    <td>{r.k}</td>
                    {r.abs ? (
                      <>
                        <td className="mono">{r.pp}</td>
                        <td className="mono">{r.abs}</td>
                      </>
                    ) : (
                      <td colSpan={2} className="ph-in">
                        {r.pp}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Qolip bilan ishlash — 4 qadam */}
      <section className="sec sec-alt">
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="sps-section-head">
            <div>
              <p className="sps-eyebrow">
                <b>{p.production.stepsEyebrow}</b>
              </p>
              <h2 className="h1">{p.production.stepsTitle}</h2>
              <p className="body muted">{p.production.stepsLead}</p>
            </div>
          </div>
          <div className="g4">
            {p.production.steps.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  style={{
                    aspectRatio: '1',
                    background: i % 2 === 0 ? 'var(--surface)' : 'transparent',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    borderRadius: 'var(--radius-card)',
                  }}
                >
                  <Image
                    src={stepImages[i]}
                    alt={s.img}
                    fill
                    sizes="(max-width: 760px) 45vw, 240px"
                    style={{ objectFit: i % 2 === 0 ? 'contain' : 'cover', padding: i % 2 === 0 ? 20 : 0 }}
                    loading="lazy"
                  />
                </div>
                <span className="step-n">{s.n}</span>
                <p className="body muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eksport */}
      <section className="sec" id="eksport">
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="sps-section-head">
            <div>
              <p className="sps-eyebrow">
                <b>{p.production.exportEyebrow}</b>
              </p>
              <h2 className="h1">{p.production.exportTitle}</h2>
              <p className="body muted">{p.production.exportLead}</p>
            </div>
            <a className="sps-btn sps-btn--primary" href={`/${lang}/partners#sorov`}>
              {p.production.exportCta}
            </a>
          </div>
          <div style={{ background: 'var(--surface-alt)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
            <Image src="/images/site/map-uz.webp" alt={p.production.mapAlt} width={1280} height={640} style={{ width: '100%', height: 'auto' }} loading="lazy" />
          </div>
          <div className="g2" style={{ gap: 'var(--space-5)' }}>
            <div style={{ aspectRatio: '16 / 9', overflow: 'hidden', position: 'relative', borderRadius: 'var(--radius-card)' }}>
              <Image src="/images/site/port.webp" alt={p.production.portImg} fill sizes="(max-width: 760px) 100vw, 620px" loading="lazy" />
            </div>
            <div style={{ aspectRatio: '16 / 9', overflow: 'hidden', position: 'relative', borderRadius: 'var(--radius-card)' }}>
              <Image src="/images/site/containers.webp" alt={p.production.containerImg} fill sizes="(max-width: 760px) 100vw, 620px" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* Tashrif CTA */}
      <section className="pr-visit">
        <div className="wrap" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-5)' }}>
          <h2 className="h1" style={{ maxWidth: '22ch' }}>
            {p.production.visitTitle}
          </h2>
          <div className="row">
            <a className="sps-btn sps-btn--primary sps-btn--lg" href={`/${lang}/contact`}>
              {p.production.visitCta}
            </a>
            <a className="sps-btn sps-btn--outline sps-btn--lg" href={`/${lang}/catalog`}>
              {p.production.visitCatalog}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
