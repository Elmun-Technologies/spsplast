const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Blog va loyihalar kontenti (prisma/data/content-2026.json) uchun sifat
 * tekshiruvi.
 *
 * `prisma/seed.js` shu faylni to'g'ridan-to'g'ri bazaga yozadi, ya'ni bu
 * yerdagi xato faqat `npm run db:seed` paytida (yoki undan yomoni —
 * productionda) bilinadi. Tekshiruvlar:
 *
 *  1. majburiy maydonlar bo'sh emas;
 *  2. slug'lar takrorlanmaydi va URL uchun xavfsiz;
 *  3. muqova hamda "oldin/keyin" rasmlari `public/` ichida haqiqatan bor;
 *  4. matnda parser qo'llamaydigan belgilar (**qalin**, [havola], `kod`) yo'q —
 *     aks holda maqola sahifasida ular yulduzcha/havola sifatida ko'rinib qoladi.
 */

const ROOT = path.join(__dirname, '..');
const content = JSON.parse(fs.readFileSync(path.join(ROOT, 'prisma/data/content-2026.json'), 'utf8'));

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LOCALES = ['uz', 'ru'];

/** Blog sahifasidagi mini-parser qo'llaydigan blok belgilari. */
const BLOCK_MARKERS = /^(#{2,3} |> |- )/;

test('1. kontent tuzilishi: blog va loyihalar mavjud', () => {
  assert.ok(Array.isArray(content.blog), 'content.blog massiv emas');
  assert.ok(Array.isArray(content.projects), 'content.projects massiv emas');
  assert.ok(content.blog.length >= 6, `kamida 6 maqola kutilgan, ${content.blog.length} bor`);
  assert.ok(content.projects.length >= 6, `kamida 6 loyiha kutilgan, ${content.projects.length} bor`);
});

test('2. blog slug va muqova rasmi', () => {
  const seen = new Set();
  for (const post of content.blog) {
    assert.ok(SLUG_RE.test(post.slug), `slug URL uchun xavfsiz emas: ${post.slug}`);
    assert.ok(!seen.has(post.slug), `slug takrorlangan: ${post.slug}`);
    seen.add(post.slug);

    assert.match(post.coverImage, /^\/media\/blog\/.+\.jpg$/, `muqova yo'li noto'g'ri: ${post.coverImage}`);
    assert.ok(
      fs.existsSync(path.join(ROOT, 'public', post.coverImage)),
      `muqova fayli topilmadi: ${post.coverImage} (scripts/build-media.py ishga tushirilganmi?)`
    );

    for (const locale of LOCALES) {
      const localized = post[locale];
      assert.ok(localized, `${post.slug}: ${locale} tarjimasi yo'q`);
      assert.ok(localized.title && localized.title.length > 10, `${post.slug}/${locale}: sarlavha juda qisqa`);
      assert.ok(localized.excerpt && localized.excerpt.length > 40, `${post.slug}/${locale}: tavsif juda qisqa`);
      assert.ok(localized.content && localized.content.length > 800, `${post.slug}/${locale}: matn juda qisqa`);
      assert.ok(/^## /m.test(localized.content), `${post.slug}/${locale}: matnda "## " sarlavha yo'q`);
    }
  }
});

test('3. blog matni faqat parser qo‘llaydigan belgilardan foydalanadi', () => {
  // Parser (src/app/[lang]/blog/[slug]/page.tsx) faqat "## ", "### ", "- " va "> "
  // ni tushunadi. Qolgan markdown belgilari matnda yulduzcha bo'lib ko'rinadi.
  const forbidden = [
    [/\*\*/, 'qalin matn (**)'],
    [/\]\(/, 'havola (](...) )'],
    [/`/, 'kod (`)'],
    [/^\s*\*\s/m, 'yulduzcha ro‘yxat (*)'],
    [/^\s*\d+\.\s/m, 'raqamli ro‘yxat (1.)'],
  ];

  for (const post of content.blog) {
    for (const locale of LOCALES) {
      const text = post[locale].content;
      for (const [pattern, label] of forbidden) {
        assert.ok(
          !pattern.test(text),
          `${post.slug}/${locale}: ${label} ishlatilgan — parser uni ko‘rsatmaydi`
        );
      }
    }
  }
});

test('4. loyihalar: oldin/keyin rasmlari va tavsiflar', () => {
  const seen = new Set();
  for (const project of content.projects) {
    assert.ok(SLUG_RE.test(project.slug), `loyiha slug'i xavfsiz emas: ${project.slug}`);
    assert.ok(!seen.has(project.slug), `loyiha slug'i takrorlangan: ${project.slug}`);
    seen.add(project.slug);

    for (const key of ['beforeImage', 'afterImage']) {
      const image = project[key];
      assert.match(image, /^\/media\/projects\/.+\.jpg$/, `${project.slug}: ${key} yo'li noto'g'ri`);
      assert.ok(
        fs.existsSync(path.join(ROOT, 'public', image)),
        `${project.slug}: ${key} fayli topilmadi (${image})`
      );
    }
    assert.notStrictEqual(project.beforeImage, project.afterImage, `${project.slug}: oldin/keyin bir xil rasm`);

    assert.ok(project.location && project.location.length > 3, `${project.slug}: joylashuv bo'sh`);
    assert.ok(project.productUsed && project.productUsed.length > 3, `${project.slug}: mahsulot turi bo'sh`);

    for (const locale of LOCALES) {
      assert.ok(project[locale]?.title?.length > 10, `${project.slug}/${locale}: sarlavha juda qisqa`);
      assert.ok(project[locale]?.description?.length > 60, `${project.slug}/${locale}: tavsif juda qisqa`);
    }
  }
});

test('5. ishlab chiqarish galereyasi rasmlari joyida', () => {
  // src/app/[lang]/production/page.tsx shu fayllarni ko'rsatadi.
  const productionDir = path.join(ROOT, 'public/media/production');
  assert.ok(fs.existsSync(productionDir), 'public/media/production katalogi yo‘q');

  const page = fs.readFileSync(path.join(ROOT, 'src/app/[lang]/production/page.tsx'), 'utf8');
  const referenced = [...page.matchAll(/'(\/media\/production\/[^']+)'/g)].map((m) => m[1]);
  assert.ok(referenced.length >= 10, `galereyada ${referenced.length} rasm — kamida 10 kutilgan`);

  for (const image of referenced) {
    assert.ok(fs.existsSync(path.join(ROOT, 'public', image)), `galereya rasmi topilmadi: ${image}`);
  }
});
