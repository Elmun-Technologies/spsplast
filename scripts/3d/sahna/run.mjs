import fs from 'node:fs'; import path from 'node:path'; import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const require = createRequire(path.join(ROOT, 'package.json'));
const { chromium } = require('playwright'); const sharp = require('sharp');
const ASSETS = process.env.SAHNA_ASSETS || '/tmp/scn';   // hdr/, props/, tex/, nv/ (README.md)
const [, , page, out, query = '', w = '1700', h = '2400'] = process.argv;
const ROOTS = { '/three/': path.join(ROOT, 'node_modules/three/'), '/render/': path.join(ROOT, 'scripts/3d/sahna/'), '/3d/': path.join(ROOT, 'public/3d/'), '/tex/': ASSETS + '/tex/', '/nv/': ASSETS + '/nv/', '/hdr/': ASSETS + '/hdr/', '/props/': ASSETS + '/props/' };
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.hdr': 'application/octet-stream' };
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const k = Object.keys(ROOTS).find((r) => p.startsWith(r));
  const f = k && path.join(ROOTS[k], p.slice(k.length));
  if (!f || !fs.existsSync(f)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: +w, height: +h } });
pg.on('pageerror', (e) => console.log('ERR', String(e))); pg.on('console', (m) => (m.type() === 'error' || m.text().startsWith('[i]')) && console.log(m.text()));
const t0 = Date.now();
await pg.goto(`http://127.0.0.1:${srv.address().port}/render/${page}?w=${w}&h=${h}&${query}`);
await pg.waitForFunction(() => window.__done, null, { timeout: 600000 });
const err = await pg.evaluate(() => window.__err); if (err) { console.log(err); process.exit(1); }
const b64 = (await pg.evaluate(() => window.__png())).split(',')[1];
const im = sharp(Buffer.from(b64, 'base64')).resize(+w, +h, { kernel: 'lanczos3' }).sharpen({ sigma: 0.5 });
if (out.endsWith('.png')) await im.png().toFile(out); else await im.jpeg({ quality: 93, chromaSubsampling: '4:4:4' }).toFile(out);
console.log(out, ((Date.now() - t0) / 1000).toFixed(1) + 's');
await b.close(); srv.close();
