/** @type {import('next').NextConfig} */
// Product media is served from the S3/R2 public URL. Next Image rejects a
// remote host that is not declared here, which can fail the whole product page
// during rendering even though the image itself is reachable in the browser.
// Read the configured CDN host at build time so changing S3_PUBLIC_URL does not
// require another source-code change.
const storageImagePattern = (() => {
  if (!process.env.S3_PUBLIC_URL) return null;

  try {
    const url = new URL(process.env.S3_PUBLIC_URL);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const basePath = url.pathname.replace(/\/+$/, '');

    return {
      protocol: url.protocol.slice(0, -1),
      hostname: url.hostname,
      pathname: `${basePath}/**`,
    };
  } catch {
    return null;
  }
})();

const nextConfig = {
  /**
   * Docker (Fly.io) uchun `output: 'standalone'` — `.next/standalone/server.js`
   * va faqat kerakli node_modules chiqariladi (image ~10x kichik bo'ladi).
   * Vercelda shart emas, shuning uchun faqat Dockerfile o'rnatadigan
   * BUILD_STANDALONE=1 bilan yoqiladi.
   */
  output: process.env.BUILD_STANDALONE === '1' ? 'standalone' : undefined,
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  /**
   * Rust-siz Prisma client (`engineType = "client"`, ko'ring prisma/schema.prisma
   * va src/lib/db.ts) so'rov vaqtida `query_compiler_bg.wasm` faylini
   * `fs.readFileSync(path.join(config.dirname, 'query_compiler_bg.wasm'))`
   * orqali o'qiydi — bu yo'l build vaqtida string birlashtirish bilan
   * hosil bo'lgani uchun Next/Vercelning output file tracing'i (Node File
   * Trace) buni STATIK aniqlay olmaydi va .wasm fayl serverless funksiya
   * bundle'idan chiqarib tashlanadi.
   *
   * Natija productionda (Vercel) HAR bir `db`dan foydalanadigan so'rovda
   * `ENOENT: query_compiler_bg.wasm topilmadi` xatosi — sahifa "Xatolik yuz
   * berdi" ekraniga tushib qoladi (masalan mahsulot kartasi, katalog).
   * ISR bilan keshlangan bosh sahifa eski keshni ko'rsataveradi va buzuq
   * ko'rinmaydi, shuning uchun muammo faqat mahsulot/katalog sahifalarida
   * sezilardi.
   *
   * Yechim: shu faylni (va yonidagi .prisma/client papkasini) har bir route
   * uchun aniq trace qilishga majburlaymiz. Fly.io/Docker'dagi
   * `output: 'standalone'` uchun ham zarar qilmaydi — standalone trace shu
   * ro'yxatni hurmat qiladi.
   */
  outputFileTracingIncludes: {
    '/*': ['./node_modules/.prisma/client/**/*'],
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.cloudflare.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'sps.uz' },
      { protocol: 'https', hostname: '*.sps.uz' },
      // Production's documented media host is media.spsplast.uz (distinct from
      // the sps.uz zone above). Keep it as a safe default and also allow the
      // host configured by S3_PUBLIC_URL below.
      { protocol: 'https', hostname: 'spsplast.uz' },
      { protocol: 'https', hostname: '*.spsplast.uz' },
      ...(storageImagePattern ? [storageImagePattern] : []),
      { protocol: 'https', hostname: '**.s3.amazonaws.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
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
      {
        source: '/api/feed/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=3600' }],
      },
    ];
  },
  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: '/sitemap' },
    ];
  },
};

module.exports = nextConfig;
