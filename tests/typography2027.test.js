// O'zbekcha tipografiya (2026-11-12): bir matnda uch xil apostrof (', ’, ‘) aralash edi.
// Qoida: o‘/g‘ — U+2018 (‘), tutuq (ma’lumot, WhatsApp’da) — U+2019 (’). ASCII ' faqat kodda.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const WRONG = /[A-Za-z](?:\\?'|ʻ|ʼ)[a-z]/g;
const WRONG_OG = /[oOgG]’[a-z]/g; // o’/g’ — noto'g'ri belgi (‘ bo'lishi kerak)

/** Faqat satr literallari (izohlar emas): '...', "...", `...`. */
function literals(src) {
  const noComments = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  return noComments.match(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g) || [];
}

test("uz lug'atlarida apostrof bir xil (o‘, g‘ — ‘; tutuq — ’)", () => {
  for (const rel of ['src/dictionaries/ui/uz.ts', 'src/dictionaries/pages/uz.ts', 'src/dictionaries/pagesServer/uz.ts']) {
    const bad = [];
    for (const lit of literals(fs.readFileSync(path.join(ROOT, rel), 'utf8'))) {
      for (const m of [...(lit.match(WRONG) || []), ...(lit.match(WRONG_OG) || [])]) bad.push(`${m} — ${lit.slice(0, 60)}`);
    }
    assert.deepStrictEqual(bad, [], `${rel}: ASCII/noto'g'ri apostrof`);
  }
});

test('model nomlari (uz) ham tipografik apostrof bilan', () => {
  const models = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/models-2027.json'), 'utf8')).models;
    // /g bayrog'isiz nusxa: `.test()` lastIndex'ni saqlamasin.
  const re = new RegExp(`${WRONG.source}|${WRONG_OG.source}`);
  const bad = models.filter((m) => re.test(m.name.uz || '')).map((m) => m.name.uz);
  assert.deepStrictEqual(bad, []);
});
