'use client';

import { useSyncExternalStore } from 'react';

/**
 * Media queries, shared.
 *
 * `useSyncExternalStore` is used instead of `useState` + `useEffect` so that
 * every component asking for the same query subscribes through ONE
 * MediaQueryList (a catalog page mounts 24 product cards) and so the value is
 * read without an extra render pass.
 *
 * Server snapshot is always `false`, which keeps SSR output stable and avoids
 * hydration mismatches.
 */
type Entry = {
  mql: MediaQueryList;
  listeners: Set<() => void>;
  onChange: (event: MediaQueryListEvent) => void;
};

const entries = new Map<string, Entry>();

function getEntry(query: string): Entry | null {
  if (typeof window === 'undefined' || !window.matchMedia) return null;

  let entry = entries.get(query);
  if (!entry) {
    const mql = window.matchMedia(query);
    const listeners = new Set<() => void>();
    const onChange = () => listeners.forEach((listener) => listener());
    mql.addEventListener
      ? mql.addEventListener('change', onChange)
      : (mql as MediaQueryList & { addListener: (cb: () => void) => void }).addListener(onChange);

    entry = { mql, listeners, onChange };
    entries.set(query, entry);
  }
  return entry;
}

function subscribe(query: string, callback: () => void): () => void {
  const entry = getEntry(query);
  if (!entry) return () => {};
  entry.listeners.add(callback);
  return () => entry.listeners.delete(callback);
}

const getServerSnapshot = () => false;

/**
 * SSR-safe media query hook — returns `false` during SSR and the first client
 * render, then the live value.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => subscribe(query, callback),
    () => getEntry(query)?.mql.matches ?? false,
    getServerSnapshot
  );
}

/** True only on devices with a real pointer (mouse/trackpad) that can hover. */
export const HOVER_QUERY = '(hover: hover) and (pointer: fine)';

export const useCanHover = (): boolean => useMediaQuery(HOVER_QUERY);
