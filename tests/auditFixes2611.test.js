// Audit 2026-11-02, 1-bosqich ("Ishga tushirishdan oldin") tuzatishlari:
// zayafka yo'qolmasligi, telefon normallashtirish, solishtirish tugmasi, RU/EN sarlavhalar,
// `<main>` ichidagi kontent, formalar UX, 301 himoyasi.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('1. /api/leads: baza ham Telegram ham ishlamasa — 503 not_delivered (jim "ok" emas)', () => {
  const route = read('src/app/api/leads/route.ts');
  assert.match(route, /!saved && !sent/, 'yetkazilmagan zayafka tekshirilmaydi');
  assert.match(route, /not_delivered/, 'not_delivered kodi yo\'q');
  assert.match(route, /status: 503/, '503 qaytmaydi');
  // Timeout'lar: Telegram, baza ulanishi, deploy hook.
  assert.match(read('src/lib/telegram.ts'), /AbortSignal\.timeout/, 'Telegram so\'rovida timeout yo\'q');
  assert.match(read('src/server/db/client.ts'), /connect_timeout/, 'bazaga ulanish timeout\'i yo\'q');
  assert.match(read('src/server/settings.ts'), /AbortSignal\.timeout/, 'deploy hook timeout\'i yo\'q');
});

test('2. Formalar: xato turiga qarab matn + kontakt tugmalari, noValidate, muvaffaqiyatga fokus', () => {
  const fb = read('src/components/site/LeadFeedback.tsx');
  for (const k of ['formErrorName', 'formErrorPhone', 'formErrorNetwork', 'formErrorDelivery', 'formRateLimit']) {
    assert.match(fb, new RegExp(k), `${k} ishlatilmaydi`);
  }
  assert.match(fb, /CONTACTS_2027\.mainPhoneRaw/, 'qo\'ng\'iroq tugmasi yo\'q');
  assert.match(fb, /telegramUrl/, 'Telegram tugmasi yo\'q');
  assert.match(fb, /whatsappUrl/, 'WhatsApp tugmasi yo\'q');
  for (const f of ['src/components/catalog2027/QuickRequestModal.tsx', 'src/components/request2027/RequestClient.tsx', 'src/components/partners2027/PartnersForm.tsx']) {
    const src = read(f);
    assert.match(src, /noValidate/, `${f}: brauzerning inglizcha xabarlari chiqadi`);
    assert.match(src, /LeadFormError/, `${f}: umumiy xato bloki ishlatilmaydi`);
    assert.match(src, /useRevealOnShow/, `${f}: muvaffaqiyat xabari ko'rinmay qolishi mumkin`);
    assert.match(src, /checkLead\(/, `${f}: yuborishdan oldin tekshiruv yo'q`);
  }
  // Kalkulyatordagi hajm tez zayafkaga o'tadi.
  assert.match(read('src/components/model2027/ModelClient.tsx'), /initialVolume=\{volume/);
  // Bo'sh ro'yxat: mobilda forma birinchi.
  assert.match(read('src/app/globals.css'), /\.rl--empty \.rl-sum \{ order: -1; \}/);
});

test('3. Telefon: RU/KZ "8…", KG "0…", davlat kodi bo\'yicha', async () => {
  const { normalizePhone: n, isValidIntlPhone: ok } = await import(path.join(ROOT, 'src/lib/phone.ts'));
  assert.strictEqual(n('8 701 123 45 67'), '+77011234567');
  assert.strictEqual(n('8 (916) 123-45-67'), '+79161234567');
  assert.strictEqual(n('8 029 123 45 67'), '+375291234567');
  assert.strictEqual(n('0555 123 456', '+996'), '+996555123456');
  assert.strictEqual(n('555 123 456', '+996'), '+996555123456');
  assert.strictEqual(n('050 123 45 67', '+994'), '+994501234567');
  // Eski O'zbekiston formatlari o'zgarmaydi.
  assert.strictEqual(n('901234567'), '+998901234567');
  assert.strictEqual(n('8901234567'), '+998901234567');
  // Davlat kodisiz "0…" — noaniq: rad etiladi, "+0…" saqlanmaydi.
  assert.strictEqual(ok('0555 123 456'), false);
  assert.strictEqual(ok('0555 123 456', '+996'), true);
  // Ma'lum kodlarda uzunlik aniq tekshiriladi.
  assert.strictEqual(ok('+998 90 123 45 6'), false);
  assert.strictEqual(ok('+7 916 123 45 6'), false);
  assert.strictEqual(ok('+1 415 555 2671'), true);
  // API davlat kodini qabul qiladi, ulgurji forma uni yuboradi.
  assert.match(read('src/app/api/leads/route.ts'), /normalizePhone\(data\.phone, data\.dial\)/);
  assert.match(read('src/components/partners2027/PartnersForm.tsx'), /COUNTRY_DIALS/);
});

test('4. Solishtirish: "Zayafka" tugmasi ko\'rinadi va modelni ro\'yxatga qo\'shadi', () => {
  const css = read('src/app/globals.css');
  assert.ok(!/^\s*\.mc a\s*\{/m.test(css), '`.mc a` tugmaga ham grafit matn beradi');
  const cmp = read('src/components/compare2027/CompareClient.tsx');
  assert.match(cmp, /addOne\(m\)/, 'tugma modelni qo\'shmaydi');
});

test('5. RU/EN/UZ sarlavhalarda asosiy so\'rov: формы / molds / qoliplari', async () => {
  const { loadAliased, cleanupTmp } = await import('./helpers/load-alias.mjs');
  try {
    const t = await loadAliased('src/lib/seoTitles.ts');
    const c = await loadAliased('src/lib/catalog2027.ts');
    assert.match(t.sectionSeoTitle('trotuar', 'ru', 95), /^Формы для тротуарной плитки — 95 моделей$/);
    assert.match(t.sectionSeoTitle('trotuar', 'en', 95), /molds/);
    assert.match(t.sectionSeoTitle('trotuar', 'uz', 95), /qoliplari/);
    assert.match(t.catalogSeoTitle('ru', 119), /^Формы/);
    for (const m of c.getModels()) {
      const ru = t.modelSeoTitle(m, 'ru');
      assert.match(ru, /^Форма/, `${m.slug}: ${ru}`);
      // " · SPS Plast" (12) bilan 65 dan oshmasin.
      for (const lang of ['uz', 'ru', 'en']) assert.ok(t.modelSeoTitle(m, lang).length <= 53, `${lang} ${m.slug}: uzun`);
    }
  } finally {
    cleanupTmp();
  }
  for (const f of ['src/app/[lang]/catalog/page.tsx', 'src/app/[lang]/catalog/[section]/page.tsx', 'src/app/[lang]/catalog/[section]/[slug]/page.tsx']) {
    assert.match(read(f), /SeoTitle\(/, `${f}: sarlavha shablondan olinmaydi`);
  }
});

test('6. `[lang]/loading.tsx` yo\'q — statik sahifa matni SSR\'da <main> ichida', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'src/app/[lang]/loading.tsx')), 'loading.tsx kontentni <main> dan tashqariga chiqaradi');
  assert.match(read('scripts/lib/dom-rules.mjs'), /h1 <main> ichida emas/);
});

test('7. 301: build paytida ham xavfli qatorlar tashlab yuboriladi; CI npm audit', () => {
  const snap = read('scripts/export-snapshot.mjs');
  assert.match(snap, /filter\(safeRedirect\)/);
  assert.match(read('.github/workflows/checks.yml'), /npm audit --omit=dev --audit-level=high/);
  assert.ok(fs.existsSync(path.join(ROOT, '.github/dependabot.yml')), 'Dependabot sozlanmagan');
});
