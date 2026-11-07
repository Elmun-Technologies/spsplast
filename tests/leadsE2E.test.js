// /api/leads uchidan-uchigacha (audit 2026-11-02, texnik: route testlarda haqiqatan ishga
// tushirilmasdi). Haqiqiy route handler + PGlite (haqiqiy migratsiyalar) + soxta Telegram fetch.
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

let ctx;
async function setup() {
  if (ctx) return ctx;
  const { pathToFileURL } = await import('node:url');
  const { loadAliased, cleanupTmp } = await import('./helpers/load-alias.mjs');
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const schema = await import(pathToFileURL(path.join(ROOT, 'src/server/db/schema.ts')).href);
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: path.join(ROOT, 'drizzle') });
  const client = await import(pathToFileURL(path.join(ROOT, 'src/server/db/client.ts')).href);
  const leads = await import(pathToFileURL(path.join(ROOT, 'src/server/leads.ts')).href);
  const route = await loadAliased('src/app/api/leads/route.ts');
  ctx = { db, schema, client, leads, route, cleanupTmp };
  return ctx;
}

test.after(() => ctx?.cleanupTmp());

/** Telegram API o'rniga: chaqiruvlarni yozib boradi, javob `ok` bilan boshqariladi. */
function fakeTelegram(ok = true) {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(init.body) });
    return new Response(ok ? '{"ok":true}' : '{"ok":false}', { status: ok ? 200 : 500 });
  };
  return { calls, restore: () => (globalThis.fetch = original) };
}

let ipSeq = 0;
function post(route, body, ip = `10.0.0.${++ipSeq}`) {
  return route.POST(
    new Request('http://localhost/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    }),
  );
}

/** `post()` kabi, lekin sarlavha/tana to'liq nazoratda — xavfsizlik testlari uchun. */
function postRaw(route, body, extraHeaders = {}, ip = `10.0.0.${++ipSeq}`) {
  return route.POST(
    new Request('http://localhost/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, ...extraHeaders },
      body,
    }),
  );
}

const base = { type: 'quick', name: 'Aziz Test', phone: '90 123 45 67', lang: 'uz', items: [{ slug: '01-monako', m2: 120 }] };

test('1. Zayafka bazaga yoziladi, Telegram\'ga ketadi, raqam SPS-YYMM-NNNN', async () => {
  const { db, schema, client, route } = await setup();
  client.setDbForTests(db);
  process.env.TELEGRAM_BOT_TOKEN = 'test-token';
  process.env.TELEGRAM_CHAT_ID = '-100';
  const tg = fakeTelegram(true);
  try {
    const res = await post(route, base);
    const json = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(json.ok, true);
    assert.match(json.requestId, /^SPS-\d{4}-0001$/);
    assert.strictEqual(tg.calls.length, 1);
    const text = tg.calls[0].body.text;
    assert.match(text, new RegExp(json.requestId));
    assert.match(text, /wa\.me\/998901234567/);
    assert.match(text, /Monako/);
    const [row] = await db.select().from(schema.leads);
    assert.strictEqual(row.phone, '+998901234567');
    assert.strictEqual(row.telegramDelivered, true);
  } finally {
    tg.restore();
  }
});

test('2. Telegram yiqilsa — zayafka bazada qoladi (200), admin\'dan qayta yuboriladi', async () => {
  const { db, schema, client, route, leads } = await setup();
  client.setDbForTests(db);
  const tg = fakeTelegram(false);
  let leadId;
  try {
    const res = await post(route, { ...base, name: 'Bobur Test' });
    assert.strictEqual(res.status, 200);
    const rows = await db.select().from(schema.leads);
    const row = rows.find((r) => r.name === 'Bobur Test');
    assert.strictEqual(row.telegramDelivered, false);
    leadId = row.id;
  } finally {
    tg.restore();
  }
  const sent = [];
  const ok = await leads.resendLeadTelegram(db, leadId, null, 'https://spsplast.com', async (m) => (sent.push(m), true));
  assert.strictEqual(ok, true);
  assert.match(sent[0], /Qayta yuborildi/);
  assert.match(sent[0], /admin\/leads\//);
  const { eq } = await import('drizzle-orm');
  const [after] = await db.select().from(schema.leads).where(eq(schema.leads.id, leadId));
  assert.strictEqual(after.telegramDelivered, true);
});

test('3. Baza ham Telegram ham yo\'q (production) — 503 not_delivered, "ok" emas', async () => {
  const { client, route } = await setup();
  client.setDbForTests(null);
  const env = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const tg = fakeTelegram(false);
  try {
    const res = await post(route, base);
    assert.strictEqual(res.status, 503);
    assert.strictEqual((await res.json()).error, 'not_delivered');
  } finally {
    tg.restore();
    process.env.NODE_ENV = env;
  }
});

test('4. Telefon: davlat kodisiz "0…" rad etiladi, `dial` bilan qabul qilinadi', async () => {
  const { db, schema, client, route } = await setup();
  client.setDbForTests(db);
  const tg = fakeTelegram(true);
  try {
    const bad = await post(route, { ...base, phone: '0555 123 456' });
    assert.strictEqual(bad.status, 400);
    assert.strictEqual((await bad.json()).error, 'bad_phone');
    const good = await post(route, { ...base, type: 'partners', name: 'Kyrgyz Test', phone: '0555 123 456', dial: '+996' });
    assert.strictEqual(good.status, 200);
    const rows = await db.select().from(schema.leads);
    assert.strictEqual(rows.find((r) => r.name === 'Kyrgyz Test').phone, '+996555123456');
    assert.match(tg.calls.at(-1).body.text, /Mijoz yozgani: 0555 123 456/);
  } finally {
    tg.restore();
  }
});

test('5. Honeypot — soxta ok, Telegram yuborilmaydi; 11-so\'rov — 429', async () => {
  const { db, client, route } = await setup();
  client.setDbForTests(db);
  const tg = fakeTelegram(true);
  try {
    const bot = await post(route, { ...base, website: 'http://spam' });
    assert.strictEqual(bot.status, 200);
    assert.strictEqual(tg.calls.length, 0);
    let last;
    for (let i = 0; i < 11; i++) last = await post(route, { ...base, name: `Rate ${i}` }, '10.9.9.9');
    assert.strictEqual(last.status, 429);
  } finally {
    tg.restore();
    client.setDbForTests(undefined);
  }
});

test('6. Begona Origin — "text/plain" CORS-aylanib o\'tish hiylasi rad etiladi (audit 2026-11-02)', async () => {
  const { client, route } = await setup();
  client.setDbForTests(null);
  // Telegram'ga haqiqiy tarmoq so'rovi ketmasin — avvalgi testdan qolgan token bo'lishi mumkin.
  const savedToken = process.env.TELEGRAM_BOT_TOKEN;
  const savedChat = process.env.TELEGRAM_CHAT_ID;
  delete process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_CHAT_ID;
  const body = JSON.stringify(base);
  // Begona sayt: Origin so'ralgan Host bilan mos kelmaydi.
  const cross = await postRaw(route, body, { origin: 'https://evil.example', host: 'localhost' });
  assert.strictEqual(cross.status, 400);
  assert.strictEqual((await cross.json()).error, 'bad_json');

  // "text/plain" — begona sayt <form>/fetch bilan CORS preflight'siz yuborishi mumkin.
  const plain = await postRaw(route, body, { 'content-type': 'text/plain;charset=UTF-8' });
  assert.strictEqual(plain.status, 400);

  // O'zining Origin'i (Host bilan mos) — ruxsat etiladi.
  const same = await postRaw(route, body, { origin: 'http://localhost', host: 'localhost' });
  assert.strictEqual(same.status, 200);

  // Origin umuman yo'q (ko'p brauzer/mijoz) — ham ruxsat etiladi (faqat begonasi bloklanadi).
  const noOrigin = await postRaw(route, body);
  assert.strictEqual(noOrigin.status, 200);

  client.setDbForTests(undefined);
  if (savedToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
  else process.env.TELEGRAM_BOT_TOKEN = savedToken;
  if (savedChat === undefined) delete process.env.TELEGRAM_CHAT_ID;
  else process.env.TELEGRAM_CHAT_ID = savedChat;
});

test('7. Juda katta so\'rov tanasi — 413, server tanani oxirigacha o\'qimay to\'xtaydi', async () => {
  const { client, route } = await setup();
  client.setDbForTests(null);
  const huge = JSON.stringify({ ...base, message: 'x'.repeat(40 * 1024) }); // 32 KB limitdan katta
  const res = await postRaw(route, huge);
  assert.strictEqual(res.status, 413);
  assert.strictEqual((await res.json()).error, 'bad_json');
  client.setDbForTests(undefined);
});
