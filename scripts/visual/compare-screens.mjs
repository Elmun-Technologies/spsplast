#!/usr/bin/env node
/**
 * Vizual tekshiruv (Stage 6): Playwright bilan 390 va 1440 px skrinshotlar.
 *
 * Ishlatish (brauzer kerak — sandbox'da yo'q, shuning uchun lokalda/Vercel'da):
 *   npm run build && npm run start          # yoki npm run dev
 *   npx playwright install chromium         # bir marta
 *   npm run shots                           # screenshots + hisobot
 *
 * Nima qiladi:
 *  1. `scripts/lib/routes.mjs` dagi SHOT_PLAN bo'yicha har bir ekranning
 *     mobil (390×844, DPR 2) va desktop (1440×900) suratini oladi;
 *  2. gorizontal scroll yo'qligini tekshiradi (va aybdor elementlarni topadi);
 *  3. suratni `docs/design-handoff/screens/{mobile,desktop,i18n}` dagi etalon
 *     bilan juftlaydi va `docs/audits/visual-<sana>.md` hisobotini yozadi
 *     (inson ko'zi bilan solishtirish uchun); `pixelmatch` o'rnatilgan bo'lsa,
 *     piksel farqi foizini ham hisoblaydi.
 *
 * Suratlarga ulanish: `AUDIT_ORIGIN=https://sps-uz.vercel.app npm run shots`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { SHOT_PLAN, VIEWPORTS, SITE_ORIGIN } from '../lib/routes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = path.join(ROOT, 'screens-actual');
const REF_DIR = path.join(ROOT, 'docs', 'design-handoff', 'screens');
const REPORT_DIR = path.join(ROOT, 'docs', 'audits');

/**
 * Interaktiv holatlar (maketdagi 02-menyu, 04-filtr, 05-zayafka-oynasi).
 *
 * Eslatma: Playwright strict rejimida ishlaydi — `page.click(sel)` bittadan ortiq
 * element topilsa xato beradi (kartochkada tugma ko'p). Shuning uchun hamma yerda
 * `locator(...).first()` va qisqa timeout; xato bo'lsa, holat hisobotga yoziladi va
 * surat baribir olinadi (sahifa asosiy holatda qoladi).
 */
async function act(page, selector, options = {}) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: 'visible', timeout: 8000 });
  await locator.click({ timeout: 8000, ...options });
  return locator;
}

const ACTIONS = {
  async menu(page) {
    await act(page, 'a.hd-burger');
    await page.locator('#sps-mobile-menu').first().waitFor({ state: 'visible', timeout: 8000 });
  },
  async filters(page) {
    await act(page, 'button.hide-1100');
    await page.locator('.fsheet').first().waitFor({ state: 'visible', timeout: 8000 });
  },
  async quickLead(page) {
    await act(page, '.sps-card__foot .sps-btn--primary');
    await page.locator('.sps-modal[role="dialog"]').first().waitFor({ state: 'visible', timeout: 8000 });
  },
  // Ro'yxat/solishtirish sahifalari bo'sh holatda emas, to'ldirilgan holatda
  // suratga olinadi (maketda shunday). Slug'lar qattiq yozilmaydi — haqiqiy
  // katalogdan olinadi (`seedModels()`), aks holda ma'lumot o'zgarganda
  // suratlar bo'sh holatni ko'rsatib qo'yadi.
  async seedCompare(page) {
    const slugs = seedModels().map((m) => m.slug).slice(0, 2);
    await page.evaluate((value) => {
      window.localStorage.setItem('sps_compare', JSON.stringify(value));
    }, slugs);
    await page.reload({ waitUntil: 'networkidle' });
  },
  async seedRequest(page) {
    const items = seedModels().slice(0, 3).map((m, i) => ({
      slug: m.slug,
      code: m.code,
      name: m.name.uz,
      m2: [120, 80, 45][i] ?? 50,
    }));
    await page.evaluate((value) => {
      window.localStorage.setItem('sps_request', JSON.stringify(value));
    }, items);
    await page.reload({ waitUntil: 'networkidle' });
  },
};

/**
 * Solishtirish/ro'yxat suratlari uchun haqiqiy modellar: rasmi bor ilk 3 ta.
 * Format `src/lib/store/spsLists.ts` dagi `RequestItem`/`sps_compare` bilan bir xil.
 */
let cachedSeeds = null;
function seedModels() {
  if (cachedSeeds) return cachedSeeds;
  const file = path.join(ROOT, 'data', 'models-2027.json');
  const models = JSON.parse(fs.readFileSync(file, 'utf8')).models || [];
  cachedSeeds = models.filter((m) => m.images && m.images.scene).slice(0, 3);
  if (cachedSeeds.length < 2) {
    cachedSeeds = models.slice(0, 3); // rasmlar kam bo'lsa ham holat to'ldiriladi
  }
  return cachedSeeds;
}

/** Gorizontal scroll va uni keltirib chiqargan elementlar. */
async function measureOverflow(page) {
  return page.evaluate(() => {
    const viewport = window.innerWidth;
    const width = document.documentElement.scrollWidth;
    const offenders = [];
    if (width > viewport) {
      for (const el of document.querySelectorAll('body *')) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0) continue;
        if (rect.right > viewport + 1 || rect.left < -1) {
          offenders.push({
            selector: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).join('.')}` : ''),
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
          });
        }
        if (offenders.length >= 8) break;
      }
    }
    return { viewport, width, overflow: width - viewport, offenders };
  });
}

/**
 * Tegish maydoni (HANDOFF 7: barcha tugma va linklar ≥ 44px).
 *
 * Maket CSS'i ba'zi kichik boshqaruvlarni 36–40px qiladi (`source/site.css`:
 * `.chip` 40px, `.sps-btn--sm` 36px) — bu HANDOFF'ning o'zi bilan zid, shuning
 * uchun hisobot aniq ro'yxat beradi: biznes qaror qiladi (vizual aniqliqmi yoki
 * 44px tegish maydoni).
 */
async function measureTapTargets(page) {
  return page.evaluate(() => {
    const out = [];
    const nodes = document.querySelectorAll('a[href], button, input, select, textarea, [role="button"]');
    for (const el of nodes) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.top > window.innerHeight * 3) continue; // pastdagi kontentni sanamaymiz
      if (rect.height < 44 || rect.width < 44) {
        const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
        out.push({
          selector: `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}`,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40),
        });
      }
    }
    return out;
  });
}

/** Etalon faylni topadi (mobile/desktop/i18n papkalaridan). */
function findReference(id, kind) {
  const candidates = kind === 'mobile'
    ? [path.join(REF_DIR, 'mobile', `${id}.jpg`), path.join(REF_DIR, 'i18n', `${id}.jpg`)]
    : [path.join(REF_DIR, 'desktop', `${id}.jpg`), path.join(REF_DIR, 'i18n', `${id}.jpg`)];
  return candidates.find((file) => fs.existsSync(file)) || null;
}

/** pixelmatch ixtiyoriy: o'rnatilgan bo'lsa piksel farqini hisoblaydi. */
export async function pixelDiff(actualPng, refJpg) {
  try {
    // pngjs — CommonJS: `default` bu butun eksport obyekti, shuning uchun
    // klassni nom bilan olamiz (`PNG.sync.read`), aks holda undefined bo'ladi.
    const [{ default: pixelmatch }, { PNG }, sharpModule] = await Promise.all([
      import('pixelmatch'),
      import('pngjs'),
      import('sharp').catch(() => null),
    ]);
    const sharp = sharpModule ? (sharpModule.default || sharpModule) : null;
    if (!sharp || !pixelmatch || !PNG) return null;

    const actual = PNG.sync.read(fs.readFileSync(actualPng));
    const refBuffer = await sharp(refJpg).resize(actual.width, actual.height, { fit: 'fill' }).png().toBuffer();
    const ref = PNG.sync.read(refBuffer);

    const diff = new PNG({ width: actual.width, height: actual.height });
    const mismatched = pixelmatch(actual.data, ref.data, diff.data, actual.width, actual.height, { threshold: 0.25 });
    return { percent: (mismatched / (actual.width * actual.height)) * 100 };
  } catch {
    return null; // kutubxona yo'q yoki format mos kelmadi — hisobotda "-"
  }
}

function markdown(rows, overflows, tapTargets, actionErrors, pageErrors) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    '# Vizual tekshiruv: 390 / 1440 px',
    '',
    `> Sana: ${today} · manba: \`${SITE_ORIGIN}\` · Playwright chromium`,
    `> Ekranlar: ${rows.length} · gorizontal scroll: **${overflows.length ? overflows.length + " ta" : "yo'q"}**`,
    '',
    '## Gorizontal scroll',
    '',
    overflows.length
      ? overflows.map((o) => `- **${o.id} (${o.kind})**: scrollWidth ${o.width} > viewport ${o.viewport} (+${o.overflow}px) — ${o.offenders.slice(0, 3).map((x) => `\`${x.selector}\``).join(', ')}`).join('\n')
      : "Hech bir ekranda gorizontal scroll yo'q (390 va 1440 px).",
    '',
    '## Screenshot ↔ etalon juftligi',
    '',
    '| Ekran | Oʻlcham | Haqiqiy surat | Etalon (HANDOFF) | Piksel farqi |',
    '|---|---|---|---|---|',
  ];

  for (const row of rows) {
    lines.push(`| ${row.id} | ${row.kind} ${row.viewport} | \`${path.relative(ROOT, row.file)}\` | ${row.ref ? `\`${path.relative(ROOT, row.ref)}\`` : '— (etalon yo\'q)'} | ${row.diff === null ? '—' : `${row.diff.toFixed(1)}%`} |`);
  }

  lines.push('## Sahifa/holat xatolari', '');
  if (actionErrors.length || pageErrors.length) {
    for (const item of pageErrors) lines.push(`- **${item.id} (${item.kind})**: sahifa ochilmadi — ${item.message}`);
    for (const item of actionErrors) lines.push(`- **${item.id} (${item.kind})**: \`${item.action}\` holati ochilmadi — ${item.message}`);
  } else {
    lines.push("Yo'q: barcha sahifalar ochildi, interaktiv holatlar (menyu, filtr, tez zayafka, to'ldirilgan ro'yxatlar) ishladi.");
  }

  lines.push('', '## Tegish maydoni 44px dan kichik (mobil 390px)', '');
  if (tapTargets.length) {
    const counts = new Map();
    for (const group of tapTargets) {
      for (const item of group.items) {
        const key = `${item.selector} — ${item.width}×${item.height}px`;
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    lines.push('| Element | Oʻlcham | Uchrash |', '|---|---|---|');
    for (const [key, count] of [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25)) {
      const [selector, size] = key.split(' — ');
      lines.push(`| \`${selector}\` | ${size} | ${count} |`);
    }
    lines.push(
      '',
      'Izoh: maket CSS\'i (`source/site.css`) `.chip` ni 40px, `.sps-btn--sm` ni 36px qiladi —',
      'HANDOFF 7 ning "\u2265 44px" talabi bilan zid. Qaror docs/unresolved-questions.md da.',
    );
  } else {
    lines.push("Barcha boshqaruvlar ≥ 44px.");
  }

  lines.push(
    '',
    '## Qanday o\'qish kerak',
    '',
    '- Piksel farqi **yo\'nalish beruvchi**: etalonlar JPG (siqilgan) va boshqa DPR\'da olingan,',
    '  shuning uchun 0% hech qachon chiqmaydi. Muhimi — tartib, bloklar nisbati, rang va tipografika.',
    '- `pixelmatch`/`pngjs`/`sharp` o\'rnatilmagan bo\'lsa, ustun "—" bo\'ladi: fayllarni yonma-yon',
    '  ochib ko\'z bilan solishtiring (`screens-actual/` va `docs/design-handoff/screens/`).',
    '- Suratlarni qayta olish: `npm run shots` (server ishlab turgan bo\'lsin).',
    '',
  );

  return lines.join('\n');
}

export async function main() {
  const howto = [
    'Brauzer topilmadi. Ishga tushirish:',
    '  npm i -D playwright && npx playwright install chromium',
    '  npm run build && npm run start',
    '  npm run shots',
  ];

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.log('Playwright o\'rnatilmagan.');
    console.log(howto.join('\n'));
    process.exitCode = 0;
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    // Paket bor, lekin brauzer fayllari yuklanmagan (CI'da `playwright install`
    // qadami kerak; lokalda ham xuddi shunday). Xato bilan yiqilmasdan,
    // tushunarli yo'riqnoma chiqaramiz.
    console.log(`Chromium ishga tushmadi: ${String(error.message).split('\n')[0]}`);
    console.log(howto.join('\n'));
    process.exitCode = 0;
    return;
  }
  const rows = [];
  const overflows = [];
  const tapTargets = [];
  const actionErrors = [];
  const pageErrors = [];

  for (const shot of SHOT_PLAN) {
    for (const kind of ['mobile', 'desktop']) {
      if (!shot[kind]) continue;

      const viewport = VIEWPORTS[kind];
      const context = await browser.newContext({ ...viewport, locale: shot.path.slice(1, 3) === 'ru' ? 'ru-RU' : shot.path.slice(1, 3) === 'en' ? 'en-US' : 'uz-UZ' });
      const page = await context.newPage();

      try {
        await page.goto(`${SITE_ORIGIN}${shot.path}`, { waitUntil: 'networkidle' });
        if (shot.action && ACTIONS[shot.action]) {
          try {
            await ACTIONS[shot.action](page);
          } catch (error) {
            // Holat ochilmadi (selector o'zgargan bo'lishi mumkin): surat asosiy
            // holatda baribir olinadi, xato esa hisobotga va exit code'ga tushadi.
            actionErrors.push({ id: shot.id, kind, action: shot.action, message: String(error.message).split('\n')[0] });
            console.log(`HOLAT  ${shot.id} (${kind}): "${shot.action}" ochilmadi — ${String(error.message).split('\n')[0]}`);
          }
        }
        await page.waitForTimeout(400); // shrift/animatsiya barqarorlashuvi

        const file = path.join(OUT_DIR, `${shot.id}-${kind}.png`);
        await page.screenshot({ path: file, fullPage: true });

        const overflow = await measureOverflow(page);
        if (overflow.overflow > 0) {
          overflows.push({ id: shot.id, kind, ...overflow });
        }

        if (kind === 'mobile') {
          const small = await measureTapTargets(page);
          if (small.length) tapTargets.push({ id: shot.id, path: shot.path, items: small });
        }

        const ref = findReference(shot.id, kind);
        const diff = ref ? await pixelDiff(file, ref) : null;
        rows.push({ id: shot.id, kind, viewport: `${viewport.width}×${viewport.height}`, file, ref, diff: diff ? diff.percent : null });
        console.log(`${overflow.overflow > 0 ? 'SCROLL' : '  ok  '} ${shot.id.padEnd(26)} ${kind.padEnd(8)} ${overflow.overflow > 0 ? `+${overflow.overflow}px` : ''}`);
      } catch (error) {
        const message = String(error.message).split('\n')[0];
        rows.push({ id: shot.id, kind, viewport: `${viewport.width}×${viewport.height}`, file: `xato: ${message}`, ref: findReference(shot.id, kind), diff: null });
        pageErrors.push({ id: shot.id, kind, message });
        console.log(`XATO   ${shot.id} (${kind}): ${message}`);
      } finally {
        await context.close();
      }
    }
  }

  // HANDOFF 7: 360–390 px oralig'ida ham gorizontal scroll bo'lmasligi kerak.
  const narrow = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true });
  const narrowPage = await narrow.newPage();
  const narrowOverflows = [];
  for (const shot of SHOT_PLAN) {
    try {
      await narrowPage.goto(`${SITE_ORIGIN}${shot.path}`, { waitUntil: 'networkidle' });
      const overflow = await measureOverflow(narrowPage);
      if (overflow.overflow > 0) narrowOverflows.push({ id: shot.id, kind: '360px', ...overflow });
    } catch (error) {
      pageErrors.push({ id: shot.id, kind: '360px', message: String(error.message).split('\n')[0] });
    }
  }
  await narrow.close();

  await browser.close();

  const file = path.join(REPORT_DIR, `visual-${new Date().toISOString().slice(0, 10)}.md`);
  fs.writeFileSync(file, markdown(rows, [...overflows, ...narrowOverflows], tapTargets, actionErrors, pageErrors));
  console.log(`\nsuratlar: ${OUT_DIR} (${rows.length} fayl)`);
  console.log(`hisobot: ${path.relative(ROOT, file)}`);

  const failures = overflows.length + pageErrors.length + actionErrors.length;
  if (overflows.length) {
    console.error(`\nGORIZONTAL SCROLL TOPILDI (${overflows.length}):`);
    for (const o of overflows) console.error(` - ${o.id} (${o.kind}) +${o.overflow}px`);
  }
  if (pageErrors.length || actionErrors.length) {
    console.error(`\nSAHIFA/HOLAT XATOLARI (${pageErrors.length + actionErrors.length}):`);
    for (const e of [...pageErrors, ...actionErrors]) console.error(` - ${e.id} (${e.kind}): ${e.message}`);
  }
  if (failures) process.exitCode = 1;
}

// Modul test'dan import qilinganda (pixelDiff'ni sinash uchun) ishga tushmasligi kerak.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
