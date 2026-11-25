import * as THREE from 'three';
import { num, str, col, tex, quad, rng, L, WF, CH, T, HT } from '/render/kcommon.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const Q_has = (k) => new URLSearchParams(location.search).has(k);
const W = num('w', 1170), H = num('h', 1650), SS = num('ss', 2);
const R = rng(num('seed', 4));
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
  g.fillStyle = '#fff'; g.fillRect(0, 0, 1024, 1024); const r = rng(seed); g.filter = 'blur(9px)';
  for (let i = 0; i < 700; i++) {
    const x = r() * 1024, y = r() * 1024; const d = Math.hypot(x - 520, y - 470) / 540;
    if (r() < d * d * 1.4) continue;
    g.fillStyle = `rgba(50,62,84,${0.22 + r() * 0.3})`; g.beginPath();
    g.ellipse(x, y, 12 + r() * 36, 7 + r() * 17, r() * Math.PI, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
async function main() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W * SS, H * SS, false);
  renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = H + 'px';
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = num('exp', 1.05);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const haze = col('haze', 'dfe6dc');
  scene.background = haze; scene.fog = new THREE.Fog(haze, num('fog0', 7), num('fog1', 40));
  scene.environment = new THREE.PMREMGenerator(renderer).fromEquirectangular(skyTexture()).texture;
  scene.environmentIntensity = num('env', 0.55);
  if (str('hdr', '')) {
    const bgT = await new Promise((res) => new THREE.TextureLoader().load(`/hdr/${str('hdr')}.jpg`, res)); bgT.mapping = THREE.EquirectangularReflectionMapping; bgT.colorSpace = THREE.SRGBColorSpace;
    scene.background = bgT; scene.backgroundRotation.y = num('bgrot', 0) * Math.PI / 180; if (num('nofog', 0)) scene.fog = null;
  }

  const ns = num('ns', 1.25);
  const conc = { a: await tex('conc_a', true, [1, 1]), n: await tex('conc_n', false, [1, 1]) };
  async function kerbMats(kind, color) {
    const mk = async (name) => { const m = new THREE.MeshStandardMaterial({ color, map: await tex(name + '_a', true), normalMap: await tex(name + '_n'), roughness: 0.9, metalness: 0 }); m.normalScale.set(ns, ns); return m; };
    const plain = new THREE.MeshStandardMaterial({ color, map: conc.a, normalMap: conc.n, roughness: 0.92, metalness: 0, side: THREE.DoubleSide });
    return [await mk(kind + '_face'), await mk(kind + '_cham'), plain];
  }
  const zf = T / 2, zb = -T / 2, x0 = -L / 2, x1 = L / 2;
  const G = {
    face: quad([x0, 0, zf], [x1, 0, zf], [x1, WF, zf], [x0, WF, zf]),
    cham: quad([x0, WF, zf], [x1, WF, zf], [x1, HT, zf - CH], [x0, HT, zf - CH]),
    top: quad([x0, HT, zf - CH], [x1, HT, zf - CH], [x1, HT, zb], [x0, HT, zb], [0, 0, 1, 0.07]),
    back: quad([x1, 0, zb], [x0, 0, zb], [x0, HT, zb], [x1, HT, zb], [0, 0, 1, 0.26]),
  };
  const endShape = (sgn) => { const s = new THREE.Shape(); const X = (z) => -sgn * z; s.moveTo(X(zf), 0); s.lineTo(X(zf), WF); s.lineTo(X(zf - CH), HT); s.lineTo(X(zb), HT); s.lineTo(X(zb), 0); s.closePath(); const g = new THREE.ShapeGeometry(s); g.scale(4, 4, 1); const uv = g.attributes.uv; g.scale(0.25, 0.25, 1); return g; };
  function kerb(mats, x, y, z, rotY, tint) {
    const g = new THREE.Group();
    const m = mats.map((mm) => { const c = mm.clone(); c.color = mm.color.clone().multiplyScalar(tint); return c; });
    const parts = [[G.face, m[0]], [G.cham, m[1]], [G.top, m[2]], [G.back, m[2]]];
    for (const [geo, mat] of parts) { const me = new THREE.Mesh(geo, mat); me.castShadow = true; me.receiveShadow = true; g.add(me); }
    const dark = new THREE.MeshStandardMaterial({ color: 0x4a4640, roughness: 1, side: THREE.DoubleSide });
    for (const sgn of [1, -1]) { const me = new THREE.Mesh(endShape(sgn), dark); me.rotation.y = sgn * Math.PI / 2; me.position.x = sgn * L / 2; me.castShadow = true; g.add(me); }
    g.position.set(x, y, z); g.rotation.y = rotY; scene.add(g);
  }
  const JOINT = 0.0025, PITCH = L + JOINT;
  const mA = await kerbMats('A', col('ka', 'd6d1c7')), mB = await kerbMats('B', col('kb', 'd6d1c7'));
  const yPave = num('ypave', 0.028), z2 = num('z2', -0.62), y2 = num('y2', 0.085), yGrav = y2 + 0.03, yLawn = y2 + HT - 0.018;
  for (let i = -9; i <= 9; i++) {
    kerb(str('fk', 'A') === 'A' ? mA : mB, i * PITCH + 0.12, -R() * 0.0008, (R() - 0.5) * 0.0016, 0, 1 + (R() - 0.5) * 0.05);
    kerb(str('bk', 'B') === 'A' ? mA : mB, i * PITCH - 0.07, y2 - R() * 0.0008, z2 + (R() - 0.5) * 0.0016, 0, 1 + (R() - 0.5) * 0.05);
  }
  // kerblar orasidagi chok (to'q)
  const plane = (w, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; scene.add(m); return m; };
  const pm = new THREE.MeshStandardMaterial({ map: await tex('pave_a', true, [40 / 0.8, 12 / 0.8]), normalMap: await tex('pave_n', false, [40 / 0.8, 12 / 0.8]), roughness: 0.88, color: col('pave', 'cfc8bd') });
  plane(40, 12, pm, 0, yPave, zf + 6);
  const gm = new THREE.MeshStandardMaterial({ map: await tex('grav_a', true, [52, 0.91]), normalMap: await tex('grav_n', false, [52, 0.91]), roughness: 0.95, color: col('grav', 'eeeae2') }); gm.normalScale.set(1.2, 1.2);
  plane(40, 0.7, gm, 0, yGrav, (zb + z2) / 2 - 0.02);
  const lm = new THREE.MeshStandardMaterial({ map: await tex('lawn_a', true, [60 / 1.2, 40 / 1.2]), normalMap: await tex('lawn_n', false, [60 / 1.2, 40 / 1.2]), roughness: 1, color: (Q_has('lawnc') ? new THREE.Color().setRGB(...str('lawnc', '1,1,1').split(',').map(Number)) : new THREE.Color(1.25, 1.3, 1.15)).multiplyScalar(num('lawnk', 1)) });
  plane(60, 40, lm, 0, yLawn, z2 - T / 2 - 20);
  // tuproq to'ldirgichlari (teshik ko'rinmasin)
  const soil = new THREE.MeshStandardMaterial({ color: 0x3a342c, roughness: 1 });
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(40, 0.3, 0.6), soil); b1.position.set(0, yGrav - 0.151, (zb + z2) / 2); scene.add(b1);

  if (num('bush', 1)) {
    const bt = await tex('lawn_a', true, [3, 2]), bn = await tex('lawn_n', false, [3, 2]);
    const bm = new THREE.MeshStandardMaterial({ map: bt, normalMap: bn, roughness: 1, color: new THREE.Color(1.15, 1.3, 1.0) }); bm.normalScale.set(3, 3);
    const base = new THREE.IcosahedronGeometry(1, 40);
    for (const [bx, br] of [[-2.55, 0.17], [-1.55, 0.2], [-0.5, 0.17], [0.55, 0.2], [1.6, 0.17], [2.6, 0.2], [-3.6, 0.2], [-4.7, 0.17]]) {
      const g = base.clone(); const p = g.attributes.position; const r2 = rng(Math.round(bx * 100) + 999);
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 1 + 0.022 * Math.sin(x * 9 + bx) * Math.sin(y * 8) * Math.sin(z * 10 + bx * 3) + 0.012 * Math.sin(x * 23) * Math.sin(z * 27 + y * 19) + 0.006 * Math.sin(x * 61 + y * 47) * Math.sin(z * 53); p.setXYZ(i, x * k, y * k * 0.93, z * k); }
      const nn = g.attributes.normal; const v = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { v.set(p.getX(i), p.getY(i) / 0.93, p.getZ(i)).normalize(); nn.setXYZ(i, v.x, v.y, v.z); }
      const me = new THREE.Mesh(g, bm); me.scale.setScalar(br * 1.45); me.position.set(bx * 1.25 + num('bushx', 0.3), yLawn + br * 1.45 * 0.8, z2 - num('bushz', 0.5)); me.castShadow = true; me.receiveShadow = true; scene.add(me);
    }
  }
  if (num('hedge', 1)) {
    const ht = await tex('lawn_a', true, [26, 2.2]), hn = await tex('lawn_n', false, [26, 2.2]);
    const hm = new THREE.MeshStandardMaterial({ map: ht, normalMap: hn, roughness: 1, color: new THREE.Color(0.8, 0.95, 0.72) }); hm.normalScale.set(3, 3);
    const hd = new THREE.Mesh(new THREE.BoxGeometry(40, 3.2, 0.6), hm); hd.position.set(0, yLawn + 1.6, num('hz', -3.3)); hd.receiveShadow = true; hd.castShadow = true; scene.add(hd);
  }
  const props = str('props', '');
  if (props) {
    const gl = new GLTFLoader();
    for (const it of props.split(';')) {
      const [nm, px, pz, sc = '1', ry = '0'] = it.split(':'); const g = (await gl.loadAsync(`/props/${nm}/${nm}.gltf`)).scene;
      g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material.map) o.material.map.anisotropy = 8; if (o.material.alphaMap || o.material.transparent) { o.material.alphaTest = 0.4; o.material.transparent = false; } o.material.side = THREE.DoubleSide; } });
      g.scale.setScalar(+sc); g.rotation.y = +ry * Math.PI / 180; g.position.set(+px, yLawn - 0.01, +pz); scene.add(g);
    }
  }
  const cam = new THREE.PerspectiveCamera(num('fov', 32), W / H, 0.05, 120);
  cam.position.set(num('cx', 0.62), num('cy', 0.58), num('cz', 1.05));
  cam.lookAt(new THREE.Vector3(num('tx', -0.12), num('ty', 0.1), num('tz', -0.25)));
  const sa = num('sunaz', 118) * Math.PI / 180, se = num('sunel', 34) * Math.PI / 180;      // azimut: +x dan soat miliga qarshi
  const sun = new THREE.DirectionalLight(col('sunc', 'fff1dc'), num('sun', 3.2));
  const tgt = new THREE.Vector3(0, 0.05, 0);
  sun.position.copy(tgt).add(new THREE.Vector3(Math.cos(sa) * Math.cos(se), Math.sin(se), Math.sin(sa) * Math.cos(se)).multiplyScalar(20));
  sun.target.position.copy(tgt); sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 50 });
  sun.shadow.mapSize.set(8192, 8192); sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.002; sun.shadow.radius = 2;
  scene.add(sun, sun.target);
  scene.add(new THREE.HemisphereLight(0xcfe2ff, 0x8a947a, num('hemi', 0.6)));
  if (num('leaf', 1)) {
    const sz = num('leafsz', 5);
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), new THREE.MeshBasicMaterial({ map: leafTexture(21), blending: THREE.MultiplyBlending, transparent: true, depthWrite: false, premultipliedAlpha: true, toneMapped: false, fog: false }));
    leaf.rotation.x = -Math.PI / 2; leaf.rotation.z = 0.4; leaf.position.set(num('leafx', -2.6), yLawn + 0.004, num('leafz', -3.4)); leaf.renderOrder = 5; scene.add(leaf);
  }
  renderer.render(scene, cam);
  window.__png = () => renderer.domElement.toDataURL('image/png'); window.__done = true;
}
main().catch((e) => { window.__err = String(e && e.stack || e); window.__done = true; });
