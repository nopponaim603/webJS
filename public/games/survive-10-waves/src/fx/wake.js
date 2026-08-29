import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { WAKE_TEX } from './textures.js';

const WAKE = () => CFG.player.wake;

const wake = (() => {
  const N = CFG.player.wake.points;
  const mat = () => new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const ribGeo = new THREE.BufferGeometry();
  ribGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 2 * 3), 3));
  ribGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 2 * 3), 3));

  const uv = new Float32Array(N * 2 * 2);
  for (let i = 0; i < N; i++) { uv[i * 4 + 1] = 0; uv[i * 4 + 3] = 1; }
  ribGeo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  const idx = [];
  for (let i = 0; i < N - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  ribGeo.setIndex(idx);
  const ribbon = new THREE.Mesh(ribGeo, new THREE.MeshBasicMaterial({
    map: WAKE_TEX, vertexColors: true, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  }));
  ribbon.frustumCulled = false;
  ribbon.renderOrder = 3;
  ribbon.visible = false;
  scene.add(ribbon);

  const streaks = [0, 1, 2, 3].map(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const l = new THREE.Line(g, mat());
    l.frustumCulled = false;
    l.renderOrder = 3;
    l.visible = false;
    scene.add(l);
    return l;
  });

  return { ribbon, streaks, pts: [], running: false, life: 0 };
})();

const _wdir = new THREE.Vector3();
const _wcol = new THREE.Color();

export function start() {
  wake.pts.length = 0;
  wake.running = true;
  wake.life = WAKE().life;

  wake.ribbon.material.opacity = 1;
  for (const s of wake.streaks) s.material.opacity = 1;
}

export function feed(pos) {
  if (!wake.running) return;
  const N = WAKE().points;
  wake.pts.push(pos.x, pos.y, pos.z);
  while (wake.pts.length > N * 3) wake.pts.splice(0, 3);
  rebuild();
}

export function end() { wake.running = false; }

function hide() {
  wake.ribbon.visible = false;
  for (const s of wake.streaks) s.visible = false;
}

function rebuild() {
  const W = WAKE();
  const n = wake.pts.length / 3;
  if (n < 2) { hide(); return; }

  const hx = wake.pts[3] - wake.pts[0], hz = wake.pts[5] - wake.pts[2];
  const hl = Math.hypot(hx, hz) || 1;
  const ex = -(hx / hl) * W.tailExtend, ez = -(hz / hl) * W.tailExtend;
  const px = (i) => wake.pts[i * 3] + (i === 0 ? ex : 0);
  const pz = (i) => wake.pts[i * 3 + 2] + (i === 0 ? ez : 0);

  const rp = wake.ribbon.geometry.attributes.position;
  const rc = wake.ribbon.geometry.attributes.color;
  _wcol.setHex(W.color);

  for (let i = 0; i < n; i++) {
    const x = px(i), z = pz(i);

    const j = Math.min(n - 1, i + 1), k = Math.max(0, i - 1);
    _wdir.set(px(j) - px(k), 0, pz(j) - pz(k));
    if (_wdir.lengthSq() < 1e-8) _wdir.set(0, 0, 1);
    _wdir.normalize();
    const nx = -_wdir.z, nz = _wdir.x;

    const t = n > 1 ? i / (n - 1) : 1;
    const half = W.width * 0.5 * (W.taper + (1 - W.taper) * t);
    rp.setXYZ(i * 2, x - nx * half, W.y, z - nz * half);
    rp.setXYZ(i * 2 + 1, x + nx * half, W.y, z + nz * half);
    const b = Math.pow(t, W.fadePow);
    rc.setXYZ(i * 2, _wcol.r * b, _wcol.g * b, _wcol.b * b);
    rc.setXYZ(i * 2 + 1, _wcol.r * b, _wcol.g * b, _wcol.b * b);
  }
  rp.needsUpdate = rc.needsUpdate = true;
  wake.ribbon.geometry.setDrawRange(0, (n - 1) * 6);
  wake.ribbon.visible = true;

  wake.streaks.forEach((line, s) => {
    const y = W.streakY[s >> 1];
    const side = (s & 1) ? 1 : -1;
    const lp = line.geometry.attributes.position;
    const lc = line.geometry.attributes.color;
    for (let i = 0; i < n; i++) {
      const j = Math.min(n - 1, i + 1), k = Math.max(0, i - 1);
      _wdir.set(px(j) - px(k), 0, pz(j) - pz(k));
      if (_wdir.lengthSq() < 1e-8) _wdir.set(0, 0, 1);
      _wdir.normalize();
      lp.setXYZ(i, px(i) + -_wdir.z * side * W.streakX, y,
                   pz(i) + _wdir.x * side * W.streakX);
      const b = n > 1 ? Math.pow(i / (n - 1), W.fadePow) : 1;
      lc.setXYZ(i, _wcol.r * b, _wcol.g * b, _wcol.b * b);
    }
    lp.needsUpdate = lc.needsUpdate = true;
    line.geometry.setDrawRange(0, n);
    line.visible = true;
  });
}

export function update(dt) {
  if (wake.running || wake.life <= 0) return;
  wake.life -= dt;
  if (wake.life <= 0) { hide(); wake.pts.length = 0; return; }
  const o = (wake.life / WAKE().life) ** 0.8;
  wake.ribbon.material.opacity = o;
  for (const s of wake.streaks) s.material.opacity = o;
}

export function clear() {
  wake.running = false;
  wake.life = 0;
  wake.pts.length = 0;
  hide();
}
