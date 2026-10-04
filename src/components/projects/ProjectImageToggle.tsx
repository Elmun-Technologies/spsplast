'use client';

import React, { useState } from 'react';
import Image from 'next/image';

/**
 * Loyiha kartasidagi "oldin / keyin" almashtirgichi.
 *
 * `public/media/projects/<slug>-before.jpg` — obyektning muhiti (qolip
 * qo'llanilgan joy), `-after.jpg` — tayyor beton mahsulot. Ikkala rasm
 * `scripts/build-media.py` tomonidan bitta juftlashgan master kadrdan
 * (chap/o'ng yarmi) yasaladi.
 *
 * Nega slayder emas, tugma: loyiha kartasi kichik, slayder uchun joy yo'q va
 * mobil brauzerda surish sahifa skrollini buzadi. Tugma esa bir bosishda
 * ishlaydi.
 */

interface ProjectImageToggleProps {
  beforeImage: string;
  afterImage: string;
  alt: string;
  beforeLabel: string;
  afterLabel: string;
  className?: string;
}

export const ProjectImageToggle: React.FC<ProjectImageToggleProps> = ({
  beforeImage,
  afterImage,
  alt,
  beforeLabel,
  afterLabel,
  className,
}) => {
  const [showAfter, setShowAfter] = useState(true);

  return (
    <div className={`relative ${className || ''}`}>
      <div className="relative aspect-[4/3] bg-surface-soft border-b border-line">
        <Image
          src={showAfter ? afterImage : beforeImage}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />
      </div>

      {/* Oldin / keyin almashtirgichi */}
      <div className="absolute bottom-3 left-3 inline-flex rounded-full bg-black/70 backdrop-blur-sm p-0.5">
        <button
          type="button"
          onClick={() => setShowAfter(false)}
          aria-pressed={!showAfter}
          className={`px-3 py-1 rounded-full text-[12px] font-bold transition-colors ${
            !showAfter ? 'bg-surface text-ink' : 'text-white/80 hover:text-white'
          }`}
        >
          {beforeLabel}
        </button>
        <button
          type="button"
          onClick={() => setShowAfter(true)}
          aria-pressed={showAfter}
          className={`px-3 py-1 rounded-full text-[12px] font-bold transition-colors ${
            showAfter ? 'bg-brand-red text-white' : 'text-white/80 hover:text-white'
          }`}
        >
          {afterLabel}
        </button>
      </div>
    </div>
  );
};
