import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const metadata = {
  title: 'SPS PLAST — Termopanel, Bruschatka va Beton Qoliplari',
  description: 'O‘zbekistonda termopanel, bruschatka qoliplari va beton mahsulotlari uchun sifatli plastik qoliplar ishlab chiqarish. 300+ quyish kafolati, zavod narxlari.',
  manifest: '/manifest.json',
  themeColor: '#E61C24',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'SPS PLAST',
  },
  openGraph: {
    title: 'SPS PLAST — Qoliplar Zavodi',
    description: 'Bruschatka qoliplari, termopanellar, bordyur qoliplari — zavoddan to‘g‘ridan-to‘g‘ri',
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
