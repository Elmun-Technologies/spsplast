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

function createListStore<T>(key: string, fallback: T[]) {
  let memory: T[] | null = null;
  const listeners: Listeners = new Set();

  const read = (): T[] => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return memory ?? fallback;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : fallback;
    } catch {
      return memory ?? fallback;
    }
  };

  const write = (next: T[]) => {
    memory = next;
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
