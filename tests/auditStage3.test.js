// Audit 2026-11-02, 3-bosqich ("Rejali ish") — 3.1 xavfsizlik tuzatishlari.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('1. requestGuard: begona Origin aniqlanadi, so\'rov tanasi limitdan oshsa to\'xtaydi', async () => {
  const { loadAliased, cleanupTmp } = await import('./helpers/load-alias.mjs');
  try {
    const guard = await loadAliased('src/lib/requestGuard.ts');

    const req = (headers) => new Request('http://localhost/x', { method: 'POST', headers });
    assert.strictEqual(guard.isCrossOrigin(req({ origin: 'https://evil.example', host: 'spsplast.com' })), true);
    assert.strictEqual(guard.isCrossOrigin(req({ origin: 'https://spsplast.com', host: 'spsplast.com' })), false);
    // Preview/lokal: Origin bilan Host mos — qattiq domen ro'yxati shart emas.
    assert.strictEqual(guard.isCrossOrigin(req({ origin: 'https://foo-git-branch.vercel.app', host: 'foo-git-branch.vercel.app' })), false);
    // Origin umuman yo'q — bloklanmaydi (ba'zi brauzer/mijozlar yubormaydi).
    assert.strictEqual(guard.isCrossOrigin(req({ host: 'spsplast.com' })), false);
    // Noto'g'ri Origin qiymati — ishonilmaydi.
    assert.strictEqual(guard.isCrossOrigin(req({ origin: 'not-a-url', host: 'spsplast.com' })), true);

    const small = new Request('http://localhost/x', { method: 'POST', body: 'a'.repeat(100) });
    assert.strictEqual((await guard.readLimitedText(small, 1000)).length, 100);

    const big = new Request('http://localhost/x', { method: 'POST', body: 'a'.repeat(2000) });
    assert.strictEqual(await guard.readLimitedText(big, 1000), null);

    const empty = new Request('http://localhost/x', { method: 'GET' });
    assert.strictEqual(await guard.readLimitedText(empty, 1000), '');
  } finally {
    cleanupTmp();
  }
});

test("2. /api/track: begona Origin'dan yuborilgan soxta tashrif rad etiladi", async () => {
  const { loadAliased, cleanupTmp } = await import('./helpers/load-alias.mjs');
  try {
    const client = await loadAliased('src/server/db/client.ts');
    const route = await loadAliased('src/app/api/track/route.ts');
    // getDb() null bo'lsa ham POST 204 bilan tugaydi — Origin tekshiruvi shundan oldin ishlaydi,
    // shuning uchun haqiqiy baza shart emas (manba matnidan tasdiqlaymiz: tartib muhim).
    assert.match(read('src/app/api/track/route.ts'), /isCrossOrigin\(req\)\) return NO_CONTENT/, 'Origin tekshiruvi yo\'q');
    client.setDbForTests?.(null);
    const res = await route.POST(
      new Request('http://localhost/api/track', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'https://evil.example', host: 'localhost' },
        body: JSON.stringify({ vid: 'a'.repeat(12), sid: 'b'.repeat(12), t: 'page_view', p: '/uz' }),
      }),
    );
    assert.strictEqual(res.status, 204); // har doim 204 (mijozga oshkor qilmaydi), lekin yozilmaydi
  } finally {
    cleanupTmp();
  }
});

test('3. /api/health: HEALTH_CHECK_TOKEN sozlanmasa to\'liq, sozlansa faqat token bilan', async () => {
  const { loadAliased, cleanupTmp } = await import('./helpers/load-alias.mjs');
  const saved = process.env.HEALTH_CHECK_TOKEN;
  try {
    delete process.env.HEALTH_CHECK_TOKEN;
    const routeOpen = await loadAliased('src/app/api/health/route.ts');
    const openRes = await routeOpen.GET(new Request('http://localhost/api/health'));
    const openJson = await openRes.json();
    assert.ok('checks' in openJson, 'token sozlanmaganda batafsil javob kerak');

    process.env.HEALTH_CHECK_TOKEN = 'sekret-123';
    const routeGated = await loadAliased('src/app/api/health/route.ts');

    const noToken = await routeGated.GET(new Request('http://localhost/api/health'));
    const noTokenJson = await noToken.json();
    assert.ok(!('checks' in noTokenJson), 'tokensiz batafsil javob chiqmasligi kerak');
    assert.ok('status' in noTokenJson && 'timestamp' in noTokenJson);

    const wrongToken = await routeGated.GET(new Request('http://localhost/api/health?token=notogri'));
    assert.ok(!('checks' in (await wrongToken.json())));

    const queryToken = await routeGated.GET(new Request('http://localhost/api/health?token=sekret-123'));
    assert.ok('checks' in (await queryToken.json()), 'query token bilan batafsil javob kerak');

    const headerToken = await routeGated.GET(
      new Request('http://localhost/api/health', { headers: { authorization: 'Bearer sekret-123' } }),
    );
    assert.ok('checks' in (await headerToken.json()), 'Authorization header bilan batafsil javob kerak');

    // HTTP status (uptime monitor shunga qaraydi) tokensiz ham to'g'ri qoladi.
    assert.strictEqual(noToken.status, openRes.status);
  } finally {
    if (saved === undefined) delete process.env.HEALTH_CHECK_TOKEN;
    else process.env.HEALTH_CHECK_TOKEN = saved;
    cleanupTmp();
  }
});

test('4. Admin kirish: IP bilan bir qatorda e-pochta bo\'yicha ham limit (botnet himoyasi)', () => {
  const actions = read('src/app/admin/actions.ts');
  assert.match(actions, /emailRateKey = ipKey\('login_email', normalizeEmail\(emailRaw\)\)/);
  assert.match(actions, /emailHits >= 5/);
  assert.match(actions, /ipHits >= 10/);
});

test('5. Umumiy CSP: butun saytga qo\'yiladi, productionda, haqiqiy xavf (object-src/base-uri/form-action/frame-ancestors) yopiladi', async () => {
  const config = require(path.join(ROOT, 'next.config.js'));
  const prodHeaders = await config.headers();
  const csp = prodHeaders[0].headers.find((h) => h.key === 'Content-Security-Policy');
  assert.ok(csp, 'umumiy CSP yo\'q');
  for (const rule of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'"]) {
    assert.ok(csp.value.includes(rule), `CSP'da yo'q: ${rule}`);
  }
  // Faqat haqiqatda ishlatiladigan analitika host'lari — ixtiyoriy domen qolmagan.
  assert.ok(csp.value.includes('googletagmanager.com'));
  assert.ok(csp.value.includes('mc.yandex.ru'));
  // 3D ko'ruvchi (GLB teksturalari blob URL orqali) — `blob:` bo'lmasa relyef teksturasiz
  // chiqadi (brauzerda tasdiqlangan, 2026-11-12).
  const directive = (name) => csp.value.split(';').map((d) => d.trim()).find((d) => d.startsWith(`${name} `)) || '';
  assert.match(directive('img-src'), /\bblob:/, "img-src'da blob: yo'q — 3D teksturalar yuklanmaydi");
  assert.match(directive('connect-src'), /\bblob:/, "connect-src'da blob: yo'q — 3D teksturalar yuklanmaydi");
});

test('6. Admin CSP: nonce bilan, "unsafe-inline"siz script-src, umumiy CSP\'ni almashtiradi', () => {
  const mw = read('src/middleware.ts');
  const scriptSrcLine = mw.match(/`script-src 'self'[^`]*\$\{nonce\}[^`]*`/);
  assert.ok(scriptSrcLine, 'admin script-src qatori topilmadi');
  assert.match(scriptSrcLine[0], /'nonce-\$\{nonce\}'/);
  assert.match(scriptSrcLine[0], /'strict-dynamic'/);
  assert.ok(!scriptSrcLine[0].includes('unsafe-inline'), 'admin script-src\'da unsafe-inline bo\'lmasligi kerak');
  assert.match(mw, /crypto\.randomUUID\(\)/, 'har so\'rovda yangi nonce yaratilmayapti');
  assert.match(mw, /requestHeaders\.set\('Content-Security-Policy', csp\)/, 'nonce so\'rov sarlavhasiga qo\'yilmayapti — Next avtomatik skriptlarga qo\'ymaydi');
  assert.match(mw, /process\.env\.NODE_ENV !== 'production'/, 'dev\'da CSP o\'chirilishi kerak (HMR)');
});

test('7. /api/leads: Content-Type va Origin tekshiruvi, 32 KB tana limiti', () => {
  const route = read('src/app/api/leads/route.ts');
  assert.match(route, /isCrossOrigin\(req\)/);
  assert.match(route, /contentType\.toLowerCase\(\)\.includes\('application\/json'\)/);
  assert.match(route, /readLimitedText\(req, MAX_BODY_BYTES\)/);
  assert.match(route, /MAX_BODY_BYTES = 32 \* 1024/);
});
