/**
 * Test yordamchisi: `@/...` aliasli TypeScript modullarni Node'da ishga
 * tushirish.
 *
 * Nega kerak: ilova kodi `@/lib/...` aliasidan foydalanadi (tsconfig paths),
 * Node esa uni bilmaydi. Shuning uchun modul va uning bog'liqliklari vaqtinchalik
 * papkaga (`/.tmp-tests`) nusxalanadi, alias importlari nisbiy yo'lga
 * almashtiriladi va `--experimental-strip-types` orqali import qilinadi.
 *
 * Muhim: bu faqat test uchun — `src/` dagi fayllar o'zgarmaydi. Natijada
 * testlar haqiqiy `sitemap.ts` / `robots.ts` / `seo.ts` kodini chaqiradi
 * (manba matnini regex bilan tekshirish emas).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '..', '..');
/**
 * Har bir test jarayoni o'z papkasida (`.tmp-tests/<pid>`): `node --test` fayllarni
 * parallel yuritadi, va umumiy papkada bir fayl oxiridagi `cleanupTmp()` boshqa
 * fayl hali import qilayotgan nusxalarni o'chirib yuborardi (ERR_MODULE_NOT_FOUND,
 * CI'da tasodifiy yiqilish). Papka ROOT ichida qoladi — `node_modules` topiladi.
 */
const TMP_BASE = path.join(ROOT, '.tmp-tests');
const TMP_ROOT = path.join(TMP_BASE, String(process.pid));
// cleanupTmp() chaqirmagan test fayllari ham o'z papkasini qoldirmasin.
process.once('exit', () => {
  try {
    fs.rmSync(TMP_ROOT, { recursive: true, force: true });
    fs.rmdirSync(TMP_BASE);
  } catch {
    /* boshqa jarayon papkasi hali bor yoki allaqachon o'chirilgan */
  }
});

/** `@/lib/x`, `./y`, `../z` specini haqiqiy faylga aylantiradi. */
function resolveSpec(spec, fromFile) {
  const base = spec.startsWith('@/')
    ? path.join(ROOT, 'src', spec.slice(2))
    : path.resolve(path.dirname(fromFile), spec);

  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null; // JSON, .css yoki node_modules — tegmaymiz
}

const materialized = new Map();

/** Faylni TMP ga ko'chiradi (alias/nisbiy importlarni qayta yozib). */
function materialize(absFile) {
  if (materialized.has(absFile)) return materialized.get(absFile);

  const rel = path.relative(ROOT, absFile);
  const tmpFile = path.join(TMP_ROOT, rel);
  materialized.set(absFile, tmpFile); // rekursiyada tsikl bo'lmasligi uchun

  const source = fs.readFileSync(absFile, 'utf8');
  const rewritten = source.replace(
    /(from\s+|import\s*\(\s*)(['"])([^'"]+)\2/g,
    (match, prefix, quote, spec) => {
      // `next/server` kabi subpath'lar: Next paketida `exports` xaritasi yo'q, Node ESM esa
      // kengaytmasiz CJS faylni topolmaydi — `next/server.js` ga aylantiramiz (route testlari).
      if (/^next\/[a-z-]+$/.test(spec) && fs.existsSync(path.join(ROOT, 'node_modules', `${spec}.js`))) {
        return `${prefix}${quote}${spec}.js${quote}`;
      }
      if (!spec.startsWith('@/') && !spec.startsWith('.')) return match; // bare: next, react...
      const target = resolveSpec(spec, absFile);
      if (!target) return match;
      const targetTmp = materialize(target);
      let next = path.relative(path.dirname(tmpFile), targetTmp).split(path.sep).join('/');
      if (!next.startsWith('.')) next = `./${next}`;
      return `${prefix}${quote}${next}${quote}`;
    },
  );

  fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
  fs.writeFileSync(tmpFile, rewritten);
  return tmpFile;
}

/**
 * `src/lib/seo.ts` kabi aliasli modulni yuklaydi.
 * Har bir chaqiruv yangi nusxa qaytaradi (module cache'ni chetlab o'tadi).
 */
export async function loadAliased(relativePath) {
  const abs = path.join(ROOT, relativePath);
  if (!fs.existsSync(abs)) throw new Error(`fayl yo'q: ${relativePath}`);
  fs.mkdirSync(TMP_ROOT, { recursive: true });
  const tmpFile = materialize(abs);
  return import(`${pathToFileURL(tmpFile).href}?run=${process.pid}-${Date.now()}`);
}

/** Shu jarayonning vaqtinchalik papkasini tozalash (test fayli oxirida chaqiriladi). */
export function cleanupTmp() {
  fs.rmSync(TMP_ROOT, { recursive: true, force: true });
  materialized.clear();
  // Boshqa jarayonlar papkalari qolmagan bo'lsa — umumiy papkani ham olib tashlaymiz.
  try {
    fs.rmdirSync(TMP_BASE);
  } catch {
    /* bo'sh emas yoki yo'q — parallel fayllar hali ishlayapti */
  }
}
