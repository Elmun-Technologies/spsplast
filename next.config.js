/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  /**
   * Barcha rasmlar repozitoriy ichida (`public/`) — S3/R2 yoki tashqi CDN
   * ishlatilmaydi, shuning uchun `remotePatterns` umuman yo'q: ochiq rasm
   * proksisi bo'lib qolish xavfi ham yo'qoladi.
   */
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },
  experimental: {
    // Admin: mahsulot rasmlari server action orqali yuklanadi (15 MB gacha, src/server/media.ts).
    serverActions: { bodySizeLimit: '16mb' },
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    // Clickjacking himoyasi productionda saqlanadi. `next dev` esa ko'pincha
    // preview iframe ichida ochiladi — u yerda DENY sahifani bloklab qo'yadi.
    const frameHeaders =
      process.env.NODE_ENV === 'development' ? [] : [{ key: 'X-Frame-Options', value: 'DENY' }];

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          ...frameHeaders,
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
      {
        source: '/icons/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Self-hosted Onest woff2 fayllari deploy'siz o'zgarmaydi.
        source: '/fonts/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Katalog suratlari statik va og'ir: brauzer/CDN qayta ishlataversin.
        source: '/catalog/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=604800' }],
      },
      {
        source: '/images/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=604800' }],
      },
      {
        // 3D modellar (GLB) va rasmlar statik: uzoq keshlanadi.
        source: '/3d/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=604800' }],
      },
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
    ];
  },
  /**
   * Migratsiya (HANDOFF 7): eski URL'lar → yangi marshrutlar, 301.
   *
   * Ro'yxat `scripts/redirects-2027.json` da (generator:
   * `scripts/extract/build_redirects_2027.py`). U eski `src/data/catalog.json`
   * (192 mahsulot, 3 kategoriya) va yangi `data/models-2027.json` ni
   * solishtirib, nom mos kelsa aniq model sahifasiga, kelmasa bo'lim/katalogga
   * yo'naltiradi. 2017-yilgi CMS manzillari ham shu yerda.
   */
  async redirects() {
    const migration = require('./scripts/redirects-2027.json').redirects;
    /**
     * Admin → SEO → "Yo'naltirishlar" (`redirects` jadvali). Build boshida
     * `scripts/export-snapshot.mjs` yozadi; git'da `[]`. Migratsiya xaritasidan
     * oldin turadi — admin eski qoidani ustidan yozishi mumkin.
     */
    let fromAdmin = [];
    try {
      fromAdmin = require('./src/data/redirects.generated.json');
    } catch {
      fromAdmin = [];
    }

    /**
     * Kanonik host — `spsplast.com` (docs/SEO-2028-RU.md 0-bo'lim). Bir xil
     * kontent bir nechta hostda ochilsa duplikat hisoblanadi va canonical
     * signal kuchsizlanadi, shuning uchun `www` va eski `sps.uz` domeni yo'lni
     * saqlagan holda 301 bilan shu yerga keladi: eski havolalar (va ularning
     * vazni) yo'qolmaydi, eski CMS manzillari esa keyingi qadamda migratsiya
     * xaritasidan o'tadi.
     */
    const CANONICAL_ORIGIN = 'https://spsplast.com';
    const LEGACY_HOSTS = ['www.spsplast.com', 'sps.uz', 'www.sps.uz'];
    // Next `has.value` ni `^value$` qilib RegExp ga aylantiradi: alternativalar
    // guruhda bo'lmasa `^a|b|c$` bo'lib, `^`/`$` faqat chetdagilarga tegadi.
    const legacyHostPattern = `(?:${LEGACY_HOSTS.map((h) => h.replace(/\./g, '\\.')).join('|')})`;
    const canonicalHost = {
      source: '/:path*',
      has: [{ type: 'host', value: legacyHostPattern }],
      destination: `${CANONICAL_ORIGIN}/:path*`,
      statusCode: 301,
    };

    return [canonicalHost, ...fromAdmin, ...migration];
  },
  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: '/sitemap' },
      // 3D-katalog (QR sahifalar): public/3d/<id>/index.html papka manzilida ochilsin.
      { source: '/3d', destination: '/3d/index.html' },
      { source: '/3d/:id', destination: '/3d/:id/index.html' },
    ];
  },
};

module.exports = nextConfig;
