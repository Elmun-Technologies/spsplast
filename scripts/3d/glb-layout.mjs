/**
 * terilgan.glb (QR 3D sahifalardagi "Укладка") tuzilmasini o'qish va "ko'tarilgan"
 * plitkaning asl o'rnini (teshikni) topish — "Соберите сами" rejimi uchun.
 *
 * terilgan.glb: har bir plitka — alohida ildiz node (`mesh` nomi `t_*`), `qum` — qum
 * yostig'i. Bitta plitka ko'tarilgan: y = qalinlik + 1 mm, Y o'qi atrofida +9° va
 * (0.62·m, 0.18·m) ga surilgan (m — plitkaning eng katta tomoni). Bu qoida 91 ta
 * trotuar modelining hammasida tekshirildi (teshik boshqa plitkalar bilan ustma-ust
 * tushmaydi). Teshik band bo'lsa — null: brauzer ko'tarilgan plitkani slot qilmaydi.
 */
import fs from 'node:fs';

/** GLB faylidan JSON qismini o'qiydi (binar qism kerak emas). */
export function readGlbJson(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32LE(0) !== 0x46546c67) throw new Error(`${file}: GLB emas`);
  const len = b.readUInt32LE(12);
  return JSON.parse(b.subarray(20, 20 + len).toString('utf8'));
}

const yawOf = (q) => (q ? 2 * Math.atan2(q[1], q[3]) : 0);
const LIFT_TURN = (9 * Math.PI) / 180;
const T = (n) => n.translation || [0, 0, 0];

/**
 * @returns {{ x:number, z:number, yaw:number } | null} teshik markazi (m) va plitkaning
 *   asl burchagi (radian, Y o'qi atrofida).
 */
export function findHole(json) {
  const meshName = (n) => (n.mesh == null ? '' : json.meshes[n.mesh]?.name || '');
  const tiles = json.nodes.filter((n) => meshName(n).startsWith('t_'));
  const lift = tiles.find((n) => T(n)[1] > 0.001);
  if (!lift) return null;
  const acc = json.accessors[json.meshes[lift.mesh].primitives[0].attributes.POSITION];
  const wx = acc.max[0] - acc.min[0];
  const wz = acc.max[2] - acc.min[2];
  const m = Math.max(wx, wz);
  const x = T(lift)[0] - 0.62 * m;
  const z = T(lift)[2] - 0.18 * m;
  const free = tiles.every((n) => n === lift || Math.hypot(T(n)[0] - x, T(n)[2] - z) > 0.45 * Math.min(wx, wz));
  if (!free) return null;
  const r = (v) => Math.round(v * 10000) / 10000;
  return { x: r(x), z: r(z), yaw: r(yawOf(lift.rotation) - LIFT_TURN) };
}
