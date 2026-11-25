// Terilgan plitka sahnasi: public/3d/<id>/terilgan.glb (yoki /nv/<nom>.json) -> davriy takror -> katta maydon, quyosh, maysa.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
const Q = new URLSearchParams(location.search);
const num = (k, d) => (Q.has(k) ? +Q.get(k) : d);
const str = (k, d) => (Q.has(k) ? Q.get(k) : d);
const col = (k, d) => new THREE.Color('#' + str(k, d));
const W = num('w', 1700), H = num('h', 2400), SS = num('ss', 2);
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const R = rng(num('seed', 7));
const loader = new THREE.TextureLoader();
const tex = (url, srgb, rep) => new Promise((res, rej) => loader.load(url, (t) => {
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 16;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  res(t);
}, undefined, () => rej(new Error('tex ' + url))));

function skyTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#7fb0ea'); gr.addColorStop(0.42, '#d3e3f3'); gr.addColorStop(0.5, '#f4ecdc'); gr.addColorStop(0.52, '#7c8a66'); gr.addColorStop(1, '#5d6650');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  const rg = g.createRadialGradient(120, 70, 0, 120, 70, 90); rg.addColorStop(0, 'rgba(255,244,214,1)'); rg.addColorStop(1, 'rgba(255,244,214,0)');
  g.fillStyle = rg; g.fillRect(0, 0, 512, 256);
  const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function leafTexture(seed) {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 1024, 1024); const r = rng(seed); g.filter = 'blur(10px)';
  for (let i = 0; i < 620; i++) {
    const x = r() * 1024, y = r() * 1024; const d = Math.hypot(x - 512, y - 512) / 520;
    if (r() < d * d * 1.5) continue;
    g.fillStyle = `rgba(52,62,84,${0.2 + r() * 0.3})`; g.beginPath();
    g.ellipse(x, y, 14 + r() * 40, 8 + r() * 18, r() * Math.PI, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// --- 1) Manba: GLB yoki JSON tartib ---
const sig = (g) => { const b = g.boundingBox; return g.attributes.position.count + ':' + [b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z].map((v) => v.toFixed(3)).join('x'); };
async function loadGlb(id) {
  const gltf = await new GLTFLoader().loadAsync(`/3d/${id}/terilgan.glb`);
  gltf.scene.updateMatrixWorld(true);
  const tiles = []; let top = -1e9;
  gltf.scene.traverse((o) => {
    if (!o.isMesh || !o.material || /qum/i.test(o.material.name) || /^qum/i.test(o.name)) return;
    const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); o.matrixWorld.decompose(p, q, s);
    const tilt = Math.hypot(q.x, q.z); if (tilt > 0.02) return;                    // ko'tarilgan plitka
    const rot = Math.round((2 * Math.atan2(q.y, q.w) * 180 / Math.PI + 720) % 360);
    o.geometry.computeBoundingBox(); const ty = p.y + o.geometry.boundingBox.max.y * s.y;
    tiles.push({ geo: o.geometry, mat: o.material, m: o.matrixWorld.clone(), x: p.x, z: p.z, key: o.geometry.uuid + '|' + o.material.name + '|' + rot, gk: sig(o.geometry) + '|' + rot, ty });
  });
  const tys = tiles.map((t) => t.ty).sort((p, q) => p - q); top = tys[tys.length >> 1];
  // ko'tarib qo'yilgan plitkani joyiga qaytarish (scripts/3d/glb-layout.mjs findHole bilan bir xil qoida: +9°, (0.62·m, 0.18·m))
  for (const t of tiles) {
    if (t.ty - top < 0.004) continue;
    const b = t.geo.boundingBox, m = Math.max(b.max.x - b.min.x, b.max.z - b.min.z);
    const p = new THREE.Vector3(), q = new THREE.Quaternion(), sc = new THREE.Vector3(); t.m.decompose(p, q, sc);
    const yawT = 2 * Math.atan2(q.y, q.w) - 9 * Math.PI / 180; const rot = Math.round((yawT * 180 / Math.PI + 720) % 360);
    p.x -= 0.62 * m; p.z -= 0.18 * m; p.y -= t.ty - top;
    t.m = new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawT), sc);
    t.x = p.x; t.z = p.z; t.ty = top; t.key = t.geo.uuid + '|' + t.mat.name + '|' + rot; t.gk = sig(t.geo) + '|' + rot;
    console.log('[i] lifted -> ' + p.x.toFixed(3) + ',' + p.z.toFixed(3) + ' rot ' + rot);
  }
  return { tiles: tiles.filter((t) => Math.abs(t.ty - top) < 0.004), top };
}
async function loadJson(name) {
  const J = await (await fetch(`/nv/${name}.json`)).json();
  const types = [];
  for (const t of J.types) {
    let geo;
    const h = t.h ?? 0.04;
    if (t.poly) {
      const sh = new THREE.Shape(); t.poly.forEach(([x, z], i) => (i ? sh.lineTo(x, -z) : sh.moveTo(x, -z))); sh.closePath();
      geo = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false }); geo.rotateX(-Math.PI / 2);
      geo.computeBoundingBox(); const bb = geo.boundingBox; const uv = geo.attributes.uv, pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), 1 - (pos.getZ(i) - bb.min.z) / (bb.max.z - bb.min.z));
    } else {
      geo = new THREE.BoxGeometry(t.w, h, t.d); geo.translate(0, h / 2, 0);
    }
    const mat = new THREE.MeshStandardMaterial({ name: t.name || ('T' + types.length), color: new THREE.Color(t.color || '#bbbbbb') });
    if (t.n) { mat.normalMap = await tex(`/nv/${t.n}`, false); mat.normalMap.flipY = t.flipY ?? true; }
    if (t.map) { mat.userData.map = await tex(`/nv/${t.map}`, true); }
    types.push({ geo, mat });
  }
  const tiles = J.tiles.map((t) => {
    const m = new THREE.Matrix4().makeRotationY((t.r || 0) * Math.PI / 180); m.setPosition(t.x, 0, t.z);
    const ty = types[t.t]; return { geo: ty.geo, mat: ty.mat, m, x: t.x, z: t.z, key: t.t + '|' + (t.r || 0), gk: t.t + '|' + (t.r || 0) };
  });
  return { tiles, top: Math.max(...J.types.map((t) => t.h ?? 0.04)), a: J.a, b: J.b, base: true };
}

// --- 2) Davr (panjara) topish ---
function findLattice(tiles, useColor) {
  const K = (t) => (useColor ? t.key : t.gk);
  const cell = 0.004, hash = new Map();
  const hk = (k, x, z) => k + '|' + Math.round(x / cell) + '|' + Math.round(z / cell);
  for (const t of tiles) hash.set(hk(K(t), t.x, t.z), t);
  const has = (k, x, z) => { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if (hash.has(hk(k, x + i * cell, z + j * cell))) return true; return false; };
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const t of tiles) { x0 = Math.min(x0, t.x); x1 = Math.max(x1, t.x); z0 = Math.min(z0, t.z); z1 = Math.max(z1, t.z); }
  const inside = (x, z) => x > x0 - 0.002 && x < x1 + 0.002 && z > z0 - 0.002 && z < z1 + 0.002;
  const cnt = {}; for (const t of tiles) cnt[K(t)] = (cnt[K(t)] || 0) + 1;
  const main = Object.keys(cnt).sort((p, q) => cnt[q] - cnt[p])[0]; const ms = tiles.filter((t) => K(t) === main);
  const cand = new Map();
  for (const p of ms) for (const q of ms) { const dx = q.x - p.x, dz = q.z - p.z; const l = Math.hypot(dx, dz); if (l < 0.04) continue; if (dx < -1e-4 || (Math.abs(dx) < 1e-4 && dz < 0)) continue; cand.set(Math.round(dx * 500) + '|' + Math.round(dz * 500), [dx, dz, l]); }
  const ok = [];
  for (const [dx, dz, l] of [...cand.values()].sort((p, q) => p[2] - q[2])) {
    let pairs = 0, hits = 0; const cls = {};
    for (const t of tiles) { for (const sg of [1, -1]) { const x = t.x + sg * dx, z = t.z + sg * dz; if (!inside(x, z)) continue; pairs++; const c = (cls[K(t)] ||= [0, 0]); c[0]++; if (has(K(t), x, z)) { hits++; c[1]++; } } }
    const clsOk = Object.values(cls).every(([p, h]) => p < 2 || h / p >= 0.5);       // har bir plitka turi alohida ham takrorlanishi shart
    if (clsOk && pairs >= tiles.length * 0.5 && hits / pairs >= 0.93) ok.push([dx, dz, l, hits / pairs]);
    if (ok.length > 40) break;
  }
  if (!ok.length) return null;
  const a = ok[0]; let b = null;
  for (const c of ok) { const cr = Math.abs(a[0] * c[1] - a[1] * c[0]); if (cr > 0.3 * a[2] * c[2]) { b = c; break; } }
  if (!b) return null;
  // asosiy to'plam: panjara bo'yicha noyob plitkalar (chet bo'laklarisiz)
  const det = a[0] * b[1] - a[1] * b[0]; const base = new Map();
  for (const t of tiles) {
    let good = 0, tot = 0;
    for (const v of [a, b]) for (const sg of [1, -1]) { const x = t.x + sg * v[0], z = t.z + sg * v[1]; if (!inside(x, z)) continue; tot++; if (has(K(t), x, z)) good++; }
    if (tot && !good) continue;
    let u = (t.x * b[1] - t.z * b[0]) / det, v = (a[0] * t.z - a[1] * t.x) / det; u -= Math.floor(u + 1e-3); v -= Math.floor(v + 1e-3);
    const k = K(t) + '|' + Math.round(u * 200) % 200 + '|' + Math.round(v * 200) % 200; if (!base.has(k)) base.set(k, t);
  }
  return { a: [a[0], a[1]], b: [b[0], b[1]], base: [...base.values()], score: [a[3], b[3]] };
}

function mottleTexture(seed) {
  const c = document.createElement('canvas'); c.width = c.height = 1024; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, 1024, 1024); const r = rng(seed); g.filter = 'blur(26px)';
  for (let i = 0; i < 260; i++) { const v = 150 + r() * 70; g.fillStyle = `rgba(${v + 20},${v + 14},${v + 6},${0.08 + r() * 0.13})`; g.beginPath(); g.ellipse(r() * 1024, r() * 1024, 30 + r() * 120, 20 + r() * 80, r() * Math.PI, 0, Math.PI * 2); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
async function main() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W * SS, H * SS, false);
  renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = num('exp', 1.12);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); const root = new THREE.Group(); scene.add(root);
  const hdrId = str('hdr', 'rooitou_park');
  const env = await new RGBELoader().loadAsync(`/hdr/${hdrId}_2k.hdr`); env.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = env; scene.environmentIntensity = num('env', 0.7);
  const bg = await tex(`/hdr/${hdrId}.jpg`, true); bg.mapping = THREE.EquirectangularReflectionMapping; bg.anisotropy = 1;
  scene.background = bg; scene.backgroundIntensity = num('bgi', 1.0);
  const vaz = num('vaz', 126) * Math.PI / 180;                                  // qarash azimuti (HDRI tizimida)
  root.rotation.y = Math.atan2(-Math.cos(vaz), -Math.sin(vaz));

  const src = Q.has('nv') ? await loadJson(str('nv')) : await loadGlb(str('id'));
  let lat;
  if (src.base) lat = { a: src.a, b: src.b, base: src.tiles };
  else { lat = findLattice(src.tiles, !num('nocolor', 0)) || findLattice(src.tiles, false); }
  if (!lat) throw new Error('davr topilmadi: ' + str('id'));
  const A = lat.a, B = lat.b, det = A[0] * B[1] - A[1] * B[0];
  console.log(`[i] tiles=${src.tiles.length} base=${lat.base.length} a=${A.map((v) => v.toFixed(3))} b=${B.map((v) => v.toFixed(3))} score=${(lat.score || []).map((v) => v.toFixed(2))} top=${src.top.toFixed(3)}`);

  const conc = await tex('/tex/conc_a.png', true);
  const ns = num('ns', 3); const mats = new Map(); const names = [...new Set(lat.base.map((t) => t.mat.name))].sort();
  names.forEach((nm, i) => {
    const o = lat.base.find((t) => t.mat.name === nm).mat;
    const c = Q.has('c' + i) ? col('c' + i) : o.color.clone();
    if (!Q.has('c' + i) && (c.r + c.g + c.b) / 3 < 0.045) c.set('#4c4e55');   // GLB'dagi qop-qora o'rniga grafit
    const mc = c.clone().multiplyScalar(num('cb', 1.22));
    const m = new THREE.MeshStandardMaterial({ color: mc, map: o.userData.map || conc, normalMap: o.normalMap || null, roughness: num('rough', 0.8), metalness: 0 });
    if (m.normalMap) m.normalScale.set(ns, ns);
    mats.set(nm, m); console.log(`[i] mat${i} ${nm} #${c.getHexString(THREE.SRGBColorSpace)}`);
  });

  const yaw = num('yaw', 24) * Math.PI / 180, cs = num('cs', 1);
  const X = num('xr', 7), ZF = num('zf', 8.5), ZN = num('zn', 3.4);
  const Rm = new THREE.Matrix4().makeRotationY(yaw); const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const toLocal = (x, z) => [x * cy - z * sy, x * sy + z * cy];
  let i0 = 1e9, i1 = -1e9, j0 = 1e9, j1 = -1e9;
  for (const [x, z] of [[-X, -ZF], [X, -ZF], [X, ZN], [-X, ZN]]) { const [lx, lz] = toLocal(x, z); const u = (lx * B[1] - lz * B[0]) / det, v = (A[0] * lz - A[1] * lx) / det; i0 = Math.min(i0, u); i1 = Math.max(i1, u); j0 = Math.min(j0, v); j1 = Math.max(j1, v); }
  i0 = Math.floor(i0) - 2; i1 = Math.ceil(i1) + 2; j0 = Math.floor(j0) - 2; j1 = Math.ceil(j1) + 2;
  const groups = new Map(); const T = new THREE.Matrix4(), M = new THREE.Matrix4();
  const mix = num('mix', 0);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (const t of lat.base) {
    const lx = t.x + i * A[0] + j * B[0], lz = t.z + i * A[1] + j * B[1];
    const wx = lx * cy + lz * sy, wz = -lx * sy + lz * cy;
    if (wx < -X - 0.4 || wx > X + 0.4 || wz < -ZF - 0.05 || wz > ZN + 0.4) continue;
    let mn = t.mat.name; if (mix) mn = names[Math.floor(R() * names.length)];
    const gk = t.geo.uuid + '|' + mn; if (!groups.has(gk)) groups.set(gk, { geo: t.geo, mat: mats.get(mn), ms: [] });
    T.makeTranslation(i * A[0] + j * B[0], 0, i * A[1] + j * B[1]); M.copy(Rm).multiply(T).multiply(t.m); groups.get(gk).ms.push(M.clone());
  }
  let total = 0; const tint = num('tint', 0.09); const cc = new THREE.Color();
  for (const g of groups.values()) {
    const im = new THREE.InstancedMesh(g.geo, g.mat, g.ms.length); g.ms.forEach((m, k) => { im.setMatrixAt(k, m); const v = 1 + (R() - 0.5) * tint; cc.setRGB(v, v * (1 + (R() - 0.5) * 0.025), v * (1 + (R() - 0.5) * 0.04)); im.setColorAt(k, cc); });
    im.receiveShadow = true; im.castShadow = false; im.frustumCulled = false; root.add(im); total += g.ms.length;
  }
  console.log(`[i] instances=${total}`);
  const top = src.top;
  const plane = (w, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; root.add(m); return m; };
  plane(2 * X + 2, ZF + ZN + 1, new THREE.MeshStandardMaterial({ color: col('joint', '7d7567'), roughness: 1 }), 0, top - num('jd', 0.007), (ZN - ZF) / 2);
  // bordyur (uzoq chet) + uning ortida tor maysa tasmasi; undan narisi — HDRI
  const km = new THREE.MeshStandardMaterial({ color: 0xcfcabf, map: conc, roughness: 0.9 });
  const kerb = new THREE.Mesh(new THREE.BoxGeometry(2 * X + 4, 0.16, 0.12), km); kerb.position.set(0, top - 0.02, -ZF - 0.06); kerb.castShadow = true; kerb.receiveShadow = true; root.add(kerb);
  if (num('lawn', 0)) {
    const lm = new THREE.MeshStandardMaterial({ map: await tex('/tex/lawn_a.png', true, [20, 5]), normalMap: await tex('/tex/lawn_n.png', false, [20, 5]), roughness: 1, color: col('lawnc', 'c9d6a0') });
    plane(2 * X + 30, num('lawnd', 6), lm, 0, top + 0.03, -ZF - 0.12 - num('lawnd', 6) / 2);
  }
  // rang notekisligi (eskirish) — ko'paytiruvchi qatlam
  if (num('mottle', 1)) {
    const mt = mottleTexture(5); mt.repeat.set(3, 2.4);
    const mo = new THREE.Mesh(new THREE.PlaneGeometry(2 * X, ZF + ZN), new THREE.MeshBasicMaterial({ map: mt, blending: THREE.MultiplyBlending, transparent: true, depthWrite: false, premultipliedAlpha: true, toneMapped: false }));
    mo.rotation.x = -Math.PI / 2; mo.position.set(0, top + 0.002, (ZN - ZF) / 2); mo.renderOrder = 4; root.add(mo);
  }
  // buyumlar: "nom:x:z:masshtab:burilish;..."
  const props = str('props', '');
  if (props) {
    const gl = new GLTFLoader();
    for (const it of props.split(';')) {
      const [nm, px, pz, sc = '1', ry = '0'] = it.split(':'); const g = (await gl.loadAsync(`/props/${nm}/${nm}.gltf`)).scene;
      g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material.map) o.material.map.anisotropy = 8; if (o.material.alphaMap || o.material.transparent) { o.material.alphaTest = 0.4; o.material.transparent = false; } o.material.side = THREE.DoubleSide; } });
      g.scale.setScalar(+sc); g.rotation.y = +ry * Math.PI / 180; g.position.set(+px, top, +pz); root.add(g);
    }
  }
  const cam = new THREE.PerspectiveCamera(num('fov', 36), W / H, 0.05, 400);
  cam.position.set(num('cx', 0.4) * cs, top + num('cy', 1.3) * cs, num('cz', 2.4) * cs);
  root.add(cam); cam.lookAt(root.localToWorld(new THREE.Vector3(num('tx', -0.15) * cs, top + num('ty', 0.15) * cs, num('tz', -2.7) * cs)));
  root.updateMatrixWorld(true);
  const sa = num('sunaz', 36) * Math.PI / 180, se = num('sunel', 24) * Math.PI / 180;
  const sun = new THREE.DirectionalLight(col('sunc', 'fff0da'), num('sun', 4.2)); const tgt = root.localToWorld(new THREE.Vector3(0, top, -2.5));
  sun.position.copy(tgt).add(new THREE.Vector3(Math.cos(sa) * Math.cos(se), Math.sin(se), Math.sin(sa) * Math.cos(se)).multiplyScalar(40));
  sun.target.position.copy(tgt); sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 90 });
  sun.shadow.mapSize.set(8192, 8192); sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.003; sun.shadow.radius = 2.5;
  scene.add(sun, sun.target); scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x9a917f, num('hemi', 0.35)));
  if (num('leaf', 1)) {
    const lt = leafTexture(num('leafseed', 21));
    for (const [lx, lz, sz, rz] of [[num('leafx', -3.2), num('leafz', -4.6), num('leafsz', 6.5), 0.4]]) {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), new THREE.MeshBasicMaterial({ map: lt, blending: THREE.MultiplyBlending, transparent: true, depthWrite: false, premultipliedAlpha: true, toneMapped: false }));
      leaf.rotation.x = -Math.PI / 2; leaf.rotation.z = rz; leaf.position.set(lx, top + 0.004, lz); leaf.renderOrder = 5; root.add(leaf);
    }
  }
  renderer.render(scene, cam);
  window.__png = () => renderer.domElement.toDataURL('image/jpeg', 0.97); window.__done = true;
}
main().catch((e) => { window.__err = String(e && e.stack || e); window.__done = true; });
