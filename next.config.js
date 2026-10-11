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
     * `www` ni apex domenga: bir xil kontent ikki hostda ochilsa duplikat
     * hisoblanadi va canonical signal kuchsizlanadi.
     */
    const canonicalHost = {
      source: '/:path*',
      has: [{ type: 'host', value: 'www.sps.uz' }],
      destination: 'https://sps.uz/:path*',
      statusCode: 301,
    };

    return [canonicalHost, ...migration];
  },
  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: '/sitemap' },
    ];
  },
};

module.exports = nextConfig;
