import './globals.css';
import { Inter } from 'next/font/google';

/**
 * Inter ships as a variable font, so instead of asking Google for six static
 * weights (6 files x 2 subsets = 12 preloads) we load one variable file per
 * subset. Same visual result for `font-black`/`font-extrabold`, far less
 * font CSS and fewer font requests on the critical path.
 */
const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  adjustFontFallback: true,
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
});

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
    <html lang="uz" className={inter.variable}>
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
