import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { smokePuffs } from './blast.js';

const _pdir = new THREE.Vector3();

export function dust(x, z, dx, dz, C, scale = 1) {
  _pdir.set(dx, 0, dz);
  smokePuffs.spawn({ x, y: 0, z }, _pdir, C, scale);
}

const L = CFG.rush.lane;
const LANE_POOL = 4;
const CAP = 768;
const PATCH_Y = 0.028;
// The patch grid is sized once off the default width, so it is a density: a
// wider lane covers more cells rather than the same cells spread thinner.
const CELL = Math.sqrt((L.spacing * L.width) / L.perStep);

// The mark belongs to the ground, not to the lane: every patch is a function of its own
// cell coordinates, so ground that stays under a swinging lane keeps the mark it has.
function hash(ix, iz, salt) {
  let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(salt, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const VERT_DECL = `
attribute float aGrow;
attribute float aSeed;
attribute float aWet;
varying float vGrow;
varying float vSeed;
varying float vWet;
varying vec2 vLocal;
`;

const VERT_BODY = `
vGrow = aGrow;
vSeed = aSeed;
vWet = aWet;
vLocal = position.xz * 2.0;
`;

const FRAG_DECL = `
uniform float uTime;
uniform vec3 uSheen;
uniform float uAlpha;
uniform float uStart;
varying float vGrow;
varying float vSeed;
varying float vWet;
varying vec2 vLocal;

float slimeHash(vec2 p) {
  return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453123);
}

float slimeNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = slimeHash(i);
  float b = slimeHash(i + vec2(1.0, 0.0));
  float c = slimeHash(i + vec2(0.0, 1.0));
  float d = slimeHash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
`;

// Measuring the falloff from a warped position, not a straight one: a plain disc that
// noise can only nibble at the edge of reads as a row of scallops down the lane.
const FRAG_SURFACE = `
vec2 sp = vLocal * (1.05 + vSeed * 0.7) + vSeed * 53.0;

vec2 warp = vec2(slimeNoise(sp * 0.9 + 3.7), slimeNoise(sp * 0.9 + 8.3)) - 0.5;
float d = length(vLocal + warp * 0.78);

float n = slimeNoise(sp * 2.1) * 0.52
        + slimeNoise(sp * 4.3 + vec2(uTime * 0.05, uTime * -0.04)) * 0.28
        + slimeNoise(sp * 9.1) * 0.20;

float field = 1.0 - d + (n - 0.5) * 0.5;
float cov = smoothstep(-0.15, 0.23, field);
if (cov <= 0.004) discard;

float inside = clamp((field + 0.15) / 0.38, 0.0, 1.0);
float fade = smoothstep(0.0, 1.0, vGrow);

diffuseColor.rgb *= 0.78 + 0.42 * n;
// vWet is how far the tank was through its wind-up when it claimed this ground,
// so the lane arrives at full strength exactly as the charge is let go.
diffuseColor.a *= uAlpha * cov * fade * mix(0.5, 1.0, inside) * mix(uStart, 1.0, vWet);
`;

// Wetness as emissive so it does not go out in the shadow of the tank that made it,
// which is exactly where the player is looking.
const FRAG_SHEEN = `
float rim = (1.0 - inside) * cov * fade;
float pulse = 0.72 + 0.28 * sin(uTime * 1.7 + vSeed * 21.0 + d * 3.4);
totalEmissiveRadiance += uSheen * (rim * rim * 0.55 * pulse * mix(0.45, 1.0, vWet));

float pools = slimeNoise(sp * 1.9 + 17.0);
float glint = smoothstep(0.80, 0.96, pools) * cov * fade;
totalEmissiveRadiance += uSheen * (glint * 0.7 * (0.7 + 0.3 * n) * mix(0.4, 1.0, vWet));

vec2 hl = vLocal - vec2(-0.34, -0.28);
totalEmissiveRadiance += uSheen * (exp(-dot(hl, hl) * 2.6) * 0.05 * cov * fade);
`;

const uniforms = {
  uTime: { value: 0 },
  uSheen: { value: new THREE.Color(L.sheen) },
  uAlpha: { value: L.alpha },
  uStart: { value: L.start },
};

const geometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const aGrow = new THREE.InstancedBufferAttribute(new Float32Array(CAP), 1)
  .setUsage(THREE.DynamicDrawUsage);
const aSeed = new THREE.InstancedBufferAttribute(new Float32Array(CAP), 1);
const aWet = new THREE.InstancedBufferAttribute(new Float32Array(CAP), 1)
  .setUsage(THREE.DynamicDrawUsage);
geometry.setAttribute('aGrow', aGrow);
geometry.setAttribute('aSeed', aSeed);
geometry.setAttribute('aWet', aWet);

const material = new THREE.MeshLambertMaterial({
  color: L.color, transparent: true, depthWrite: false, emissive: 0x000000,
});
material.onBeforeCompile = (shader) => {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', `#include <common>${VERT_DECL}`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>${VERT_BODY}`);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>${FRAG_DECL}`)
    .replace('#include <alphamap_fragment>', `#include <alphamap_fragment>${FRAG_SURFACE}`)
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>${FRAG_SHEEN}`);
};

const mesh = new THREE.InstancedMesh(geometry, material, CAP);
mesh.receiveShadow = true;
mesh.castShadow = false;
mesh.frustumCulled = false;
mesh.renderOrder = 1;
mesh.visible = false;
scene.add(mesh);

const free = [];
for (let i = CAP - 1; i >= 0; i--) free.push(i);

const cells = new Map();
const lanes = [];
for (let i = 0; i < LANE_POOL; i++) {
  lanes.push({ held: false, aimed: false, x: 0, z: 0, dx: 0, dz: 1, t: 0, reach: 0,
               half: L.width / 2 });
}

let stamp = 0;

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

function wake(slot, ix, iz, x, z) {
  const size = L.size * (0.7 + hash(ix, iz, 4) * 0.62);
  _e.set(0, hash(ix, iz, 3) * Math.PI * 2, 0);
  mesh.setMatrixAt(slot, _m.compose(_p.set(x, PATCH_Y, z), _q.setFromEuler(_e),
                                    _s.set(size, 1, size)));
  mesh.instanceMatrix.needsUpdate = true;
  aSeed.array[slot] = hash(ix, iz, 5);
  aSeed.needsUpdate = true;
}

function drop(c) {
  mesh.setMatrixAt(c.slot, _m.makeScale(0, 0, 0));
  mesh.instanceMatrix.needsUpdate = true;
  aGrow.array[c.slot] = 0;
  free.push(c.slot);
  cells.delete(c.key);
}

function wet(ix, iz, x, z, index, t) {
  const key = (ix + 2048) * 4096 + (iz + 2048);
  let c = cells.get(key);
  if (!c) {
    if (!free.length) return;
    c = { key, slot: free.pop(), g: 0, seen: 0, lane: index, drying: false, t };
    wake(c.slot, ix, iz, x, z);
    cells.set(key, c);
  }
  c.seen = stamp;
  c.lane = index;
  c.drying = false;
  c.t = t;
}

function claimGround(l, index) {
  const reach = l.reach;
  const ex = l.dx * reach, ez = l.dz * reach;
  const padX = Math.abs(l.dz) * l.half + CELL;
  const padZ = Math.abs(l.dx) * l.half + CELL;

  const i0 = Math.floor((Math.min(l.x, l.x + ex) - padX) / CELL);
  const i1 = Math.floor((Math.max(l.x, l.x + ex) + padX) / CELL);
  const k0 = Math.floor((Math.min(l.z, l.z + ez) - padZ) / CELL);
  const k1 = Math.floor((Math.max(l.z, l.z + ez) + padZ) / CELL);

  for (let ix = i0; ix <= i1; ix++) {
    for (let iz = k0; iz <= k1; iz++) {
      if (hash(ix, iz, 0) >= L.fill) continue;

      const x = (ix + 0.5) * CELL + (hash(ix, iz, 1) - 0.5) * L.jitter;
      const z = (iz + 0.5) * CELL + (hash(ix, iz, 2) - 0.5) * L.jitter;

      const rx = x - l.x, rz = z - l.z;
      const along = rx * l.dx + rz * l.dz;
      if (along < 0 || along > reach) continue;
      if (Math.abs(-rx * l.dz + rz * l.dx) > l.half) continue;

      wet(ix, iz, x, z, index, l.t);
    }
  }
}

// Claimed at the width of whatever is charging, so the strip on the ground is
// the ground that body will actually cover.
export function claim(width = L.width) {
  for (let i = 0; i < lanes.length; i++) {
    if (lanes[i].held) continue;
    lanes[i].held = true;
    lanes[i].aimed = false;
    lanes[i].half = width / 2;
    return i;
  }
  return -1;
}

// Aimed while the charge is being wound up; once it is let go the lane is left
// where it was, so the strip on the ground is the whole run, held still.
export function aim(i, x, z, dx, dz, t, reach) {
  const l = lanes[i];
  if (!l) return;
  l.x = x; l.z = z; l.dx = dx; l.dz = dz; l.t = t; l.reach = reach;
  l.aimed = true;
}

export function fade(i) {
  const l = lanes[i];
  if (!l || !l.held) return;
  for (const c of cells.values()) if (c.lane === i) c.drying = true;
  l.held = false;
  l.aimed = false;
}

export function update(dt) {
  uniforms.uTime.value += dt;
  stamp++;

  for (let i = 0; i < lanes.length; i++) {
    if (lanes[i].held && lanes[i].aimed) claimGround(lanes[i], i);
  }

  for (const c of cells.values()) {
    if (c.seen === stamp) c.g = Math.min(1, c.g + L.grow * dt);
    else {
      c.g -= L.grow * (c.drying ? L.die : L.wither) * dt;
      if (c.g <= 0) { drop(c); continue; }
    }
    aGrow.array[c.slot] = c.g;
    aWet.array[c.slot] = c.t;
  }
  aGrow.needsUpdate = true;
  aWet.needsUpdate = true;

  mesh.visible = cells.size > 0;
}

export function clear() {
  for (const c of cells.values()) drop(c);
  for (const l of lanes) { l.held = false; l.aimed = false; }
  mesh.visible = false;
}
