import './globals.css';
import { AnalyticsScripts } from '@/components/analytics/AnalyticsScripts';
import { JsonLd } from '@/components/site/JsonLd';
import { getTotalCount } from '@/lib/catalog2027';
import { SITE_NAME, SITE_URL, jsonLdOrganization, jsonLdWebSite } from '@/lib/seo';

/**
 * Onest self-host (`/public/fonts`, @fontsource-variable/onest 5.3.1, OFL 1.1).
 * lotin subset har sahifaning kritik yo'lida; kirill subset faqat kirill
 * glif chiqqanda yuklanadi (unicode-range). `next/font/google` ishlatilmaydi:
 * build tarmoqsiz ham ishlashi shart (HANDOFF 2-bo'lim).
 */
const FONT_PRELOAD = '/fonts/onest-latin-wght-normal.woff2';

/** Barcha nisbiy havolalar (canonical, OG, sitemap) shu manzilga nisbatan. */
// SITE_URL / SITE_NAME — src/lib/seo.ts (bitta manba).

function toMetadataBase(value: string): URL | undefined {
  for (const candidate of [value, `https://${value}`, 'https://sps.uz']) {
    try {
      return new URL(candidate);
    } catch {
      // keyingi variantni sinaymiz
    }
  }
  return undefined;
}

const MODELS = getTotalCount();

export const metadata = {
  metadataBase: toMetadataBase(SITE_URL),
  title: {
    default: `SPS — beton plitka va fasad uchun plastik qoliplar, ${MODELS} model`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "SPS — Toshkentda plastik qoliplar ishlab chiqaruvchi zavod: trotuar plitkasi, fasad, zabor va dekor elementlari. Zayafka qoldiring — menejer narx va qolip sonini hisoblab aytadi.",
  openGraph: {
    title: 'SPS — Qoliplar zavodi, Toshkent',
    description: 'Beton plitka va fasad uchun plastik qoliplar. 20 yil tajriba, 8 eksport davlati.',
    type: 'website',
    locale: 'uz_UZ',
    images: [
      {
        url: '/images/og-logo.jpg',
        width: 1200,
        height: 630,
        alt: 'SPS — Qoliplar zavodi, Toshkent',
      },
    ],
  },
  icons: {
    icon: [{ url: '/favicon.ico', sizes: 'any' }],
  },
};

export const viewport = {
  themeColor: '#e3202a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <link rel="preload" href={FONT_PRELOAD} as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* Analitika: faqat env ID bo'lsa yuklanadi */}
        <AnalyticsScripts />
        {/* Sayt darajasidagi strukturaviy ma'lumot (HANDOFF 7) */}
        <JsonLd data={[jsonLdOrganization(), jsonLdWebSite()]} />
        {children}
      </body>
    </html>
  );
}
