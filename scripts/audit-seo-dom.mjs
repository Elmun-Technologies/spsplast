#!/usr/bin/env node
/**
 * SSR HTML auditi (Stage 6): SEO + DOM + kontent qoidalari.
 *
 * Ishlatish:
 *   npm run build && npm run start     # yoki npm run dev
 *   npm run audit:seo                  # http://127.0.0.1:3000 ni tekshiradi
 *   AUDIT_ORIGIN=https://sps-uz.vercel.app npm run audit:seo
 *
 * Nima qiladi: `scripts/lib/routes.mjs` dagi har bir manzilni yuklaydi,
 * `scripts/lib/dom-rules.mjs` qoidalarini qo'llaydi, sahifadagi JS/CSS/rasm
 * og'irligini o'lchaydi va natijani `docs/audits/seo-dom-<sana>.md` ga yozadi.
 * Xato bo'lsa exit code 1 (CI'da ishlatish mumkin).
 *
 * Cheklov: bu statik HTML tekshiruvi — brauzer kerak bo'lgan narsalar
 * (gorizontal scroll, kontrast, LCP/CLS) `scripts/visual/*` va Lighthouse'da.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { JSDOM } from 'jsdom';

import { AUDIT_ROUTES, SITE_ORIGIN, SITE_URL } from './lib/routes.mjs';
import { auditDocument } from './lib/dom-rules.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'docs', 'audits');

/** JS to'plami uchun og'irlik chegaralari (First Load JS, gzip'siz). */
const JS_WARN_BYTES = 200 * 1024;
const JS_ERROR_BYTES = 400 * 1024;
const IMAGE_WARN_BYTES = 400 * 1024;

async function fetchText(url) {
  const response = await fetch(url);
  return { status: response.status, headers: response.headers, body: await response.text() };
}

/** Sahifadagi ichki JS/CSS manbalarining umumiy hajmi. */
async function measureAssets(doc, origin, out, routePath) {
  // `nomodule` skriptlar (Next polyfills) zamonaviy brauzerlarda yuklanmaydi —
  // ularni alohida hisoblaymiz, aks holda byudjet 40 KB ga sun'iy oshadi.
  const sources = new Set();
  const legacySources = new Set();
  for (const script of doc.querySelectorAll('script[src]')) {
    const src = script.getAttribute('src');
    if (!src || !src.startsWith('/')) continue;
    if (script.hasAttribute('nomodule')) legacySources.add(src);
    else sources.add(src);
  }
  for (const link of doc.querySelectorAll('link[rel="stylesheet"][href]')) {
    const href = link.getAttribute('href');
    if (href && href.startsWith('/')) sources.add(href);
  }

  let total = 0;
  let legacyTotal = 0;
  const sizes = [];

  const measure = async (src, isLegacy) => {
    try {
      // Siqish so'raladi: Next `compress: true` bilan gzip/br qaytaradi, bizga
      // esa tarmoq orqali ketadigan hajm kerak (Lighthouse "transfer size").
      const response = await fetch(`${origin}${src}`, {
        headers: { 'accept-encoding': 'gzip, deflate, br' },
      });
      if (!response.ok) {
        out.errors.push(`${routePath}: resurs ${response.status} qaytardi: ${src}`);
        return;
      }
      // Node'ning fetch'i javobni o'zi ochadi (decompress) va `content-length`
      // ni yo'qotadi, shuning uchun tarmoq hajmini o'zimiz gzip bilan hisoblaymiz
      // (Lighthouse "transfer size" ga yaqin; brotli bundan kichik bo'ladi).
      const raw = Buffer.from(await response.arrayBuffer());
      const bytes = gzipSync(raw).length;
      if (isLegacy) legacyTotal += bytes;
      else total += bytes;
      sizes.push([src, raw.length, bytes, isLegacy]);
    } catch (error) {
      out.warnings.push(`${routePath}: resurs o'lchanmadi (${src}): ${error.message}`);
    }
  };

  for (const src of sources) await measure(src, false);
  for (const src of legacySources) await measure(src, true);

  if (total > JS_ERROR_BYTES) {
    out.errors.push(`${routePath}: JS+CSS gzip ${(total / 1024).toFixed(0)} KB (limit ${JS_ERROR_BYTES / 1024} KB)`);
  } else if (total > JS_WARN_BYTES) {
    out.warnings.push(`${routePath}: JS+CSS gzip ${(total / 1024).toFixed(0)} KB (chegara ${JS_WARN_BYTES / 1024} KB)`);
  }

  // Katta rasmlar (LCP va mobil trafik).
  for (const img of doc.querySelectorAll('img[src^="/"]')) {
    const src = img.getAttribute('src');
    if (src.startsWith('/_next/image')) continue;
    const file = path.join(ROOT, 'public', src);
    if (!fs.existsSync(file)) {
      out.errors.push(`${routePath}: rasm fayli yo'q: ${src}`);
      continue;
    }
    const bytes = fs.statSync(file).size;
    if (bytes > IMAGE_WARN_BYTES) {
      out.warnings.push(`${routePath}: rasm ${(bytes / 1024).toFixed(0)} KB — ${src}`);
    }
  }

  return { total, legacyTotal, count: sources.size, legacyCount: legacySources.size, sizes };
}

function markdown(results, assetTotals) {
  const errors = results.flatMap((r) => r.out.errors);
  const warnings = results.flatMap((r) => r.out.warnings);
  const notes = results.flatMap((r) => r.out.notes);
  const today = new Date().toISOString().slice(0, 10);

  const lines = [
    '# SSR HTML auditi (SEO + DOM + kontent)',
    '',
    `> Sana: ${today} · manba: \`${SITE_ORIGIN}\` · sayt: \`${SITE_URL}\``,
    `> Marshrutlar: ${results.length} · xato: **${errors.length}** · ogohlantirish: **${warnings.length}** · qayd: ${notes.length}`,
    '> Generator: `npm run audit:seo` (`scripts/audit-seo-dom.mjs` + `scripts/lib/dom-rules.mjs`).',
    '',
    '## Xulosa',
    '',
    errors.length ? 'Xatolar bor — quyidagi ro\'yxatni tuzatish kerak.' : '**Xato yo\'q** — barcha qoidalar bajarildi.',
    '',
  ];

  if (errors.length) {
    lines.push('## Xatolar', '');
    for (const item of errors) lines.push(`- ${item}`);
    lines.push('');
  }
  if (warnings.length) {
    lines.push('## Ogohlantirishlar', '');
    for (const item of warnings) lines.push(`- ${item}`);
    lines.push('');
  }
  if (notes.length) {
    lines.push('## Qaydlar', '');
    for (const item of notes) lines.push(`- ${item}`);
    lines.push('');
  }

  lines.push(
    "## Sahifa og'irligi (JS + CSS, gzip)",
    '',
    '`nomodule` (eski brauzerlar uchun polyfills) alohida hisoblangan — zamonaviy brauzer uni yuklamaydi.',
    '',
    '| Manzil | Fayl | Zamonaviy | Legacy (nomodule) |',
    '|---|---|---|---|',
  );
  for (const [routePath, totals] of assetTotals) {
    lines.push(`| \`${routePath}\` | ${totals.count} | ${(totals.total / 1024).toFixed(0)} KB | ${(totals.legacyTotal / 1024).toFixed(0)} KB |`);
  }
  lines.push('');

  lines.push('## Tekshirilgan qoidalar', '', [
    'title (10–65 belgi) va meta description (50–170), til mosligi',
    'bitta canonical, hreflang uz/ru/en/x-default (mutlaq URL)',
    'meta robots: noindex faqat compare/request/404 da',
    'OpenGraph + Twitter kartochka, og:locale va og:url',
    'bitta h1, sarlavha ierarxiyasi sakramaydi',
    '<html lang>, meta viewport, charset',
    'img: alt, o\'lcham (CLS), format (WebP), birinchi rasm lazy emas',
    'havolalar: til prefiksi, o\'chirilgan marshrut yo\'q, tel: E.164, target=_blank rel=noopener',
    'forma maydonlari nomlangan, honeypot aria-hidden, action faqat /api/leads',
    'JSON-LD: @context/@type, Product/Breadcrumb/FAQ/LocalBusiness/WebSite talablari, **narx yo\'q**',
    'kontent: "yarat" yo\'q, narx (son + valyuta) yo\'q, placeholder\'lar qayd etiladi',
    'JS+CSS hajmi (200 KB ogohlantirish / 400 KB xato), rasm fayllari mavjud',
  ].map((line) => `- ${line}`), '');

  return lines.join('\n');
}

async function main() {
  const results = [];
  const assetTotals = [];

  for (const route of AUDIT_ROUTES) {
    const url = `${SITE_ORIGIN}${route.path}`;
    const out = { errors: [], warnings: [], notes: [] };
    let status = 0;

    try {
      const response = await fetch(url, { redirect: 'manual' });
      status = response.status;
      const expectedStatus = route.expect.status || 200;

      if (status !== expectedStatus) {
        out.errors.push(`${route.path}: status ${status} (kutilgan ${expectedStatus})`);
      }

      if (route.expect.redirectTo) {
        const location = response.headers.get('location') || '';
        const target = location.replace(SITE_ORIGIN, '').replace(/^https:\/\/sps\.uz/, '');
        if (!target.startsWith(route.expect.redirectTo)) {
          out.errors.push(`${route.path}: redirect "${location}" != "${route.expect.redirectTo}"`);
        }
        results.push({ route: route.path, status, out, skipped: 'redirect' });
        continue;
      }

      if (status !== 200 && status !== 404) {
        results.push({ route: route.path, status, out, skipped: `status ${status}` });
        continue;
      }

      const html = await response.text();
      const dom = new JSDOM(html, { url: `${SITE_URL}${route.path}` });
      const doc = dom.window.document;

      const audit = auditDocument({
        doc,
        url,
        path: route.path,
        lang: route.lang,
        siteUrl: SITE_URL,
        // SSR <html lang> cheklovi CLAUDE.md'da yozilgan (yagona root layout).
        expect: { ...route.expect, allowLangMismatch: true },
      });
      out.errors.push(...audit.errors);
      out.warnings.push(...audit.warnings);
      out.notes.push(...audit.notes);

      const totals = await measureAssets(doc, SITE_ORIGIN, out, route.path);
      assetTotals.push([route.path, totals]);
      results.push({ route: route.path, status, out });
    } catch (error) {
      out.errors.push(`${route.path}: yuklanmadi — ${error.message}`);
      results.push({ route: route.path, status, out });
    }
  }

  const errors = results.flatMap((r) => r.out.errors);
  const warnings = results.flatMap((r) => r.out.warnings);
  const notes = results.flatMap((r) => r.out.notes);

  for (const result of results) {
    const mark = result.out.errors.length ? 'XATO' : result.out.warnings.length ? 'OGOHL' : '  ok ';
    const detail = [...result.out.errors, ...result.out.warnings].slice(0, 3).join(' | ');
    console.log(`${mark} ${String(result.status).padEnd(3)} ${result.route.padEnd(46)} ${detail.slice(0, 150)}`);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `seo-dom-${new Date().toISOString().slice(0, 10)}.md`);
  fs.writeFileSync(file, markdown(results, assetTotals));

  console.log(`\nmarshrutlar: ${results.length} · xato: ${errors.length} · ogohlantirish: ${warnings.length} · qayd: ${notes.length}`);
  console.log(`hisobot: ${path.relative(ROOT, file)}`);

  if (errors.length) {
    console.error('\nXATOLAR:');
    for (const item of errors) console.error(` - ${item}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
