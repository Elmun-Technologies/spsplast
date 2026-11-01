// Mijoz ro'yxatlari (sps_request / sps_compare) — useSyncExternalStore snapshot barqarorligi.
//
// Regressiya: `get()` har chaqiruvda JSON.parse qilib yangi massiv qaytarardi.
// React buni "har renderda o'zgardi" deb qabul qilib #185 (Maximum update depth
// exceeded) bilan yiqilardi — ro'yxatda bitta model bo'lishi bilan header orqali
// butun sayt ochilmay qolardi (2026-11-01, Playwright bilan topilgan).
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const supportsTypeStripping = Number(process.versions.node.split('.')[0]) >= 22;

function fakeStorage({ failWrites = false } = {}) {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => {
      if (failWrites) throw new Error('QuotaExceededError');
      data.set(k, String(v));
    },
    removeItem: (k) => data.delete(k),
    _data: data,
  };
}

async function loadStore(t) {
  if (!supportsTypeStripping) {
    t.skip("Node type-stripping yo'q");
    return null;
  }
  const { loadAliased } = await import(path.join(__dirname, 'helpers', 'load-alias.mjs'));
  return loadAliased('src/lib/store/spsLists.ts');
}

test('1. get() o\'zgarmagan ma\'lumot uchun aynan bir xil massiv qaytaradi', async (t) => {
  const mod = await loadStore(t);
  if (!mod) return;
  const storage = fakeStorage();
  globalThis.window = { localStorage: storage };
  try {
    storage.setItem('sps_test_a', JSON.stringify(['01-monako', '03-yalta']));
    const store = mod.createListStore('sps_test_a', []);
    const first = store.get();
    assert.deepStrictEqual(first, ['01-monako', '03-yalta']);
    assert.strictEqual(store.get(), first, 'snapshot har chaqiruvda yangi massiv — React #185');

    store.set(['12-rio']);
    const next = store.get();
    assert.deepStrictEqual(next, ['12-rio']);
    assert.notStrictEqual(next, first, "yozuvdan keyin yangi snapshot bo'lishi kerak");
    assert.strictEqual(store.get(), next);

    // Boshqa tab yozgan qiymat ham ko'rinadi (xom qator o'zgardi -> yangi snapshot).
    storage.setItem('sps_test_a', JSON.stringify(['56-buxoro']));
    assert.deepStrictEqual(store.get(), ['56-buxoro']);
  } finally {
    delete globalThis.window;
  }
});

test('2. Bo\'sh ro\'yxat va yopiq localStorage ham barqaror snapshot beradi', async (t) => {
  const mod = await loadStore(t);
  if (!mod) return;
  const fallback = [];
  globalThis.window = { localStorage: fakeStorage() };
  try {
    const empty = mod.createListStore('sps_test_b', fallback);
    assert.strictEqual(empty.get(), fallback);
    assert.strictEqual(empty.get(), empty.get());
  } finally {
    delete globalThis.window;
  }

  // Yozish kvota sababli muvaffaqiyatsiz: ro'yxat xotirada ishlaydi va eski qiymat qaytib qolmaydi.
  globalThis.window = { localStorage: fakeStorage({ failWrites: true }) };
  try {
    const store = mod.createListStore('sps_test_c', fallback);
    assert.strictEqual(store.get(), fallback);
    store.set(['01-monako']);
    const afterWrite = store.get();
    assert.deepStrictEqual(afterWrite, ['01-monako'], "xotiradagi nusxa ko'rinmayapti");
    assert.strictEqual(store.get(), afterWrite);
  } finally {
    delete globalThis.window;
  }
});
