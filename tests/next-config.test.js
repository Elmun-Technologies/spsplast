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
