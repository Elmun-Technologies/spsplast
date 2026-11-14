import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * robots.txt: butun sayt ochiq, API va admin panel yopiq. `/compare`/`/request`
 * ATAYLAB bu yerda YO'Q (audit 2026-11-02, 3.5-band — ziddiyat edi): ular
 * `noindex, follow` (`noindexMetadata`, HANDOFF B8) — qidiruvchi ularni
 * indekslamaydi, lekin ULARDAGI HAVOLALARNI (model sahifalariga) BOSIB O'TISHI
 * kerak. `Disallow` qo'ysak qidiruvchi bu sahifaga umuman kirmay, o'shа
 * havolalarni hech qachon ko'rmaydi — `follow: true`ning o'zi ma'nosiz qolardi.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
