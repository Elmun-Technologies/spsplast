import { notFound } from 'next/navigation';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getPages } from '@/lib/pages';
import { CONTACTS_2027 } from '@/lib/contacts2027';
import { JsonLd } from '@/components/site/JsonLd';
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

        <div className="ct-note">
          <b>{r.emptyTitle}</b>
          <span>{r.emptyText}</span>
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
          <a className="hm-link" href={`/${lang}/catalog`}>
            {r.moldsLink}
          </a>
        </div>
      </div>
    </section>
  );
}
