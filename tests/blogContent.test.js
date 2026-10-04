const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

/**
 * Blog matni parseri (`src/lib/blogContent.ts`) va haqiqiy kontent
 * (`data/content-2026.json`) mos kelishini tekshiradi.
 *
 * Nega child process: parser TypeScript'da yozilgan va sahifa komponenti
 * (React/Next importlari) ichida emas — shuning uchun uni toza modul sifatida
 * saqladik. Node'ning `--experimental-strip-types` bayrog'i TS tiplarni olib
 * tashlab, modulni to'g'ridan-to'g'ri yuklashga imkon beradi.
 *
 * Tekshiriladigan eng muhim xato: matn "paragraf:\n- element" ko'rinishida
 * yozilgan bo'lsa (ro'yxat paragrafga yopishgan), parser ro'yxatni oddiy
 * matn sifatida chiqarib qo'ymasligi kerak.
 */

const ROOT = path.join(__dirname, '..');
const PARSER_PATH = path.join(ROOT, 'src/lib/blogContent.ts');
const content = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/content-2026.json'), 'utf8'));

/** Parser'ni TS modul sifatida yuklab, matnni bloklarga ajratadi. */
function parseViaNode(text) {
  const script = `
    import { parseContent } from ${JSON.stringify(pathToFileURL(PARSER_PATH).href)};
    const text = JSON.parse(process.env.BLOG_TEXT);
    process.stdout.write(JSON.stringify(parseContent(text)));
  `;

  const stdout = execFileSync(
    process.execPath,
    ['--experimental-strip-types', '--input-type=module', '-e', script],
    {
      encoding: 'utf8',
      env: { ...process.env, BLOG_TEXT: JSON.stringify(text) },
      maxBuffer: 32 * 1024 * 1024,
    }
  );

  return JSON.parse(stdout);
}

test('1. sarlavhalar h2/h3 bloklariga aylanadi', () => {
  const text = '## Birinchi sarlavha\n\nOddiy paragraf.\n\n### Kichik sarlavha\n\nYana paragraf.';
  const blocks = parseViaNode(text);

  assert.deepStrictEqual(
    blocks.map((b) => b.kind),
    ['h2', 'p', 'h3', 'p']
  );
  assert.strictEqual(blocks[0].text, 'Birinchi sarlavha');
  assert.strictEqual(blocks[2].text, 'Kichik sarlavha');
});

test('2. ro‘yxat paragrafga yopishgan bo‘lsa ham ro‘yxat bo‘lib qoladi', () => {
  // Haqiqiy kontentda eng ko'p uchraydigan holat: "...quyidagilar:" dan keyingi
  // satrlar to'g'ridan-to'g'ri "- " bilan boshlanadi (orada bo'sh qator yo'q).
  const text = 'Uchta kanal ishlaydi:\n- Birinchi\n- Ikkinchi\n- Uchinchi';
  const blocks = parseViaNode(text);

  assert.deepStrictEqual(
    blocks.map((b) => b.kind),
    ['p', 'ul']
  );
  assert.deepStrictEqual(blocks[1].items, ['Birinchi', 'Ikkinchi', 'Uchinchi']);
});

test('3. iqtibos va ketma-ket paragraflar', () => {
  const text = 'Birinchi satr\nikkinchi satr.\n\n> Muhim fikr\n\nYakuniy paragraf.';
  const blocks = parseViaNode(text);

  assert.deepStrictEqual(
    blocks.map((b) => b.kind),
    ['p', 'quote', 'p']
  );
  // Paragraf ichidagi qator uzilishlari bo'sh joyga aylanadi (matn oqimi).
  assert.strictEqual(blocks[0].text, 'Birinchi satr ikkinchi satr.');
  assert.strictEqual(blocks[1].text, 'Muhim fikr');
});

test('4. haqiqiy kontentdagi barcha belgilar to‘g‘ri o‘qiladi', () => {
  for (const post of content.blog) {
    for (const locale of ['uz', 'ru']) {
      const text = post[locale].content;
      const blocks = parseViaNode(text);
      const where = `${post.slug}/${locale}`;

      const countInText = (prefix) =>
        text.split('\n').filter((line) => line.trim().startsWith(prefix)).length;
      const countInBlocks = (kind) => blocks.filter((b) => b.kind === kind).length;

      assert.strictEqual(countInBlocks('h2'), countInText('## '), `${where}: h2 soni mos emas`);
      assert.strictEqual(countInBlocks('h3'), countInText('### '), `${where}: h3 soni mos emas`);
      assert.strictEqual(countInBlocks('quote'), countInText('> '), `${where}: iqtibos soni mos emas`);

      // Har bir "- " satri ro'yxat ichida bo'lishi kerak — matn ichida
      // ko'rinib qolgan defis qolmasin.
      const bulletLines = countInText('- ');
      const bulletItems = blocks.filter((b) => b.kind === 'ul').reduce((sum, b) => sum + b.items.length, 0);
      assert.strictEqual(bulletItems, bulletLines, `${where}: ro'yxat elementlari soni mos emas`);
      assert.ok(bulletLines > 0, `${where}: ro'yxat umuman yo'q`);

      // Hech bir blokda xom belgi qolmasligi kerak.
      for (const block of blocks) {
        const value = block.kind === 'ul' ? block.items.join(' ') : block.text;
        assert.ok(!value.startsWith('#'), `${where}: blok "#" bilan boshlanadi`);
        assert.ok(!value.includes('\n'), `${where}: blok ichida satr uzilishi qoldi`);
      }
    }
  }
});

test('5. parser hujjatlashtirilgan formatda ishlaydi (bo‘sh matn, ortiqcha bo‘sh qatorlar)', () => {
  assert.deepStrictEqual(parseViaNode(''), []);
  assert.deepStrictEqual(parseViaNode('\n\n\n'), []);
  assert.deepStrictEqual(parseViaNode('Faqat matn'), [{ kind: 'p', text: 'Faqat matn' }]);
});
