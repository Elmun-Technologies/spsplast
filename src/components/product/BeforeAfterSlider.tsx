'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { MoveHorizontal, ImageOff } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = 'QOLIP',
  afterLabel = 'NATIJASI',
  className,
}) => {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [beforeErr, setBeforeErr] = useState(false);
  const [afterErr, setAfterErr] = useState(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setPosition(pct);
  };

  const onMouseDown = () => setIsDragging(true);
  const onMouseUp = () => setIsDragging(false);
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const up = () => setIsDragging(false);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchend', up);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-gray-200 bg-[#F8F9FA] select-none touch-none ${className || ''}`}
      onMouseMove={onMouseMove}
      onMouseDown={onMouseDown}
      onTouchMove={onTouchMove}
      onTouchStart={() => setIsDragging(true)}
    >
      {/* After (full) */}
      <div className="absolute inset-0">
        {!afterErr ? (
          <Image src={afterImage} alt={afterLabel} fill className="object-contain p-6" onError={() => setAfterErr(true)} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <ImageOff className="w-8 h-8 mb-1" />
            <span className="text-xs font-bold">NATIJА</span>
          </div>
        )}
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-brand-red text-white text-xs font-bold shadow-sm">
          {afterLabel}
        </span>
      </div>

      {/* Before (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <div className="absolute inset-0 w-full h-full" style={{ width: `${(100 / position) * 100}%` }}>
          {!beforeErr ? (
            <Image src={beforeImage} alt={beforeLabel} fill className="object-contain p-6 bg-white" onError={() => setBeforeErr(true)} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-white">
              <ImageOff className="w-8 h-8 mb-1" />
              <span className="text-xs font-bold">QOLIP</span>
            </div>
          )}
        </div>
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-gray-900 text-white text-xs font-bold shadow-sm">
          {beforeLabel}
        </span>
      </div>

      {/* Slider line + handle */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.1)]" style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border-2 border-brand-red shadow-lg flex items-center justify-center text-brand-red cursor-ew-resize hover:scale-110 transition-transform">
          <MoveHorizontal className="w-5 h-5" />
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 text-white text-xs font-medium backdrop-blur-sm pointer-events-none">
        Chapga-o‘ngga suring
      </div>
    </div>
  );
};
