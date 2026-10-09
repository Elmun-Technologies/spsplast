'use client';

import { usePathname } from 'next/navigation';
import { locales, type Locale } from '@/lib/i18n';

/**
 * Til almashtirgich: joriy manzilning faqat birinchi segmentini almashtiradi
 * (/uz/catalog → /ru/catalog), qolgan qismi saqlanadi.
 */
export function LangSwitch({ lang, dark, className }: { lang: Locale; dark?: boolean; className?: string }) {
  const pathname = usePathname() || `/${lang}`;
  const rest = pathname.replace(/^\/(uz|ru|en)/, '') || '';

  return (
    <nav
      className={['sps-lang', className].filter(Boolean).join(' ')}
      aria-label="Til / Language"
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
