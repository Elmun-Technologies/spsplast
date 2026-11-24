'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useUi } from '@/components/site/UiProvider';

export type ZoomItem = { src: string; alt: string; bg?: 'studio' | 'deep' };

const MAX = 5;
const STEP = 2.5;
type View = { s: number; x: number; y: number };
const HOME: View = { s: 1, x: 0, y: 0 };

/**
 * To'liq ekranli rasm ko'ruvchi: bosish / ikki marta bosish — kattalashtirish, tortish — surish,
 * g'ildirak yoki ikki barmoq — masshtab, ← → — keyingi rasm, Esc — yopish.
 */
export default function ZoomPanel({ items, start, onClose }: { items: ZoomItem[]; start: number; onClose: () => void }) {
  const t = useUi().a11y;
  const [i, setI] = useState(start);
  const [v, setV] = useState<View>(HOME);
  const [drag, setDrag] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const view = useRef<View>(HOME);
  const ptr = useRef(new Map<number, { x: number; y: number }>());
  const gest = useRef<{ moved: number; dist: number; s: number; x0: number; y0: number; t: number } | null>(null);
  const item = items[i] ?? items[0];
  const many = items.length > 1;

  /** Rasm ekrandan chiqib ketmasin: surish chegarasi masshtabga bog'liq. */
  const apply = useCallback((n: View) => {
    const b = box.current;
    const im = img.current;
    const s = Math.min(MAX, Math.max(1, n.s));
    let { x, y } = n;
    if (b && im) {
      const mx = Math.max(0, (im.offsetWidth * s - b.clientWidth) / 2);
      const my = Math.max(0, (im.offsetHeight * s - b.clientHeight) / 2);
      x = Math.min(mx, Math.max(-mx, x));
      y = Math.min(my, Math.max(-my, y));
    }
    if (s === 1) x = y = 0;
    view.current = { s, x, y };
    setV(view.current);
  }, []);

  /** (px, py) nuqta joyida qolgan holda masshtabni o'zgartirish. Koordinata — quti markazidan. */
  const zoomAt = useCallback(
    (s2: number, px: number, py: number) => {
      const c = view.current;
      const s = Math.min(MAX, Math.max(1, s2));
      const k = s / c.s;
      apply({ s, x: px - (px - c.x) * k, y: py - (py - c.y) * k });
    },
    [apply],
  );

  const go = useCallback(
    (d: number) => {
      if (!many) return;
      setI((n) => (n + d + items.length) % items.length);
      apply(HOME);
    },
    [many, items.length, apply],
  );

  const center = (e: { clientX: number; clientY: number }) => {
    const r = box.current!.getBoundingClientRect();
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    root.current?.querySelector<HTMLElement>('[data-zoom-close]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === '+' || e.key === '=') zoomAt(view.current.s * 1.5, 0, 0);
      else if (e.key === '-') zoomAt(view.current.s / 1.5, 0, 0);
      else if (e.key === 'Tab') {
        // Fokus oynadan chiqmasin
        const f = Array.from(root.current?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? []);
        if (!f.length) return;
        const at = f.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        e.stopPropagation();
        f[(at + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey, true);
    };
  }, [onClose, go, zoomAt]);

  // G'ildirak: React `onWheel` passiv — preventDefault ishlamaydi, shuning uchun to'g'ridan-to'g'ri tinglovchi.
  useEffect(() => {
    const b = box.current;
    if (!b) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = center(e);
      zoomAt(view.current.s * (e.deltaY < 0 ? 1.25 : 0.8), p.x, p.y);
    };
    b.addEventListener('wheel', onWheel, { passive: false });
    return () => b.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const onDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    ptr.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...ptr.current.values()];
    const dist = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    gest.current = { moved: gest.current && pts.length > 1 ? 99 : 0, dist, s: view.current.s, x0: e.clientX, y0: e.clientY, t: Date.now() };
    setDrag(true);
  };
  const onMove = (e: React.PointerEvent) => {
    const last = ptr.current.get(e.pointerId);
    const g = gest.current;
    if (!last || !g) return;
    ptr.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...ptr.current.values()];
    if (pts.length > 1) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const mid = center({ clientX: (pts[0].x + pts[1].x) / 2, clientY: (pts[0].y + pts[1].y) / 2 });
      if (g.dist > 0) zoomAt(g.s * (d / g.dist), mid.x, mid.y);
      g.moved = 99;
      return;
    }
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    g.moved += Math.abs(dx) + Math.abs(dy);
    if (view.current.s > 1) apply({ s: view.current.s, x: view.current.x + dx, y: view.current.y + dy });
  };
  const onUp = (e: React.PointerEvent) => {
    const g = gest.current;
    ptr.current.delete(e.pointerId);
    if (ptr.current.size) return;
    setDrag(false);
    gest.current = null;
    if (!g) return;
    const dx = e.clientX - g.x0;
    if (g.moved < 8 && Date.now() - g.t < 500) {
      // Bosish: 1× -> shu nuqtada kattalashtirish, kattalashgan bo'lsa -> asl holat.
      if (view.current.s > 1) apply(HOME);
      else {
        const p = center(e);
        zoomAt(STEP, p.x, p.y);
      }
    } else if (view.current.s === 1 && many && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - g.y0) * 1.5) {
      go(dx < 0 ? 1 : -1); // yon tomonga surish — keyingi/oldingi rasm
    }
  };

  const zoomed = v.s > 1;
  return (
    <div ref={root} className={`zm${item.bg ? ` zm--${item.bg}` : ''}`} role="dialog" aria-modal="true" aria-label={item.alt || t.zoom}>
      <div
        ref={box}
        className={`zm__box${zoomed ? ' is-zoomed' : ''}${drag ? ' is-drag' : ''}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {/* Asl fayl (optimizatsiyasiz) — kattalashtirganda eng tiniq nusxa kerak. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={img}
          key={item.src}
          src={item.src}
          alt={item.alt}
          draggable={false}
          onLoad={() => apply(view.current)}
          style={{ transform: `translate3d(${v.x}px, ${v.y}px, 0) scale(${v.s})` }}
        />
      </div>
      <div className="zm__top">
        <span className="zm__cap">
          {many ? <b>{`${i + 1} / ${items.length}`}</b> : null}
          {item.alt}
        </span>
        <button type="button" className="zm__btn" data-zoom-close aria-label={t.close} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        </button>
      </div>
      {many ? (
        <>
          <button type="button" className="zm__btn zm__nav zm__nav--prev" aria-label={t.zoomPrev} onClick={() => go(-1)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <button type="button" className="zm__btn zm__nav zm__nav--next" aria-label={t.zoomNext} onClick={() => go(1)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      ) : null}
      <div className="zm__bar">
        <button type="button" className="zm__btn" aria-label={t.zoomOut} disabled={!zoomed} onClick={() => zoomAt(v.s / 1.6, 0, 0)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>
        <span className="zm__pct" aria-live="polite">{`${Math.round(v.s * 100)}%`}</span>
        <button type="button" className="zm__btn" aria-label={t.zoomIn} disabled={v.s >= MAX} onClick={() => zoomAt(v.s * 1.6, 0, 0)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <path d="M5 12h14M12 5v14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
