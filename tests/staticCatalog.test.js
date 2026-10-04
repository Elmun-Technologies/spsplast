const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

/**
 * Statik katalog shartnomasi.
 *
 * Sayt backendsiz ishlaydi: barcha sahifalar `src/data/catalog.json` dan
 * o'qiydi. Shuning uchun bu fayl — yagona ma'lumot manbasi va u quyidagi
 * kafolatlarni berishi kerak:
 *
 *   1. Fayl `catalog_build/products.json`, `data/*.json` va
 *      `scripts/static/seed-data.js` bilan sinxron (generator `--check` rejimi).
 *   2. Har bir mahsulot ikki tilda to'liq (nom, slug, tavsif).
 *   3. SKU va slug'lar takrorlanmaydi — aks holda routing buziladi.
 *   4. Har bir rasm `public/` ichida haqiqatan mavjud.
 *   5. ProductCard/Product sahifasi kutgan maydonlar joyida.
 */

const ROOT = path.join(__dirname, '..');
const CATALOG_PATH = path.join(ROOT, 'src', 'data', 'catalog.json');
const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

test('1. generator bilan sinxron (npm run catalog:check)', () => {
  // Skript manbalardan JSON'ni qayta yasaydi va mavjudi bilan solishtiradi:
  // qo'lda tahrirlangan yoki eskirgan fayl shu yerda ushlanadi.
  execFileSync('node', [path.join(ROOT, 'scripts', 'build-static-catalog.js'), '--check'], {
    stdio: 'pipe',
  });
});

test('2. katalog hajmi va tarkibi', () => {
  assert.strictEqual(catalog.products.length, 192, '192 ta mahsulot kutilgan');
  assert.strictEqual(catalog.categories.length, 3, '3 ta asosiy kategoriya');
  assert.ok(catalog.blog.length >= 7, 'kamida 7 maqola');
  assert.ok(catalog.projects.length >= 6, 'kamida 6 loyiha');
});

test('3. SKU va slug’lar takrorlanmaydi', () => {
  const skus = new Set();
  const slugs = new Set();

  for (const product of catalog.products) {
    assert.ok(!skus.has(product.sku), `SKU takrorlangan: ${product.sku}`);
    skus.add(product.sku);

    for (const locale of ['uz', 'ru']) {
      const trans = product.translations.find((t) => t.locale === locale);
      assert.ok(trans, `${product.sku}: ${locale} tarjimasi yo‘q`);
      const key = `${locale}:${trans.slug}`;
      assert.ok(!slugs.has(key), `Slug takrorlangan: ${key}`);
      slugs.add(key);
    }
  }
});

test('4. har bir mahsulot ikki tilda to‘liq va o‘lchami bilan', () => {
  for (const product of catalog.products) {
    for (const locale of ['uz', 'ru']) {
      const trans = product.translations.find((t) => t.locale === locale);
      assert.ok(trans.name && trans.name.trim().length > 2, `${product.sku}: ${locale} nomi bo‘sh`);
      assert.ok(trans.slug && /^[a-z0-9-]+$/.test(trans.slug), `${product.sku}: ${locale} slug formati buzuq`);
      assert.ok(
        (trans.shortDescription || trans.description || '').trim().length > 20,
        `${product.sku}: ${locale} tavsifi juda qisqa`
      );
    }

    const dimensions = product.attributeValues.find((value) => value.attribute.code === 'dimensions');
    assert.ok(dimensions?.textValue, `${product.sku}: o‘lcham ko‘rsatilmagan`);
  }
});

test('5. barcha mahsulot rasmlari public/ ichida mavjud', () => {
  for (const product of catalog.products) {
    assert.ok(product.media.length > 0, `${product.sku}: rasm yo‘q`);
    for (const media of product.media) {
      const file = path.join(ROOT, 'public', media.url.replace(/^\//, ''));
      assert.ok(fs.existsSync(file), `${product.sku}: rasm topilmadi — ${media.url}`);
    }
  }
});

test('6. kategoriya bog‘lanishlari izchil', () => {
  const categoryIds = new Set(catalog.categories.map((category) => category.id));
  const counts = {};

  for (const product of catalog.products) {
    assert.ok(categoryIds.has(product.categoryId), `${product.sku}: noma’lum kategoriya ${product.categoryId}`);
    counts[product.categoryId] = (counts[product.categoryId] || 0) + 1;
  }

  for (const category of catalog.categories) {
    assert.strictEqual(
      category.productCount,
      counts[category.id] || 0,
      `${category.id}: productCount noto‘g‘ri`
    );
    for (const locale of ['uz', 'ru']) {
      assert.ok(
        category.translations.some((t) => t.locale === locale),
        `${category.id}: ${locale} tarjimasi yo‘q`
      );
    }
  }
});

test('7. ProductCard/Product sahifa kutgan maydonlar shakli', () => {
  for (const product of catalog.products) {
    assert.strictEqual(product.status, 'ACTIVE');
    assert.strictEqual(typeof product.basePrice, 'number');
    assert.strictEqual(product.currency, 'UZS');
    assert.strictEqual(typeof product.inStock, 'boolean');
    assert.ok(Array.isArray(product.variants));

    for (const variant of product.variants) {
      assert.ok(variant.sku && variant.sku.startsWith(product.sku), `${product.sku}: variant SKU formati buzuq`);
      assert.ok(variant.options.length > 0, `${product.sku}: variantsiz variant yozuvi`);
    }
  }
});

test('8. blog va loyiha rasmlari joyida', () => {
  for (const post of catalog.blog) {
    assert.ok(post.translations.length >= 2, `blog ${post.id}: ikki til yo‘q`);
    assert.ok(post.publishedAt, `blog ${post.id}: sana yo‘q`);
    assert.ok(fs.existsSync(path.join(ROOT, 'public', post.coverImage.replace(/^\//, ''))), `blog ${post.id}: muqova yo‘q`);
  }

  for (const project of catalog.projects) {
    assert.ok(project.titleUz && project.titleRu, `loyiha ${project.id}: nom ikki tilda emas`);
    assert.ok(
      fs.existsSync(path.join(ROOT, 'public', project.afterImage.replace(/^\//, ''))),
      `loyiha ${project.id}: keyin rasmi yo‘q`
    );
  }
});
