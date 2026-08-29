import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { manager } from '../core/loading.js';
import { onPath } from './footpath.js';
import { clip, clipShadow } from './clip.js';

const S = () => CFG.scatter;

let rockMap = null, rockNormal = null;

export function retexture() {
  rockMap?.dispose();
  rockNormal?.dispose();
  rockMap = rockNormal = null;
}

function rockTextures() {
  if (rockMap) return;
  const loader = new THREE.TextureLoader(manager);
  rockMap = loader.load(S().rockTexture);
  rockMap.colorSpace = THREE.SRGBColorSpace;
  rockMap.wrapS = rockMap.wrapT = THREE.RepeatWrapping;
  rockNormal = loader.load(S().rockNormal);
  rockNormal.wrapS = rockNormal.wrapT = THREE.RepeatWrapping;
}

function boxProjectUVs(geo, scale) {
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1);
    c.fromBufferAttribute(pos, i + 2);
    n.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a));
    const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
    for (let k = 0; k < 3; k++) {
      const v = k === 0 ? a : k === 1 ? b : c;

      const u = ax >= ay && ax >= az ? v.z : v.x;
      const w = ay >= ax && ay >= az ? v.z : v.y;
      uv[(i + k) * 2] = u * scale + 0.5;
      uv[(i + k) * 2 + 1] = w * scale + 0.5;
    }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

function rockGeometry({ salt, base, coarse, fine, flatten, uvScale }) {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const pos = geo.attributes.position;
  // Hashed by position: the geometry is non-indexed, so a shared corner exists
  // several times over and must be displaced identically each time.
  const hash = (x, y, z) => {
    let h = Math.imul(Math.round(x * 2048) ^ salt, 0x85ebca6b);
    h = Math.imul(h ^ Math.round(y * 2048), 0xc2b2ae35);
    h = Math.imul(h ^ Math.round(z * 2048), 0x27d4eb2f);
    h ^= h >>> 15;
    return ((h >>> 0) / 4294967296);
  };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const k = base + hash(x, y, z) * coarse
            + hash(z * fine.at, x * fine.at, y * fine.at) * fine.amp;
    pos.setXYZ(i, x * k, y * k * flatten, z * k);
  }
  geo.computeVertexNormals();
  boxProjectUVs(geo, uvScale);

  geo.computeBoundingBox();
  return { geo, top: geo.boundingBox.max.y };
}

function rockMaterial(color) {
  rockTextures();
  return clip(new THREE.MeshStandardMaterial({
    map: rockMap, normalMap: rockNormal,
    normalScale: new THREE.Vector2(0.6, 0.6),
    color, roughness: 0.95, metalness: 0, flatShading: true,
  }));
}

const blockers = [];

function blockIfTall(x, z, hx, hz, top) {
  if (top < CFG.player.height * S().blockAbove) return false;
  const box = { x, z, hx, hz, hidden: true };
  blockers.push(box);
  CFG.walls.boxes.push(box);
  return true;
}

function buildRocks(rnd, free) {
  const C = S().rocks;
  if (!C.count) return null;
  const R = CFG.arena.max;

  const { geo } = rockGeometry({
    salt: 0x9e3779b9, base: 0.58, coarse: 0.62, fine: { at: 3.1, amp: 0.22 },
    flatten: 0.55, uvScale: 0.7,
  });
  const mesh = new THREE.InstancedMesh(geo, rockMaterial(C.color), C.count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  clipShadow(mesh);

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
  let placed = 0;
  for (let guard = 0; placed < C.count && guard < C.count * 30; guard++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (R - 4);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const size = C.min + rnd() * (C.max - C.min);
    if (!free(x, z, size + 0.5, CFG.arena.obstacleEdge)) continue;
    e.set(rnd() * 0.5 - 0.25, rnd() * Math.PI * 2, rnd() * 0.5 - 0.25);
    q.setFromEuler(e);

    p.set(x, size * 0.42, z);
    s.set(size * (0.8 + rnd() * 0.5), size, size * (0.8 + rnd() * 0.5));
    mesh.setMatrixAt(placed, m.compose(p, q, s));

    const v = 0.82 + rnd() * 0.3;
    mesh.setColorAt(placed, col.setRGB(v, v, v));

    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
  return mesh;
}

function buildBoulders(rnd, free) {
  const C = S().boulders;
  if (!C || !C.count) return null;
  const R = CFG.arena.max;

  const { geo, top: geoTop } = rockGeometry({
    salt: 0x7f4a7c15, base: 0.62, coarse: 0.58, fine: { at: 2.7, amp: 0.2 },
    flatten: 0.85, uvScale: 0.45,
  });
  const mesh = new THREE.InstancedMesh(geo, rockMaterial(C.color), C.count);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  clipShadow(mesh);

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();
  let placed = 0;
  for (let guard = 0; placed < C.count && guard < C.count * 60; guard++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (R - 10);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const size = C.min + rnd() * (C.max - C.min);
    if (!free(x, z, size + 2, CFG.arena.obstacleEdge)) continue;

    if (onPath(x, z) || onPath(x + size, z) || onPath(x - size, z)
        || onPath(x, z + size) || onPath(x, z - size)) continue;

    if (blockers.some((b) => Math.abs(b.x - x) < size * 2.6 && Math.abs(b.z - z) < size * 2.6)) continue;

    const wide = 0.85 + rnd() * 0.4;
    e.set((rnd() - 0.5) * 0.24, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.24);
    q.setFromEuler(e);
    p.set(x, size * 0.5, z);
    sc.set(size * wide, size, size / wide);
    mesh.setMatrixAt(placed, m.compose(p, q, sc));
    const v = 0.86 + rnd() * 0.24;
    mesh.setColorAt(placed, col.setRGB(v, v, v));

    blockIfTall(x, z, size * wide * C.block, (size / wide) * C.block, p.y + sc.y * geoTop);
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
  return mesh;
}

export function build(rnd, free) {
  return [buildRocks(rnd, free), buildBoulders(rnd, free)].filter(Boolean);
}

export function clear() {
  retexture();
  for (const b of blockers) {
    const i = CFG.walls.boxes.indexOf(b);
    if (i >= 0) CFG.walls.boxes.splice(i, 1);
  }
  blockers.length = 0;
}
