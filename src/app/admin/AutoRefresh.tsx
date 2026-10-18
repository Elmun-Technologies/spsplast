'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Admin sahifasini har N soniyada server ma'lumoti bilan yangilaydi (yangi zayafkalar,
 * tashriflar). Tab ko'rinmasa yoki foydalanuvchi forma maydonida yozayotgan bo'lsa — kutadi.
 */
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const el = document.activeElement;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (document.querySelector('.adm-pform, .adm-secform, [data-no-refresh]')) return;
      router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds]);
  return null;
}
