// Bosqich 4: analitika voqealari (HANDOFF 5) va /api/health tekshiruvlari.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('1. HANDOFF 5 dagi uchta asosiy voqea yuboriladi', () => {
  const analytics = read('src/lib/analytics.ts');
  for (const name of ['generate_lead', 'add_to_request', 'add_to_compare']) {
    assert.ok(analytics.includes(name), `analytics.ts da ${name} yo'q`);
  }
  const store = read('src/lib/store/spsLists.ts');
  assert.match(store, /trackAddToRequest\(/, 'ro\'yxatga qo\'shish kuzatilmaydi');
  assert.match(store, /trackRemoveFromRequest\(/, 'ro\'yxatdan olish kuzatilmaydi');
  assert.match(store, /trackAddToCompare\(/, 'solishtirishga qo\'shish kuzatilmaydi');
  assert.match(store, /trackRemoveFromCompare\(/, 'solishtirishdan olish kuzatilmaydi');
});

test('2. generate_lead zayafka muvaffaqiyatli bo\'lganda yonadi', () => {
  const submit = read('src/lib/leadSubmit.ts');
  assert.match(submit, /trackLeadSent\(\{/, 'leadSubmit muvaffaqiyatni kuzatmaydi');
  assert.match(submit, /trackLeadFailed\(/, 'leadSubmit xatoni kuzatmaydi');
  // Uch xil forma turi ham bitta wrapper orqali yuboriladi
  for (const rel of [
    'src/components/catalog2027/QuickRequestModal.tsx',
    'src/components/request2027/RequestClient.tsx',
    'src/components/partners2027/PartnersForm.tsx',
  ]) {
    assert.match(read(rel), /submitLead\(/, `${rel}: submitLead ishlatilmagan`);
  }
});

test('3. Model sahifasi va katalog ro\'yxati voqealari', () => {
  assert.match(read('src/components/model2027/ModelClient.tsx'), /trackEvent\('view_item'/);
  const catalog = read('src/components/catalog2027/CatalogClient.tsx');
  assert.match(catalog, /trackEvent\('view_item_list'/);
  assert.match(catalog, /trackEvent\('search'/);
});

test('4. Analitika skriptlari faqat env ID bilan yuklanadi', () => {
  const layout = read('src/app/layout.tsx');
  assert.match(layout, /<AnalyticsScripts \/>/, 'root layout analitikani ulamaydi');

  const scripts = read('src/components/analytics/AnalyticsScripts.tsx');
  for (const env of [
    'NEXT_PUBLIC_GTM_ID',
    'NEXT_PUBLIC_GA_MEASUREMENT_ID',
    'NEXT_PUBLIC_YANDEX_METRICA_ID',
    'NEXT_PUBLIC_META_PIXEL_ID',
  ]) {
    assert.ok(scripts.includes(env), `AnalyticsScripts: ${env} tekshirilmaydi`);
  }
  // Har bir skript shartli render ichida bo'lishi kerak
  assert.match(scripts, /\{GTM_ID &&/, 'GTM shartsiz yuklanadi');
  assert.match(scripts, /\{METRICA_ID &&/, 'Metrica shartsiz yuklanadi');
  assert.match(scripts, /\{PIXEL_ID &&/, 'Pixel shartsiz yuklanadi');
});

test('5. Analitika ID\'lari kodda qattiq yozilmagan (faqat env)', () => {
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        const source = fs.readFileSync(full, 'utf8');
        if (/['"`](G-[A-Z0-9]{6,}|GTM-[A-Z0-9]{4,}|AW-\d+|UA-\d+-\d+)['"`]/.test(source)) {
          offenders.push(path.relative(ROOT, full));
        }
      }
    }
  };
  walk(path.join(ROOT, 'src'));
  assert.deepStrictEqual(offenders, [], `qattiq yozilgan ID: ${offenders.join(', ')}`);
});

test('6. /api/health katalog va analitika holatini qaytaradi', () => {
  const health = read('src/app/api/health/route.ts');
  assert.match(health, /analytics,/, 'health: analitika tekshiruvi yo\'q');
  assert.match(health, /catalog: \{/, 'health: katalog tekshiruvi yo\'q');
  assert.match(health, /force-dynamic/, 'health: keshga olinmasligi kerak');
  // Telegram maxfiyligi: token hech qayerda ochiq yozilmaydi
  assert.match(health, /isTelegramConfigured/, 'health: telegram holati yo\'q');
  assert.ok(!/['"`]\d{8,10}:[A-Za-z0-9_-]{30,}['"`]/.test(health), 'health: bot tokeni kodda');
});

test('7. Analitika server renderda portlamaydi (window himoyasi)', () => {
  const analytics = read('src/lib/analytics.ts');
  assert.match(analytics, /typeof window === 'undefined'/, 'trackEvent SSR himoyasisiz');
  assert.match(analytics, /catch \{/, 'Metrica xatosi sayt ishini to\'xtatmasligi kerak');
});

test('8. .env.example barcha kerakli o\'zgaruvchilarni ko\'rsatadi', () => {
  const example = read('.env.example');
  for (const key of [
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_CHAT_ID',
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_GA_MEASUREMENT_ID',
    'NEXT_PUBLIC_YANDEX_METRICA_ID',
  ]) {
    assert.ok(example.includes(key), `.env.example da ${key} yo'q`);
  }
  // Maxfiy qiymatlar bo'sh qoldirilgan (namuna token yo'q)
  assert.ok(!/\d{8,10}:[A-Za-z0-9_-]{30,}/.test(example), '.env.example da haqiqiy token');
});
