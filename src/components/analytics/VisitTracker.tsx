'use client';

import { useEffect, useRef } from 'react';
import { trackPageviewNav } from '@/lib/analytics';
import { usePathname } from 'next/navigation';
import { sendVisit } from '@/lib/visitTracker';

/**
 * Sahifa ko'rishlar + aloqa havolalari bosilishi (tel:, WhatsApp, Telegram,
 * PDF katalog) — admin'dagi "Tashriflar" hisobotiga.
 */
export function VisitTracker() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    sendVisit('pageview');
    // Birinchi yuklanishni Metrica/Pixel o'zi sanaydi; keyingi o'tishlarni biz yuboramiz.
    if (first.current) first.current = false;
    else trackPageviewNav(window.location.pathname + window.location.search);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a');
      const href = a?.getAttribute('href') || '';
      if (href.startsWith('tel:')) sendVisit('contact_click', { detail: `tel ${href.slice(4)}` });
      else if (/wa\.me|whatsapp/i.test(href)) sendVisit('contact_click', { detail: 'whatsapp' });
      else if (/t\.me\//i.test(href)) sendVisit('contact_click', { detail: 'telegram' });
      else if (/^mailto:/i.test(href)) sendVisit('contact_click', { detail: 'email' });
      else if (/\.pdf($|\?)/i.test(href)) sendVisit('pdf_download', { detail: href.split('/').pop() });
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}
