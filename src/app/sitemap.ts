import { MetadataRoute } from 'next';
import { db } from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://spsplast.uz';

  const products = await db.product.findMany({ select: { slug: true, updatedAt: true } });
  const categories = await db.category.findMany({ select: { slug: true, updatedAt: true } });
  const posts = await db.blogPost.findMany({ select: { slug: true, updatedAt: true } });

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
      routes.push({
        url: `${baseUrl}/${locale}/product/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }

    // Dynamic categories
    for (const c of categories) {
      routes.push({
        url: `${baseUrl}/${locale}/catalog/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    // Dynamic blog posts
    for (const b of posts) {
      routes.push({
        url: `${baseUrl}/${locale}/blog/${b.slug}`,
        lastModified: b.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  }

  return routes;
}
