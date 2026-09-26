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

export const metadata = {
  title: 'SPS — Bruschatka, Bordyur va Plitka Qoliplari, Fasad Dekor',
  description: 'SPS — O‘zbekistonda bruschatka, bordyur va trotuar plitka qoliplari hamda fasad dekor elementlarini ishlab chiqaruvchi zavod. Sifatli xomashyo, zavod narxlari.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SPS',
  },
  openGraph: {
    title: 'SPS — Qoliplar va Fasad Dekor Zavodi',
    description: 'Bruschatka qoliplari, bordyur qoliplari, plitka qoliplari va fasad dekor — zavoddan to‘g‘ridan-to‘g‘ri',
    type: 'website',
    locale: 'uz_UZ',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
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
