#!/usr/bin/env node
/**
 * SPS Plast — models-2027 validatsiyasi (PROMPT.md, 0-bosqich).
 *
 * XATO (exit 1): slug unikal emas, rasm fayli diskda yo'q, "yarat" so'zi (uz matn),
 *               noma'lum bo'lim, sxema buzilgan.
 * OGOH (exit 0): biznesdan kutilayotgan ma'lumot yo'q (ru/en tarjima, 152 ta model,
 *               bo'lim taqsimoti) — docs/data-questions.md da qayd etilgan.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FILE = path.join(ROOT, 'data/models-2027.json');
const APPROVED = { total: 152, trotuar: 91, fasad: 26, zabor: 10, dekor: 18, skameyka: 7 };
const SECTIONS = ['trotuar', 'fasad', 'zabor', 'dekor', 'skameyka'];
const LANGS = ['uz', 'ru', 'en'];

const errors = [];
const warnings = [];

function walkStrings(node, cb, trail = '') {
  if (typeof node === 'string') cb(node, trail);
  else if (Array.isArray(node)) node.forEach((v, i) => walkStrings(v, cb, `${trail}[${i}]`));
  else if (node && typeof node === 'object')
    for (const [k, v] of Object.entries(node)) walkStrings(v, cb, `${trail}.${k}`);
}

const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const models = data.models;

// 1. slug / key unikal
const slugs = new Map();
for (const m of models) {
  if (slugs.has(m.slug)) errors.push(`slug takrorlandi: ${m.slug}`);
  slugs.set(m.slug, true);
}

// 2. sxema + "yarat" taqiqi
for (const m of models) {
  if (!SECTIONS.includes(m.section)) errors.push(`${m.slug}: noma'lum bo'lim ${m.section}`);
  for (const l of LANGS) {
    if (!(l in m.name)) errors.push(`${m.slug}: name.${l} maydoni yo'q`);
  }
  if (!m.name.uz) errors.push(`${m.slug}: name.uz bo'sh`);
  if (!Array.isArray(m.molds) || m.molds.length === 0)
    warnings.push(`${m.slug}: qolip qatori yo'q (kalkulyator ishlamaydi)`);
  walkStrings(m, (s, trail) => {
    if (/yarat/i.test(s) && trail.includes('.uz'))
      errors.push(`${m.slug}: uz matnda "yarat" so'zi bor (${trail}: "${s}")`);
  });
  // 3. rasm fayllari diskda bormi
  const imgs = [m.images.scene, m.images.sceneSm, ...Object.values(m.images.molds), ...Object.values(m.images.tiles)];
  for (const src of imgs) {
    if (!src) continue;
    if (!fs.existsSync(path.join(ROOT, 'public', src.replace(/^\//, ''))))
      errors.push(`${m.slug}: rasm fayli yo'q ${src}`);
  }
}

// 4. soni va bo'lim taqsimoti (tasdiqlangan 152 ga nisbatan)
const counts = {};
for (const m of models) counts[m.section] = (counts[m.section] || 0) + 1;
if (models.length !== APPROVED.total)
  warnings.push(`model soni ${models.length} ≠ tasdiqlangan ${APPROVED.total} (yakuniy PDF kutilmoqda)`);
for (const s of SECTIONS)
  if ((counts[s] || 0) !== APPROVED[s])
    warnings.push(`bo'lim ${s}: ${counts[s] || 0} ≠ tasdiqlangan ${APPROVED[s]}`);

// 5. tarjimalar qamrovi
const missing = { ru: 0, en: 0 };
for (const m of models) {
  if (!m.name.ru) missing.ru += 1;
  if (!m.name.en) missing.en += 1;
}
if (missing.ru) warnings.push(`ru nomlar yo'q: ${missing.ru} ta (kirill PDF kutilmoqda)`);
if (missing.en) warnings.push(`en nomlar yo'q: ${missing.en} ta (EN PDF kutilmoqda)`);
const noImage = models.filter((m) => !m.images.scene && Object.keys(m.images.molds).length === 0).length;
if (noImage) warnings.push(`rasmsiz model: ${noImage} ta`);

console.log(`models-2027: ${models.length} model, bo'limlar: ${SECTIONS.map((s) => `${s}=${counts[s] || 0}`).join(' ')}`);
for (const w of warnings) console.log('  OGOH  ' + w);
for (const e of errors) console.log('  XATO  ' + e);
console.log(errors.length ? `\n${errors.length} ta XATO — tuzatish shart.` : `\nXATO yo'q. ${warnings.length} ta ogohlantirish (biznes javobi kutilmoqda).`);
process.exit(errors.length ? 1 : 0);
