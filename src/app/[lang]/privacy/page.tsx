import { notFound } from 'next/navigation';
import { isValidLocale, locales, type Locale } from '@/lib/i18n';
import { getPages } from '@/lib/pages';
import { JsonLd } from '@/components/site/JsonLd';
import { jsonLdBreadcrumb, pageMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isValidLocale(lang) ? (lang as Locale) : 'uz';
  return pageMetadata({
    lang: locale,
    path: '/privacy',
    title: getPages(locale).privacy.title,
    description: getPages(locale).privacy.summary,
  });
}

/** Maxfiylik siyosati (Privacy.dc.html). Matn yuristdan o'tishi kerak. */
export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await params;
  if (!isValidLocale(langParam)) notFound();
  const lang = langParam as Locale;
  const p = getPages(lang);

  return (
    <>
      <JsonLd
        data={jsonLdBreadcrumb(lang, [
          { name: 'SPS', path: '' },
          { name: p.privacy.title, path: '/privacy' },
        ])}
      />
      <section className="pv-hero">
        <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <nav className="crumbs" aria-label="breadcrumb">
            <a href={`/${lang}`}>{p.model.breadcrumbHome}</a>
            <span>/</span>
            <span>{p.privacy.title}</span>
          </nav>
          <h1 className="disp-l">{p.privacy.title}</h1>
          <p className="body muted">
            {p.privacy.updated} <span className="ph-in">{p.privacy.updatedMeta}</span>
          </p>
        </div>
      </section>

      <section style={{ paddingBlock: 'var(--space-7) var(--space-9)' }}>
        <div className="wrap pv">
          <nav className="toc" aria-label={p.privacy.tocLabel}>
            {p.privacy.toc.map((label, i) => (
              <a key={label} href={`#${p.privacy.sections[i].id}`}>
                {label}
              </a>
            ))}
          </nav>

          <div className="pv-body">
            <p className="note">{p.privacy.summary}</p>
            {p.privacy.sections.map((s) => (
              <section id={s.id} key={s.id}>
                <h2>{s.h2}</h2>
                {s.p.map((line) => (
                  <p key={line}>{renderPlaceholders(line)}</p>
                ))}
                {s.ul.length ? (
                  <ul>
                    {s.ul.map((li) => (
                      <li key={li}>{renderPlaceholders(li)}</li>
                    ))}
                  </ul>
                ) : null}
                {s.p2.map((line) => (
                  <p key={line}>{renderPlaceholders(line)}</p>
                ))}
              </section>
            ))}
            <p className="note muted">{renderPlaceholders(p.privacy.legalNote)}</p>
          </div>
        </div>
      </section>
    </>
  );
}

/** `[...]` placeholderlar qizil belgilanadi (HANDOFF 1: ular joyida qoladi). */
function renderPlaceholders(text: string) {
  const parts = text.split(/(\[[^\]]+\])/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part.startsWith('[') && part.endsWith(']') ? (
      <span className="ph-in" key={`${part}-${i}`}>
        {part}
      </span>
    ) : (
      <span key={`${part}-${i}`}>{part}</span>
    ),
  );
}
