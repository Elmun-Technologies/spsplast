/**
 * PWA / service-worker cleanup.
 *
 * This site used to install itself as a web-app: a cache-first service worker
 * (`/sw.js`) plus a `display: standalone` manifest. That made links open in a
 * separate app window instead of the browser and — because the worker served
 * everything cache-first — froze visitors on stale HTML/JS after deploys until
 * the site looked "completely broken".
 *
 * The PWA has been removed (it is a regular website again). This component
 * heals existing visitors: it unregisters every service worker and clears the
 * caches the old worker created, so the next navigation loads fresh content
 * straight from the server/CDN.
 */
'use client';

import { useEffect } from 'react';

export const SWCleanup: React.FC = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    (async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      } catch {
        /* ignore */
      }
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        /* ignore */
      }
    })();
  }, []);

  return null;
};
