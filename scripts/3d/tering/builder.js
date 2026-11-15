/**
 * "Соберите сами" — QR 3D sahifalaridagi (public/3d/t<NN>/) plitka terish rejimi.
 *
 * Manba: shu model uchun terilgan.glb ("Укладка" tabidagi fayl) — unda har bir
 * plitkaning haqiqiy joyi va burchagi bor (komplektlar, yarim plitkalar, aylantirilgan
 * qatorlar ham). Har bir joy — "slot": bo'sh bo'lsa och rangli soya, bosilganda plitka
 * tushadi, plitkani bosish — olib tashlash (yoki "Поворот" rejimida burish).
 *
 * Yig'ish: `npm run 3d:tering` (esbuild + three.js) -> public/3d/assets/tering-<hash>.js.
 * Sahifa uni faqat "Соберите сами" tabi ochilganda dynamic import qiladi.
 */
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  DirectionalLight,
  InstancedMesh,
  MeshBasicMaterial,
  Matrix4,
  Quaternion,
  Vector3,
  Vector2,
  Raycaster,
  Sphere,
  Box3,
  Color,
  PMREMGenerator,
  NeutralToneMapping,
  PCFShadowMap,
  SRGBColorSpace,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const TXT = {
  nogl: 'Ваш браузер не поддерживает 3D. Посмотрите вкладку «Укладка».',
  fail: 'Не удалось загрузить модель. Обновите страницу.',
  hintPlace: 'Нажмите на пустую клетку — уложите плитку · на плитку — уберите её',
  hintTurn: 'Нажмите на плитку — поверните её',
};

const Y = new Vector3(0, 1, 0);
const HIDE = new Matrix4().compose(new Vector3(0, -50, 0), new Quaternion(), new Vector3(1e-5, 1e-5, 1e-5));
const DROP_H = 0.32; // m — plitka shu balandlikdan tushadi
const DROP_MS = 340;
const LIFT_MS = 170;
const TURN_MS = 220;
const GHOST_S = 0.08; // bo'sh slot soyasining qalinligi (plitka qalinligiga nisbatan)

const fmtArea = (v) => v.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Plitkaning yuqoriga qaragan yuzalari proyeksiyasi (m²) — relyef va faskalar bilan. */
function topArea(geometry) {
  const pos = geometry.getAttribute('position');
  const idx = geometry.getIndex();
  const n = idx ? idx.count : pos.count;
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  let s = 0;
  for (let i = 0; i < n; i += 3) {
    const i0 = idx ? idx.getX(i) : i;
    const i1 = idx ? idx.getX(i + 1) : i + 1;
    const i2 = idx ? idx.getX(i + 2) : i + 2;
    a.fromBufferAttribute(pos, i0);
    b.fromBufferAttribute(pos, i1);
    c.fromBufferAttribute(pos, i2);
    // (b-a) x (c-a) ning y komponenti / 2 = XZ tekisligidagi proyeksiya yuzasi (ishorali)
    const cy = (c.x - a.x) * (b.z - a.z) - (b.x - a.x) * (c.z - a.z);
    if (cy > 0) s += cy / 2;
  }
  return s;
}

/**
 * @param {HTMLElement} root  #b — sahifadagi tayyor karkas (.bv, #bc, #bl, .sw, .ba)
 * @param {{ glb: string, hole: [number, number, number] | null, hint?: HTMLElement | null }} opts
 */
export function mount(root, opts) {
  const view = root.querySelector('.bv');
  const countEl = root.querySelector('#bc');
  const msg = root.querySelector('#bl');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const say = (t) => {
    msg.textContent = t;
    msg.hidden = !t;
  };

  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    say(TXT.nogl);
    return { show() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  view.appendChild(renderer.domElement);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.85;
  pmrem.dispose();
  const sun = new DirectionalLight(0xffffff, 1.6);
  sun.position.set(0.9, 2.2, 1.3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.01;
  Object.assign(sun.shadow.camera, { left: -1.1, right: 1.1, top: 1.1, bottom: -1.1, near: 0.5, far: 5 });
  scene.add(sun);

  const camera = new PerspectiveCamera(35, 1, 0.02, 30);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reduced;
  controls.dampingFactor = 0.12;
  controls.enablePan = false;
  controls.maxPolarAngle = (80 * Math.PI) / 180;

  let active = false;
  let raf = 0;
  const req = () => {
    if (!raf && active) raf = requestAnimationFrame(frame);
  };
  controls.addEventListener('change', req);

  const resize = () => {
    const w = view.clientWidth;
    const h = view.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    req();
  };
  new ResizeObserver(resize).observe(view);

  /** @type {Array<{type:any, i:number, pos:Vector3, q:Quaternion, extra:number, placed:boolean, anim:any}>} */
  const slots = [];
  const types = [];
  const tileMats = [];
  const pickables = [];
  let ready = false;
  let turnMode = false;

  const _m = new Matrix4();
  const _p = new Vector3();
  const _q = new Quaternion();
  const _s = new Vector3();
  const _yq = new Quaternion();

  function write(slot, now) {
    const t = slot.type;
    const a = slot.anim;
    let dy = 0;
    let sc = 1;
    let yaw = slot.extra;
    let tileOn = slot.placed;
    let ghostOn = !slot.placed;
    if (a) {
      const p = Math.min(1, Math.max(0, (now - a.t0) / a.dur));
      if (a.kind === 'drop') {
        if (now < a.t0) {
          tileOn = false;
          ghostOn = true;
        } else {
          const k = 0.72;
          dy = p < k ? DROP_H * (1 - (p / k) ** 2) : 0.012 * Math.sin((Math.PI * (p - k)) / (1 - k));
        }
      } else if (a.kind === 'lift') {
        tileOn = true;
        ghostOn = true;
        const e = p * p;
        dy = 0.07 * e;
        sc = Math.max(0.001, 1 - e);
      } else if (a.kind === 'turn') {
        yaw = a.from + (a.to - a.from) * easeInOut(p);
      }
      if (p >= 1) slot.anim = null;
    }
    _yq.setFromAxisAngle(Y, yaw);
    _q.multiplyQuaternions(_yq, slot.q);
    if (tileOn) {
      _p.copy(slot.pos);
      _p.y += dy;
      _s.set(sc, sc, sc);
      _m.compose(_p, _q, _s);
    }
    for (const im of t.tiles) im.setMatrixAt(slot.i, tileOn ? _m : HIDE);
    if (ghostOn) {
      _p.copy(slot.pos);
      _p.y += t.ymin * (1 - GHOST_S) + 0.0015;
      _s.set(0.94, GHOST_S, 0.94);
      _m.compose(_p, _q, _s);
    }
    for (const im of t.ghosts) im.setMatrixAt(slot.i, ghostOn ? _m : HIDE);
    t.dirty = true;
  }

  function flush() {
    for (const t of types) {
      if (!t.dirty) continue;
      for (const im of [...t.tiles, ...t.ghosts]) im.instanceMatrix.needsUpdate = true;
      t.dirty = false;
    }
  }

  const animating = new Set();
  function frame(now) {
    raf = 0;
    const moved = controls.update();
    for (const s of animating) {
      write(s, now);
      if (!s.anim) animating.delete(s);
    }
    flush();
    renderer.render(scene, camera);
    if (moved || animating.size) req();
  }

  function animate(slot, kind, extra = {}) {
    if (reduced) {
      slot.anim = null;
      write(slot, 0);
      return;
    }
    const dur = kind === 'drop' ? DROP_MS : kind === 'lift' ? LIFT_MS : TURN_MS;
    slot.anim = { kind, t0: performance.now() + (extra.delay || 0), dur, ...extra };
    animating.add(slot);
  }

  function updateCount() {
    let n = 0;
    let area = 0;
    for (const s of slots) {
      if (s.placed) {
        n += 1;
        area += s.type.area;
      }
    }
    countEl.textContent = `Плиток: ${n} · ≈ ${fmtArea(area)} м²`;
  }

  function place(slot, delay = 0) {
    if (slot.placed) return;
    slot.placed = true;
    animate(slot, 'drop', { delay });
  }
  function remove(slot) {
    if (!slot.placed) return;
    slot.placed = false;
    animate(slot, 'lift');
  }
  function turn(slot) {
    const from = slot.extra;
    slot.extra = from + slot.type.step;
    animate(slot, 'turn', { from, to: slot.extra });
  }

  function changed() {
    updateCount();
    flush();
    req();
  }

  // --- teginish: bir barmoq bilan qisqa bosish = harakat, sudrash/ikki barmoq = aylantirish
  const ray = new Raycaster();
  const ndc = new Vector2();
  const downs = new Map();
  let multi = false;
  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => {
    downs.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now() });
    if (downs.size > 1) multi = true;
  });
  const end = (e, ok) => {
    const d = downs.get(e.pointerId);
    downs.delete(e.pointerId);
    const wasMulti = multi;
    if (!downs.size) multi = false;
    if (!ok || !d || wasMulti || !ready || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8 || performance.now() - d.t > 650) return;
    tap(e.clientX, e.clientY);
  };
  el.addEventListener('pointerup', (e) => end(e, true));
  el.addEventListener('pointercancel', (e) => end(e, false));

  function tap(x, y) {
    const r = el.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    for (const hit of ray.intersectObjects(pickables, false)) {
      const slot = hit.object.userData.slots[hit.instanceId];
      if (!slot) continue;
      const ghost = hit.object.userData.ghost;
      if (ghost && !slot.placed) place(slot);
      else if (!ghost && slot.placed) (turnMode ? turn : remove)(slot);
      else continue;
      changed();
      return;
    }
  }

  // --- asboblar paneli
  root.querySelectorAll('.sw button').forEach((b) => {
    b.addEventListener('click', () => {
      root.querySelectorAll('.sw button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      const hex = b.dataset.c;
      for (const { mat, orig } of tileMats) {
        if (hex) mat.color.set(hex);
        else mat.color.copy(orig);
      }
      req();
    });
  });
  root.querySelectorAll('.ba button').forEach((b) => {
    b.addEventListener('click', () => {
      if (!ready) return;
      const a = b.dataset.a;
      if (a === 'fill') {
        const empty = slots.filter((s) => !s.placed);
        const n = empty.length;
        // orqa chap burchakdan old tomonga to'lqin bo'lib tushadi
        empty.sort((p, q) => p.order - q.order).forEach((s, i) => place(s, n > 1 ? (i / (n - 1)) * 650 : 0));
      } else if (a === 'clear') {
        slots.forEach(remove);
      } else if (a === 'rot') {
        turnMode = !turnMode;
        b.setAttribute('aria-pressed', String(turnMode));
        if (opts.hint) opts.hint.textContent = turnMode ? TXT.hintTurn : TXT.hintPlace;
        return;
      }
      changed();
    });
  });

  // --- modelni yuklash
  new GLTFLoader().load(
    opts.glb,
    (gltf) => {
      try {
        build(gltf.scene);
      } catch (err) {
        console.error(err);
        say(TXT.fail);
        return;
      }
      say('');
      ready = true;
      updateCount();
      resize();
      req();
    },
    undefined,
    () => say(TXT.fail),
  );

  function build(root3d) {
    root3d.updateMatrixWorld(true);
    const byKey = new Map();
    const bounds = new Box3();
    const frameBox = new Box3();
    const hole = opts.hole;
    for (const node of [...root3d.children]) {
      const meshes = [];
      node.traverse((o) => o.isMesh && meshes.push(o));
      if (!meshes.length) continue;
      if (/^qum/i.test(node.name)) {
        // qum yostig'i — joyida qoladi, soyalarni qabul qiladi
        meshes.forEach((m) => (m.receiveShadow = true));
        scene.add(node);
        frameBox.expandByObject(node);
        continue;
      }
      const pos = node.position.clone();
      const q = node.quaternion.clone();
      if (pos.y > 0.001) {
        // "Укладка"dagi ko'tarilgan plitka: asl joyiga qaytariladi (generator hisoblagan)
        if (!hole) continue;
        pos.set(hole[0], 0, hole[1]);
        q.setFromAxisAngle(Y, hole[2]);
      }
      const key = meshes.map((m) => m.geometry.uuid + ':' + m.material.uuid).join('|');
      let t = byKey.get(key);
      if (!t) {
        const g = meshes[0].geometry;
        if (!g.boundingBox) g.computeBoundingBox();
        const bb = g.boundingBox;
        const w = bb.max.x - bb.min.x;
        const d = bb.max.z - bb.min.z;
        t = {
          parts: meshes.map((m) => ({ geometry: m.geometry, material: m.material, local: node === m ? null : m.matrix.clone() })),
          ymin: bb.min.y,
          // relyefli ustki yuza proyeksiyasi; to'g'ri to'rtburchakda gabaritdan oshmasin
          area: Math.min(meshes.reduce((s, m) => s + topArea(m.geometry), 0) || w * d, w * d),
          step: Math.abs(w - d) < 0.004 ? Math.PI / 2 : Math.PI,
          slots: [],
          tiles: [],
          ghosts: [],
          dirty: true,
        };
        byKey.set(key, t);
        types.push(t);
      }
      const slot = { type: t, i: t.slots.length, pos, q, extra: 0, placed: false, anim: null, order: 0 };
      t.slots.push(slot);
      slots.push(slot);
      bounds.expandByPoint(pos);
      frameBox.expandByPoint(_p.copy(pos).setY(0.01));
    }
    if (!slots.length) throw new Error('terilgan.glb: plitka topilmadi');

    // Materiallar (rang almashtirish uchun nusxa, asl rang saqlanadi)
    const matCopy = new Map();
    const ghostMat = new MeshBasicMaterial({ color: 0xfffaf0, transparent: true, opacity: 0.55, depthWrite: false });
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    const radius = Math.max(size.x, size.z) / 2 + 0.3;
    const sphere = new Sphere(new Vector3(center.x, 0.1, center.z), radius + DROP_H);
    for (const t of types) {
      for (const part of t.parts) {
        let mat = matCopy.get(part.material);
        if (!mat) {
          mat = part.material.clone();
          matCopy.set(part.material, mat);
          tileMats.push({ mat, orig: mat.color.clone() });
        }
        const geo = part.local ? part.geometry.clone().applyMatrix4(part.local) : part.geometry;
        const tiles = new InstancedMesh(geo, mat, t.slots.length);
        tiles.castShadow = true;
        tiles.userData = { slots: t.slots, ghost: false };
        const ghosts = new InstancedMesh(geo, ghostMat, t.slots.length);
        ghosts.userData = { slots: t.slots, ghost: true };
        ghosts.renderOrder = 1;
        for (const im of [tiles, ghosts]) {
          im.boundingSphere = sphere; // o'zgarmas: ko'rinmas nusxalar uni buzmasin
          scene.add(im);
          pickables.push(im);
        }
        t.tiles.push(tiles);
        t.ghosts.push(ghosts);
      }
    }

    // "Как в каталоге" tugmasi — mahsulotning o'z rangi
    const origBtn = root.querySelector('.sw button[data-c=""]');
    if (origBtn && tileMats[0]) origBtn.style.background = '#' + tileMats[0].orig.getHexString(SRGBColorSpace);

    // Boshlanishiga orqa chap burchakda bir nechta plitka — qanday ishlashini ko'rsatadi
    const corner = new Vector3(bounds.min.x, 0, bounds.min.z);
    slots.forEach((s) => (s.order = s.pos.distanceTo(corner)));
    const sorted = [...slots].sort((a, b) => a.order - b.order);
    const pre = Math.max(1, Math.round(slots.length * 0.18));
    sorted.slice(0, pre).forEach((s) => (s.placed = true));
    slots.forEach((s) => write(s, 0));
    flush();

    // Kamera: butun maydon (qum yostig'i bilan) kadrga sig'sin — burchaklarni proyeksiya
    // qilib masofani ikkiga bo'lib qidiramiz (telefonda tor, kompyuterda keng ekran).
    const fc = frameBox.getCenter(new Vector3());
    controls.target.set(fc.x, 0, fc.z);
    camera.aspect = (view.clientWidth || 360) / (view.clientHeight || 400);
    camera.updateProjectionMatrix();
    // tor (telefon) ekranda — tikroq va to'g'riroq ko'rinish, maydon kengligi to'liq ishlatiladi
    const narrow = camera.aspect < 1;
    const theta = ((narrow ? 12 : 25) * Math.PI) / 180;
    const phi = ((narrow ? 40 : 50) * Math.PI) / 180;
    const dir = new Vector3(Math.sin(phi) * Math.sin(theta), Math.cos(phi), Math.sin(phi) * Math.cos(theta));
    const corners = [];
    for (const x of [frameBox.min.x, frameBox.max.x]) for (const y of [frameBox.min.y, frameBox.max.y]) for (const z of [frameBox.min.z, frameBox.max.z]) corners.push(new Vector3(x, y, z));
    const fits = (d) => {
      camera.position.copy(controls.target).addScaledVector(dir, d);
      camera.lookAt(controls.target);
      camera.updateMatrixWorld();
      return corners.every((c) => {
        const v = c.clone().project(camera);
        return Math.abs(v.x) < 0.94 && Math.abs(v.y) < 0.9;
      });
    };
    const vfov2 = () => (camera.fov * Math.PI) / 360;
    const fwd = new Vector3(-dir.x, 0, -dir.z).normalize(); // ekranda "yuqoriga" mos yer yo'nalishi
    let dist = 3;
    for (let it = 0; it < 4; it++) {
      let lo = 0.3;
      let hi = 20;
      for (let k = 0; k < 30; k++) {
        const mid = (lo + hi) / 2;
        if (fits(mid)) hi = mid;
        else lo = mid;
      }
      dist = hi;
      fits(dist);
      // perspektiva yaqin chetni pastga suradi — nishonni maydon kadr markazida qoladigan qilib siljitamiz
      let y0 = Infinity;
      let y1 = -Infinity;
      for (const c of corners) {
        const v = c.clone().project(camera);
        y0 = Math.min(y0, v.y);
        y1 = Math.max(y1, v.y);
      }
      const halfH = Math.tan(vfov2()) * dist;
      controls.target.addScaledVector(fwd, (((y0 + y1) / 2) * halfH) / Math.cos(phi));
    }
    camera.position.copy(controls.target).addScaledVector(dir, dist);
    controls.minDistance = dist * 0.3;
    controls.maxDistance = dist * 1.8;
    controls.update();
  }

  return {
    show(on) {
      active = !!on;
      if (active) {
        resize();
        req();
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
  };
}
