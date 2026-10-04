const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Platforma testlari: zayafka oqimining kritik qismlari.
 *
 * Node 22.6+ `--experimental-strip-types` bilan `.ts` fayllarni to'g'ridan-to'g'ri
 * import qiladi — shuning uchun bu testlar haqiqiy manba kodini tekshiradi
 * (nusxa emas). Eski Node'da testlar skip bo'ladi.
 */
const supportsTypeStripping = Boolean(process.features && process.features.typescript);

async function loadTs(relativePath) {
  return import(path.join('..', relativePath));
}

test('1. Telefon raqami E.164 formatiga keltiriladi', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { normalizePhone, isValidUzPhone } = await loadTs('src/lib/phone.ts');

  assert.strictEqual(normalizePhone('901234567'), '+998901234567');
  assert.strictEqual(normalizePhone('+998 (90) 123-45-67'), '+998901234567');
  assert.strictEqual(normalizePhone('8901234567'), '+998901234567');
  assert.strictEqual(isValidUzPhone('+998901234567'), true);
  assert.strictEqual(isValidUzPhone('12345'), false);
  assert.strictEqual(isValidUzPhone('+7 999 123 45 67'), false);
});

test('2. Telegram HTML escape — markup inject qilinmaydi', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { escapeTelegramHtml } = await loadTs('src/lib/telegram.ts');

  assert.strictEqual(escapeTelegramHtml('<b>Ism</b>'), '&lt;b&gt;Ism&lt;/b&gt;');
  assert.strictEqual(escapeTelegramHtml('A & B'), 'A &amp; B');
  assert.strictEqual(escapeTelegramHtml(null), '');
  assert.strictEqual(escapeTelegramHtml(undefined), '');
  // Haqiqiy hujum urinishi: havola inject qilib bo'lmasligi kerak.
  assert.ok(!escapeTelegramHtml('<a href="http://evil">x</a>').includes('<a'));
});

test('3. Rate limit oynasi ishlaydi va qayta tiklanadi', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { checkRateLimit, resetRateLimit } = await loadTs('src/lib/rateLimit.ts');

  resetRateLimit();
  const key = 'test_' + Date.now();

  for (let i = 0; i < 3; i += 1) {
    assert.strictEqual(checkRateLimit(key, 3, 60_000).allowed, true, `${i + 1}-so‘rov ruxsat etilishi kerak`);
  }
  const blocked = checkRateLimit(key, 3, 60_000);
  assert.strictEqual(blocked.allowed, false, 'limitdan keyingi so‘rov bloklanishi kerak');
  assert.ok(blocked.resetTimeMs > 0);

  // Boshqa kalit (boshqa IP) bloklanmaydi.
  assert.strictEqual(checkRateLimit(key + '_boshqa', 3, 60_000).allowed, true);
});

test('4. Zayafka API’si Telegram’ga yuboradi va bazani ishlatmaydi', () => {
  const route = fs.readFileSync(path.join(__dirname, '..', 'src', 'app', 'api', 'leads', 'route.ts'), 'utf8');

  assert.ok(route.includes('sendTelegramNotification'), 'Telegram yuborilishi kerak');
  assert.ok(route.includes('escapeTelegramHtml'), 'HTML escape ishlatilishi kerak');
  assert.ok(route.includes('checkRateLimit'), 'rate limit bo‘lishi kerak');
  assert.ok(route.includes('website'), 'honeypot maydoni bo‘lishi kerak');
  assert.ok(!route.includes('@/lib/db'), 'baza importi bo‘lmasligi kerak');
  assert.ok(route.includes('pageUrl') && route.includes('lang'), 'manba sahifa va til xabarga qo‘shiladi');
});

test('5. Faqat bitta API marshruti qolgan (leads + health)', () => {
  const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
  const routes = [];

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'route.ts') routes.push(path.relative(apiDir, full).replace(/\\/g, '/'));
    }
  };
  walk(apiDir);

  assert.deepStrictEqual(routes.sort(), ['health/route.ts', 'leads/route.ts']);
});

test('6. Ommaviy sahifalarda baza importi qolmagan', () => {
  const srcDir = path.join(__dirname, '..', 'src');
  const offenders = [];

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) {
        const source = fs.readFileSync(full, 'utf8');
        if (source.includes("@/lib/db") || source.includes('@prisma/client')) {
          offenders.push(path.relative(srcDir, full));
        }
      }
    }
  };
  walk(srcDir);

  assert.deepStrictEqual(offenders, [], `Prisma/baza importi qolgan: ${offenders.join(', ')}`);
});

test('7. Fly.io/Docker konfiguratsiyasi olib tashlangan', () => {
  const root = path.join(__dirname, '..');
  for (const file of ['fly.toml', 'Dockerfile', '.github/workflows/fly-deploy.yml', '.github/workflows/cron-integrations.yml']) {
    assert.ok(!fs.existsSync(path.join(root, file)), `${file} hali ham mavjud`);
  }
});

test('8. Har bir kategoriya sahifasida 300+ so‘z SEO matn va FAQ bor (P1-7)', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { CATEGORY_SEO } = await loadTs('src/lib/categoryContent.ts');
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'catalog.json'), 'utf8'));

  for (const category of catalog.categories) {
    for (const locale of ['uz', 'ru']) {
      const seo = CATEGORY_SEO[category.id]?.[locale];
      assert.ok(seo, `${category.id}/${locale}: SEO matn yo‘q`);

      const words = [
        seo.lead,
        ...seo.body.map((b) => `${b.heading} ${b.text}`),
        ...seo.bullets,
        ...seo.faq.flatMap((f) => [f[locale].q, f[locale].a]),
      ]
        .join(' ')
        .split(/\s+/)
        .filter(Boolean).length;

      assert.ok(words >= 300, `${category.id}/${locale}: faqat ${words} so‘z (300+ kerak)`);
      assert.ok(seo.faq.length >= 5, `${category.id}/${locale}: FAQ 5 tadan kam`);
    }
  }
});

test('9. FAQ JSON-LD sahifadagi matn bilan bir manbadan yasaladi', async (t) => {
  if (!supportsTypeStripping) return t.skip("Node type-stripping yo'q");
  const { HOME_FAQ, faqJsonLd } = await loadTs('src/lib/faq.ts');

  const jsonLd = faqJsonLd(HOME_FAQ, 'ru');
  assert.strictEqual(jsonLd['@type'], 'FAQPage');
  assert.strictEqual(jsonLd.mainEntity.length, HOME_FAQ.length);
  assert.strictEqual(jsonLd.mainEntity[0].name, HOME_FAQ[0].ru.q);
  assert.strictEqual(jsonLd.mainEntity[0].acceptedAnswer.text, HOME_FAQ[0].ru.a);
});
