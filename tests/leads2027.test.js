// Bosqich 4: /api/leads shartnomasi (HANDOFF 5) — sxema, honeypot, rate limit,
// requestId formati, Telegram xabari va maxfiylik.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const route = read('src/app/api/leads/route.ts');
const telegram = read('src/lib/telegram.ts');

test('1. Zayafka turlari faqat quick | list | partners', () => {
  assert.match(route, /z\.enum\(\['quick', 'list', 'partners'\]\)/);
  assert.ok(!/z\.enum\(\[[^\]]*'cart'/s.test(route), "savat ('cart') turi bo'lmasligi kerak");
});

test('2. Telefon xatosi `bad_phone`, boshqalari `validation`', () => {
  assert.match(route, /bad_phone/, 'bad_phone kodi yo\'q');
  assert.match(route, /phoneOnly/, 'telefon xatosi ajratilmaydi');
  assert.match(route, /isValidIntlPhone/, 'xalqaro telefon tekshiruvi yo\'q');
});

test('3. Honeypot: `website` to\'ldirilsa soxta ok, Telegram yuborilmaydi', () => {
  const idx = route.indexOf('data.website');
  assert.ok(idx > 0, 'honeypot tekshiruvi yo\'q');
  const block = route.slice(idx, idx + 300);
  assert.match(block, /ok: true/, 'honeypot soxta ok qaytarmaydi');
  // Soxta javobdan keyin Telegram chaqiruvi bo\'lmasligi kerak
  assert.ok(!/sendTelegramNotification/.test(block), 'honeypotda Telegram yuborilmoqda');
  assert.match(route, /sendTelegramNotification/, 'asosiy oqimda Telegram chaqiruvi yo\'q');
});

test('4. Rate limit sozlanishi mavjud', () => {
  const rl = read('src/lib/rateLimit.ts');
  assert.match(rl, /export function/, 'rateLimit eksporti yo\'q');
  assert.match(route, /rate_limit/, '429 holati qaytarilmaydi');
  assert.match(route, /429/);
});

test('5. requestId formati SPS-YYMM-NNNN', () => {
  assert.match(route, /SPS-/, 'requestId prefiksi yo\'q');
  const lib = route.match(/requestId[\s\S]{0,200}/);
  assert.ok(lib, 'requestId generatsiyasi topilmadi');
  assert.match(route, /\d{4}|padStart/, 'NNNN qismi yo\'q');
});

test('6. Telegram xabari HTML-escape qilinadi va havolalar bosiladigan', () => {
  assert.match(telegram, /escapeTelegramHtml/, 'escape funksiyasi yo\'q');
  assert.match(telegram, /parse_mode/, 'parse_mode yuborilmaydi');
  // Telefon va WhatsApp havolalari xabar matnida (route quradi)
  assert.match(route, /tel:/, 'tel: havolasi yo\'q');
  assert.match(route, /wa\.me/, 'WhatsApp havolasi yo\'q');
});

test('7. Maxfiy qiymatlar faqat env orqali (kodda token yo\'q)', () => {
  for (const rel of ['src/app/api/leads/route.ts', 'src/lib/telegram.ts', 'src/lib/rateLimit.ts']) {
    const source = read(rel);
    assert.ok(!/\d{8,10}:[A-Za-z0-9_-]{30,}/.test(source), `${rel}: bot tokeni kodda`);
    assert.ok(!/sk-[A-Za-z0-9]{20,}/.test(source), `${rel}: API kalit kodda`);
  }
  assert.match(telegram, /process\.env\.TELEGRAM_BOT_TOKEN/, 'token env dan olinmaydi');
  assert.match(telegram, /process\.env\.TELEGRAM_CHAT_ID/, 'chat ID env dan olinmaydi');
});

test('8. Faqat ruxsat etilgan API marshrutlari mavjud', () => {
  const api = fs.readdirSync(path.join(ROOT, 'src/app/api'));
  assert.deepStrictEqual(api.filter((n) => !n.startsWith('.')).sort(), ['health', 'leads']);
});

test('9. Analitika voqealari zayafka wrapper\'ida', () => {
  const submit = read('src/lib/leadSubmit.ts');
  assert.match(submit, /trackLeadSent/, 'leadSubmit generate_lead yubormaydi');
  const analytics = read('src/lib/analytics.ts');
  assert.match(analytics, /lead_type/, 'lead_type parametri yo\'q');
  assert.match(analytics, /request_id/, 'request_id parametri yo\'q');
});
