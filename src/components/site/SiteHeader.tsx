import { getSectionCounts, SECTIONS, SECTION_SLUGS } from '@/lib/catalog2027';
import { type Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { HeaderClient } from '@/components/site/HeaderClient';

/** Katalog PDF (2026, uz) — 2027 uch tilli PDF biznesdan kutilmoqda (savol). */
export const PDF_CATALOG_HREF = '/catalog/pdf/sps-qoliplar-katalogi-2026.pdf';

export function SiteHeader({ lang, current }: { lang: Locale; current?: string }) {
  const t = getUi(lang);
  const counts = getSectionCounts();

  const sections = SECTIONS.map((s) => ({
    href: `/${lang}/catalog/${SECTION_SLUGS[s]}`,
    label: t.sections[s],
    count: counts[s],
    current: current === s,
  }));

  const nav = [
    { href: `/${lang}/partners`, label: t.nav.partners, current: current === 'partners' },
    { href: `/${lang}/production`, label: t.nav.production, current: current === 'production' },
    // RU'da 2-qator sig'maydi: "Eksport" havolasi olib tashlanadi (HANDOFF 4.10)
    ...(lang === 'ru' ? [] : [{ href: `/${lang}/production#eksport`, label: t.nav.export, current: false }]),
    { href: `/${lang}/contact`, label: t.nav.contact, current: current === 'contact' },
  ];

  return <HeaderClient lang={lang} sections={sections} nav={nav} pdfHref={PDF_CATALOG_HREF} />;
}
