// Audit 2026-11-02, 3-bosqich (3.3): mijoz sharhlari — texnik tayyorgarlik (PGlite ustida).
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
let ctx;
async function setup() {
  if (ctx) return ctx;
  const { pathToFileURL } = await import('node:url');
  const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const schema = await load('src/server/db/schema.ts');
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: path.join(ROOT, 'drizzle') });
  ctx = { db, testimonials: await load('src/server/testimonials.ts') };
  return ctx;
}

const EMPTY_LOC = { uz: null, ru: null, en: null };

test('1. saveTestimonial: UZ ism/matn majburiy, baho 1-5 oralig\'ida', async () => {
  const { db, testimonials } = await setup();
  const noName = await testimonials.saveTestimonial(db, null, {
    authorName: EMPTY_LOC,
    authorRole: null,
    text: { uz: 'Matn', ru: null, en: null },
    rating: null,
    sort: 100,
    visible: true,
  });
  assert.match(noName, /ismi/);

  const noText = await testimonials.saveTestimonial(db, null, {
    authorName: { uz: 'Ism', ru: null, en: null },
    authorRole: null,
    text: EMPTY_LOC,
    rating: null,
    sort: 100,
    visible: true,
  });
  assert.match(noText, /matni/);

  const badRating = await testimonials.saveTestimonial(db, null, {
    authorName: { uz: 'Ism', ru: null, en: null },
    authorRole: null,
    text: { uz: 'Matn', ru: null, en: null },
    rating: 6,
    sort: 100,
    visible: true,
  });
  assert.match(badRating, /1 dan 5 gacha/);
});

test('2. saveTestimonial/listTestimonials: tartib bo\'yicha, yangilash ishlaydi', async () => {
  const { db, testimonials } = await setup();
  const err1 = await testimonials.saveTestimonial(db, null, {
    authorName: { uz: 'Birinchi', ru: null, en: null },
    authorRole: null,
    text: { uz: 'Sharh 1', ru: null, en: null },
    rating: 5,
    sort: 20,
    visible: true,
  });
  assert.strictEqual(err1, null);
  const err2 = await testimonials.saveTestimonial(db, null, {
    authorName: { uz: 'Ikkinchi', ru: 'Второй', en: null },
    authorRole: { uz: 'Lavozim', ru: null, en: null },
    text: { uz: 'Sharh 2', ru: null, en: null },
    rating: null,
    sort: 10,
    visible: false,
  });
  assert.strictEqual(err2, null);

  const rows = await testimonials.listTestimonials(db);
  assert.strictEqual(rows.length, 2);
  // sort=10 oldin keladi (sort, keyin id bo'yicha).
  assert.strictEqual(rows[0].authorName.uz, 'Ikkinchi');
  assert.strictEqual(rows[0].visible, false);
  assert.strictEqual(rows[1].authorName.uz, 'Birinchi');
  assert.strictEqual(rows[1].rating, 5);

  const id = rows[1].id;
  const errUpdate = await testimonials.saveTestimonial(db, id, {
    authorName: { uz: 'Birinchi (tahrir)', ru: null, en: null },
    authorRole: null,
    text: { uz: 'Sharh 1', ru: null, en: null },
    rating: 4,
    sort: 20,
    visible: true,
  });
  assert.strictEqual(errUpdate, null);
  const after = await testimonials.listTestimonials(db);
  const updated = after.find((r) => r.id === id);
  assert.strictEqual(updated.authorName.uz, 'Birinchi (tahrir)');
  assert.strictEqual(updated.rating, 4);
});

test('3. deleteTestimonial: qatorni o\'chiradi', async () => {
  const { db, testimonials } = await setup();
  const before = await testimonials.listTestimonials(db);
  const id = before[0].id;
  await testimonials.deleteTestimonial(db, id);
  const after = await testimonials.listTestimonials(db);
  assert.strictEqual(after.length, before.length - 1);
  assert.ok(!after.some((r) => r.id === id));
});

test('4. testimonials2027.ts: lang fallback uz-ga, aggregateRating faqat bahosi borlarni sanaydi', async () => {
  const { pathToFileURL } = await import('node:url');
  const lib = await import(pathToFileURL(path.join(ROOT, 'src/lib/testimonials2027.ts')).href);
  const items = [
    { id: 1, authorName: { uz: 'Ism UZ', ru: 'Имя RU', en: null }, authorRole: null, text: { uz: 'Matn UZ', ru: null, en: null }, rating: 4 },
    { id: 2, authorName: { uz: 'Ism2', ru: null, en: null }, authorRole: { uz: 'Lavozim', ru: null, en: null }, text: { uz: 'Matn2', ru: null, en: null }, rating: null },
  ];
  assert.strictEqual(lib.testimonialAuthorName(items[0], 'ru'), 'Имя RU');
  assert.strictEqual(lib.testimonialAuthorName(items[0], 'en'), 'Ism UZ');
  assert.strictEqual(lib.testimonialText(items[0], 'en'), 'Matn UZ');
  assert.strictEqual(lib.testimonialAuthorRole(items[0], 'uz'), null);
  assert.strictEqual(lib.testimonialAuthorRole(items[1], 'uz'), 'Lavozim');

  const rating = lib.aggregateRating(items);
  assert.deepStrictEqual(rating, { ratingValue: '4.0', reviewCount: 1 });
  assert.strictEqual(lib.aggregateRating([items[1]]), null, 'bahosi bo\'lmasa aggregateRating null');
  assert.strictEqual(lib.getTestimonials().length, 0, 'DATABASE_URL bo\'lmagan testda snapshot null — bo\'sh massiv');
});

test('5. video2027.ts: faqat YouTube/Vimeo havolasidan embed URL yasaydi', async () => {
  const { pathToFileURL } = await import('node:url');
  const lib = await import(pathToFileURL(path.join(ROOT, 'src/lib/video2027.ts')).href);
  assert.strictEqual(lib.factoryVideoEmbedUrl(), null, "sozlama kiritilmaganda null");
});

test("6. Admin sahifasi va actions requireUser() chaqiradi (testimonials)", () => {
  const fs = require('node:fs');
  const page = fs.readFileSync(path.join(ROOT, 'src/app/admin/testimonials/page.tsx'), 'utf8');
  assert.match(page, /requireUser\(/);
  const actions = fs.readFileSync(path.join(ROOT, 'src/app/admin/testimonials/actions.ts'), 'utf8');
  const fns = actions.match(/export async function \w+[\s\S]*?\n}/g) || [];
  assert.ok(fns.length >= 2);
  for (const fn of fns) assert.match(fn, /requireUser\(/);
  // Audit 2026-11-02: hech qanday forma `id` nomli hidden input ishlatmasin (form.id to'qnashuvi).
  assert.doesNotMatch(
    fs.readFileSync(path.join(ROOT, 'src/app/admin/testimonials/TestimonialForm.tsx'), 'utf8'),
    /name="id"/,
  );
});
