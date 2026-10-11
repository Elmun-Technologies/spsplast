#!/usr/bin/env node
/**
 * a11y auditi (Stage 6): axe-core + jsdom.
 *
 * Ishlatish:
 *   npm run build && npm run start
 *   npm run audit:a11y
 *
 * Nima qiladi: `scripts/lib/routes.mjs` dagi har bir sahifaning SSR HTML'ini
 * yuklaydi va axe-core qoidalarini qo'llaydi. Natija `docs/audits/a11y-<sana>.md`
 * ga yoziladi; `critical`/`serious` darajadagi buzilishlar exit code 1 beradi.
 *
 * Cheklov (jsdom haqiqiy brauzer emas):
 *  - rang kontrasti va tegish maydoni (target-size) o'lchanmaydi — bular
 *    Lighthouse/Playwright tekshiruvida (`npm run lighthouse`, `npm run shots`);
 *  - gidratatsiyadan keyingi holat (modal oynalar, filtr sheet) tekshirilmaydi,
 *    faqat server qaytargan HTML.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

import { AUDIT_ROUTES, SITE_ORIGIN, SITE_URL } from './lib/routes.mjs';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'docs', 'audits');
const AXE_SOURCE = fs.readFileSync(require.resolve('axe-core'), 'utf8');

/** jsdom'da ishlamaydigan qoidalar ( layout/geometry talab qiladi). */
const DISABLED_RULES = ['color-contrast', 'target-size'];

async function runAxe(html, url) {
  const dom = new JSDOM(html, {
    url,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  dom.window.eval(AXE_SOURCE);

  const results = await dom.window.axe.run(dom.window.document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
    rules: Object.fromEntries(DISABLED_RULES.map((id) => [id, { enabled: false }])),
  });

  dom.window.close();
  return results;
}

function markdown(rows) {
  const today = new Date().toISOString().slice(0, 10);
  const violations = rows.flatMap((row) => row.violations.map((v) => ({ ...v, path: row.path })));
  const serious = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');

  const lines = [
    '# a11y auditi (axe-core + jsdom)',
    '',
    `> Sana: ${today} · manba: \`${SITE_ORIGIN}\` · qoidalar: WCAG 2.1 AA + best-practice`,
    `> Sahifalar: ${rows.length} · buzilish: **${violations.length}** (jiddiy: ${serious.length}) · to'liq tekshiruv: ${rows.reduce((sum, r) => sum + r.passes, 0)} qoida`,
    `> O'chirilgan qoidalar (jsdom layout bilmaydi): ${DISABLED_RULES.join(', ')} — ular Lighthouse'da tekshiriladi.`,
    '',
    serious.length
      ? '## Jiddiy buzilishlar (tuzatish shart)'
      : '## Jiddiy buzilishlar yo\'q',
    '',
  ];

  if (serious.length) {
    for (const v of serious) {
      lines.push(`- **[${v.impact}] \`${v.id}\`** — ${v.help} · ${v.path} (${v.nodes} element)`);
      lines.push(`  - ${v.helpUrl}`);
      for (const target of v.targets.slice(0, 3)) lines.push(`  - \`<${target}>\``);
    }
    lines.push('');
  }

  const minor = violations.filter((v) => v.impact !== 'critical' && v.impact !== 'serious');
  if (minor.length) {
    lines.push('## Kichik buzilishlar / ogohlantirishlar', '');
    for (const v of minor) {
      lines.push(`- [${v.impact || 'minor'}] \`${v.id}\` — ${v.help} · ${v.path} (${v.nodes} element)`);
    }
    lines.push('');
  }

  lines.push('## Sahifalar kesimi', '', '| Manzil | Status | Buzilish | O\'tgan qoidalar |', '|---|---|---|---|');
  for (const row of rows) {
    lines.push(`| \`${row.path}\` | ${row.status} | ${row.violations.length} | ${row.passes} |`);
  }
  lines.push('');

  return lines.join('\n');
}

async function main() {
  const rows = [];

  for (const route of AUDIT_ROUTES) {
    const url = `${SITE_ORIGIN}${route.path}`;
    let response;
    try {
      response = await fetch(url, { redirect: 'manual' });
    } catch (error) {
      console.log(`XATO  --- ${route.path.padEnd(46)} yuklanmadi: ${error.message}`);
      rows.push({ path: route.path, status: 0, passes: 0, violations: [{ id: 'fetch', impact: 'critical', help: error.message, nodes: 0, targets: [], helpUrl: '' }] });
      continue;
    }

    if (response.status !== 200 && response.status !== 404) {
      continue; // redirect'lar DOM emas
    }

    const html = await response.text();
    const results = await runAxe(html, `${SITE_URL}${route.path}`);

    const violations = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
      targets: v.nodes.slice(0, 3).map((n) => String(n.target && n.target[0] ? n.target[0] : '').replace(/\s+/g, ' ').slice(0, 110)),
    }));

    const worst = violations.some((v) => v.impact === 'critical' || v.impact === 'serious') ? 'XATO' : violations.length ? 'OGOHL' : '  ok ';
    const summary = violations.slice(0, 2).map((v) => `${v.id}(${v.nodes})`).join(', ');
    console.log(`${worst} ${String(response.status).padEnd(3)} ${route.path.padEnd(46)} ${summary}`);

    rows.push({ path: route.path, status: response.status, passes: results.passes.length, violations });
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `a11y-${new Date().toISOString().slice(0, 10)}.md`);
  fs.writeFileSync(file, markdown(rows));

  const all = rows.flatMap((r) => r.violations);
  const serious = all.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  console.log(`\nsahifalar: ${rows.length} · buzilish: ${all.length} (jiddiy: ${serious.length}) · o'tgan qoidalar: ${rows.reduce((s, r) => s + r.passes, 0)}`);
  console.log(`hisobot: ${path.relative(ROOT, file)}`);

  if (serious.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
