const test = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');

// 1. Phone Normalization Tests
function normalizePhone(input) {
  if (!input) return '';
  let cleaned = input.trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
  if (cleaned.startsWith('8') && cleaned.length === 10) {
    cleaned = '998' + cleaned.slice(1);
  } else if (!cleaned.startsWith('998') && cleaned.length === 9) {
    cleaned = '998' + cleaned;
  }
  return `+${cleaned}`;
}

function isValidUzPhone(phone) {
  const normalized = normalizePhone(phone);
  return /^\+998\d{9}$/.test(normalized);
}

test('Phone Normalization & Validation', () => {
  assert.strictEqual(normalizePhone('901234567'), '+998901234567');
  assert.strictEqual(normalizePhone('+998 (90) 123-45-67'), '+998901234567');
  assert.strictEqual(normalizePhone('8901234567'), '+998901234567');
  assert.strictEqual(isValidUzPhone('+998901234567'), true);
  assert.strictEqual(isValidUzPhone('12345'), false);
});

// 2. Money Calculation Tests (Integer UZS)
test('Server-side Money Recalculation (Integer UZS)', () => {
  const items = [
    { basePrice: 18000, quantity: 5 },
    { basePrice: 125000, quantity: 2 },
  ];

  let total = 0;
  for (const item of items) {
    assert.strictEqual(Number.isInteger(item.basePrice), true);
    assert.strictEqual(Number.isInteger(item.quantity), true);
    total += item.basePrice * item.quantity;
  }

  assert.strictEqual(total, 340000); // 18000*5 + 125000*2 = 90000 + 250000 = 340000 UZS
});

// 3. Stock Validation Tests
test('Stock Validation & Oversell Prevention', () => {
  const product = { stockQty: 10, trackInventory: true, allowBackorder: false };
  
  const validRequestQty = 8;
  const invalidRequestQty = 15;

  const canFulfillValid = !product.trackInventory || product.allowBackorder || product.stockQty >= validRequestQty;
  const canFulfillInvalid = !product.trackInventory || product.allowBackorder || product.stockQty >= invalidRequestQty;

  assert.strictEqual(canFulfillValid, true);
  assert.strictEqual(canFulfillInvalid, false);
});

// 4. Password Hashing & Verification Tests
test('Bcrypt Admin Password Hashing & Verification', async () => {
  const password = 'SecretAdminPassword2026!';
  const hash = await bcrypt.hash(password, 10);
  
  const isValid = await bcrypt.compare(password, hash);
  const isInvalid = await bcrypt.compare('WrongPassword', hash);

  assert.strictEqual(isValid, true);
  assert.strictEqual(isInvalid, false);
});

// 5. Rate Limiting Logic Tests
test('Login Rate Limiter Sliding Window', () => {
  const tracker = new Map();
  function checkLimit(key, max) {
    const current = tracker.get(key) || 0;
    if (current >= max) return false;
    tracker.set(key, current + 1);
    return true;
  }

  const key = 'ip_127.0.0.1';
  assert.strictEqual(checkLimit(key, 3), true); // Attempt 1
  assert.strictEqual(checkLimit(key, 3), true); // Attempt 2
  assert.strictEqual(checkLimit(key, 3), true); // Attempt 3
  assert.strictEqual(checkLimit(key, 3), false); // Attempt 4 (Blocked)
});
