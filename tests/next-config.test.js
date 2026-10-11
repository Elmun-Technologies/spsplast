const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const config = require('../next.config.js');

/**
 * `next.config.js` shartnomasi.
 *
 * Ilgari bu testlar S3/CDN host'lari va Prisma WASM tracing'ini tekshirardi —
 * ikkalasi ham backendsiz arxitekturada olib tashlandi. Endi muhim bo'lgan
 * narsalar: 301 migratsiya xaritasi (HANDOFF 7), xavfsizlik sarlavhalari,
 * statik media keshi va tashqi rasm host'larining umuman yo'qligi.
 *
 * Migratsiya xaritasining batafsil tekshiruvi (manzil-manzil) `tests/seo2027.test.js`
 * da; bu yerda konfiguratsiya darajasi: fayl bitta manba, format to'g'ri,
 * Next'ga ulangan.
 */

const ROOT = path.join(__dirname, '..');
const MAP_PATH = path.join(ROOT, 'scripts', 'redirects-2027.json');

test('1. 301 migratsiya xaritasi bitta faylda va Next’ga ulangan', async () => {
  assert.ok(fs.existsSync(MAP_PATH), 'scripts/redirects-2027.json yo‘q');
  const map = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'));
  const redirects = await config.redirects();

  assert.ok(Array.isArray(map.redirects), 'xarita redirects massivi emas');
  assert.ok(map.redirects.length >= 400, `xarita juda kichik: ${map.redirects.length}`);

  for (const entry of map.redirects) {
    assert.ok(typeof entry.source === 'string' && entry.source.startsWith('/'), `source noto‘g‘ri: ${entry.source}`);
    assert.ok(typeof entry.destination === 'string', `destination yo‘q: ${entry.source}`);
    // Qidiruv tizimlari uchun aynan 301 muhim (308 emas).
    assert.strictEqual(entry.statusCode, 301, `${entry.source}: 301 emas`);
  }

  // Next konfiguratsiyasi xaritani to‘liq oladi (+1 qoida: www → apex).
  assert.strictEqual(redirects.length, map.redirects.length + 1,
    'redirects xaritasi Next’ga to‘liq ulanmagan');

  // Generator va manba fayl saqlanadi: xaritani qayta yig‘ish mumkin bo‘lishi kerak.
  assert.ok(fs.existsSync(path.join(ROOT, 'scripts', 'extract', 'build_redirects_2027.py')),
    'xarita generatori o‘chirilgan');
  assert.ok(fs.existsSync(path.join(ROOT, 'docs', 'legacy', 'catalog-2026.json')),
    'eski katalog manbasi (docs/legacy/catalog-2026.json) yo‘q — xaritani qayta yig‘ib bo‘lmaydi');

  // Sinov uchun bir necha aniq juftlik (batafsil ro‘yxat seo2027.test.js da).
  const bySource = Object.fromEntries(redirects.map((entry) => [entry.source, entry.destination]));
  assert.strictEqual(bySource['/uz/product/g001-floriya'], '/uz/catalog/paving/15-floriya');
  assert.strictEqual(bySource['/uz/catalog/bruschatka-trotuar-qoliplari'], '/uz/catalog/paving');
  assert.strictEqual(bySource['/uz/about'], '/uz/production');
  assert.strictEqual(bySource['/produkciya'], '/ru/catalog');
});

test('2. www → apex yo‘naltirish saqlanadi', async () => {
  const redirects = await config.redirects();
  const canonical = redirects.find((entry) => Array.isArray(entry.has) && entry.has.some((h) => h.value === 'www.sps.uz'));

  assert.ok(canonical, 'www.sps.uz uchun redirect yo‘q');
  assert.strictEqual(canonical.destination, 'https://sps.uz/:path*');
  assert.strictEqual(canonical.statusCode, 301);
});

test('3. Tashqi rasm host‘lari yo‘q — butun media public/ ichida', () => {
  // Barcha rasmlar repozitoriyda, shuning uchun `remotePatterns` umuman yo‘q:
  // ochiq rasm-proksisi bo‘lib qolish xavfi ham yo‘qoladi.
  assert.strictEqual(config.images.remotePatterns, undefined,
    'remotePatterns olib tashlanishi kerak (tashqi rasm ishlatilmaydi)');
  assert.deepStrictEqual(config.images.formats, ['image/avif', 'image/webp']);

  const serialized = JSON.stringify({ images: config.images });
  for (const host of ['unsplash', 'amazonaws', 'cloudfront', 'r2.dev']) {
    assert.ok(!serialized.includes(host), `konfiguratsiyada tashqi host qoldi: ${host}`);
  }

  // Eski (2026) foto papka o‘chirilgan, yangi WebP to‘plam joyida.
  assert.ok(!fs.existsSync(path.join(ROOT, 'public', 'catalog', '2026')),
    'public/catalog/2026 hali ham mavjud (18 MB eski foto)');
  const webp2027 = fs.readdirSync(path.join(ROOT, 'public', 'catalog', '2027'))
    .filter((f) => f.endsWith('.webp'));
  assert.ok(webp2027.length >= 100, `public/catalog/2027 da faqat ${webp2027.length} webp bor`);

  // PDF katalog (header’dagi havola) saqlanadi.
  assert.ok(fs.existsSync(path.join(ROOT, 'public', 'catalog', 'pdf')),
    'public/catalog/pdf o‘chirilgan — katalog PDF havolasi buziladi');
});

test('4. Prisma/S3 konfiguratsiyasi qolmagan', () => {
  assert.strictEqual(config.outputFileTracingIncludes, undefined, 'Prisma tracing bloki olib tashlanishi kerak');
  assert.strictEqual(config.output, undefined, 'standalone (Docker) rejimi olib tashlanishi kerak');
  assert.strictEqual(config.poweredByHeader, false, 'X-Powered-Header yopiq bo‘lishi kerak');
});

test('5. Xavfsizlik sarlavhalari saqlanadi', async () => {
  const headerGroups = await config.headers();
  const globalHeaders = Object.fromEntries(headerGroups[0].headers.map((h) => [h.key, h.value]));

  assert.strictEqual(globalHeaders['X-Content-Type-Options'], 'nosniff');
  assert.strictEqual(globalHeaders['Referrer-Policy'], 'strict-origin-when-cross-origin');
  assert.strictEqual(globalHeaders['Permissions-Policy'], 'camera=(), microphone=(), geolocation=(), payment=()');
  assert.ok(globalHeaders['Strict-Transport-Security'].includes('max-age='));

  // Statik media uzoq muddat keshlanadi (suratlar deploy’siz o‘zgarmaydi).
  const bySource = Object.fromEntries(headerGroups.map((g) => [g.source, g.headers]));
  for (const source of ['/fonts/(.*)', '/catalog/(.*)', '/images/(.*)', '/icons/(.*)']) {
    assert.ok(bySource[source], `${source} uchun kesh sarlavhasi yo‘q`);
  }
  assert.ok(
    bySource['/fonts/(.*)'].some((h) => h.value.includes('immutable')),
    'fontlar immutable keshlanmasligi kerak emas'
  );

  // O‘chirilgan fayllar uchun qoida qolmasligi kerak.
  assert.strictEqual(bySource['/manifest.json'], undefined, 'manifest.json o‘chirilgan, qoidasi qolgan');
});

test('6. sitemap rewrite saqlanadi', async () => {
  const rewrites = await config.rewrites();
  assert.ok(
    rewrites.some((entry) => entry.source === '/sitemap.xml' && entry.destination === '/sitemap'),
    '/sitemap.xml → /sitemap rewrite yo‘q'
  );
});
