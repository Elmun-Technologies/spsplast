#!/usr/bin/env node
/**
 * Build boshida: bazadagi (admin panel) katalog va integratsiya sozlamalarini
 * `src/data/site.generated.ts` ga yozadi — sayt statik qoladi, lekin admin'dagi
 * o'zgarishlar "Nashr qilish" (Vercel Deploy Hook → yangi build) bilan saytga chiqadi.
 *
 * DATABASE_URL bo'lmasa yoki baza javob bermasa — fayl tegilmaydi (git'dagi `null`),
 * sayt statik katalog + env bilan yig'iladi. Build hech qachon shu sababli yiqilmaydi,
 * faqat `SNAPSHOT_REQUIRED=1` bo'lsa (productionda tavsiya) xato beradi.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'src/data/site.generated.ts');
/** Validator (validate-models-2027.mjs) shu nusxani tekshiradi; snapshot bo'lmasa o'chiriladi. */
const OUT_JSON = path.join(ROOT, '.snapshot.json');
const url = process.env.DATABASE_URL;
const required = process.env.SNAPSHOT_REQUIRED === '1';

function write(snapshot) {
  const body = `// GENERATED at build time by scripts/export-snapshot.mjs from the database (admin panel).
// In git this stays \`null\`: the site then uses the static catalog (src/data/models2027.ts)
// and env variables. Do not edit by hand.
import type { SiteSnapshot } from '../lib/snapshotTypes.ts';

export const siteSnapshot: SiteSnapshot | null = ${snapshot ? JSON.stringify(snapshot) : 'null'};
`;
  fs.writeFileSync(OUT, body);
  if (snapshot?.models) fs.writeFileSync(OUT_JSON, JSON.stringify(snapshot));
  else fs.rmSync(OUT_JSON, { force: true });
}

if (!url) {
  fs.rmSync(OUT_JSON, { force: true });
  console.log('[snapshot] DATABASE_URL yo\'q — statik katalog va env ishlatiladi.');
  process.exit(0);
}

const sql = postgres(url, { max: 1, prepare: false, connect_timeout: 15 });
try {
  const settingsRows = await sql`select key, value from site_settings`;
  const settings = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
  const sectionRows = await sql`select key, slug, name, sort from catalog_sections where visible order by sort, key`;
  const productRows = await sql`
    select p.* from products p join catalog_sections s on s.key = p.section
    where p.status = 'published' and s.visible
    order by p.sort, p.id`;
  const allProducts = await sql`select count(*)::int as n from products`;

  // Katalog bazaga hali import qilinmagan bo'lsa — statik katalogni buzmaymiz.
  const hasCatalog = allProducts[0].n > 0 && sectionRows.length > 0;
  const models = hasCatalog
    ? productRows.map((p) => ({
        key: p.key,
        code: p.code,
        slug: p.slug,
        section: p.section,
        name: p.name,
        subtitle: p.subtitle,
        note: p.note,
        kg: p.kg,
        molds: p.molds,
        tiles: p.tiles,
        specs: p.specs,
        sizeEstimated: p.size_estimated,
        images: p.images,
      }))
    : null;
  write({
    generatedAt: new Date().toISOString(),
    settings,
    sections: hasCatalog ? sectionRows.map((s) => ({ key: s.key, slug: s.slug, name: s.name, sort: s.sort })) : null,
    models,
  });
  console.log(
    `[snapshot] ${hasCatalog ? `${models.length} ta nashr qilingan mahsulot, ${sectionRows.length} bo'lim` : 'katalog bazada yo\'q (statik)'}; ${Object.keys(settings).length} sozlama.`,
  );
} catch (error) {
  console.error('[snapshot] bazadan o\'qib bo\'lmadi:', error.message);
  if (required) process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
