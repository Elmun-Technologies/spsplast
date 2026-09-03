import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const metadata = {
  title: 'SPS — Bruschatka, Bordyur va Plitka Qoliplari, Fasad Dekor',
  description: 'SPS — O‘zbekistonda bruschatka, bordyur va trotuar plitka qoliplari hamda fasad dekor elementlarini ishlab chiqaruvchi zavod. Sifatli xomashyo, zavod narxlari.',
  manifest: '/manifest.json',
  themeColor: '#E61C24',
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#E61C24" />
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
