#!/usr/bin/env node
/**
 * Sayt rasmlarining konteyner nisbatidagi variantlarini yasaydi.
 *
 * Nega kerak: `fill` + `object-fit: cover` rasmlarni konteyner nisbatiga kesadi,
 * lekin faylning tabiiy nisbati boshqacha bo'lsa, Lighthouse `image-aspect-ratio`
 * auditini yiqadi (best-practices balli 96 ga tushgan edi) va ortiqcha bayt
 * yuklanadi. Bu skript har bir konteyner nisbatiga mos markazdan kesilgan
 * variant yasaydi — ko'rinish o'zgarmaydi (cover allaqachon shunday kesardi).
 *
 * Ishlatish: `npm run images:variants` (sharp devDependency kerak).
 * Manba: `public/images/site/*.webp` va `public/images/brand/*.webp`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = path.join(ROOT, 'public', 'images', 'site');
const BRAND = path.join(ROOT, 'public', 'images', 'brand');

/** [manba, natija, nisbat] — nisbat konteyner CSS/inline style'dan olingan. */
const JOBS = [
  // Bosh sahifa "ulgurji" bloki: ikkita kvadrat katak (aspectRatio: '1')
  ['site/factory.webp', 'site/factory-1x1.webp', 1],
  ['site/containers.webp', 'site/containers-1x1.webp', 1],
  // Ulgurji sahifasi "eksport" bloki: aspectRatio '4 / 3'
  ['site/containers.webp', 'site/containers-4x3.webp', 4 / 3],
  // Ishlab chiqarish sahifasi "eksport" juftligi: aspectRatio '16 / 9'
  ['site/port.webp', 'site/port-16x9.webp', 16 / 9],
  ['site/containers.webp', 'site/containers-16x9.webp', 16 / 9],
  // Ulgurji sahifasi "kim uchun" kartochkalari: .who-img aspect-ratio 16 / 9
  ['site/master-pouring.webp', 'site/master-pouring-16x9.webp', 16 / 9],
  ['site/distribyutor-ombor.webp', 'site/distribyutor-ombor-16x9.webp', 16 / 9],
  ['site/qurilish-obyekti.webp', 'site/qurilish-obyekti-16x9.webp', 16 / 9],
];

/** Logotiplar: 72×44 ko'rsatiladi (18/11). next/image kichik kengliklarda
 *  balandlikni yaxlitlagani uchun nisbat 1% dan ko'proq og'ib, audit yiqilardi —
 *  manba faylni 18/11 nisbatga keltiramiz (1px kesim, ko'rinmaydi). */
const LOGO_RATIO = 72 / 44;

async function main() {
  const { default: sharp } = await import('sharp');

  const resolve = (rel) => path.join(ROOT, 'public', 'images', rel);
  let created = 0;

  for (const [src, dst, ratio] of JOBS) {
    const input = resolve(src);
    const output = resolve(dst);
    if (!fs.existsSync(input)) {
      console.log(`O'TKAZIB YUBORILDI (manba yo'q): ${src}`);
      continue;
    }

    const meta = await sharp(input).metadata();
    const current = meta.width / meta.height;
    let width = meta.width;
    let height = meta.height;
    if (Math.abs(current - ratio) > 0.002) {
      if (current > ratio) width = Math.round(meta.height * ratio);
      else height = Math.round(meta.width / ratio);
    }

    await sharp(input)
      .resize(width, height, { fit: 'cover', position: 'centre' })
      .webp({ quality: 80, effort: 6 })
      .toFile(output);

    const size = (fs.statSync(output).size / 1024).toFixed(0);
    console.log(`${dst.padEnd(42)} ${width}x${height} (${ratio.toFixed(3)}) · ${size} KB`);
    created += 1;
  }

  for (const file of ['logo-white.webp', 'logo-ink.webp']) {
    const target = path.join(BRAND, file);
    if (!fs.existsSync(target)) continue;
    const meta = await sharp(target).metadata();
    const current = meta.width / meta.height;
    if (Math.abs(current - LOGO_RATIO) <= 0.002) {
      console.log(`${('brand/' + file).padEnd(42)} allaqachon 72/44 nisbatda`);
      continue;
    }
    const width = Math.round(meta.height * LOGO_RATIO);
    const buffer = await sharp(target)
      .resize(width, meta.height, { fit: 'cover', position: 'centre' })
      .webp({ quality: 92, effort: 6 })
      .toBuffer();
    fs.writeFileSync(target, buffer);
    console.log(`${('brand/' + file).padEnd(42)} ${meta.width}x${meta.height} -> ${width}x${meta.height} (72/44)`);
    created += 1;
  }

  console.log(`\ntayyor: ${created} fayl`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
