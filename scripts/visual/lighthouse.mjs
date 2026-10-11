#!/usr/bin/env node
/**
 * Lighthouse tekshiruvi (Stage 6, HANDOFF 7).
 *
 * Ishlatish (Chrome kerak — agent sandbox'ida yo'q, CI/lokalda bor):
 *   npm run build && npm run start
 *   npm run lighthouse                      # mobil + desktop, JSON + hisobot
 *   LH_ORIGIN=https://sps-uz.vercel.app npm run lighthouse   # Vercel preview
 *
 * Byudjet (HANDOFF 7): mobil Performance ≥ 90, Accessibility ≥ 95,
 * Best-practices ≥ 95, SEO = 100; desktop Performance ≥ 95.
 *
 * Hisobotda nafaqat ballar, balki **ballni tushirgan aniq auditlar** ham chiqadi
 * (id + sarlavha + displayValue) — shunda "SEO 92" kabi natijani sababsiz
 * qoldirmaymiz. Performance uchun LCP elementi va eng katta imkoniyatlar
 * (overallSavingsMs bo'yicha) ham ko'rsatiladi.
 *
 * Natijalar: `docs/audits/lighthouse/<manzil>-<rejim>.json` va
 * `docs/audits/lighthouse-<sana>.md`. Byudjet buzilsa exit 1.
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

/** Ballni tushiradigan auditlarni qaysi kategoriyalardan yig'amiz. */
const DETAIL_CATEGORIES = ['seo', 'accessibility', 'best-practices'];

function runLighthouse(url, formFactor, outFile) {
  const args = [
    '--yes', 'lighthouse', url,
    '--quiet',
    '--output=json',
    `--output-path=${outFile}`,
    '--only-categories=performance,accessibility,best-practices,seo',
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

/** Kategoriyadagi ballni tushirgan auditlar (score < 1). */
function failedAudits(report, category) {
  const cat = report.categories && report.categories[category];
  if (!cat) return [];
  const out = [];
  for (const ref of cat.auditRefs || []) {
    const audit = report.audits[ref.id];
    if (!audit || audit.score === null || audit.score === undefined) continue;
    if (audit.score >= 1) continue;
    out.push({
      id: ref.id,
      weight: ref.weight ?? 0,
      title: audit.title,
      score: Math.round(audit.score * 100),
      displayValue: audit.displayValue || '',
      items: describeItems(audit).slice(0, 4),
    });
  }
  return out.sort((a, b) => b.weight - a.weight);
}

/** Audit natijasidagi muhim elementlarni qisqa matnga aylantiradi. */
function describeItems(audit) {
  const rows = [];
  // Ba'zi auditlarda `details.items` massiv emas (obyekt yoki undefined) —
  // shuning uchun tekshirib olamiz, aks holda butun yurish yiqiladi.
  const raw = audit.details ? audit.details.items : null;
  const items = Array.isArray(raw) ? raw : [];
  for (const item of items) {
    if (!item) continue;
    const node = item.node && (item.node.snippet || item.node.selector);
    const savings = item.overallSavingsMs || item.wastedMs || item.totalBytes;
    const text = item.url || item.source || item.label || item.description || item.text || '';
    const parts = [String(text).slice(0, 90)];
    if (node) parts.push(String(node).slice(0, 70));
    if (savings) parts.push(typeof savings === 'number' && savings > 10000 ? `${Math.round(savings / 1024)} KB` : `${Math.round(savings)} ms`);
    // image-aspect-ratio kabi auditlarda sababni ko'rsatadigan qo'shimcha maydonlar
    for (const key of ['displayedAspectRatio', 'actualAspectRatio', 'explanation', 'label']) {
      if (item[key] && String(item[key]) !== String(text)) parts.push(`${key}: ${String(item[key]).replace(/\s+/g, ' ').slice(0, 70)}`);
    }
    rows.push(parts.filter(Boolean).join(' · '));
  }
  if (!rows.length && audit.details && audit.details.type === 'table' && audit.details.headings) {
    rows.push(audit.details.headings.map((h) => h.text).join(', '));
  }
  return rows;
}

/** LCP elementi va eng katta performance imkoniyatlari. */
function perfDetails(report) {
  const out = { lcpElement: '', opportunities: [], diagnostics: [] };

  const lcpElement = report.audits['largest-contentful-paint-element'];
  if (lcpElement && lcpElement.details && lcpElement.details.items && lcpElement.details.items[0]) {
    const item = lcpElement.details.items[0];
    const node = item.node || (item.items && item.items[0] && item.items[0].node);
    if (node) out.lcpElement = `${node.snippet || ''} ${node.selector || ''}`.trim().slice(0, 140);
  }

  for (const ref of (report.categories.performance.auditRefs || [])) {
    const audit = report.audits[ref.id];
    if (!audit || audit.score === null || audit.score >= 0.9) continue;
    const savings = audit.numericValue || (audit.details && audit.details.overallSavingsMs) || 0;
    const entry = `${audit.title}${audit.displayValue ? ` (${audit.displayValue})` : ''}${savings ? ` · ~${Math.round(savings)} ms` : ''}`;
    if (ref.group === 'load-opportunities') out.opportunities.push(entry);
    else out.diagnostics.push(entry);
  }
  out.opportunities = out.opportunities.slice(0, 6);
  out.diagnostics = out.diagnostics.slice(0, 6);
  return out;
}

/** perfDetails xatosi butun hisobotni yo'q qilmasin. */
function safePerf(report) {
  try {
    return perfDetails(report);
  } catch (error) {
    return { lcpElement: `tahlil xatosi: ${error.message}`, opportunities: [], diagnostics: [] };
  }
}

function markdown(results, failures) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [
    '# Lighthouse hisoboti',
    '',
    `> Sana: ${today} · manba: \`${ORIGIN}\` · rejimlar: mobil (throttled) + desktop`,
    '> Byudjet (HANDOFF 7): mobil perf \u2265 90, desktop perf \u2265 95, a11y \u2265 95, best-practices \u2265 95, SEO = 100',
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

  // Performance tafsilotlari (LCP elementi + imkoniyatlar) — hisobot boshiga
  // yaqin joyda: CI izohida kesilmasligi kerak.
  const perfRows = results.filter((r) => r.formFactor === 'mobile' && r.perf && (r.perf.lcpElement || r.perf.opportunities.length || r.perf.diagnostics.length));
  if (perfRows.length) {
    lines.push('', '## Mobil performance tafsilotlari', '');
    for (const row of perfRows) {
      lines.push(`### \`${row.path}\` — perf ${row.performance} (LCP ${row.lcp}, TBT ${row.tbt})`, '');
      if (row.perf.lcpElement) lines.push(`- LCP elementi: \`${row.perf.lcpElement}\``);
      for (const item of row.perf.opportunities) lines.push(`- Imkoniyat: ${item}`);
      for (const item of row.perf.diagnostics) lines.push(`- Diagnostika: ${item}`);
      lines.push('');
    }
  }

  // Ballni tushirgan aniq auditlar — sababini ko'rsatish uchun.
  lines.push('', '## Ballni tushirgan auditlar (score < 1)', '');
  const detailed = results.filter((r) => r.failed.length);
  if (!detailed.length) {
    lines.push('Barcha kategoriyalarda auditlar to\'liq o\'tgan.');
  }
  for (const row of detailed) {
    lines.push(`### \`${row.path}\` — ${row.formFactor}`, '');
    for (const item of row.failed) {
      lines.push(`- **${item.category} / ${item.id}** (score ${item.score}, weight ${item.weight}) — ${item.title}${item.displayValue ? ` · ${item.displayValue}` : ''}`);
      for (const detail of item.items) lines.push(`  - ${detail}`);
    }
    lines.push('');
  }

  lines.push(
    '## Qayta ishga tushirish',
    '',
    '```bash',
    'npm run build && npm run start',
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

      const failed = [];
      for (const category of DETAIL_CATEGORIES) {
        try {
          for (const item of failedAudits(report, category)) failed.push({ category, ...item });
        } catch (error) {
          failed.push({ category, id: '(tahlil xatosi)', weight: 0, score: 0, title: String(error.message), displayValue: '', items: [] });
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
        failed,
        perf: formFactor === 'mobile' ? safePerf(report) : null,
      });
      console.log(`perf ${scores.performance} · a11y ${scores.accessibility} · bp ${scores.bestPractices} · seo ${scores.seo}${failed.length ? ` · buzilgan audit: ${failed.length}` : ''}`);
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
