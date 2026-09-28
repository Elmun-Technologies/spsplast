const test = require('node:test');
const assert = require('node:assert/strict');

function loadNextConfigWithStorageUrl(storageUrl) {
  const previousStorageUrl = process.env.S3_PUBLIC_URL;
  const configPath = require.resolve('../next.config.js');

  if (storageUrl === undefined) {
    delete process.env.S3_PUBLIC_URL;
  } else {
    process.env.S3_PUBLIC_URL = storageUrl;
  }
  delete require.cache[configPath];

  try {
    return require('../next.config.js');
  } finally {
    if (previousStorageUrl === undefined) {
      delete process.env.S3_PUBLIC_URL;
    } else {
      process.env.S3_PUBLIC_URL = previousStorageUrl;
    }
    delete require.cache[configPath];
  }
}

test('Next Image allows the documented SPS Plast media CDN host', () => {
  const config = loadNextConfigWithStorageUrl('https://media.spsplast.uz');
  const mediaPattern = config.images.remotePatterns.find(
    (pattern) => pattern.hostname === 'media.spsplast.uz'
  );

  assert.deepEqual(mediaPattern, {
    protocol: 'https',
    hostname: 'media.spsplast.uz',
    pathname: '/**',
  });
});

test('Next Image allows a custom S3_PUBLIC_URL host and base path', () => {
  const config = loadNextConfigWithStorageUrl('https://cdn.example.com/product-images');

  assert.ok(config.images.remotePatterns.some((pattern) =>
    pattern.protocol === 'https' &&
    pattern.hostname === 'cdn.example.com' &&
    pattern.pathname === '/product-images/**'
  ));
});

test('Output file tracing explicitly includes the Prisma WASM query compiler', () => {
  // Regression guard for the "product card / catalog throws 'Xatolik yuz
  // berdi' on Vercel" outage.
  //
  // The Rust-free Prisma client (`engineType = "client"`) loads
  // `query_compiler_bg.wasm` at request time via
  // `fs.readFileSync(path.join(config.dirname, 'query_compiler_bg.wasm'))`
  // (see node_modules/.prisma/client/index.js). That path is built from a
  // runtime variable, so Next's output file tracing cannot see it and drops
  // the .wasm file from every serverless function bundle that imports
  // `@/lib/db` — which is every route that touches the catalog. The page
  // still builds fine locally (full node_modules is on disk), so this only
  // ever broke in the deployed (traced) bundle, which is why it kept
  // silently coming back. `outputFileTracingIncludes` is the only way to
  // force Next to keep the file.
  const config = loadNextConfigWithStorageUrl(undefined);
  const includesForAllRoutes = config.outputFileTracingIncludes?.['/*'] || [];

  assert.ok(
    includesForAllRoutes.some((pattern) => pattern.includes('.prisma/client')),
    'next.config.js must force-include node_modules/.prisma/client/** via outputFileTracingIncludes'
  );
});

test('The production build actually traces query_compiler_bg.wasm for a database-backed page', () => {
  const fs = require('node:fs');
  const path = require('node:path');

  const traceFile = path.join(
    __dirname,
    '..',
    '.next',
    'server',
    'app',
    '[lang]',
    'product',
    '[slug]',
    'page.js.nft.json'
  );

  if (!fs.existsSync(traceFile)) {
    // No production build available in this environment (e.g. `npm run build`
    // was never run) — nothing to assert against, skip rather than fail CI
    // steps that only run `npm test`.
    return;
  }

  const trace = JSON.parse(fs.readFileSync(traceFile, 'utf8'));
  assert.ok(
    trace.files.some((file) => file.endsWith('query_compiler_bg.wasm')),
    '.next/server/app/[lang]/product/[slug]/page.js.nft.json is missing query_compiler_bg.wasm — ' +
      'the product page will throw ENOENT against the database on Vercel'
  );
});
