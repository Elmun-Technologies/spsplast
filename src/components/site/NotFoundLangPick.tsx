'use client';

import type { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { isValidLocale, type Locale } from '@/lib/i18n';

/**
 * `not-found.tsx` ga Next `params` bermaydi: til `useParams()` dan olinadi (noma'lum — uz).
 * Uch tildagi tana server'da tayyorlanib prop sifatida keladi — mijoz bundle'iga katalog
 * ma'lumoti va lug'atlar kirmaydi.
 */
export function NotFoundLangPick(props: Record<Locale, ReactNode>) {
  const params = useParams<{ lang?: string }>();
  // Ma'lum cheklov (CLAUDE.md, 3.2): `notFound()` yo'lida `useParams()` ham, `usePathname()` ham
  // segmentni bermaydi (2026-11-12 da ikkalasi brauzerda tekshirildi) — 404 tanasi hozircha uz.
  const lang: Locale = isValidLocale(params?.lang ?? '') ? (params.lang as Locale) : 'uz';
  return <>{props[lang]}</>;
}
