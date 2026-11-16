#!/usr/bin/env node
/**
 * QR 3D sahifalari: model-viewer foni har doim QORA.
 * Sabab: tashqi pipeline sahifalarga och bej fon (#e9e3d7→#cfc6b4) yozadi; oq/och mahsulotlar
 * ("Изделие", "Форма", aylantirganda) unga qo'shilib ko'rinmay qolardi. Tering tabi allaqachon qora.
 *
 *   npm run 3d:dark            # barcha public/3d/<id>/index.html ni yangilaydi (idempotent)
 *   npm run 3d:dark -- --check # yozmaydi; eskirgan sahifa bo'lsa exit 1
 * Tashqi pipeline sahifalarni qayta eksport qilsa — shu skriptni qayta ishga tushiring.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PUB3D = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public/3d');
const CHECK = process.argv.includes('--check');
const DARK = 'radial-gradient(#3d3b38,#121314)';
const LIGHT_RULE = 'background:radial-gradient(#e9e3d7,#cfc6b4)';
const DARK_MEDIA = '@media (prefers-color-scheme:dark){model-viewer{background:radial-gradient(#3a3834,#1b1a19)}}';

export function patch(html) {
  return html.replace(LIGHT_RULE, `background:${DARK}`).replace(DARK_MEDIA, '');
}

let stale = 0;
let changed = 0;
for (const d of fs.readdirSync(PUB3D)) {
  const f = path.join(PUB3D, d, 'index.html');
  if (!fs.existsSync(f)) continue;
  const html = fs.readFileSync(f, 'utf8');
  const out = patch(html);
  if (out === html) continue;
  stale++;
  if (!CHECK) {
    fs.writeFileSync(f, out);
    changed++;
  }
}
if (CHECK) {
  if (stale) {
    console.error(`3d:dark: ${stale} ta sahifada och fon qolgan — "npm run 3d:dark" ni ishga tushiring`);
    process.exit(1);
  }
  console.log('3d:dark: hammasi qora fon');
} else {
  console.log(`3d:dark: ${changed} ta sahifa yangilandi`);
}
