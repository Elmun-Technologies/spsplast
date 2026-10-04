import type { Metadata } from 'next';
import { Locale } from '@/lib/i18n';

/**
 * Sahifa metama'lumotlari uchun yagona yordamchi.
 *
 * Nega kerak: audit (docs/MADANI-RAQOBAT-AUDITI.md, P0-11) sayt sahifalarining
 * ko'pida `generateMetadata` yo'qligini ko'rsatdi. Natijada /about, /projects,
 * /blog kabi sahifalar bosh sahifaning sarlavhasi va tavsifini meros olardi —
 * Google uchun bu bir xil sahifalarning takrori, foydalanuvchi uchun esa
 * qidiruv natijasida farqlanmaydigan havolalar.
 *
 * Bundan tashqari har bir sahifa uchun canonical, uz/ru hreflang (x-default
 * bilan) va og:image shu yerda bir joyda beriladi — ilgari ular sahifama-sahifa
 * qo'lda yozilardi va ba'zilarida umuman yo'q edi.
 */

/** Ijtimoiy tarmoqlar uchun standart rasm (1200×630). */
export const DEFAULT_OG_IMAGE = '/images/og-logo.jpg';

const SITE_NAME = 'SPS';

type OgType = 'website' | 'article';

interface PageMetadataOptions {
  lang: Locale;
  /** Sahifa manzili tildan keyingi qismi: '/about', '/catalog' (bosh sahifa uchun ''). */
  path: string;
  title: string;
  description: string;
  /** Sahifaga xos rasm (blog muqovasi, mahsulot surati). Berilmasa standart rasm. */
  image?: string;
  imageAlt?: string;
  type?: OgType;
  /** Qidiruv natijasidan chiqarish (savat, buyurtma, shaxsiy ro'yxatlar). */
  noindex?: boolean;
}

/**
 * uz/ru va x-default hreflang to'plami.
 *
 * `x-default` — til aniqlanmagan foydalanuvchi uchun asosiy variant; bizda bu
 * o'zbek tili, chunki sayt asosiy auditoriyasi O'zbekistonda.
 */
export function hreflang(path: string): Record<string, string> {
  return {
    uz: `/uz${path}`,
    ru: `/ru${path}`,
    'x-default': `/uz${path}`,
  };
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
}: PageMetadataOptions): Metadata {
  const canonical = `/${lang}${path}`;
  const ogImage = image || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: hreflang(path),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: lang === 'uz' ? 'uz_UZ' : 'ru_RU',
      type,
      images: [
        {
          url: ogImage,
          alt: imageAlt || title,
          ...(image ? {} : { width: 1200, height: 630 }),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/**
 * Xususiy sahifalar (savat, buyurtma, solishtirish) uchun: kontent foydali,
 * lekin qidiruvda indekslanishi shart emas — aks holda bir xil "bo'sh savat"
 * sahifalari indeksga tushadi.
 */
export function noindexMetadata(lang: Locale, title: string): Metadata {
  return {
    title,
    robots: { index: false, follow: true },
    alternates: { canonical: `/${lang}` },
  };
}
