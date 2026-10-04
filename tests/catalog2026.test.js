const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Data integrity of the 2026 studio series (data/molds-2026.json).
 *
 * The seed writes this file straight into the database, so a broken slug,
 * a duplicate SKU or a missing photo would only surface at `npm run db:seed`
 * time (or worse, in production). These checks keep the catalogue file honest.
 */
const ROOT = path.join(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/molds-2026.json'), 'utf8'));
const products = catalog.products;

const KNOWN_CATEGORIES = ['devor-panel', 'fasad', 'bruschatka', 'plitka', 'bordyur', 'termopanel'];
const KNOWN_TEXTURES = ['brick', 'stone', 'smooth', 'gloss', '3d', 'faceted'];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

test('1. catalogue holds at most 50 listed products', () => {
  assert.ok(Array.isArray(products));
  assert.ok(products.length > 0, 'catalogue is empty');
  assert.ok(products.length <= 50, `expected <= 50 products, got ${products.length}`);
});

test('2. SKUs and both locale slugs are unique', () => {
  const skus = new Set();
  const slugsUz = new Set();
  const slugsRu = new Set();

  for (const product of products) {
    assert.ok(!skus.has(product.sku), `duplicate SKU: ${product.sku}`);
    assert.ok(!slugsUz.has(product.slugUz), `duplicate uz slug: ${product.slugUz}`);
    assert.ok(!slugsRu.has(product.slugRu), `duplicate ru slug: ${product.slugRu}`);
    skus.add(product.sku);
    slugsUz.add(product.slugUz);
    slugsRu.add(product.slugRu);
  }
});

test('3. slugs are URL-safe in both locales', () => {
  for (const product of products) {
    assert.match(product.slugUz, SLUG_RE, `bad uz slug: ${product.slugUz}`);
    assert.match(product.slugRu, SLUG_RE, `bad ru slug: ${product.slugRu}`);
  }
});

test('4. every product is bilingual and priced explicitly', () => {
  for (const product of products) {
    for (const field of ['nameUz', 'nameRu', 'shortUz', 'shortRu', 'descUz', 'descRu']) {
      assert.ok(product[field] && product[field].trim().length > 0, `${product.sku}: empty ${field}`);
    }
    assert.strictEqual(typeof product.price, 'number', `${product.sku}: price must be a number`);
    assert.ok(product.price >= 0, `${product.sku}: negative price`);
  }
});

test('5. category and texture codes exist in the seed', () => {
  for (const product of products) {
    assert.ok(KNOWN_CATEGORIES.includes(product.category), `${product.sku}: unknown category ${product.category}`);
    assert.ok(KNOWN_TEXTURES.includes(product.texture), `${product.sku}: unknown texture ${product.texture}`);
  }
});

test('6. every product photo exists in /public and is unique', () => {
  const used = new Set();
  for (const product of products) {
    assert.ok(product.image.startsWith('/catalog/'), `${product.sku}: unexpected image path`);
    assert.ok(!used.has(product.image), `image reused by two products: ${product.image}`);
    used.add(product.image);

    const file = path.join(ROOT, 'public', product.image.replace(/^\//, ''));
    assert.ok(fs.existsSync(file), `${product.sku}: missing photo ${product.image}`);
  }
});

test('7. option axes referenced by products are declared', () => {
  const axes = Object.keys(catalog.optionAxes);
  assert.ok(axes.length > 0, 'no option axes declared');

  for (const [code, axis] of Object.entries(catalog.optionAxes)) {
    assert.ok(axis.nameUz && axis.nameRu, `${code}: axis needs uz/ru name`);
    assert.ok(axis.values.length >= 2, `${code}: an option axis needs at least 2 values`);
    const codes = new Set();
    for (const value of axis.values) {
      assert.ok(!codes.has(value.code), `${code}: duplicate option value ${value.code}`);
      codes.add(value.code);
      assert.ok(value.labelUz && value.labelRu, `${code}/${value.code}: needs uz/ru label`);
    }
  }

  for (const product of products) {
    for (const axisCode of product.options || []) {
      assert.ok(axes.includes(axisCode), `${product.sku}: unknown option axis ${axisCode}`);
    }
  }
});

test('8. cavity count is a positive integer (it drives "1 quyishda N dona")', () => {
  for (const product of products) {
    assert.ok(Number.isInteger(product.cavities) && product.cavities >= 1, `${product.sku}: bad cavities`);
  }
});

test('9. unconfirmed sizes are flagged so the UI can render the "*" note', () => {
  for (const product of products) {
    assert.strictEqual(
      typeof product.dimensionsConfirmed,
      'boolean',
      `${product.sku}: dimensionsConfirmed must be a boolean`
    );
    assert.ok(product.dimensions && product.dimensions.trim().length > 0, `${product.sku}: empty dimensions`);
  }
});

test('10. generated variant SKUs stay unique across the catalogue', () => {
  const variantSkus = new Set();

  for (const product of products) {
    let combos = [[]];
    for (const axisCode of product.options || []) {
      const next = [];
      for (const combo of combos) {
        for (const value of catalog.optionAxes[axisCode].values) {
          next.push([...combo, value.code]);
        }
      }
      combos = next;
    }

    for (const combo of combos) {
      if (combo.length === 0) continue;
      const sku = `${product.sku}-${combo.map((c) => c.toUpperCase()).join('-')}`;
      assert.ok(!variantSkus.has(sku), `duplicate variant SKU: ${sku}`);
      variantSkus.add(sku);
    }
  }

  assert.ok(variantSkus.size > 0, 'no variants would be created');
});
