import './globals.css';

/**
 * Inter is self-hosted from `/public/fonts` (see `globals.css` for the
 * `@font-face` rules and why we no longer use `next/font/google`).
 *
 * The latin subset is on the critical path of every page, so it is preloaded;
 * the cyrillic subset is only fetched by the browser when a Cyrillic glyph is
 * actually rendered (unicode-range), which keeps the Russian UI covered without
 * making uz-only visitors pay for it.
 */
const FONT_PRELOAD = '/fonts/inter-latin-wght-normal.woff2';

/**
 * Barcha nisbiy havolalar (canonical, OG rasm, sitemap) shu manzilga nisbatan
 * hisoblanadi. `metadataBase` bo'lmasa Next.js ularni `localhost:3000` ga
 * bog'laydi — natijada Telegram/Facebook'da havola noto'g'ri ochiladi.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sps.uz';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'SPS — Bruschatka, Bordyur va Plitka Qoliplari, Fasad Dekor',
  description: 'SPS — O‘zbekistonda bruschatka, bordyur va trotuar plitka qoliplari hamda fasad dekor elementlarini ishlab chiqaruvchi zavod. Sifatli xomashyo, zavod narxlari.',
  // No web-app manifest / appleWebApp: this is a regular website. It used to
  // ship a `display: standalone` manifest + service worker, which made browsers
  // open links in a separate app window and freeze on stale cached pages.
  openGraph: {
    title: 'SPS — Qoliplar va Fasad Dekor Zavodi',
    description: 'Bruschatka qoliplari, bordyur qoliplari, plitka qoliplari va fasad dekor — zavoddan to‘g‘ridan-to‘g‘ri',
    type: 'website',
    locale: 'uz_UZ',
    images: [
      {
        url: '/images/og-logo.jpg',
        width: 1200,
        height: 630,
        alt: 'SPS — Qoliplar va Fasad Dekor Zavodi',
      },
    ],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport = {
  themeColor: '#E61C24',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz">
      <body className="font-sans antialiased">
        {/* Hoisted into <head> by React — keeps the LCP font off the CSS round-trip. */}
        <link
          rel="preload"
          href={FONT_PRELOAD}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {children}
      </body>
    </html>
  );
}
