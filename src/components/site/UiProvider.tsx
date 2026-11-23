'use client';

import { createContext, useContext } from 'react';
import type { UiDictionary } from '@/lib/ui';

/**
 * Joriy tilning mijoz komponentlariga kerakli UI matnlari (2026-11-23). `[lang]/layout.tsx` (server) bir marta
 * beradi. Mijozda `getUi(lang)` chaqirilsa, `ui/{uz,ru,en}.ts` uchalasi ham har sahifa JS'iga tushadi (~13 KB gzip) —
 * shuning uchun `'use client'` fayllarda `getUi`/`pluralModels` emas, `useUi()` ishlating.
 */
export type ClientUi = Pick<UiDictionary, 'catalog' | 'alt' | 'a11y' | 'header' | 'models'>;

const UiContext = createContext<ClientUi | null>(null);

export function UiProvider({ value, children }: { value: ClientUi; children: React.ReactNode }) {
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): ClientUi {
  const ui = useContext(UiContext);
  if (!ui) throw new Error('useUi(): UiProvider topilmadi ([lang]/layout.tsx ichida bo‘lishi kerak)');
  return ui;
}
