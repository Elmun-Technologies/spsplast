import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sps.uz';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // `admin`, `checkout`, `cart` — backendsiz arxitekturada bu yo'llar yo'q,
      // lekin eski havolalar indeksda qolgan bo'lsa ham tozalanib boradi.
      // `search-index.json` — qidiruv indeksi; sahifa emas, indekslanmasin.
      disallow: ['/admin/', '/api/', '/checkout/', '/cart/', '/search-index.json'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
