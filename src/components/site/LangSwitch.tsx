'use client';

import { usePathname } from 'next/navigation';
import { locales, type Locale } from '@/lib/i18n';
import { getUi } from '@/lib/ui';

/**
 * Til almashtirgich: joriy manzilning faqat birinchi segmentini almashtiradi
 * (/uz/catalog → /ru/catalog), qolgan qismi saqlanadi.
 *
 * `label`: sahifada uchta til almashtirgich bor (header, mobil menyu, footer).
 * Bir xil nomli ikki `nav` landmark bo'lsa, ekran o'quvchi foydalanuvchisi
 * ularni farqlay olmaydi (axe: landmark-unique) — shuning uchun har biriga
 * o'z konteksti beriladi.
 */
export function LangSwitch({
  lang,
  dark,
  className,
  label,
}: {
  lang: Locale;
  dark?: boolean;
  className?: string;
  label?: string;
}) {
  const pathname = usePathname() || `/${lang}`;
  const rest = pathname.replace(/^\/(uz|ru|en)/, '') || '';

  return (
    <nav
      className={['sps-lang', className].filter(Boolean).join(' ')}
      aria-label={label || getUi(lang).a11y.langNavHeader}
      style={dark ? { borderColor: 'rgba(255,255,255,.2)' } : undefined}
    >
      {locales.map((l) => (
        <a
          key={l}
          href={`/${l}${rest}`}
          lang={l}
          aria-current={l === lang ? 'true' : undefined}
          style={dark && l !== lang ? { color: 'var(--on-ink-muted)' } : undefined}
        >
          {l.toUpperCase()}
        </a>
      ))}
    </nav>
  );
}
