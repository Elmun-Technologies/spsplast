import type { Metadata } from 'next';
import type { Locale } from '@/lib/i18n';
import { locales } from '@/lib/i18n';
import { CONTACTS_2027 } from '@/lib/contacts2027';

/**
 * SEO qatlami — redesign 2027 (HANDOFF 7): uz/ru/en, hreflang + x-default,
 * canonical, OpenGraph va JSON-LD (Organization, WebSite, BreadcrumbList,
 * Product, FAQPage, LocalBusiness).
 *
 * Eski versiya faqat uz/ru ni bilardi va `alternatePaths` ni mahsulot/kategoriya
 * slug'lari uchun talab qilardi. Yangi saytda slug'lar tillar bo'yicha bir xil
 * (model slugi lotin, nom tarjimasi `name.ru`/`name.en` dan keladi), shuning
 * uchun hreflang bitta `path` dan yig'iladi.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://sps.uz').replace(/\/$/, '');
export const SITE_NAME = 'SPS Plast';
export const DEFAULT_OG_IMAGE = '/images/og-logo.jpg';

interface PageMetadataOptions {
  lang: Locale;
  /** Til prefiksisiz manzil: bosh sahifa uchun '', katalog uchun '/catalog'. */
  path: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
  /** Til bo'yicha manzil farq qilsa (hozircha farq yo'q). */
  alternatePaths?: Partial<Record<Locale, string>>;
}

/** uz/ru/en + x-default (asosiy = uz). */
export function hreflang(path: string, alternatePaths?: Partial<Record<Locale, string>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const lang of locales) out[lang] = `/${lang}${alternatePaths?.[lang] ?? path}`;
  out['x-default'] = `/uz${alternatePaths?.uz ?? path}`;
  return out;
}

/**
 * Sitemap uchun mutlaq (absolute) hreflang manzillari.
 *
 * `metadata.alternates.languages` da Next nisbiy yo'lni `metadataBase` ga qarab
 * o'zi mutlaq qiladi, sitemap XML da esa bunday o'zgartirish yo'q — nisbiy
 * `href` qolsa Google alternate'ni hisobga olmaydi. Shuning uchun bu funksiya
 * darhol `SITE_URL` bilan birlashtiradi.
 */
export function hreflangAbsolute(path: string, alternatePaths?: Partial<Record<Locale, string>>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(hreflang(path, alternatePaths)).map(([key, value]) => [key, `${SITE_URL}${value}`]),
  );
}

export function pageMetadata({
  lang,
  path,
  title,
  description,
  image,
  imageAlt,
  type = 'website',
  noindex = false,
  alternatePaths,
}: PageMetadataOptions): Metadata {
  const canonical = `/${lang}${path}`;
  const ogImage = image || DEFAULT_OG_IMAGE;
  const ogLocale = lang === 'uz' ? 'uz_UZ' : lang === 'ru' ? 'ru_RU' : 'en_US';

  return {
    title,
    description,
    alternates: { canonical, languages: hreflang(path, alternatePaths) },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: ogLocale,
      type,
      images: [{ url: ogImage, alt: imageAlt || title, ...(image ? {} : { width: 1200, height: 630 }) }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/**
 * Foydalanuvchi holatiga bog'liq sahifalar (solishtirish, zayafka ro'yxati):
 * kontent foydali, lekin indekslanmasin — aks holda "bo'sh ro'yxat" duplikat bo'ladi.
 */
export function noindexMetadata(lang: Locale, title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: true },
    alternates: { canonical: `/${lang}` },
  };
}

/* --- JSON-LD (HANDOFF 7) ---------------------------------------------------- */

export type JsonLdValue = Record<string, unknown>;

/**
 * Kontakt ma'lumotlari JSON-LD da ham `contacts2027.ts` dan olinadi (yagona
 * manba) — aks holda telefon/ijtimoiy tarmoq ikki joyda yozilib, biri
 * eskirishi mumkin.
 */
const CONTACT_PHONE = CONTACTS_2027.mainPhoneRaw;
const SOCIAL_PROFILES = [CONTACTS_2027.telegramUrl, CONTACTS_2027.instagramUrl];

export function jsonLdOrganization(): JsonLdValue {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/brand/logo-ink.webp`,
    description:
      "Toshkentdagi plastik qoliplar zavodi: beton plitka, fasad, zabor va dekor elementlari uchun qoliplar. Zayafka qoldiring — menejer qolip soni va narxini hisoblab beradi.",
    telephone: CONTACT_PHONE,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Toshkent',
      streetAddress: "Xalqa yo'li ko'chasi, 7A",
      addressCountry: 'UZ',
    },
    sameAs: [...SOCIAL_PROFILES],
  };
}

export function jsonLdWebSite(): JsonLdValue {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: ['uz', 'ru', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/uz/catalog?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function jsonLdLocalBusiness(): JsonLdValue {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: SITE_NAME,
    image: `${SITE_URL}/images/site/factory.webp`,
    url: `${SITE_URL}/uz/contact`,
    telephone: CONTACT_PHONE,
    priceRange: 'Zayafka bo‘yicha',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Toshkent',
      streetAddress: "Uchtepa tumani, Xalqa yo'li ko'chasi, 7A",
      addressCountry: 'UZ',
    },
    geo: { '@type': 'GeoCoordinates', latitude: CONTACTS_2027.coords.lat, longitude: CONTACTS_2027.coords.lng },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    sameAs: [...SOCIAL_PROFILES],
  };
}

export function jsonLdBreadcrumb(lang: Locale, items: { name: string; path: string }[]): JsonLdValue {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}/${lang}${item.path}`,
    })),
  };
}

/**
 * Product JSON-LD. Narx saytda yo'q (HANDOFF 1.1) — `offers` faqat
 * "so'rov bo'yicha" holatini bildiradi va `price` maydonini o'z ichiga olmaydi.
 */
export function jsonLdProduct(opts: {
  lang: Locale;
  path: string;
  name: string;
  description?: string | null;
  image?: string | null;
  sku?: string | null;
  category: string;
  extra?: JsonLdValue;
}): JsonLdValue {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: opts.name,
    description: opts.description || undefined,
    sku: opts.sku || undefined,
    category: opts.category,
    image: opts.image ? [`${SITE_URL}${opts.image}`] : undefined,
    url: `${SITE_URL}/${opts.lang}${opts.path}`,
    brand: { '@type': 'Brand', name: SITE_NAME },
    manufacturer: { '@type': 'Organization', name: SITE_NAME },
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      priceCurrency: 'UZS',
      url: `${SITE_URL}/${opts.lang}${opts.path}`,
      // Narx oshkor etilmaydi: hisob-kitob zayafka bo'yicha.
      itemOffered: { '@type': 'Service', name: 'Qolip hisob-kitobi va yetkazib berish' },
    },
    ...(opts.extra ?? {}),
  };
}

export function jsonLdFaq(items: { q: string; a: string }[]): JsonLdValue {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.q,
      acceptedAnswer: { '@type': 'Answer', text: i.a },
    })),
  };
}

export function jsonLdItemList(lang: Locale, items: { name: string; path: string; image?: string | null }[]): JsonLdValue {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/${lang}${item.path}`,
      name: item.name,
      ...(item.image ? { image: `${SITE_URL}${item.image}` } : {}),
    })),
  };
}
