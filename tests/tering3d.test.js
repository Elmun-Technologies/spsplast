// "Соберите сами" — QR 3D sahifalaridagi plitka terish rejimi (2026-11-16).
// Generator: scripts/3d/build-tering.mjs (bundle + sahifalarga 5-tab), manba: scripts/3d/tering/builder.js.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const PUB3D = path.join(ROOT, 'public/3d');
const dirs = fs.readdirSync(PUB3D).filter((d) => fs.existsSync(path.join(PUB3D, d, 'index.html')));
const isPaver = (d) => /^t\d+$/.test(d) && fs.existsSync(path.join(PUB3D, d, 'terilgan.glb'));
const read = (d) => fs.readFileSync(path.join(PUB3D, d, 'index.html'), 'utf8');
const bundles = fs.readdirSync(path.join(PUB3D, 'assets')).filter((f) => /^tering-[0-9a-f]+\.js$/.test(f));

test('bitta tering-<hash>.js bundle bor va u faqat o‘z serveridan yuklanadi (CSP: self)', () => {
  assert.strictEqual(bundles.length, 1, `bundle soni: ${bundles.join(', ')}`);
  const js = fs.readFileSync(path.join(PUB3D, 'assets', bundles[0]), 'utf8');
  assert.ok(!/(?:import|from)\s*\(?\s*["']https?:/.test(js), 'tashqi (CDN) import bo‘lmasin');
  assert.ok(js.length < 900 * 1024, `bundle juda katta: ${js.length} bayt`);
});

test('har bir trotuar sahifasida 5-tab, panel va lazy ulagich bor; boshqa sahifalar o‘zgarmagan', () => {
  const pavers = dirs.filter(isPaver);
  assert.ok(pavers.length >= 90, `trotuar sahifalari: ${pavers.length}`);
  for (const d of pavers) {
    const html = read(d);
    assert.ok(html.includes('data-k="tering"'), `${d}: tab yo‘q`);
    assert.ok(html.includes('<div id="b" class="bd" hidden>'), `${d}: panel yo‘q`);
    assert.ok(html.includes(`"js":"/3d/assets/${bundles[0]}"`), `${d}: eskirgan bundle havolasi`);
    assert.ok(html.includes(`"glb":"/3d/${d}/terilgan.glb"`), `${d}: glb yo‘li`);
    // modul sahifa yuklanganda emas — faqat tab ochilganda (dynamic import)
    assert.ok(!/<script[^>]+src="\/3d\/assets\/tering-/.test(html), `${d}: bundle sahifa bilan birga yuklanmasin`);
    assert.ok(/import\(TC\.js\)/.test(html), `${d}: dynamic import yo‘q`);
  }
  for (const d of dirs.filter((x) => !isPaver(x))) {
    assert.ok(!read(d).includes('tering'), `${d}: trotuar emas — o‘zgarmasligi kerak`);
  }
});

test('mavjud 4 tab kodi o‘zgarmagan: unpatch(sahifa) asl shablonga qaytadi', async () => {
  const { unpatch } = await import(path.join(ROOT, 'scripts/3d/build-tering.mjs'));
  for (const d of dirs.filter(isPaver)) {
    const base = unpatch(read(d));
    assert.ok(!base.includes('tering') && !base.includes('TB('), `${d}: unpatch to‘liq emas`);
    assert.ok(base.includes("if(k==='sahna'){v.hidden=true;g.hidden=false}else{g.hidden=true;v.hidden=false;"), `${d}: go() asl ko‘rinishda emas`);
    assert.strictEqual((base.match(/role="tab"/g) || []).length, 4, `${d}: 4 ta asl tab`);
  }
});

test('matnlar: narx yo‘q, "yaratish" yo‘q', () => {
  const src = fs.readFileSync(path.join(ROOT, 'scripts/3d/build-tering.mjs'), 'utf8') + fs.readFileSync(path.join(ROOT, 'scripts/3d/tering/builder.js'), 'utf8');
  assert.ok(!/yarat/i.test(src), '"yaratish" taqiqlangan');
  const sample = read(dirs.filter(isPaver)[0]);
  const injected = sample.slice(sample.indexOf('<div id="b"'), sample.indexOf('<!--/b-->'));
  assert.ok(!/цен|сум|руб|\$|narx|price/i.test(injected), 'narx yozilmasin');
});

test('bundle va sahifalar manbaga mos (npm run 3d:tering -- --check)', () => {
  const out = execFileSync(process.execPath, [path.join(ROOT, 'scripts/3d/build-tering.mjs'), '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.match(out, /\(0 eskirgan\)/);
});

test('3D sahifalar: model-viewer foni qora (och bej fon oq mahsulotni yo\'qotardi) — `npm run 3d:dark`', () => {
  const dir = path.join(process.cwd(), 'public/3d');
  const bad = fs
    .readdirSync(dir)
    .filter((d) => fs.existsSync(path.join(dir, d, 'index.html')))
    .filter((d) => fs.readFileSync(path.join(dir, d, 'index.html'), 'utf8').includes('#e9e3d7'));
  assert.deepEqual(bad, [], `och fon qolgan: ${bad.join(', ')}`);
});
