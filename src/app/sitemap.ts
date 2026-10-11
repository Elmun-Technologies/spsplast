import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n';
import { getModels, getSectionCounts, SECTIONS, SECTION_SLUGS } from '@/lib/catalog2027';
import { hreflangAbsolute, SITE_URL } from '@/lib/seo';

/**
 * Sitemap (HANDOFF 7): har bir sahifa uch uchun til + x-default.
 *
 * Kiritilmaydigan sahifalar:
 *  - `/compare`, `/request` — foydalanuvchi holatiga bog'liq, `noindex`
 *    (aks holda bo'sh ro'yxatlar indeksga tushadi);
 *  - modeli bo'lmagan bo'limlar — "0 model" sahifasi yupqa kontent (thin
 *    content) hisoblanadi. Hozircha `zabor` bo'limida model yo'q: 2026 Excel
 *    manbasida zabor qoliplari alohida qatorlarda kelmagan
 *    (docs/data-questions.md). Ma'lumot to'ldirilgach bo'lim sitemap'ga
 *    o'zi qo'shiladi — kod o'zgarmaydi.
 */

const FIXED_PATHS: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/catalog', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/partners', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/production', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
];

/** Modeli bor bo'limlar (yupqa kontentni indeksga bermaymiz). */
function sectionPaths() {
  const counts = getSectionCounts();
  return SECTIONS.filter((s) => counts[s] > 0).map((s) => ({
    path: `/catalog/${SECTION_SLUGS[s]}`,
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  }));
}

function entry(
  path: string,
  lang: (typeof locales)[number],
  opts: { priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly'; lastModified: Date },
): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}/${lang}${path}`,
    lastModified: opts.lastModified,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages: hreflangAbsolute(path) },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const models = getModels();
  const out: MetadataRoute.Sitemap = [];

  for (const { path, priority, changeFrequency } of [...FIXED_PATHS, ...sectionPaths()]) {
    for (const lang of locales) out.push(entry(path, lang, { priority, changeFrequency, lastModified: now }));
  }

  for (const model of models) {
    const path = `/catalog/${SECTION_SLUGS[model.section]}/${model.slug}`;
    for (const lang of locales) {
      out.push(entry(path, lang, { priority: 0.6, changeFrequency: 'monthly', lastModified: now }));
    }
  }

  return out;
}
