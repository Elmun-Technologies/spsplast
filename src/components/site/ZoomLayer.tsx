'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { ZoomItem } from './ZoomPanel';

/**
 * Rasmni katta ko'rish (lupa) — butun sayt uchun bitta qatlam (2026-11-24).
 *
 * Istalgan element `data-zoom="<src>"` (+ `data-zoom-alt`, `data-zoom-bg="studio|deep"`) bilan belgilanadi;
 * bir nechta rasm bo'lsa `data-zoom-list` (JSON: ZoomItem[]) va `data-zoom-index`. Bosish hujjat darajasida
 * ushlanadi (server komponentlar ham ishlata oladi; dasturdan — `sps:zoom` hodisasi), panel esa faqat birinchi bosishda yuklanadi —
 * har sahifa JS'iga faqat shu kichik qobiq tushadi.
 */
const Panel = dynamic(() => import('./ZoomPanel'), { ssr: false });

export function ZoomLayer() {
  const [open, setOpen] = useState<{ items: ZoomItem[]; index: number; from: HTMLElement | null } | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>('[data-zoom]');
      if (!el) return;
      // Ichidagi havola/tugma o'z ishini qilsin (lupa tugmasining o'zi bundan mustasno).
      const inner = target?.closest('a, button, input, select, textarea');
      if (inner && inner !== el && el.contains(inner) && !inner.hasAttribute('data-zoom-btn')) return;
      let items: ZoomItem[] = [];
      try {
        items = el.dataset.zoomList ? (JSON.parse(el.dataset.zoomList) as ZoomItem[]) : [];
      } catch {
        items = [];
      }
      if (!items.length && el.dataset.zoom) {
        items = [{ src: el.dataset.zoom, alt: el.dataset.zoomAlt || '', bg: el.dataset.zoomBg as ZoomItem['bg'] }];
      }
      if (!items.length) return;
      e.preventDefault();
      const index = Math.min(items.length - 1, Math.max(0, Number(el.dataset.zoomIndex) || 0));
      setOpen({ items, index, from: (document.activeElement as HTMLElement) || el });
    };
    // Dasturdan ochish (masalan PDF varaqlagich sahifani yuqori aniqlikda chizib beradi).
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<{ items: ZoomItem[]; index?: number }>).detail;
      if (d?.items?.length) setOpen({ items: d.items, index: d.index ?? 0, from: document.activeElement as HTMLElement });
    };
    document.addEventListener('click', onClick);
    window.addEventListener('sps:zoom', onOpen);
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('sps:zoom', onOpen);
    };
  }, []);

  if (!open) return null;
  return (
    <Panel
      items={open.items}
      start={open.index}
      onClose={() => {
        open.from?.focus?.();
        setOpen(null);
      }}
    />
  );
}
