import { notFound } from 'next/navigation';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getPages } from '@/lib/pages';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import Image from 'next/image';
import { JsonLd } from '@/components/site/JsonLd';
import { READY_PRODUCTS } from '@/lib/ready2027';
import { jsonLdBreadcrumb } from '@/lib/seo';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function ReadyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const p = getPages(lang);
  const r = p.ready;

  return (
    <section className="ct-sec">
      <JsonLd
        data={jsonLdBreadcrumb(lang, [
          { name: 'SPS', path: '' },
          { name: r.title, path: '/ready' },
        ])}
      />
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

        {READY_PRODUCTS.length ? (
          <ul className="rd-grid">
            {READY_PRODUCTS.map((x) => {
              const name = x.name[lang];
              return (
                <li key={x.slug} className="rd-card">
                  <span className="rd-card__img">
                    <Image src={x.image} alt={name} fill sizes="(max-width: 760px) 100vw, 360px" />
                  </span>
                  <span className="rd-card__body">
                    <b>{name}</b>
                    {x.size ? <span className="muted">{x.size}</span> : null}
                    <a
                      className="sps-btn sps-btn--primary"
                      href={`${CONTACTS_2027.whatsappUrl}?text=${encodeURIComponent(`${r.waText} ${name}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {r.cta}
                    </a>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}

        <div className="ct-note">
          {READY_PRODUCTS.length ? null : (
            <>
              <b>{r.emptyTitle}</b>
              <span>{r.emptyText}</span>
            </>
          )}
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
        </div>
      </div>
    </section>
  );
}
