import { getSectionCounts, getTotalCount, SECTION_SLUGS, sectionLabel, sectionShortLabel, getActiveSections } from '@/lib/catalog2027';
import { type Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';
import { HeaderClient } from '@/components/site/HeaderClient';

/** Katalog PDF (2026, uz) — 2027 uch tilli PDF biznesdan kutilmoqda (savol). */
export const PDF_CATALOG_HREF = '/catalog/pdf/sps-qoliplar-katalogi-2026.pdf';

/**
 * Header (Redesign 2028): qora utilita qatori (kompaniya havolalari, telefon,
 * PDF, til) + asosiy qator (logo, bo'lim tab'lari, qidiruv, ro'yxatlar, CTA).
 *
 * `[lang]/layout.tsx` header'ni bitta marta, sahifadan mustaqil chizadi —
 * shuning uchun joriy bo'lim server'da ma'lum emas: faol tab `HeaderClient`
 * ichida `usePathname()` bo'yicha belgilanadi (`match` — yo'l prefiksi).
 */
export function SiteHeader({ lang }: { lang: Locale }) {
  const t = getUi(lang);
  const counts = getSectionCounts();

  const sections = getActiveSections().map((s) => {
    const href = `/${lang}/catalog/${SECTION_SLUGS[s]}`;
    // Tabda qisqa nom (7 bo'lim sig'sin), to'liq nom — title va mobil menyuda.
    return { href, match: href, label: sectionShortLabel(s, lang), full: sectionLabel(s, lang), count: counts[s] };
  });

  const nav = [
    { href: `/${lang}/partners`, match: `/${lang}/partners`, label: t.nav.partners },
    { href: `/${lang}/production`, match: `/${lang}/production`, label: t.nav.production },
    // RU'da qator sig'maydi: "Экспорт" alohida havola emas — u "Производство" ichida (HANDOFF 4.10)
    ...(lang === 'ru' ? [] : [{ href: `/${lang}/production#eksport`, match: '', label: t.nav.export }]),
    { href: `/${lang}/contact`, match: `/${lang}/contact`, label: t.nav.contact },
  ];

  return <HeaderClient lang={lang} sections={sections} total={getTotalCount()} nav={nav} pdfHref={PDF_CATALOG_HREF} />;
}
