'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Cat = { key: string; label: string; file: string };
type Txt = { pdf: string; prev: string; next: string; page: string; of: string; loading: string; error: string; hint: string };

/** pdf.js sahifa renderi: faqat ko'rinadigan atrofdagi sahifalar chiziladi (PDF Range bilan bo'laklab yuklanadi). */
export function FlipBook({ cats, initial, t }: { cats: Cat[]; initial: string; t: Txt }) {
  const [key, setKey] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [cur, setCur] = useState(0);
  const [total, setTotal] = useState(0);
  const host = useRef<HTMLDivElement>(null);
  const flipRef = useRef<{ next: () => void; prev: () => void } | null>(null);
  const cat = cats.find((c) => c.key === key) ?? cats[0];

  // Statik sahifa: ?c=fasad ni brauzerda o'qiymiz (server searchParams o'qimaydi).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('c');
    setKey(cats.some((c) => c.key === q) ? q : initial);
  }, [cats, initial]);

  useEffect(() => {
    let dead = false;
    let flip: { destroy: () => void } | null = null;
    let doc: { destroy: () => Promise<void> } | null = null;
    const box = host.current;
    if (!box || !key) return;
    setStatus('loading');
    setCur(0);
    setTotal(0);
    box.innerHTML = '';
    (async () => {
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
        const pdf = await pdfjs.getDocument({ url: cat.file }).promise;
        doc = pdf;
        if (dead) return;
        const n = pdf.numPages;
        const vp = (await pdf.getPage(1)).getViewport({ scale: 1 });
        const ratio = vp.width / vp.height;
        const { PageFlip } = await import('page-flip/dist/js/page-flip.module.js');
        if (dead) return;
        const book = document.createElement('div');
        box.appendChild(book);
        const pages: HTMLElement[] = [];
        const canvases: HTMLCanvasElement[] = [];
        for (let i = 0; i < n; i++) {
          const p = document.createElement('div');
          p.className = 'flip__page' + (i === 0 || i === n - 1 ? ' flip__page--cover' : '');
          p.setAttribute('data-density', i === 0 || i === n - 1 ? 'hard' : 'soft');
          const c = document.createElement('canvas');
          p.appendChild(c);
          pages.push(p);
          canvases.push(c);
        }
        const H = 1000;
        const pf = new PageFlip(book, {
          width: Math.round(H * ratio),
          height: H,
          size: 'stretch',
          minWidth: 260,
          maxWidth: 1100,
          minHeight: 190,
          maxHeight: 900,
          maxShadowOpacity: 0.45,
          showCover: true,
          mobileScrollSupport: true,
          flippingTime: 650,
          usePortrait: true,
        });
        pf.loadFromHTML(pages);
        flip = pf;
        const done = new Set<number>();
        const render = async (i: number) => {
          if (i < 0 || i >= n || done.has(i) || dead) return;
          done.add(i);
          try {
            const page = await pdf.getPage(i + 1);
            const cssW = Math.max(900, pages[i].clientWidth || 900);
            const scale = Math.min((cssW * Math.min(window.devicePixelRatio || 1, 2)) / vp.width, 2.2);
            const v = page.getViewport({ scale });
            const c = canvases[i];
            c.width = Math.round(v.width);
            c.height = Math.round(v.height);
            await page.render({ canvasContext: c.getContext('2d')!, viewport: v }).promise;
          } catch {
            done.delete(i);
          }
        };
        const around = (i: number) => {
          for (const k of [i, i + 1, i - 1, i + 2, i + 3, i - 2]) void render(k);
        };
        pf.on('flip', (e) => {
          const i = Number(e.data);
          setCur(i);
          around(i);
        });
        flipRef.current = { next: () => pf.flipNext(), prev: () => pf.flipPrev() };
        setTotal(n);
        setStatus('ready');
        around(0);
      } catch (e) {
        console.error(e);
        if (!dead) setStatus('error');
      }
    })();
    return () => {
      dead = true;
      flipRef.current = null;
      try {
        flip?.destroy();
      } catch {}
      void doc?.destroy();
    };
  }, [cat.file, key]);

  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') flipRef.current?.next();
    else if (e.key === 'ArrowLeft') flipRef.current?.prev();
  }, []);

  return (
    <div className="flip" onKeyDown={onKey}>
      <div className="flip__tabs" role="tablist">
        {cats.map((c) => (
          <button key={c.key} role="tab" aria-selected={c.key === key} className={c.key === key ? 'is-on' : ''} onClick={() => setKey(c.key)}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="flip__stage" tabIndex={0} aria-label={cat.label}>
        {status === 'loading' ? <p className="flip__msg">{t.loading}</p> : null}
        {status === 'error' ? (
          <p className="flip__msg">
            {t.error} <a href={cat.file} download>{t.pdf}</a>
          </p>
        ) : null}
        <div ref={host} className="flip__host" />
      </div>
      <div className="flip__bar">
        <button className="sps-btn sps-btn--outline" onClick={() => flipRef.current?.prev()} aria-label={t.prev} disabled={status !== 'ready'}>←</button>
        <span className="flip__count">{status === 'ready' ? `${t.page} ${cur + 1} ${t.of} ${total}` : ''}</span>
        <button className="sps-btn sps-btn--outline" onClick={() => flipRef.current?.next()} aria-label={t.next} disabled={status !== 'ready'}>→</button>
        <a className="sps-btn sps-btn--primary flip__dl" href={cat.file} download>{t.pdf} ↓</a>
      </div>
      <p className="flip__hint muted">{t.hint}</p>
    </div>
  );
}
