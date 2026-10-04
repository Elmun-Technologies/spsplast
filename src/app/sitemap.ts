import { MetadataRoute } from 'next';
import { catalog } from '@/lib/catalog';

/**
 * Sitemap.
 *
 * Audit (docs/MADANI-RAQOBAT-AUDITI.md, P0-11) raqib saytining xatosini
 * ko'rsatdi: `lastmod` har bir sahifa uchun "bugun" deb yozilgan edi — qidiruv
 * tizimlari bunday belgiga ishonmaydi. Shuning uchun bu yerda:
 *
 *  - statik sahifalar uchun `lastModified` umuman berilmaydi (o'zgarmagan
 *    sahifa uchun sana ko'rsatishning hojati yo'q);
 *  - dinamik sahifalar (mahsulot, kategoriya, maqola) uchun bazadagi haqiqiy
 *    `updatedAt` ishlatiladi;
 *  - har bir yozuvga uz/ru hreflang alternates qo'shiladi — bu qidiruv
 *    tizimiga ikki til versiyasi bir sahifa ekanini aytadi.
 *
 * Ma'lumot statik katalogdan (`src/data/catalog.json`) olinadi — build paytida
 * baza umuman kerak emas, shuning uchun sitemap hech qachon "bo'sh" chiqmaydi.
 */

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sps.uz';

  type SlugEntry = { updatedAt: string | null; translations: { slug: string; locale: string }[] };

  const products: SlugEntry[] = catalog.products
    .filter((product) => product.status === 'ACTIVE')
    .map((product) => ({
      updatedAt: product.updatedAt,
      translations: product.translations.map(({ slug, locale }) => ({ slug, locale })),
    }));

  // Kategoriya sahifasi `/catalog?category=...` ko'rinishida (301 orqali
  // `/catalog/[slug]` ham shu yerga olib boradi) — shuning uchun kategoriya
  // yozuvlari statik ro'yxatda allaqachon bor.
  const categories: SlugEntry[] = [];
  const posts: SlugEntry[] = catalog.blog
    .filter((post) => post.isPublished)
    .map((post) => ({
      updatedAt: post.updatedAt,
      translations: post.translations.map(({ slug, locale }) => ({ slug, locale })),
    }));

  const locales = ['uz', 'ru'];
  const routes: MetadataRoute.Sitemap = [];

  /**
   * Berilgan yo'l uchun uz/ru (+x-default) alternates to'plami.
   * `x-default` — til aniqlanmagan foydalanuvchi uchun o'zbek versiyasi.
   */
  const alternates = (path: string) => ({
    languages: {
      uz: `${baseUrl}/uz${path}`,
      ru: `${baseUrl}/ru${path}`,
      'x-default': `${baseUrl}/uz${path}`,
    },
  });

  // Statik sahifalar: lastModified berilmaydi — sahifa o'zgarganda Google
  // kontentning o'zidan buni o'zi aniqlaydi.
  const staticPages: { path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }[] = [
    { path: '', priority: 1.0, changeFrequency: 'daily' },
    { path: '/catalog', priority: 0.9, changeFrequency: 'daily' },
    { path: '/how-to-order', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/delivery-payment', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/production', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/projects', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/blog', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/returns', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/privacy', priority: 0.2, changeFrequency: 'monthly' },
    { path: '/terms', priority: 0.2, changeFrequency: 'monthly' },
  ];

  for (const locale of locales) {
    for (const page of staticPages) {
      routes.push({
        url: `${baseUrl}/${locale}${page.path}`,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: alternates(page.path),
      });
    }
  }

  /** Dinamik yozuvlar uchun: joriy tildagi slug va boshqa til slug'i yo'q bo'lsa — mavjudini olamiz. */
  const pickTrans = (entry: SlugEntry, locale: string) =>
    entry.translations.find((t) => t.locale === locale) || entry.translations[0];

  for (const locale of locales) {
    for (const p of products) {
      const trans = pickTrans(p, locale);
      if (!trans) continue;
      routes.push({
        url: `${baseUrl}/${locale}/product/${trans.slug}`,
        lastModified: p.updatedAt ?? undefined,
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates: alternates(`/product/${trans.slug}`),
      });
    }

    for (const c of categories) {
      const trans = pickTrans(c, locale);
      if (!trans) continue;
      routes.push({
        url: `${baseUrl}/${locale}/catalog/${trans.slug}`,
        lastModified: c.updatedAt ?? undefined,
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: alternates(`/catalog/${trans.slug}`),
      });
    }

    for (const b of posts) {
      const trans = pickTrans(b, locale);
      if (!trans) continue;
      routes.push({
        url: `${baseUrl}/${locale}/blog/${trans.slug}`,
        lastModified: b.updatedAt ?? undefined,
        changeFrequency: 'monthly',
        priority: 0.7,
        alternates: alternates(`/blog/${trans.slug}`),
      });
    }
  }

  return routes;
}
