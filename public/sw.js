/**
 * Legacy endpoint kept only to heal old installations.
 *
 * The site is a regular website again — the PWA (cache-first offline worker,
 * standalone display) has been removed. Browsers that still have the old
 * `/sw.js` registration fetch this file on update, install it, and it then
 * deletes every cache the old worker created and unregisters itself. After
 * that, nothing is intercepted and pages always come fresh from the server.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {
        /* ignore */
      }
      try {
        await self.registration.unregister();
      } catch (e) {
        /* ignore */
      }
      try {
        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        for (const client of clients) {
          // Reload healed tabs so they pick up fresh HTML/JS immediately.
          if (client.navigate) await client.navigate(client.url);
        }
      } catch (e) {
        /* ignore */
      }
    })()
  );
});
