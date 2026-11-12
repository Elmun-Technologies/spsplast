'use client';

import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { MODEL3D } from './model3d.generated';

type Entry = { id: string; have: string[]; poster: boolean };
const MAP: Record<string, Entry> = MODEL3D;

const L: Record<Locale, { h: string; qolip: string; mahsulot: string; terilgan: string; hint: string }> = {
  uz: { h: '3D ko‘rinish', qolip: 'Qolip', mahsulot: 'Mahsulot', terilgan: 'Terilgan', hint: 'Aylantirish — barmoq bilan, yaqinlashtirish — ikki barmoq bilan' },
  ru: { h: '3D-просмотр', qolip: 'Форма', mahsulot: 'Изделие', terilgan: 'Укладка', hint: 'Вращайте пальцем, приближайте щипком' },
  en: { h: '3D view', qolip: 'Mold', mahsulot: 'Product', terilgan: 'Laid', hint: 'Drag to rotate, pinch to zoom' },
};

export function hasModel3D(slug: string) {
  return Boolean(MAP[slug]);
}

/**
 * Mahsulotning 3D ko'rinishi (qolip / mahsulot / terilgan). `<model-viewer>` skripti
 * `/3d/assets/` dan faqat shu blok ekranga yaqinlashganda yuklanadi.
 */
export function Model3D({ slug, lang }: { slug: string; lang: Locale }) {
  const e = MAP[slug];
  const t = L[lang];
  const [on, setOn] = useState(false);
  const [tab, setTab] = useState(e?.have[0] ?? 'qolip');
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el || !e) return;
    const start = () => {
      if (!customElements.get('model-viewer')) {
        const s = document.createElement('script');
        s.type = 'module';
        s.src = '/3d/assets/model-viewer.min.js';
        document.head.appendChild(s);
      }
      setOn(true);
    };
    if (!('IntersectionObserver' in window)) return start();
    const io = new IntersectionObserver((en) => en[0].isIntersecting && (start(), io.disconnect()), { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [e]);

  if (!e) return null;
  const base = `/3d/${e.id}`;
  const MV = 'model-viewer' as unknown as React.ElementType;

  return (
    <section className="pd-sec" id="3d" aria-label={t.h}>
      <div className="wrap" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h2 style={{ margin: 0 }}>{t.h}</h2>
        <div className="tabs" role="tablist">
          {e.have.map((k) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
              {t[k as 'qolip' | 'mahsulot' | 'terilgan']}
            </button>
          ))}
        </div>
        <div ref={box} style={{ height: 'min(66vh, 520px)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-alt, #f3f3f1)' }}>
          {on && (
            <MV
              key={tab}
              src={`${base}/${tab}.glb`}
              poster={tab === 'qolip' && e.poster ? `${base}/qolip_tik.jpg` : undefined}
              camera-controls=""
              auto-rotate=""
              touch-action="pan-y"
              shadow-intensity="1"
              camera-orbit="25deg 62deg 72%"
              environment-image="neutral"
              interaction-prompt="auto"
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t.hint}</p>
      </div>
    </section>
  );
}
