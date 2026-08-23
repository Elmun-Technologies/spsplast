'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const DealCountdown: React.FC<{ lang: string }> = ({ lang }) => {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const calc = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) return { h: 0, m: 0, s: 0 };
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      return { h, m, s };
    };

    setTimeLeft(calc());
    const id = setInterval(() => setTimeLeft(calc()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1 text-xs font-bold bg-red-50 text-brand-red px-2.5 py-1 rounded-full border border-red-100">
        <Clock className="w-3.5 h-3.5" />
        <span>--:--:--</span>
      </div>
    );
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5 text-xs font-mono font-bold bg-red-50 text-brand-red px-2.5 py-1 rounded-full border border-red-100">
      <Clock className="w-3.5 h-3.5" />
      <span>
        {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
      </span>
    </div>
  );
};
