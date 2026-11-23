import type { ReactNode } from 'react';
import type { Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { flipHref, type CatalogKey } from '@/lib/catalogPdf';
import { patternStyle, type PatternName } from '@/lib/patterns';

/**
 * Katalog va bo'lim sahifalarining sarlavha bandi (HANDOFF `screens/desktop/02-katalog`):
 * och fon, "non" yo'li, H1, qisqa izoh va o'ngda "PDF katalog" + "Zayafka qoldirish".
 * Server komponent — mijoz JS'iga qo'shilmaydi.
 */
export function CatalogHead({
  lang,
  crumbs,
  title,
  lead,
  intro,
  catalog,
  pattern = 'girih',
  children,
}: {
  lang: Locale;
  crumbs: { href?: string; label: string }[];
  title: string;
  lead: string;
  intro?: string | null;
  /** Qaysi katalog ochilsin (bo'lim sahifasida). */
  catalog?: CatalogKey;
  /** Bo'limning naqshi (`sectionPattern()`), sarlavhaning o'ng tomonida — bo'limlar bir-biridan ajralib turadi. */
  pattern?: PatternName;
  children?: ReactNode;
}) {
  const t = getUi(lang);
  return (
    <section className="cat-head pat pat--fade-x pat--ink" style={patternStyle(pattern)}>
      <div className="wrap cat-head__in">
        <div className="cat-head__text">
          <nav aria-label="breadcrumb">
            <ol className="crumbs">
              {crumbs.map((c) => (
                <li key={c.label} aria-current={c.href ? undefined : 'page'}>
                  {c.href ? <a href={c.href}>{c.label}</a> : c.label}
                </li>
              ))}
            </ol>
          </nav>
          <h1 className="h1">{title}</h1>
          {intro ? <p className="lead muted">{intro}</p> : null}
          <p className="cat-head__lead muted">{lead}</p>
          {children}
        </div>
        <div className="cat-head__cta">
          <a className="sps-btn sps-btn--outline" href={flipHref(lang, catalog)}>
            {t.menu.pdf}
          </a>
          <a className="sps-btn sps-btn--primary" href={`/${lang}/request`}>
            {t.header.cta}
          </a>
        </div>
      </div>
    </section>
  );
}
