import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { manager } from '../core/loading.js';
import { clip } from './clip.js';
import { wallBox } from './wallbox.js';

const boxes = CFG.walls.boxes;

const meshes = [];

const texLoader = new THREE.TextureLoader(manager);
function loadTiling(url, srgb) {
  const t = texLoader.load(url);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;

  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const wallMat = clip(new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0.12 }));

// Mutated in place, not replaced: every wall mesh already holds this material,
// and the map slots do not change between themes.
export function retexture() {
  const old = [wallMat.map, wallMat.normalMap, wallMat.roughnessMap];
  wallMat.color.setHex(CFG.walls.color);
  wallMat.map = loadTiling(CFG.walls.texture, true);
  wallMat.normalMap = loadTiling(CFG.walls.normalMap, false);
  wallMat.roughnessMap = loadTiling(CFG.walls.roughnessMap, false);
  wallMat.normalScale.set(CFG.walls.normalStrength, CFG.walls.normalStrength);
  wallMat.needsUpdate = true;
  for (const map of old) map?.dispose();
}

retexture();

export function build() {
  for (const m of meshes) { scene.remove(m); m.geometry.dispose(); }
  meshes.length = 0;
  cornerCache.clear();
  const { height, sink } = CFG.walls;
  for (const b of boxes) {
    if (b.hidden) continue;

    const hh = height + sink;
    const geo = wallBox(b.hx * 2, hh, b.hz * 2, CFG.walls.chamfer, CFG.walls.tileWorldSize);
    const mesh = new THREE.Mesh(geo, wallMat);
    mesh.position.set(b.x, (height - sink) / 2, b.z);
    mesh.castShadow = true;

    mesh.receiveShadow = true;
    scene.add(mesh);
    meshes.push(mesh);
  }
}

export function push(x, z, r, out) {
  let moved = false;
  for (const b of boxes) {
    const dx = x - b.x, dz = z - b.z;
    const ox = b.hx + r - Math.abs(dx);
    const oz = b.hz + r - Math.abs(dz);
    if (ox <= 0 || oz <= 0) continue;
    if (ox < oz) x = b.x + Math.sign(dx || 1) * (b.hx + r);
    else z = b.z + Math.sign(dz || 1) * (b.hz + r);
    moved = true;
  }
  if (moved) out.set(x, 0, z);
  return moved;
}

// How far along the segment it first meets a wall, or -1 for a clear run. Walked
// by two thousand bugs several times a frame, so the two axes are written out
// rather than looped: iterating a pair meant building that pair for every box on
// the map, every call.
export function blocks(ax, az, bx, bz, r = 0) {
  const dx = bx - ax, dz = bz - az;
  const loX = Math.min(ax, bx), hiX = Math.max(ax, bx);
  const loZ = Math.min(az, bz), hiZ = Math.max(az, bz);
  let best = -1;

  for (const b of boxes) {
    // Four comparisons to be rid of a box the segment never comes near, before
    // any of the arithmetic that works out where it would have hit one.
    if (loX > b.x + b.hx + r || hiX < b.x - b.hx - r) continue;
    if (loZ > b.z + b.hz + r || hiZ < b.z - b.hz - r) continue;

    let t0 = 0, t1 = 1;

    if (Math.abs(dx) < 1e-9) {
      if (ax < b.x - b.hx - r || ax > b.x + b.hx + r) continue;
    } else {
      let n = (b.x - b.hx - r - ax) / dx, f = (b.x + b.hx + r - ax) / dx;
      if (n > f) { const s = n; n = f; f = s; }
      if (n > t0) t0 = n;
      if (f < t1) t1 = f;
      if (t0 > t1) continue;
    }

    if (Math.abs(dz) < 1e-9) {
      if (az < b.z - b.hz - r || az > b.z + b.hz + r) continue;
    } else {
      let n = (b.z - b.hz - r - az) / dz, f = (b.z + b.hz + r - az) / dz;
      if (n > f) { const s = n; n = f; f = s; }
      if (n > t0) t0 = n;
      if (f < t1) t1 = f;
      if (t0 > t1) continue;
    }

    if (t0 >= 0 && t0 <= 1 && (best < 0 || t0 < best)) best = t0;
  }
  return best;
}

const cornerCache = new Map();

function cornersFor(r, clear) {
  const key = `${r}|${clear}`;
  let pts = cornerCache.get(key);
  if (pts) return pts;
  pts = [];
  const m = r + clear;
  for (const b of boxes) {
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const x = b.x + sx * (b.hx + m), z = b.z + sz * (b.hz + m);
        if (!inside(x, z, r)) pts.push({ x, z });
      }
    }
  }
  cornerCache.set(key, pts);
  return pts;
}

const EPS = 0.03;

function freePoint(x, z, r, out) {
  for (let pass = 0; pass < 2; pass++) {
    for (const b of boxes) {
      const dx = x - b.x, dz = z - b.z;
      const ox = b.hx + r + EPS - Math.abs(dx);
      const oz = b.hz + r + EPS - Math.abs(dz);
      if (ox <= 0 || oz <= 0) continue;
      if (ox < oz) x = b.x + Math.sign(dx || 1) * (b.hx + r + EPS);
      else z = b.z + Math.sign(dz || 1) * (b.hz + r + EPS);
    }
  }
  out.x = x; out.z = z;
}

const _freeA = { x: 0, z: 0 };
const _freeB = { x: 0, z: 0 };

export function pathClear(ax, az, bx, bz, r) {
  freePoint(ax, az, r, _freeA);
  freePoint(bx, bz, r, _freeB);
  return blocks(_freeA.x, _freeA.z, _freeB.x, _freeB.z, r) < 0;
}

export const lastPath = [];

export function detour(fromX, fromZ, toX, toZ, r, clear, out, recordPath = false) {
  freePoint(fromX, fromZ, r, _freeA);
  freePoint(toX, toZ, r, _freeB);
  fromX = _freeA.x; fromZ = _freeA.z;
  toX = _freeB.x; toZ = _freeB.z;

  if (blocks(fromX, fromZ, toX, toZ, r) < 0) return false;

  const pts = cornersFor(r, clear);
  const n = pts.length;
  const START = n, GOAL = n + 1;
  const at = (i) => (i === START ? { x: fromX, z: fromZ }
                   : i === GOAL ? { x: toX, z: toZ } : pts[i]);
  const h = (i) => {
    const p = at(i);
    return Math.hypot(toX - p.x, toZ - p.z);
  };

  const g = new Array(n + 2).fill(Infinity);
  const f = new Array(n + 2).fill(Infinity);
  const prev = new Array(n + 2).fill(-1);
  const done = new Array(n + 2).fill(false);
  g[START] = 0;
  f[START] = h(START);

  for (;;) {
    let u = -1, best = Infinity;
    for (let i = 0; i <= GOAL; i++) if (!done[i] && f[i] < best) { best = f[i]; u = i; }
    if (u < 0) break;

    if (u === GOAL) break;
    done[u] = true;

    const a = at(u);
    for (let v = 0; v <= GOAL; v++) {
      if (done[v] || v === START) continue;
      const c = at(v);
      const step = Math.hypot(c.x - a.x, c.z - a.z);
      if (g[u] + step >= g[v]) continue;
      if (blocks(a.x, a.z, c.x, c.z, r) >= 0) continue;
      g[v] = g[u] + step;
      f[v] = g[v] + h(v);
      prev[v] = u;
    }
  }

  if (g[GOAL] === Infinity) return false;

  if (recordPath) {
    lastPath.length = 0;
    for (let node = GOAL; node !== -1; node = prev[node]) {
      const p = at(node);
      lastPath.push({ x: p.x, z: p.z });
      if (node === START) break;
    }
    lastPath.reverse();
  }

  let node = GOAL;
  while (prev[node] !== START && prev[node] !== -1) node = prev[node];
  if (prev[node] === -1) return false;
  const p = at(node);
  out.set(p.x, 0, p.z);
  return true;
}

export function inside(x, z, margin = 0) {
  for (const b of boxes) {
    if (Math.abs(x - b.x) <= b.hx + margin && Math.abs(z - b.z) <= b.hz + margin) return true;
  }
  return false;
}
