const test = require('node:test');
const assert = require('node:assert/strict');

const config = require('../next.config.js');

/**
 * `next.config.js` shartnomasi.
 *
 * Ilgari bu testlar S3/CDN host'lari va Prisma WASM tracing'ini tekshirardi —
 * ikkalasi ham backendsiz arxitekturada olib tashlandi. Endi muhim bo'lgan
 * narsa: eski `sps.uz` manzillarining 301 xaritasi saqlanishi va remote
 * rasm host'lari minimal bo'lishi (ochiq proxy bo'lib qolmasligi).
 */

test('1. Eski sps.uz manzillari 301 bilan yangi sahifalarga o‘tadi', async () => {
  const redirects = await config.redirects();

  const bySource = Object.fromEntries(redirects.map((entry) => [entry.source, entry]));

  const expected = {
    '/about': '/ru/about',
    '/produkciya': '/ru/catalog',
    '/formi': '/ru/catalog',
    '/plitki': '/ru/catalog',
    '/uslugi': '/ru/production',
    '/doc': '/ru/delivery-payment',
    '/otzyvy-o-nas': '/ru/about',
    '/fotogalereya': '/ru/projects',
    '/novosti': '/ru/blog',
    '/napishite-nam': '/ru/contact',
    '/kontakty': '/ru/contact',
    '/search': '/ru/search',
    '/user': '/ru',
  };

  for (const [source, destination] of Object.entries(expected)) {
    assert.ok(bySource[source], `redirect yo‘q: ${source}`);
    assert.strictEqual(bySource[source].destination, destination, `${source} noto‘g‘ri manzilga ketadi`);
    // Qidiruv tizimlari uchun aynan 301 muhim (308 emas).
    assert.strictEqual(bySource[source].statusCode, 301, `${source} 301 emas`);
  }
});

test('2. www → apex yo‘naltirish saqlanadi', async () => {
  const redirects = await config.redirects();
  const canonical = redirects.find((entry) => Array.isArray(entry.has) && entry.has.some((h) => h.value === 'www.sps.uz'));

  assert.ok(canonical, 'www.sps.uz uchun redirect yo‘q');
  assert.strictEqual(canonical.destination, 'https://sps.uz/:path*');
  assert.strictEqual(canonical.statusCode, 301);
});

test('3. Remote rasm host‘lari minimal (ochiq proxy yo‘q)', () => {
  const hostnames = config.images.remotePatterns.map((pattern) => pattern.hostname);

  // Barcha media endi public/ ichida — tashqi CDN host'lari qolmasligi kerak.
  assert.ok(!hostnames.includes('images.unsplash.com'), 'unsplash manbasi olib tashlanishi kerak');
  assert.ok(!hostnames.includes('**.s3.amazonaws.com'), 'S3 manbasi olib tashlanishi kerak');
  assert.ok(!hostnames.some((host) => host.includes('r2')), 'R2 manbasi olib tashlanishi kerak');
  // O‘z domenimiz (kelajakda CDN uchun) ruxsat etilgan.
  assert.ok(hostnames.includes('sps.uz'));
});

test('4. Prisma/S3 konfiguratsiyasi qolmagan', () => {
  assert.strictEqual(config.outputFileTracingIncludes, undefined, 'Prisma tracing bloki olib tashlanishi kerak');
  assert.strictEqual(config.output, undefined, 'standalone (Docker) rejimi olib tashlanishi kerak');
});

test('5. Xavfsizlik sarlavhalari saqlanadi', async () => {
  const headerGroups = await config.headers();
  const globalHeaders = Object.fromEntries(headerGroups[0].headers.map((h) => [h.key, h.value]));

  assert.strictEqual(globalHeaders['X-Content-Type-Options'], 'nosniff');
  assert.strictEqual(globalHeaders['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.ok(globalHeaders['Strict-Transport-Security'].includes('max-age='));
});

test('6. sitemap rewrite saqlanadi', async () => {
  const rewrites = await config.rewrites();
  assert.ok(
    rewrites.some((entry) => entry.source === '/sitemap.xml' && entry.destination === '/sitemap'),
    '/sitemap.xml → /sitemap rewrite yo‘q'
  );
});
