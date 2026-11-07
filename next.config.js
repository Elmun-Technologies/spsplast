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

    /**
     * Umumiy sayt CSP (audit 2026-11-02, 3-bosqich: xavfsizlik). Sahifalar statik
     * prerender bo'lgani uchun (dynamicParams=false) so'rov bo'yicha nonce qo'yib
     * bo'lmaydi — shuning uchun `script-src`/`style-src`da `'unsafe-inline'` bor
     * (Next'ning o'zi qo'shadigan gidratatsiya skriptlari + React inline `style={{}}`
     * atributlari uchun). Shunga qaramay bu bo'sh qoida emas: `object-src`, `base-uri`,
     * `form-action` va `frame-ancestors` haqiqiy xavf (plugin orqali kod, `<base>`
     * ilib qo'yish, formani begona manzilga yuborish, clickjacking) ni to'xtatadi, va
     * `script-src`/`connect-src`/`img-src` faqat haqiqatda ishlatiladigan analitika
     * host'lari bilan cheklangan — begona domenlarga so'rov/skript ketolmaydi. Admin
     * (`/admin`) uchun `src/middleware.ts` bu qoidani O'Z (nonce bilan, `'unsafe-inline'`siz)
     * qattiqroq CSP'si bilan ALMASHTIRADI — tekshirildi: `/admin` javobida faqat bitta
     * `Content-Security-Policy` sarlavhasi (middleware'niki) boradi, shu yerdagisi emas;
     * shuning uchun admin xavfsizligi bu yerdagi qoidaga tayanmaydi, o'zi yetarli bo'lishi
     * kerak. `next dev`da butunlay o'chirilgan: HMR websocket va devtools buzilmasin.
     */
    const ANALYTICS_HOSTS = [
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://analytics.google.com',
      'https://region1.google-analytics.com',
      'https://mc.yandex.ru',
      'https://connect.facebook.net',
      'https://www.facebook.com',
      'https://analytics.tiktok.com',
    ];
    const cspHeaders =
      process.env.NODE_ENV === 'development'
        ? []
        : [
            {
              key: 'Content-Security-Policy',
              value: [
                "default-src 'self'",
                `script-src 'self' 'unsafe-inline' ${ANALYTICS_HOSTS.join(' ')}`,
                "style-src 'self' 'unsafe-inline'",
                `img-src 'self' data: ${ANALYTICS_HOSTS.join(' ')}`,
                "font-src 'self'",
                `connect-src 'self' ${ANALYTICS_HOSTS.join(' ')}`,
                // YouTube/Vimeo (audit 2026-11-02, 3-bosqich: zavod videosi) — faqat embed
                // iframe uchun, admin'dagi havoladan ID ajratib olingach (src/lib/video2027.ts).
                "frame-src 'self' https://www.googletagmanager.com https://www.youtube.com https://player.vimeo.com",
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'none'",
              ].join('; '),
            },
          ];

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          ...frameHeaders,
          ...cspHeaders,
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
    ];
  },
};

module.exports = nextConfig;
