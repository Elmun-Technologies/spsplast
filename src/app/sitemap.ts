import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n';
import { hreflangAbsolute, SITE_URL } from '@/lib/seo';
import { noindexPaths } from '@/lib/seoOverrides';
import { indexablePaths } from '@/lib/sitePaths';

/**
 * Sitemap (HANDOFF 7): har bir sahifa uch tilda + x-default (mutlaq alternate'lar).
 *
 * Ro'yxat `indexablePaths()` dan (admin → SEO bilan bir manba): doimiy sahifalar,
 * modeli bor bo'limlar, teg va eksport landinglari, modellar. Kiritilmaydi:
 *  - `/compare`, `/request` — foydalanuvchi holatiga bog'liq, `noindex`;
 *  - modeli bo'lmagan bo'limlar (hozir `zabor`) — yupqa kontent; ma'lumot
 *    to'ldirilgach o'zi qo'shiladi;
 *  - admin → SEO da `noindex` belgilangan sahifalar.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const hidden = noindexPaths();
  const out: MetadataRoute.Sitemap = [];
  for (const { path, priority, changeFrequency } of indexablePaths()) {
    if (hidden.has(path)) continue;
    for (const lang of locales) {
      out.push({
        url: `${SITE_URL}/${lang}${path}`,
        lastModified: now,
        changeFrequency,
        priority,
        alternates: { languages: hreflangAbsolute(path) },
      });
    }
  }
  return out;
}
