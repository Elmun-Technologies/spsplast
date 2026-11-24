#!/usr/bin/env node
/**
 * "Соберите сами" (plitkani o'zingiz tering) — QR 3D sahifalariga 5-tab qo'shadi.
 *
 *   npm run 3d:tering            # bundle + barcha trotuar sahifalarini yangilash
 *   npm run 3d:tering -- --check # hech narsa yozmaydi; sahifalar eskirgan bo'lsa exit 1
 *
 * 1) scripts/3d/tering/builder.js + three.js (devDependency, aniq versiya) -> esbuild ->
 *    public/3d/assets/tering-<hash>.js (bitta minify qilingan ES modul; CSP: faqat 'self').
 *    Fayl nomidagi hash — /3d/* 7 kunlik keshi eski kodni ushlab qolmasligi uchun.
 * 2) public/3d/t<NN>/index.html (terilgan.glb bor trotuar sahifalari): CSS, tab tugmasi,
 *    panel karkasi va kichik ulagich skript qo'shiladi. Mavjud 4 tab kodi o'zgarmaydi —
 *    `unpatch(patch(html)) === html` har sahifada tekshiriladi.
 *
 * Sahifalarning o'zi (index.html, GLB) tashqi 3D pipeline'da tayyorlanadi (repoda generator
 * yo'q) — shuning uchun bu skript idempotent "post-process": qayta ishga tushirish xavfsiz,
 * yangi 3D paket qo'shilgandan keyin ham shunchaki qayta ishga tushiriladi.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readGlbJson, findHole } from './glb-layout.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PUB3D = path.join(ROOT, 'public/3d');
const ASSETS = path.join(PUB3D, 'assets');
export const THREE_VERSION = '0.186.1';
const CHECK = process.argv.includes('--check');

// ---------------------------------------------------------------- sahifa qismlari
const CSS =
  '/*tering*/.tabs .t5{grid-column:1/-1;border-color:var(--red);color:var(--red)}' +
  '.tabs .t5[aria-selected=true]{color:var(--bg);border-color:var(--ink)}' +
  '@media (min-width:640px){.tabs{grid-template-columns:repeat(5,1fr)}.tabs .t5{grid-column:auto}}' +
  '.bv{position:relative;height:min(62vh,520px,110vw);background:radial-gradient(#3d3b38,#121314);touch-action:none;user-select:none;-webkit-user-select:none}' +
  '.gal{display:flex;overflow-x:auto;gap:8px;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch}.gal[hidden]{display:none}.gal img{width:auto;max-width:none;height:min(62vh,520px);flex:none;scroll-snap-align:start}' +
  '.bv canvas{display:block;width:100%!important;height:100%!important;outline:none}' +
  '.bc{position:absolute;left:10px;top:10px;z-index:1;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:5px 12px;font:600 13px/1.3 system-ui;pointer-events:none}' +
  '.bl{position:absolute;inset:0;display:grid;place-items:center;padding:16px;text-align:center;color:var(--mut);font-size:14px;pointer-events:none}' +
'.tr{display:flex;flex-wrap:wrap;gap:8px;padding:10px 12px;border-top:1px solid var(--line);background:var(--card)}.tr[hidden]{display:none}' +
  '.tc{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;min-width:72px;min-height:64px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--ink);font:600 11px/1.2 system-ui;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}' +
  '.tc:active{cursor:grabbing}.tc[disabled]{opacity:.35;cursor:default}.tc:focus-visible{outline:2px solid var(--red);outline-offset:2px}' +
  '.tc i,.dg{display:block;border-radius:3px;box-shadow:inset 0 2px 0 rgba(255,255,255,.35),inset 0 0 0 1px rgba(0,0,0,.3),0 3px 0 rgba(0,0,0,.45)}' +
  '.dg{position:fixed;z-index:9999;pointer-events:none;transform:translate(-50%,-60%) scale(1.5) rotate(-5deg);box-shadow:0 14px 22px rgba(0,0,0,.5),inset 0 2px 0 rgba(255,255,255,.4)!important;transition:transform .12s}.dg.ok{transform:translate(-50%,-60%) scale(1.2) rotate(0)}' +
  '.bt{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between;padding:10px 12px;border-top:1px solid var(--line)}' +
  '.sw{display:flex;gap:8px;flex-wrap:wrap}.sw button{width:36px;height:36px;border-radius:50%;border:2px solid var(--card);box-shadow:0 0 0 1px var(--line);padding:0;cursor:pointer;background:conic-gradient(#b08a5a 0 50%,#8c8a85 0)}' +
  '.sw button[aria-checked=true]{box-shadow:0 0 0 2px var(--ink)}' +
  '.ba{display:flex;gap:6px;flex-wrap:wrap}.ba button{min-height:44px;padding:9px 12px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);font:600 13px/1.2 system-ui;cursor:pointer}' +
  '.ba button[aria-pressed=true]{background:var(--ink);color:var(--bg);border-color:var(--ink)}/*/tering*/';

const TAB = '<button role="tab" data-k="tering" aria-selected="false" class="t5">Соберите сами</button>';

const SWATCHES = [
  ['', 'Как в каталоге'],
  ['#a3a19b', 'Серый'],
  ['#a64b3c', 'Красный'],
  ['#d2ae5f', 'Жёлтый'],
  ['#7b5640', 'Коричневый'],
  ['#5b5c61', 'Графит'],
];
const PANEL =
  '<div id="b" class="bd" hidden><div class="bv" role="img" aria-label="3D: уложите плитку сами">' +
  '<div class="bc" id="bc" aria-live="polite">Плиток: 0</div><div class="bl" id="bl">Загрузка 3D…</div></div>' +
  '<div class="bt"><div class="sw" role="radiogroup" aria-label="Цвет плитки">' +
  SWATCHES.map(
    ([c, n], i) =>
      `<button type="button" role="radio" aria-checked="${i === 0}" data-c="${c}" title="${n}" aria-label="${n}"${c ? ` style="background:${c}"` : ''}></button>`,
  ).join('') +
  '</div><div class="ba"><button type="button" data-a="fill">Заполнить всё</button>' +
  '<button type="button" data-a="clear">Очистить</button>' +
  '<button type="button" data-a="rot" aria-pressed="false">⟳ Поворот</button></div></div></div><!--/b-->';

const T_OLD = "sahna:''};";
const T_NEW = "sahna:'',tering:'Перетащите плитку из набора на пустую клетку · на плитку в сетке — уберите её'};";
const GO_OLD = "if(k==='sahna'){v.hidden=true;g.hidden=false}";
const GO_NEW = "TB(k);if(k==='tering'){v.hidden=true;g.hidden=true}else if(k==='sahna'){v.hidden=true;g.hidden=false}";

/** Ulagich: modul faqat tab ochilganda yuklanadi; xato bo'lsa xabar, keyingi safar qayta urinadi. */
function connector(bundle, glb, hole) {
  const cfg = JSON.stringify({ js: `/3d/assets/${bundle}`, glb, hole });
  return (
    `<script>/*tering*/const TC=${cfg};let TM=null;` +
    "function TB(k){const on=k==='tering',b=document.getElementById('b');if(!b)return;b.hidden=!on;" +
    'if(TM){TM.then(c=>c&&c.show(on));return}if(!on)return;' +
    "TM=import(TC.js).then(m=>{const c=m.mount(b,{glb:TC.glb,hole:TC.hole,hint:document.getElementById('hint')});c.show(!b.hidden);return c})" +
    ".catch(e=>{console.error(e);TM=null;b.querySelector('#bl').textContent='Не удалось загрузить 3D. Обновите страницу.';return null})}" +
    '</script>'
  );
}

const ANCHORS = {
  style: '</style>',
  tab: '<button role="tab" data-k="sahna" aria-selected="false">На объекте</button>',
  panel: '<div class="hint" id="hint">',
  script: '<script>const H=',
};

function once(html, needle, file) {
  const i = html.indexOf(needle);
  if (i < 0 || html.indexOf(needle, i + 1) >= 0) throw new Error(`${file}: shablon kutilganidek emas (${needle.slice(0, 40)}…)`);
  return i;
}

export function patch(html, { bundle, glb, hole }, file = 'index.html') {
  for (const n of [...Object.values(ANCHORS), T_OLD, GO_OLD]) once(html, n, file);
  return html
    .replace(ANCHORS.style, CSS + ANCHORS.style)
    .replace(ANCHORS.tab, ANCHORS.tab + TAB)
    .replace(ANCHORS.panel, PANEL + ANCHORS.panel)
    .replace(ANCHORS.script, connector(bundle, glb, hole) + ANCHORS.script)
    .replace(T_OLD, T_NEW)
    .replace(GO_OLD, GO_NEW);
}

export function unpatch(html) {
  return html
    .replace(/\/\*tering\*\/[\s\S]*?\/\*\/tering\*\//g, '')
    .replace(/<button role="tab" data-k="tering"[^>]*>[^<]*<\/button>/g, '')
    .replace(/<div id="b" class="bd"[\s\S]*?<!--\/b-->/g, '')
    .replace(/<script>\/\*tering\*\/[\s\S]*?<\/script>/g, '')
    .replace(/,tering:'[^']*'\};/g, '};')
    .split(GO_NEW)
    .join(GO_OLD);
}

/** Trotuar QR sahifalari: id `t<raqam>`, terilgan.glb bor (t92+ — faqat suratlar). */
export function paverIds() {
  return fs
    .readdirSync(PUB3D)
    .filter((d) => /^t\d+$/.test(d) && fs.existsSync(path.join(PUB3D, d, 'terilgan.glb')) && fs.existsSync(path.join(PUB3D, d, 'index.html')))
    .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

// ---------------------------------------------------------------- bundle
/**
 * Sahifada model-viewer o'zining three.js nusxasi bilan allaqachon bor — ikkinchi nusxa
 * konsolga "Multiple instances of Three.js" ogohlantirishini chiqaradi. Ikkalasi bir-biriga
 * tegmaydi (alohida renderer/sahna), shuning uchun faqat shu ogohlantirish olib tashlanadi.
 */
const MULTI_WARN = "warn( 'WARNING: Multiple instances of Three.js being imported.' );";
const quietThree = {
  name: 'quiet-three',
  setup(build) {
    build.onLoad({ filter: /three[\\/]build[\\/]three\.core\.js$/ }, (args) => {
      const src = fs.readFileSync(args.path, 'utf8');
      if (!src.includes(MULTI_WARN)) throw new Error('three.core.js: kutilgan ogohlantirish topilmadi (versiya o\'zgarganmi?)');
      return { contents: src.replace(MULTI_WARN, ''), loader: 'js' };
    });
  },
};

async function bundle() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules/three/package.json'), 'utf8'));
  if (pkg.version !== THREE_VERSION) throw new Error(`three ${pkg.version} o'rnatilgan, ${THREE_VERSION} kerak (npm ci)`);
  const esbuild = await import('esbuild');
  const out = await esbuild.build({
    entryPoints: [path.join(ROOT, 'scripts/3d/tering/builder.js')],
    bundle: true,
    format: 'esm',
    minify: true,
    target: ['es2020'],
    legalComments: 'none',
    write: false,
    plugins: [quietThree],
    banner: {
      js: `/*! SPS "Соберите сами" + three.js ${THREE_VERSION} (MIT License, Copyright © 2010-2026 three.js authors, https://github.com/mrdoob/three.js) */`,
    },
  });
  const code = out.outputFiles[0].contents;
  const hash = crypto.createHash('sha256').update(code).digest('hex').slice(0, 10);
  return { name: `tering-${hash}.js`, code };
}

async function main() {
  const b = await bundle();
  const target = path.join(ASSETS, b.name);
  const stale = fs.readdirSync(ASSETS).filter((f) => /^tering-[0-9a-f]+\.js$/.test(f) && f !== b.name);
  const problems = [];
  if (!fs.existsSync(target)) problems.push(`bundle yo'q: ${b.name}`);
  if (stale.length) problems.push(`eski bundle: ${stale.join(', ')}`);
  if (!CHECK) {
    fs.writeFileSync(target, b.code);
    for (const f of stale) fs.unlinkSync(path.join(ASSETS, f));
  }
  let changed = 0;
  const noHole = [];
  const holes = {};
  const ids = paverIds();
  for (const id of ids) {
    const file = path.join(PUB3D, id, 'index.html');
    const html = fs.readFileSync(file, 'utf8');
    const base = unpatch(html);
    const h = findHole(readGlbJson(path.join(PUB3D, id, 'terilgan.glb')));
    if (!h) noHole.push(id);
    holes[id] = h ? [Number(h.x.toFixed(5)), Number(h.z.toFixed(5)), Number(h.yaw.toFixed(5))] : null;
    const next = patch(base, { bundle: b.name, glb: `/3d/${id}/terilgan.glb`, hole: h ? [h.x, h.z, h.yaw] : null }, file);
    if (unpatch(next) !== base) throw new Error(`${file}: unpatch(patch(x)) !== x — mavjud tablar buzilishi mumkin`);
    if (next !== html) {
      changed += 1;
      if (CHECK) problems.push(`eskirgan: ${id}`);
      else fs.writeFileSync(file, next);
    }
  }
  // Sayt (Model3D.tsx) uchun: har bir trotuar modelining "teshik"i — QR sahifadagi ulagich bilan bir xil ma'lumot.
  const holesFile = path.join(ROOT, 'src/components/model2027/tering-holes.generated.ts');
  const holesSrc =
    "// GENERATED — scripts/3d/build-tering.mjs (`npm run 3d:tering`). Qo'lda tahrirlanmasin!\n" +
    "// 3D id -> [x, z, yaw] (m, m, rad): ko'tarilgan plitkaning asl o'rni; null — teshik topilmadi.\n" +
    `export const TERING_HOLES: Record<string, [number, number, number] | null> = ${JSON.stringify(holes)};\n`;
  const holesOld = fs.existsSync(holesFile) ? fs.readFileSync(holesFile, 'utf8') : '';
  if (holesOld !== holesSrc) {
    if (CHECK) problems.push('tering-holes.generated.ts eskirgan');
    else fs.writeFileSync(holesFile, holesSrc);
  }
  const kb = (n) => (n / 1024).toFixed(1);
  const zlib = await import('node:zlib');
  console.log(
    `tering: ${ids.length} sahifa (${changed} ${CHECK ? 'eskirgan' : 'yangilandi'}), bundle ${b.name} ` +
      `${kb(b.code.length)} KB / gzip ${kb(zlib.gzipSync(b.code, { level: 9 }).length)} KB` +
      (noHole.length ? `; teshik topilmadi (ko'tarilgan plitka slot emas): ${noHole.join(', ')}` : ''),
  );
  if (CHECK && problems.length) {
    console.error('XATO: ' + problems.join('; ') + ' — `npm run 3d:tering` ni ishga tushiring');
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
