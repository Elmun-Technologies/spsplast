'use client';

/**
 * Mijoz holati (HANDOFF 5): `sps_request` (zayafka ro'yxati) va `sps_compare`
 * (solishtirish, maks 4). Server yo'q — localStorage; yopiq bo'lsa xotirada.
 */
import { useSyncExternalStore } from 'react';
import {
  trackAddToCompare,
  trackAddToRequest,
  trackRemoveFromCompare,
  trackRemoveFromRequest,
} from '@/lib/analytics';

export type RequestItem = { slug: string; code: string | null; name: string; m2?: number };

type Listeners = Set<() => void>;

/**
 * `get()` — `useSyncExternalStore` ning getSnapshot'i: ma'lumot o'zgarmaguncha
 * **aynan bir xil massiv** qaytarishi shart. Har chaqiruvda `JSON.parse` yangi
 * massiv bersa, React har renderda "o'zgardi" deb qayta chizadi va #185
 * (Maximum update depth exceeded) bilan yiqiladi — ro'yxatda bitta model
 * bo'lishi bilan header orqali butun sayt ochilmay qolardi. Shuning uchun
 * parse natijasi xom qator o'zgarmaguncha keshlanadi.
 */
export function createListStore<T>(key: string, fallback: T[]) {
  let memory: T[] | null = null;
  const listeners: Listeners = new Set();
  // `undefined` — hali o'qilmagan; `null` — localStorage'da qiymat yo'q.
  let cachedRaw: string | null | undefined;
  let cached: T[] = fallback;

  const read = (): T[] => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === cachedRaw) return cached;
      cachedRaw = raw;
      if (!raw) {
        cached = memory ?? fallback;
      } else {
        const parsed = JSON.parse(raw);
        cached = Array.isArray(parsed) ? (parsed as T[]) : fallback;
      }
      return cached;
    } catch {
      return memory ?? fallback;
    }
  };

  const write = (next: T[]) => {
    memory = next;
    // localStorage yozuvi muvaffaqiyatsiz bo'lsa (kvota), xom qator o'zgarmaydi —
    // kesh tozalanmasa eski ro'yxat qaytib qolardi.
    cachedRaw = undefined;
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // localStorage yopiq: xotiradagi nusxa ishlashda davom etadi
    }
    listeners.forEach((fn) => fn());
  };

  return {
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    get: () => read(),
    set: write,
  };
}

const requestStore = createListStore<RequestItem>('sps_request', []);
const compareStore = createListStore<string>('sps_compare', []);

const EMPTY_REQUEST: RequestItem[] = [];
const EMPTY_COMPARE: string[] = [];

export function useRequestList() {
  const items = useSyncExternalStore(requestStore.subscribe, requestStore.get, () => EMPTY_REQUEST);
  return {
    items,
    has: (slug: string) => items.some((i) => i.slug === slug),
    add: (item: RequestItem) => {
      if (requestStore.get().some((i) => i.slug === item.slug)) return;
      requestStore.set([...requestStore.get(), item]);
      trackAddToRequest(item);
    },
    remove: (slug: string) => {
      requestStore.set(requestStore.get().filter((i) => i.slug !== slug));
      trackRemoveFromRequest(slug);
    },
    update: (slug: string, m2: number) =>
      requestStore.set(requestStore.get().map((i) => (i.slug === slug ? { ...i, m2 } : i))),
    clear: () => requestStore.set([]),
  };
}

export const COMPARE_MAX = 4;

export function useCompareList() {
  const slugs = useSyncExternalStore(compareStore.subscribe, compareStore.get, () => EMPTY_COMPARE);
  return {
    slugs,
    count: slugs.length,
    has: (slug: string) => slugs.includes(slug),
    toggle: (slug: string) => {
      const current = compareStore.get();
      if (current.includes(slug)) {
        const next = current.filter((s) => s !== slug);
        compareStore.set(next);
        trackRemoveFromCompare(slug, next.length);
      } else if (current.length < COMPARE_MAX) {
        const next = [...current, slug];
        compareStore.set(next);
        trackAddToCompare(slug, next.length);
      }
    },
    clear: () => compareStore.set([]),
  };
}
