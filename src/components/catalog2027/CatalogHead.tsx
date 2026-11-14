import type { ReactNode } from 'react';
import type { Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { PDF_CATALOG_HREF } from '@/components/site/SiteHeader';

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
  children,
}: {
  lang: Locale;
  crumbs: { href?: string; label: string }[];
  title: string;
  lead: string;
  intro?: string | null;
  children?: ReactNode;
}) {
  const t = getUi(lang);
  return (
    <section className="cat-head">
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
          <a className="sps-btn sps-btn--outline" href={PDF_CATALOG_HREF}>
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
