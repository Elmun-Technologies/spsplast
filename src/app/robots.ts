import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * robots.txt: butun sayt ochiq, lekin API va foydalanuvchi holatiga bog'liq
 * sahifalar (solishtirish, zayafka ro'yxati) yopiq — ular `noindex` ham.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/*/compare', '/*/request', '/compare', '/request'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
