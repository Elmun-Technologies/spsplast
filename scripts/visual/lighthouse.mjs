#!/usr/bin/env node
/**
 * Lighthouse tekshiruvi (Stage 6, HANDOFF 7).
 *
 * Ishlatish (Chrome kerak — sandbox'da yo'q, lokalda yoki CI'da):
 *   npm run build && npm run start
 *   npm i -D lighthouse                     # yoki: npx --yes lighthouse ...
 *   npm run lighthouse                      # mobil + desktop, JSON + hisobot
 *   LH_ORIGIN=https://sps-uz.vercel.app npm run lighthouse   # Vercel preview
 *
 * Byudjet (hisobotda tekshiriladi):
 *   mobil:  Performance ≥ 90, Accessibility ≥ 95, Best practices ≥ 95, SEO ≥ 95
 *   desktop: Performance ≥ 95, qolganlari ≥ 95
 *
 * Natijalar: `docs/audits/lighthouse/<manzil>-<rejim>.json` va
 * `docs/audits/lighthouse-<sana>.md` (jamlanma jadval). Byudjet buzilsa exit 1.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = path.join(ROOT, 'docs', 'audits', 'lighthouse');
const ORIGIN = process.env.LH_ORIGIN || process.env.AUDIT_ORIGIN || 'http://127.0.0.1:3000';

/** Tekshiriladigan manzillar (asosiy foydalanuvchi yo'llari). */
const TARGETS = [
  { id: 'home', path: '/uz' },
  { id: 'catalog', path: '/uz/catalog' },
  { id: 'section', path: '/uz/catalog/paving' },
  { id: 'model', path: '/uz/catalog/paving/01-monako' },
  { id: 'partners', path: '/uz/partners' },
  { id: 'production', path: '/uz/production' },
  { id: 'contact', path: '/uz/contact' },
  { id: 'home-ru', path: '/ru' },
];

// HANDOFF 7: mobil Performance ≥ 90, Accessibility ≥ 95, SEO 100.
const BUDGETS = {
  mobile: { performance: 0.9, accessibility: 0.95, 'best-practices': 0.95, seo: 1.0 },
  desktop: { performance: 0.95, accessibility: 0.95, 'best-practices': 0.95, seo: 1.0 },
};

const METRICS = [
  ['first-contentful-paint', 'FCP'],
  ['largest-contentful-paint', 'LCP'],
  ['total-blocking-time', 'TBT'],
  ['cumulative-layout-shift', 'CLS'],
  ['speed-index', 'SI'],
];

function runLighthouse(url, formFactor, outFile) {
  const args = [
    '--yes', 'lighthouse', url,
    '--quiet',
    '--output=json',
    `--output-path=${outFile}`,
    `--only-categories=performance,accessibility,best-practices,seo`,
    '--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage',
  ];
  if (formFactor === 'desktop') {
    args.push('--preset=desktop');
  } else {
    args.push('--form-factor=mobile', '--screenEmulation.mobile', '--throttlingMethod=simulate');
  }

  const result = spawnSync('npx', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.error) throw new Error(`lighthouse ishga tushmadi: ${result.error.message}`);
  if (result.status !== 0) {
    const message = (result.stderr || result.stdout || '').split('\n').filter(Boolean).slice(-3).join(' | ');
    throw new Error(message || `lighthouse exit ${result.status}`);
  }
  return JSON.parse(fs.readFileSync(outFile, 'utf8'));
}

function score(report, category) {
  const value = report.categories && report.categories[category] ? report.categories[category].score : null;
  return value === null ? null : Math.round(value * 100);
}

function metric(report, id) {
  const audit = report.audits && report.audits[id];
  if (!audit) return '—';
  return typeof audit.displayValue === 'string' ? audit.displayValue : String(audit.numericValue ?? '—');
}

function markdown(results, failures) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    '# Lighthouse hisoboti',
    '',
    `> Sana: ${today} · manba: \`${ORIGIN}\` · rejimlar: mobil (throttled) + desktop`,
    `> Byudjet (HANDOFF 7): mobil perf ≥ 90, desktop perf ≥ 95, a11y ≥ 95, best-practices ≥ 95, SEO = 100`,
    `> Yurishlar: ${results.length} · byudjet buzilishi: **${failures.length}**`,
    '',
    '## Ballar',
    '',
    '| Sahifa | Rejim | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS |',
    '|---|---|---|---|---|---|---|---|---|---|',
  ];

  for (const row of results) {
    lines.push(`| \`${row.path}\` | ${row.formFactor} | ${row.performance} | ${row.accessibility} | ${row.bestPractices} | ${row.seo} | ${row.fcp} | ${row.lcp} | ${row.tbt} | ${row.cls} |`);
  }

  lines.push('', '## Byudjet buzilishlari', '');
  if (failures.length) {
    for (const item of failures) lines.push(`- ${item}`);
  } else {
    lines.push("Yo'q — barcha ballar byudjet ichida.");
  }

  lines.push(
    '',
    '## Qayta ishga tushirish',
    '',
    '```bash',
    'npm run build && npm run start',
    'npm i -D lighthouse        # bir marta',
    'npm run lighthouse         # yoki LH_ORIGIN=https://<vercel-preview> npm run lighthouse',
    '```',
    '',
    'Xom JSON natijalar: `docs/audits/lighthouse/*.json` (git\'ga tushmaydi — hajmi katta).',
    '',
  );

  return lines.join('\n');
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = [];
  const failures = [];

  for (const target of TARGETS) {
    for (const formFactor of ['mobile', 'desktop']) {
      const url = `${ORIGIN}${target.path}`;
      const outFile = path.join(OUT_DIR, `${target.id}-${formFactor}.json`);
      process.stdout.write(`${target.path} (${formFactor}) ... `);

      let report;
      try {
        report = runLighthouse(url, formFactor, outFile);
      } catch (error) {
        console.log(`XATO: ${error.message}`);
        failures.push(`${target.path} (${formFactor}): yurish bajarilmadi — ${error.message}`);
        // Birinchi yurishdayoq muhit yo'q bo'lsa (Chrome/Lighthouse o'rnatilmagan),
        // qolgan 15 ta urinishni bekorga sarflamaymiz.
        if (results.length === 0 && failures.length === 1) {
          console.log('\nLighthouse/Chrome topilmadi. O\'rnatish:');
          console.log('  npm i -D lighthouse');
          console.log('  npx puppeteer browsers install chrome   # yoki tizimdagi Chrome ishlatiladi');
          process.exitCode = 1;
          return;
        }
        continue;
      }

      const scores = {
        performance: score(report, 'performance'),
        accessibility: score(report, 'accessibility'),
        bestPractices: score(report, 'best-practices'),
        seo: score(report, 'seo'),
      };

      for (const [category, minimum] of Object.entries(BUDGETS[formFactor])) {
        const key = category === 'best-practices' ? 'bestPractices' : category;
        const value = scores[key];
        if (value === null || value < minimum * 100) {
          failures.push(`${target.path} (${formFactor}): ${category} = ${value} (byudjet ${Math.round(minimum * 100)})`);
        }
      }

      results.push({
        path: target.path,
        formFactor,
        ...scores,
        fcp: metric(report, 'first-contentful-paint'),
        lcp: metric(report, 'largest-contentful-paint'),
        tbt: metric(report, 'total-blocking-time'),
        cls: metric(report, 'cumulative-layout-shift'),
      });
      console.log(`perf ${scores.performance} · a11y ${scores.accessibility} · bp ${scores.bestPractices} · seo ${scores.seo}`);
    }
  }

  const reportPath = path.join(ROOT, 'docs', 'audits', `lighthouse-${new Date().toISOString().slice(0, 10)}.md`);
  fs.writeFileSync(reportPath, markdown(results, failures));
  console.log(`\nhisobot: ${path.relative(ROOT, reportPath)}`);
  console.log(`yurishlar: ${results.length} · byudjet buzilishi: ${failures.length}`);

  if (failures.length) {
    console.error('\nBUZILISHLAR:');
    for (const item of failures) console.error(` - ${item}`);
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
