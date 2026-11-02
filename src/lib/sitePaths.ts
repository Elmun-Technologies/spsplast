import { getModels, getSectionCounts, hasAnyImage, modelName, SECTIONS, SECTION_SLUGS, sectionLabel } from './catalog2027.ts';
import { getSitePages } from './pagesServer.ts';
import { EXPORT_COUNTRIES, getSeoTags } from './seoPages.ts';

/**
 * Indekslanadigan sahifalar ro'yxati — bitta manba: sitemap (`src/app/sitemap.ts`) va
 * admin → SEO (sahifalar jadvali, salomatlik tekshiruvi) shundan foydalanadi.
 * `path` til prefiksisiz; har bir sahifa uch tilda mavjud.
 *
 * Kiritilmaydi: `/compare`, `/request` (noindex), modelsiz bo'limlar (yupqa kontent).
 * `autoNoindex` — rasmi yo'q model: sahifa ishlaydi, lekin rasm kelguncha `noindex, follow` va
 * sitemap'da yo'q (audit 2026-11-02: 52 model × 3 til = 156 yupqa URL). Rasm nashr qilinsa — o'zi qaytadi.
 */
export type PathKind = 'page' | 'section' | 'tag' | 'export' | 'model';
export type ChangeFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type SitePath = { path: string; kind: PathKind; label: string; priority: number; changeFrequency: ChangeFrequency; autoNoindex?: boolean };

const FIXED: { path: string; label: string; priority: number; changeFrequency: ChangeFrequency }[] = [
  { path: '', label: 'Bosh sahifa', priority: 1, changeFrequency: 'weekly' },
  { path: '/catalog', label: 'Katalog', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/partners', label: 'Ulgurji va hamkorlik', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/production', label: 'Ishlab chiqarish va eksport', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', label: 'Kontakt', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/privacy', label: 'Maxfiylik siyosati', priority: 0.3, changeFrequency: 'yearly' },
];

export function indexablePaths(): SitePath[] {
  const counts = getSectionCounts();
  const seo = getSitePages('uz').seo;
  return [
    ...FIXED.map((f) => ({ ...f, kind: 'page' as const })),
    ...SECTIONS.filter((s) => counts[s] > 0).map((s) => ({
      path: `/catalog/${SECTION_SLUGS[s]}`,
      kind: 'section' as const,
      label: `${sectionLabel(s, 'uz')} (bo'lim)`,
      priority: 0.8,
      changeFrequency: 'weekly' as const,
    })),
    ...getSeoTags().map((t) => ({
      path: `/catalog/${SECTION_SLUGS[t.section]}/tag/${t.tag}`,
      kind: 'tag' as const,
      label: `${seo.tags[t.tag].name} (${t.count} model)`,
      priority: 0.7,
      changeFrequency: 'weekly' as const,
    })),
    ...EXPORT_COUNTRIES.map((c) => ({
      path: `/export/${c.key}`,
      kind: 'export' as const,
      label: `Eksport: ${seo.geo.countries[c.key].name}`,
      priority: 0.7,
      changeFrequency: 'monthly' as const,
    })),
    ...getModels().map((m) => ({
      path: `/catalog/${SECTION_SLUGS[m.section]}/${m.slug}`,
      kind: 'model' as const,
      label: `${m.code ? `№ ${m.code} ` : ''}${modelName(m, 'uz')}`,
      priority: 0.6,
      changeFrequency: 'monthly' as const,
      ...(hasAnyImage(m) ? {} : { autoNoindex: true }),
    })),
  ];
}
