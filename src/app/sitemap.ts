import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spsplast.uz';

  const products = await db.product.findMany({
    where: { status: 'ACTIVE' },
    select: { updatedAt: true, translations: { select: { slug: true, locale: true } } },
  });

  const categories = await db.category.findMany({
    where: { status: 'ACTIVE' },
    select: { updatedAt: true, translations: { select: { slug: true, locale: true } } },
  });

  const posts = await db.blogPost.findMany({
    where: { isPublished: true },
    select: { updatedAt: true, translations: { select: { slug: true, locale: true } } },
  });

  const locales = ['uz', 'ru'];
  const routes: MetadataRoute.Sitemap = [];

  // Static pages
  const staticPages = ['', '/catalog', '/about', '/production', '/projects', '/blog', '/contact'];

  for (const locale of locales) {
    for (const page of staticPages) {
      routes.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: page === '' ? 1.0 : 0.8,
      });
    }

    // Dynamic products
    for (const p of products) {
      const trans = p.translations.find((t) => t.locale === locale) || p.translations[0];
      if (trans) {
        routes.push({
          url: `${baseUrl}/${locale}/product/${trans.slug}`,
          lastModified: p.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.9,
        });
      }
    }

    // Dynamic categories
    for (const c of categories) {
      const trans = c.translations.find((t) => t.locale === locale) || c.translations[0];
      if (trans) {
        routes.push({
          url: `${baseUrl}/${locale}/catalog/${trans.slug}`,
          lastModified: c.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }

    // Dynamic blog posts
    for (const b of posts) {
      const trans = b.translations.find((t) => t.locale === locale) || b.translations[0];
      if (trans) {
        routes.push({
          url: `${baseUrl}/${locale}/blog/${trans.slug}`,
          lastModified: b.updatedAt,
          changeFrequency: 'monthly',
          priority: 0.7,
        });
      }
    }
  }

  return routes;
}
