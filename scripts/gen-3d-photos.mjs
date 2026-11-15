// public/3d/<id>/r_*.jpg (obyektda terilgan suratlar) -> src/components/model2027/model3d-photos.generated.ts
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(process.cwd(), 'public/3d');
const out = {};
for (const id of fs.readdirSync(root).sort()) {
  const dir = path.join(root, id);
  if (!fs.statSync(dir).isDirectory()) continue;
  const files = fs.readdirSync(dir).filter((f) => /^r_.*\.jpg$/.test(f)).sort();
  if (files.length) out[id] = files;
}
fs.writeFileSync(
  path.join(process.cwd(), 'src/components/model2027/model3d-photos.generated.ts'),
  `/** GENERATED: node scripts/gen-3d-photos.mjs. 3D paket id -> obyektdagi suratlar (public/3d/<id>/r_*.jpg). */\nexport const MODEL3D_PHOTOS: Record<string, string[]> = ${JSON.stringify(out, null, 2)};\n`,
);
console.log('3d photos:', Object.keys(out).length, 'paket');
