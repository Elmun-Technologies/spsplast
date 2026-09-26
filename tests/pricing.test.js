const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

/**
 * These tests import the REAL source modules (`src/lib/pricing.ts`,
 * `src/lib/slug.ts`) through Node's built-in TypeScript type stripping, so they
 * exercise the same code the storefront and the order API ship — not a copy.
 * Both modules are dependency-free on purpose so they can be loaded here.
 */
const pricing = import(pathToFileURL(path.join(__dirname, '..', 'src', 'lib', 'pricing.ts')).href);
const slugs = import(pathToFileURL(path.join(__dirname, '..', 'src', 'lib', 'slug.ts')).href);

test('1. Bulk tier unit price matches the published 5% / 10% thresholds', async () => {
  const { getBulkUnitPrice } = await pricing;

  assert.strictEqual(getBulkUnitPrice(100000, 1), 100000, '1 unit = list price');
  assert.strictEqual(getBulkUnitPrice(100000, 9), 100000, '9 units = list price');
  assert.strictEqual(getBulkUnitPrice(100000, 10), 95000, '10 units = -5%');
  assert.strictEqual(getBulkUnitPrice(100000, 49), 95000, '49 units = -5%');
  assert.strictEqual(getBulkUnitPrice(100000, 50), 90000, '50 units = -10%');
  assert.strictEqual(getBulkUnitPrice(100000, 500), 90000, '500 units = -10%');
});

test('2. Bulk tier price is always an integer and never negative', async () => {
  const { getBulkUnitPrice } = await pricing;

  assert.strictEqual(getBulkUnitPrice(100001, 10), 95001, 'rounds to whole UZS');
  assert.strictEqual(getBulkUnitPrice(0, 100), 0, 'price-on-request item stays 0');
  assert.strictEqual(getBulkUnitPrice(-5000, 100), 0, 'negative base price is clamped');
  assert.strictEqual(getBulkUnitPrice(NaN, 10), 0, 'NaN base price is clamped');
  assert.strictEqual(getBulkUnitPrice(100000, 0), 100000, 'zero quantity falls back to list price');
});

test('3. computeTotals reproduces the order total the server persists', async () => {
  const { computeTotals } = await pricing;

  const totals = computeTotals([
    { basePrice: 100000, quantity: 2 },
    { basePrice: 50000, quantity: 10 },
  ]);

  assert.strictEqual(totals.subtotal, 200000 + 475000, 'tier applied per line');
  assert.strictEqual(totals.discount, 0, 'no coupon applied');
  assert.strictEqual(totals.total, 675000);
  assert.strictEqual(totals.quantity, 12);
  assert.strictEqual(totals.coupon, null);
});

test('4. Valid coupon is applied; unknown and short-of-minimum codes are not', async () => {
  const { computeTotals } = await pricing;

  const withCoupon = computeTotals([{ basePrice: 100000, quantity: 6 }], 'sps10');
  assert.strictEqual(withCoupon.subtotal, 600000);
  assert.strictEqual(withCoupon.discount, 60000, '10% of 600k');
  assert.strictEqual(withCoupon.total, 540000);
  assert.strictEqual(withCoupon.coupon?.code, 'SPS10', 'code is normalized to upper case');

  const belowMinimum = computeTotals([{ basePrice: 100000, quantity: 1 }], 'SPS10');
  assert.strictEqual(belowMinimum.discount, 0, '500k minimum not reached');
  assert.strictEqual(belowMinimum.coupon, null);

  const unknown = computeTotals([{ basePrice: 100000, quantity: 10 }], 'HACKME');
  assert.strictEqual(unknown.discount, 0);
  assert.strictEqual(unknown.total, 950000, 'tier still applies without a coupon');
});

test('5. A client-forged discount cannot change the total', async () => {
  const { computeTotals } = await pricing;

  // The client may send any of these; only `basePrice`/`quantity` are inputs.
  const forged = computeTotals(
    [{ basePrice: 100000, quantity: 1, discount: 999999, total: 1 }],
    'SPS10'
  );
  assert.strictEqual(forged.total, 100000, 'coupon minimum blocks the discount');
});

test('6. Quantity is floored and non-positive lines are ignored', async () => {
  const { computeTotals } = await pricing;

  const totals = computeTotals([
    { basePrice: 10000, quantity: 2.9 },
    { basePrice: 10000, quantity: 0 },
    { basePrice: 10000, quantity: -5 },
  ]);
  assert.strictEqual(totals.subtotal, 20000);
  assert.strictEqual(totals.quantity, 2);
});

test('7. slugify keeps Russian titles usable instead of returning ""', async () => {
  const { slugify } = await slugs;

  assert.strictEqual(slugify('Форма для брусчатки'), 'forma-dlya-bruschatki');
  assert.strictEqual(slugify('Бордюр 1000x200'), 'bordyur-1000x200');
  assert.strictEqual(slugify('ЖБИ изделия Щ-1'), 'zhbi-izdeliya-sch-1');
});

test('8. slugify keeps the Uzbek o‘ / g‘ letters', async () => {
  const { slugify } = await slugs;

  assert.strictEqual(slugify('Bruschatka o‘lchami 200'), 'bruschatka-olchami-200');
  assert.strictEqual(slugify('G‘isht qolipi'), 'gisht-qolipi');
});

test('9. slugify never returns an empty slug and falls back to the SKU', async () => {
  const { slugify } = await slugs;

  assert.strictEqual(slugify('!!!'), 'item', 'punctuation-only title falls back');
  assert.strictEqual(slugify('', 'sps-001'), 'sps-001');
  assert.strictEqual(slugify(null, 'sps-002'), 'sps-002');
  assert.strictEqual(slugify(undefined), 'item');
  assert.strictEqual(slugify('   '), 'item');
});

test('10. slugify trims separators, case and over-long input', async () => {
  const { slugify } = await slugs;

  assert.strictEqual(slugify('  Forma -- Qolipi  '), 'forma-qolipi');
  assert.strictEqual(slugify('Forma/Qolipi (2024)'), 'forma-qolipi-2024');
  const long = slugify('a'.repeat(300));
  assert.ok(long.length <= 80, `expected <= 80 chars, got ${long.length}`);
  assert.ok(!long.endsWith('-'), 'no trailing separator after truncation');
});
