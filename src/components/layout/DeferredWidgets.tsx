'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Locale } from '@/lib/i18n';
import { useCompareStore } from '@/lib/store/compareStore';

/**
 * Non-critical floating UI (AI assistant, PWA prompt, compare bar).
 *
 * These used to be imported directly by the locale layout, which means their
 * code was part of the *initial* JS bundle and hydrated on every storefront
 * page, even though none of them is visible on first paint. They are now
 * code-split and only mounted once the browser is idle (or after 1.5s at the
 * latest), which keeps the critical path limited to the header/footer/cart.
 *
 * `ssr: false` is allowed here because this wrapper is itself a Client
 * Component (Next.js forbids it inside Server Components).
 */
const AIAssistant = dynamic(
  () => import('@/components/ui/AIAssistant').then((m) => m.AIAssistant),
  { ssr: false }
);

const PWAInstallBanner = dynamic(
  () => import('@/components/layout/PWAInstallBanner').then((m) => m.PWAInstallBanner),
  { ssr: false }
);

const CompareBar = dynamic(
  () => import('@/components/product/CompareBar').then((m) => m.CompareBar),
  { ssr: false }
);

interface DeferredWidgetsProps {
  lang: Locale;
}

export const DeferredWidgets: React.FC<DeferredWidgetsProps> = ({ lang }) => {
  const compareCount = useCompareStore((s) => s.items.length);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: 2000 });
      return () => w.cancelIdleCallback?.(id);
    }

    const timer = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return null;

  return (
    <>
      {compareCount > 0 && <CompareBar lang={lang} />}
      <PWAInstallBanner />
      <AIAssistant lang={lang} />
    </>
  );
};
