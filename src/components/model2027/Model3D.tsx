'use client';

import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n';
import { MODEL3D } from './model3d.generated';
import { MODEL3D_PHOTOS } from './model3d-photos.generated';
import { TERING_HOLES } from './tering-holes.generated';
import { TeringPanel } from './TeringPanel';

type Entry = { id: string; have: string[]; poster: boolean };
const MAP: Record<string, Entry> = MODEL3D;

const L: Record<Locale, { h: string; qolip: string; mahsulot: string; terilgan: string; sahna: string; tering: string; hint: string }> = {
  uz: { h: '3D ko‘rinish', qolip: 'Qolip', mahsulot: 'Mahsulot', terilgan: 'Terilgan', sahna: 'Obyektda', tering: 'Terib ko‘ring', hint: 'Aylantirish — barmoq bilan, yaqinlashtirish — ikki barmoq bilan' },
  ru: { h: '3D-просмотр', qolip: 'Форма', mahsulot: 'Изделие', terilgan: 'Укладка', sahna: 'На объекте', tering: 'Соберите сами', hint: 'Вращайте пальцем, приближайте щипком' },
  en: { h: '3D view', qolip: 'Mold', mahsulot: 'Product', terilgan: 'Laid', sahna: 'On site', tering: 'Build it yourself', hint: 'Drag to rotate, pinch to zoom' },
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
  const photos = e ? MODEL3D_PHOTOS[e.id] ?? [] : [];
  const hole = e && e.id in TERING_HOLES ? TERING_HOLES[e.id] : undefined;
  const canTering = Boolean(e && /^t\d+$/.test(e.id) && e.have.includes('terilgan') && hole !== undefined);
  const tabs = e ? [...e.have, ...(photos.length ? ['sahna'] : []), ...(canTering ? ['tering'] : [])] : [];
  const [tab, setTab] = useState(tabs[0] ?? 'qolip');
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
          {tabs.map((k) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
              {t[k as 'qolip' | 'mahsulot' | 'terilgan' | 'sahna' | 'tering']}
            </button>
          ))}
        </div>
        <div ref={box} style={{ marginBlock: 'calc(var(--space-3) / -2)' }} />
        {tab === 'tering' && canTering && hole !== undefined ? (
          <TeringPanel id={e.id} hole={hole} lang={lang} />
        ) : tab === 'sahna' ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {photos.map((f) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={f} src={`${base}/${f}`} alt={t.sahna} loading="lazy" style={{ width: '100%', borderRadius: 10, display: 'block' }} />
            ))}
          </div>
        ) : (
        <div style={{ height: 'min(66vh, 520px)', borderRadius: 12, overflow: 'hidden', background: 'radial-gradient(#3d3b38, #121314)' }}>
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
        )}
        {tab !== 'sahna' && tab !== 'tering' && <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t.hint}</p>}
      </div>
    </section>
  );
}
