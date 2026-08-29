import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import * as walls from './walls.js';
import { rngFrom } from '../core/rng.js';
import { clip, clipShadow } from './clip.js';
import { makePatchTexture, makePathShape, makeRegionTexture, makeBladeTexture,
         makeCloudTexture, tuftGeometry } from './textures.js';
import * as footpath from './footpath.js';
import * as rocks from './rocks.js';
import * as segments from './segments.js';
import { active } from './themes/index.js';

const S = () => CFG.scatter;

let clouds = null;

function buildClouds() {
  const C = S().clouds;
  if (!C || !C.enabled) return;
  const R = CFG.arena.max;
  const tex = makeCloudTexture(S().seed + 17);
  owned.push(tex);
  const rep = (R * 2) / C.tileWorldSize;
  tex.repeat.set(rep, rep);
  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(R, 96),
    clip(new THREE.MeshBasicMaterial({
      map: tex, color: C.color, transparent: true, opacity: C.strength,
      depthWrite: false,
    })),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = C.y;

  mesh.renderOrder = 2;
  scene.add(mesh);
  clouds = mesh;
  built.push(mesh);
}

export function update(dt) {
  active()?.update?.(dt);
  if (!clouds) return;
  const C = S().clouds;
  const t = clouds.material.map;
  t.offset.x += (C.wind[0] / C.tileWorldSize) * dt;
  t.offset.y += (C.wind[1] / C.tileWorldSize) * dt;
}

const built = [];

// Every texture this module makes, so a theme swap hands them back rather than
// stranding a canvas on the GPU. Textures owned elsewhere are freed by their
// own module: footpath.reset() and rocks.clear().
const owned = [];
const themeBuilt = [];

// `margin` is what an obstacle asks for on top of its own reach: a decal may run
// out to the ring and be cut by it, a wall or a rock may not.
function free(x, z, rad, margin = 0) {
  if (Math.hypot(x, z) + rad + margin > CFG.arena.max - 2) return false;

  if (Math.hypot(x, z) < S().clear + rad) return false;

  if (walls.inside(x, z, rad * 0.5 + 0.6)) return false;
  return true;
}

function instance(tex, tint, items, y, order, opacity = 1, surface = null) {
  if (!items.length) return;
  const geo = new THREE.PlaneGeometry(2, 2);

  const mat = clip(new THREE.MeshLambertMaterial({
    ...(surface ? { map: surface, alphaMap: tex } : { map: tex }),
    color: tint, transparent: true, opacity,
    depthWrite: false, side: THREE.DoubleSide,
  }));
  const mesh = new THREE.InstancedMesh(geo, mat, items.length);
  mesh.receiveShadow = true;
  mesh.renderOrder = order;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const col = new THREE.Color();
  items.forEach((it, i) => {
    e.set(-Math.PI / 2, 0, it.spin);
    q.setFromEuler(e);
    pos.set(it.x, y + it.lift, it.z);
    scl.set(it.r * it.aspect, it.r / it.aspect, 1);
    mesh.setMatrixAt(i, m.compose(pos, q, scl));

    const v = it.shade;
    mesh.setColorAt(i, col.setRGB(v, v, v));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
  built.push(mesh);
}

export function clear() {
  clouds = null;

  rocks.clear();
  segments.clear();
  footpath.reset();

  for (const m of themeBuilt) {
    m.material?.map?.dispose();
    m.material?.alphaMap?.dispose();
  }
  themeBuilt.length = 0;

  for (const t of owned) t.dispose();
  owned.length = 0;

  for (const m of built) {
    scene.remove(m);
    m.geometry?.dispose();
    m.material?.dispose();
  }
  built.length = 0;
}

export function build() {
  clear();
  const C = S();
  if (!C || !C.enabled) return;
  const rnd = rngFrom(C.seed);
  const R = CFG.arena.max;
  const theme = active();
  const patch = theme?.patchTexture ?? makePatchTexture;

  const TEX = {
    grass: patch(C.seed + 1, 'grass'),
    moss: patch(C.seed + 2, 'moss'),
    gravel: patch(C.seed + 3, 'gravel'),
    path: [0, 1, 2].map((i) => makePathShape(C.seed + 4 + i * 7)),
    region: makeRegionTexture(C.seed + 5),
  };
  owned.push(TEX.grass, TEX.moss, TEX.gravel, TEX.region, ...TEX.path);

  const buckets = { grass: [], moss: [], gravel: [], path: [] };

  const RG = C.regions;
  const regions = [];
  for (let i = 0; i < RG.count; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (R - RG.min * 0.5);
    const r = RG.min + rnd() * (RG.max - RG.min);
    regions.push({
      x: Math.cos(a) * d, z: Math.sin(a) * d, r,
      spin: rnd() * Math.PI * 2, lift: rnd() * 0.002,
      aspect: 0.7 + rnd() * 0.6, shade: 0.9 + rnd() * 0.2,
      tint: RG.tints[(rnd() * RG.tints.length) | 0],
    });
  }

  for (const tint of RG.tints) {
    instance(TEX.region, tint, regions.filter((g) => g.tint === tint),
             0.006, -5, RG.opacity);
  }

  const P = C.path;
  for (const { p, hx, hz } of footpath.plan(rnd)) {
    const hl = Math.hypot(hx, hz) || 1;

    const spin = Math.atan2(-hz / hl, hx / hl);
    for (let k = 0; k < 2; k++) {
      const j = (rnd() - 0.5) * P.width * 0.35;
      const x = p.x + (-hz / hl) * j, z = p.y + (hx / hl) * j;
      const r = P.width * (0.5 + rnd() * 0.35);
      if (!free(x, z, r * 0.4)) continue;
      buckets.path.push({ x, z, r,
                          spin: spin + (rnd() - 0.5) * 0.25,
                          lift: rnd() * 0.004,
                          aspect: 1.5 + rnd() * 0.35,
                          shade: 0.85 + rnd() * 0.3 });
    }
  }

  const kinds = ['grass', 'grass', 'moss', 'gravel'];
  const clusters = C.patches.clusters;
  for (let c = 0; c < clusters; c++) {
    const kind = kinds[(rnd() * kinds.length) | 0];
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (R - 8);
    const cx = Math.cos(a) * d, cz = Math.sin(a) * d;
    const spread = C.patches.spread * (0.5 + rnd());
    const n = 2 + Math.floor(rnd() * (C.patches.perCluster - 1));
    for (let i = 0; i < n; i++) {
      const aa = rnd() * Math.PI * 2, dd = Math.sqrt(rnd()) * spread;
      const x = cx + Math.cos(aa) * dd, z = cz + Math.sin(aa) * dd;
      const r = C.patches.min + rnd() * (C.patches.max - C.patches.min);
      if (!free(x, z, r * 0.5)) continue;
      buckets[kind].push({ x, z, r, spin: rnd() * Math.PI * 2, lift: rnd() * 0.006,
                           aspect: 0.65 + rnd() * 0.7, shade: 0.8 + rnd() * 0.4 });
    }
  }

  buildTufts(rnd, buckets.grass);

  TEX.path.forEach((shape, i) => {
    instance(shape, C.tint.path, buckets.path.filter((_, k) => k % 3 === i),
             0.012, -3, C.opacity.path, footpath.surface(i));
  });
  instance(TEX.gravel, C.tint.gravel, buckets.gravel, 0.016, -2, C.opacity.gravel);
  instance(TEX.moss, C.tint.moss, buckets.moss, 0.02, -1, C.opacity.moss);
  instance(TEX.grass, C.tint.grass, buckets.grass, 0.024, -1, C.opacity.grass);

  built.push(...rocks.build(rnd, free));
  segments.build();
  buildClouds();

  if (theme?.features) {
    themeBuilt.push(...theme.features({
      THREE, scene, rnd, free, onPath: footpath.onPath, clip, clipShadow,
      arenaMax: R, seed: C.seed,
    }));
    built.push(...themeBuilt);
  }
}

function buildTufts(rnd, patches) {
  const C = S().tufts;
  if (!C.count || !patches.length) return;

  const geo = tuftGeometry();
  const blade = active()?.bladeTexture ?? makeBladeTexture;
  const bladeTex = blade(S().seed + 23);
  owned.push(bladeTex);
  const mat = clip(new THREE.MeshLambertMaterial({
    alphaMap: bladeTex, color: C.color,
    alphaTest: 0.45, side: THREE.FrontSide, transparent: false,
  }));

  const mesh = new THREE.InstancedMesh(geo, mat, C.count);

  mesh.receiveShadow = true;
  mesh.castShadow = false;

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();
  let placed = 0;
  for (let guard = 0; placed < C.count && guard < C.count * 12; guard++) {
    const patch = patches[(rnd() * patches.length) | 0];
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * patch.r * 0.85;
    const x = patch.x + Math.cos(a) * d, z = patch.z + Math.sin(a) * d;
    if (!free(x, z, 0.3)) continue;
    const ht = C.min + rnd() * (C.max - C.min);

    e.set((rnd() - 0.5) * 0.3, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.3);
    q.setFromEuler(e);
    p.set(x, 0, z);
    sc.set(ht * (0.7 + rnd() * 0.6), ht, ht * (0.7 + rnd() * 0.6));
    mesh.setMatrixAt(placed, m.compose(p, q, sc));
    const v = 0.72 + rnd() * 0.56;
    mesh.setColorAt(placed, col.setRGB(v, v, v));
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
  built.push(mesh);
}
