'use client';

import { useParams } from 'next/navigation';
import { NotFoundBody } from '@/components/site/NotFoundBody';
import { isValidLocale, type Locale } from '@/lib/i18n';

/**
 * Til ichidagi 404. Next `not-found.tsx` ga `params` bermaydi — til
 * `useParams()` dan olinadi, noma'lum holatda uz (asosiy til).
 */
export default function LangNotFound() {
  const params = useParams<{ lang?: string }>();
  const lang: Locale = isValidLocale(params?.lang ?? '') ? (params.lang as Locale) : 'uz';
  return <NotFoundBody lang={lang} />;
}
