import { notFound } from 'next/navigation';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { getPages } from '@/lib/pages';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import { JsonLd } from '@/components/site/JsonLd';
import { jsonLdBreadcrumb, jsonLdLocalBusiness, pageMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? (lang as Locale) : 'uz';
  const p = getPages(locale);
  return pageMetadata({
    lang: locale,
    path: '/contact',
    title: getUi(locale).nav.contact,
    description: p.contact.hours,
  });
}

/** Kontakt (Contact.dc.html): mobilda 3 tez tugma, qatorlar, xarita, CTA. */
export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const p = getPages(lang);
  const maps = `https://www.google.com/maps/search/?api=1&query=${CONTACTS_2027.coords.lat},${CONTACTS_2027.coords.lng}`;
  const yandex = `https://yandex.uz/maps/?pt=${CONTACTS_2027.coords.lng},${CONTACTS_2027.coords.lat}&z=16`;

  return (
    <section className="ct-sec">
      <JsonLd
        data={[
          jsonLdBreadcrumb(lang, [
            { name: 'SPS', path: '' },
            { name: p.contact.title, path: '/contact' },
          ]),
          jsonLdLocalBusiness(),
        ]}
      />
      <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <nav className="crumbs" aria-label="breadcrumb">
            <a href={`/${lang}`}>{p.model.breadcrumbHome}</a>
            <span>/</span>
            <span>{p.contact.title}</span>
          </nav>
          <h1 className="disp-l">{p.contact.title}</h1>
          <p className="body muted">{p.contact.hours}</p>
        </div>

        <div className="qa">
          <a href={`tel:${CONTACTS_2027.mainPhoneRaw}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
            </svg>
            {p.contact.quick.call}
          </a>
          <a href={CONTACTS_2027.telegramUrl} target="_blank" rel="noopener noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M21 4L3 11l6 2 2 6 3-4 5 4z" />
            </svg>
            {p.contact.quick.telegram}
          </a>
          <a href={CONTACTS_2027.whatsappUrl} target="_blank" rel="noopener noreferrer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7z" />
            </svg>
            {p.contact.quick.whatsapp}
          </a>
        </div>

        <div className="ct-grid">
          <div>
            <div className="ct-row">
              <span className="sps-label" style={{ paddingTop: 6 }}>
                {p.contact.rows.sales}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {CONTACTS_2027.sales.map((s) => (
                  <a className="ct-big" key={s.raw} href={`tel:${s.raw}`}>
                    {s.display}
                  </a>
                ))}
              </div>
            </div>
            <div className="ct-row">
              <span className="sps-label" style={{ paddingTop: 6 }}>
                {p.contact.rows.office}
              </span>
              <a className="ct-big" href={`tel:${CONTACTS_2027.office.raw}`}>
                {CONTACTS_2027.office.display}
              </a>
            </div>
            <div className="ct-row">
              <span className="sps-label" style={{ paddingTop: 6 }}>
                {p.contact.rows.messenger}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <a className="ct-big" href={CONTACTS_2027.telegramUrl} target="_blank" rel="noopener noreferrer">
                  Telegram · {CONTACTS_2027.telegramHandle}
                </a>
                <a className="ct-big" href={CONTACTS_2027.instagramUrl} target="_blank" rel="noopener noreferrer">
                  Instagram · {CONTACTS_2027.instagramHandle}
                </a>
              </div>
            </div>
            <div className="ct-row">
              <span className="sps-label" style={{ paddingTop: 6 }}>
                {p.contact.rows.email}
              </span>
              <span className="ct-big ph-in">{p.contact.emailPlaceholder}</span>
            </div>
            <div className="ct-row">
              <span className="sps-label" style={{ paddingTop: 6 }}>
                {p.contact.rows.address}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ font: '500 18px/26px var(--font-sans)' }}>{CONTACTS_2027.address[lang]}</span>
                <span className="ct-sub">{p.contact.addressNote}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="map">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.5" aria-hidden="true">
                <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
                <circle cx="12" cy="9.5" r="2.5" />
              </svg>
              <b style={{ font: '600 16px/22px var(--font-sans)' }}>{p.contact.mapTitle}</b>
              <span className="mono" style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                {CONTACTS_2027.coords.lat.toFixed(5)}, {CONTACTS_2027.coords.lng.toFixed(5)}
              </span>
              <a className="sps-btn sps-btn--outline sps-btn--sm" href={maps} target="_blank" rel="noopener noreferrer">
                {p.contact.mapOpen}
              </a>
              <a className="sps-btn sps-btn--link sps-btn--sm" href={yandex} target="_blank" rel="noopener noreferrer">
                Yandex Maps
              </a>
            </div>
            <div className="ct-note">
              <b>{p.contact.ctaTitle}</b>
              <span>{p.contact.ctaText}</span>
              <a className="sps-btn sps-btn--primary" href={`/${lang}/request`} style={{ alignSelf: 'stretch' }}>
                {p.contact.cta}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
