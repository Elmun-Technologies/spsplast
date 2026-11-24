'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * Tayyor mahsulot galereyasi: katta rasm + kichik rasmlar (asosiy surat, rang/tekstura variantlari, obyektdagi surat).
 * Server sahifa tayyor ro'yxatni beradi (src, alt) — katalog ma'lumoti bu yerga kirmaydi.
 */
export function ReadyGallery({ images, label }: { images: { src: string; alt: string; cover?: boolean }[]; label: string }) {
  const [i, setI] = useState(0);
  const cur = images[i] ?? images[0];
  if (!cur) return null;
  return (
    <div className="rd-gal">
      <div className="rd-gal__main">
        <Image src={cur.src} alt={cur.alt} fill sizes="(max-width: 900px) 100vw, 640px" priority style={{ objectFit: cur.cover ? 'cover' : 'contain', padding: cur.cover ? 0 : '6%' }} />
      </div>
      {images.length > 1 ? (
        <div className="rd-gal__thumbs" role="group" aria-label={label}>
          {images.map((x, n) => (
            <button
              key={x.src}
              type="button"
              className={`rd-gal__thumb${n === i ? ' is-on' : ''}`}
              aria-label={x.alt}
              aria-pressed={n === i}
              onClick={() => setI(n)}
            >
              <Image src={x.src} alt="" fill sizes="88px" style={{ objectFit: x.cover ? 'cover' : 'contain', padding: x.cover ? 0 : 5 }} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
