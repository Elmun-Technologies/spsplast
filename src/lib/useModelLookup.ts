'use client';

import { useEffect, useState } from 'react';
import type { Model } from '@/lib/catalogCore';

type Lookup = (slug: string) => Model | undefined;

/**
 * Brauzerdagi ro'yxatlar (zayafka, solishtirish) slug'larini modelga aylantirish uchun katalogni
 * KECHIKTIRIB yuklaydi (2026-11-23): `catalog2027` ~15 KB gzip — sahifaning birinchi JS'iga kirmasin.
 * Yuklanguncha `null` (komponent ro'yxat o'rniga hech narsa/yuklanish holatini ko'rsatadi, "bo'sh" emas).
 * `needed` — ro'yxatda slug bor-yo'qligi: bo'sh ro'yxatda katalog yuklanmaydi. Yuklanguncha ro'yxatli forma
 * yuborilmasin (aks holda zayafka `items: []` bilan ketib, ro'yxat tozalanib ketadi).
 */
export function useModelLookup(needed: boolean): Lookup | null {
  const [lookup, setLookup] = useState<Lookup | null>(null);
  useEffect(() => {
    // Ro'yxat bo'sh bo'lsa katalog umuman yuklanmaydi (kerak bo'lganda — slug qo'shilganda — effekt qayta ishlaydi).
    if (!needed || lookup) return;
    let live = true;
    import('@/lib/catalog2027').then((m) => {
      if (live) setLookup(() => m.getModelBySlug);
    });
    return () => {
      live = false;
    };
  }, [needed, lookup]);
  return lookup;
}
