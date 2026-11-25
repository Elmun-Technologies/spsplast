import * as THREE from 'three';
export const Q = new URLSearchParams(location.search);
export const num = (k, d) => (Q.has(k) ? +Q.get(k) : d);
export const str = (k, d) => (Q.has(k) ? Q.get(k) : d);
export const col = (k, d) => new THREE.Color('#' + str(k, d));
const loader = new THREE.TextureLoader();
export const tex = (name, srgb, rep) => new Promise((res, rej) => loader.load(`/tex/${name}.png`, (t) => {
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 16;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  res(t);
}, undefined, () => rej(new Error('tex ' + name))));
export function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
// O'lchamlar (m): uzunlik, yuz, faska (45°), umumiy qalinlik
export const L = 0.5, WF = 0.095, CH = 0.034, T = 0.064, HT = WF + CH;
// To'rtburchak: a,b,c,d (soat miliga qarshi, tashqaridan qaraganda), uv: a(0,0) b(1,0) c(1,1) d(0,1)
export function quad(a, b, c, d, uv = [0, 0, 1, 1]) {
  const g = new THREE.BufferGeometry();
  const [u0, v0, u1, v1] = uv;
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1], 2));
  g.computeVertexNormals(); return g;
}
