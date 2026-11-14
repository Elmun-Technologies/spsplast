'use client';

import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { isValidLocale, type Locale } from '@/lib/i18n';

const noop = () => () => {};
/** URL'ning birinchi bo'lagi: /ru/xato-yol -> ru. Server'da (prerender) — uz. */
function urlLang(): Locale {
  const first = window.location.pathname.split('/')[1] ?? '';
  return isValidLocale(first) ? (first as Locale) : 'uz';
}

/**
 * 404 tili. `dynamicParams = false` tufayli HAR qanday noma'lum manzil (`/ru/xato-yol`,
 * `/en/catalog/paving/yoq`) bitta oldindan tayyorlangan ildiz `not-found.tsx` bilan javob
 * oladi — u `[lang]` dan tashqarida, `params`/`useParams()` yo'q (2026-11-12 da curl bilan
 * tasdiqlandi: `[lang]/not-found.tsx` amalda ishlatilmaydi). Shuning uchun til brauzerdagi
 * haqiqiy URL'dan olinadi; uch tildagi tana (header/footer bilan) server'da tayyorlanib prop
 * sifatida keladi — mijoz bundle'iga katalog ma'lumoti va lug'atlar kirmaydi.
 */
export function NotFoundLangPick(props: Record<Locale, ReactNode>) {
  const lang = useSyncExternalStore(noop, urlLang, () => 'uz' as Locale);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return <>{props[lang]}</>;
}
