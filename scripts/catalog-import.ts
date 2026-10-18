/**
 * Statik katalogni bazaga import qilish (bir marta, admin panel ishga tushirilganda):
 *
 *   DATABASE_URL=postgres://... npm run catalog:import
 *
 * - data/models-2027.json → hozirgi saytdagi 119 model (nashr holatida, tartib saqlanadi);
 * - data/termopanel-2027.json → 76 ta fasad termopanel/dekor mahsuloti (qoralama: rasm va
 *   tarjimalar admin'da qo'shilgach nashr qilinadi).
 * Takror ishga tushirish xavfsiz: mavjud slug'lar o'zgartirilmaydi.
 */
import fs from 'node:fs';
import path from 'node:path';
import { importCatalog } from '../src/server/catalog.ts';
import { getDb } from '../src/server/db/client.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const db = getDb();
if (!db) {
  console.error('DATABASE_URL berilmagan.');
  process.exit(1);
}
const models = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/models-2027.json'), 'utf8')).models;
const termo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/termopanel-2027.json'), 'utf8')).items;
const res = await importCatalog(db, models, termo);
console.log(`Bo'limlar: +${res.sections}; mahsulotlar: +${res.added} (o'tkazib yuborildi: ${res.skipped}).`);
process.exit(0);
