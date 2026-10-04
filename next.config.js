/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  /**
   * Barcha rasmlar repozitoriy ichida (`public/`) — S3/R2 yoki tashqi CDN
   * ishlatilmaydi, shuning uchun faqat kelajakda kerak bo'lishi mumkin bo'lgan
   * eng ehtimoliy hostlar qoldirildi. Mahalliy fayllar `remotePatterns`siz
   * ishlaydi.
   */
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'sps.uz' },
      { protocol: 'https', hostname: '*.sps.uz' },
    ],
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
        // Self-hosted Inter woff2 files never change without a deploy.
        source: '/fonts/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Catalog photography is static and heavy: let browsers/CDN reuse it.
        source: '/catalog/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=604800' }],
      },
      {
        source: '/images/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=604800' }],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }],
      },
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
    ];
  },
  /**
   * Migratsiya: eski `sps.uz` (2017-yilgi CMS) manzillarini yangi marshrutlarga
   * doimiy (301) bog'laymiz.
   *
   * Nega bu shart: eski sayt 2017-yildan beri indeksda va unga tashqi havolalar
   * bor. Bu blok bo'lmasa, yangi sayt ishga tushganda o'sha URL'lar 404 qaytaradi
   * va to'plangan organik trafik hamda link-massasi yo'qoladi
   * (docs/MADANI-RAQOBAT-AUDITI.md, P0-2 va 8.1).
   *
   * Manba ro'yxati eski saytning haqiqiy `sitemap.xml`idan olingan. Qidiruv
   * tizimlari 301 ni "signal yangi manzilga o'tdi" deb tushunadi, shuning uchun
   * `permanent: true` (308) emas, aynan 301 ishlatiladi.
   */
  async redirects() {
    /** Eski manzil → yangi manzil (rus tilidagi kontent edi, shuning uchun /ru). */
    const legacy = [
      { source: '/about', destination: '/ru/about' },
      { source: '/produkciya', destination: '/ru/catalog' },
      { source: '/formi', destination: '/ru/catalog' },
      { source: '/formi/p/:page*', destination: '/ru/catalog' },
      { source: '/formi/image/:id*', destination: '/ru/catalog' },
      { source: '/plitki', destination: '/ru/catalog' },
      { source: '/kolodtsy', destination: '/ru/catalog' },
      { source: '/bordyury-i-lotki', destination: '/ru/catalog' },
      { source: '/uslugi', destination: '/ru/production' },
      { source: '/proizvoditeli', destination: '/ru/production' },
      { source: '/doc', destination: '/ru/delivery-payment' },
      { source: '/otzyvy-o-nas', destination: '/ru/about' },
      { source: '/fotogalereya', destination: '/ru/projects' },
      { source: '/novosti', destination: '/ru/blog' },
      { source: '/novosti/news_post/:slug*', destination: '/ru/blog' },
      { source: '/napishite-nam', destination: '/ru/contact' },
      { source: '/kontakty', destination: '/ru/contact' },
      { source: '/search', destination: '/ru/search' },
      { source: '/karta-sayta', destination: '/ru' },
      // Ma'nosi yo'q shaxsiy sahifa — trafikni bosh sahifaga qaytaramiz.
      { source: '/user', destination: '/ru' },
    ].map((entry) => ({ ...entry, statusCode: 301 }));

    /**
     * `www` ni asosiy domenga (apex) yo'naltiramiz: bir xil kontent ikki hostda
     * ochilsa, qidiruv tizimlari dublikat deb hisoblaydi va canonical signal
     * kuchsizlanadi.
     */
    const canonicalHost = {
      source: '/:path*',
      has: [{ type: 'host', value: 'www.sps.uz' }],
      destination: 'https://sps.uz/:path*',
      statusCode: 301,
    };

    return [canonicalHost, ...legacy];
  },
  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: '/sitemap' },
    ];
  },
};

module.exports = nextConfig;
