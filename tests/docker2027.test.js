// Docker image (Coolify) — 2026-11-23. Nixpacks har deployda butun repo + dev-paketlarni yangi qatlamga
// yozib, server diskini to'ldirardi. Bu testlar Dockerfile'ning asosiy kafolatlarini saqlaydi.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const docker = fs.readFileSync(new URL('../Dockerfile', import.meta.url), 'utf8');
const config = fs.readFileSync(new URL('../next.config.js', import.meta.url), 'utf8');

test('1. Next standalone output yoqilgan, runtime server.js', () => {
  assert.match(config, /output:\s*'standalone'/);
  assert.match(docker, /CMD \["node", "server\.js"\]/);
  assert.match(docker, /HOSTNAME=0\.0\.0\.0/);
  assert.match(docker, /COPY --link --from=builder \/app\/\.next\/standalone/);
  assert.match(docker, /COPY --link --from=builder \/app\/\.next\/static \.\/\.next\/static/);
});

test("2. Katta statik papkalar alohida qatlam, build'dan olib tashlanadi (ikki marta yozilmaydi)", () => {
  for (const dir of ['public/3d', 'public/catalog']) {
    assert.ok(docker.includes(`COPY --link ${dir} ./${dir}`), dir);
    assert.ok(docker.includes(dir), dir);
  }
  assert.match(docker, /rm -rf public\/3d public\/catalog/);
  // Qolgan public (fonts, pdfjs, admin-ai, …) build bosqichidan to'liq ko'chiriladi.
  assert.match(docker, /COPY --link --from=builder \/app\/public \.\/public/);
});

test('3. Build vaqtidagi env ARG sifatida e`lon qilingan (snapshot va analitika)', () => {
  for (const name of [
    'DATABASE_URL',
    'SNAPSHOT_REQUIRED',
    'NEXT_PUBLIC_SITE_URL',
    'NEXT_PUBLIC_GTM_ID',
    'NEXT_PUBLIC_GA_MEASUREMENT_ID',
    'NEXT_PUBLIC_YANDEX_METRICA_ID',
    'NEXT_PUBLIC_META_PIXEL_ID',
  ]) {
    assert.match(docker, new RegExp(`^ARG ${name}$`, 'm'), name);
  }
  // Har bir NEXT_PUBLIC_* (kodda ishlatilgan) Dockerfile'da ham bo'lsin.
  const used = new Set();
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`;
      if (e.isDirectory()) walk(p);
      else if (/\.(ts|tsx|js|mjs)$/.test(e.name)) {
        for (const m of fs.readFileSync(p, 'utf8').matchAll(/process\.env\.(NEXT_PUBLIC_[A-Z0-9_]+)/g)) used.add(m[1]);
      }
    }
  };
  walk(new URL('../src', import.meta.url).pathname);
  for (const name of used) assert.match(docker, new RegExp(`^ARG ${name}$`, 'm'), name);
});

test('4. Runtime: dev-paketlar yo`q, root emas', () => {
  const runner = docker.slice(docker.indexOf('AS runner'));
  assert.doesNotMatch(runner, /npm (ci|install)/);
  assert.doesNotMatch(runner, /COPY --link --from=deps/);
  assert.match(runner, /^USER node$/m);
});
