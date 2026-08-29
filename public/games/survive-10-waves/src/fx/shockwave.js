import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { ZONE_TEX, ZONE_FILL, SCORCH_TEX } from '../fx/textures.js';
import { makeGlow } from './glow.js';
import { addSplat } from './spatter.js';
import { lightning, smokePuffs, dustPuffs, claimLight, moveLight,
         releaseLight } from './blast.js';
import { clip } from '../arena/clip.js';

const W = () => CFG.jetStrike.wave;

const DISC = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const WALL = new THREE.CylinderGeometry(1, 1, 1, 40, 1, true);

// The field is three things at once: a sheet of light running out across the
// floor, a wall of it standing up off the front, and the arcs the front throws
// as it goes. They share one clock, so what the player sees and what the ground
// answers for are the same edge.
const sheet = new THREE.Mesh(DISC, clip(new THREE.MeshBasicMaterial({
  map: ZONE_TEX.disc, transparent: true, opacity: 0, depthWrite: false,
  blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
})));
sheet.position.y = 0.06;
sheet.renderOrder = 3;
sheet.visible = false;
scene.add(sheet);

const wall = new THREE.Mesh(WALL, new THREE.MeshBasicMaterial({
  transparent: true, opacity: 0, depthWrite: false,
  blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
}));
wall.renderOrder = 6;
wall.visible = false;
scene.add(wall);

const core = makeGlow(0xffffff, 1, 0);
core.renderOrder = 7;
core.visible = false;
scene.add(core);

const live = { on: false, x: 0, z: 0, t: 0, dur: 1, max: 1, arc: 0, dust: 0, light: -1 };

const _from = new THREE.Vector3();
const _to = new THREE.Vector3();
const _at = new THREE.Vector3();
const _dust = {};
const _smoke = {};

export const front = () => (live.on ? live.max * ease(live.t / live.dur) : 0);

// Fast out of the gate and easing into the rim: a front that ran at one speed
// would read as a growing circle rather than as something thrown.
const ease = (k) => 1 - Math.pow(1 - Math.min(1, k), 2);

// What the floor keeps of the landing: burns scattered under the boots, and the
// smoke coming off them. Laid once, at the moment of impact, so the marks are
// already there as the front runs out over them.
function mark(C, x, z, radius) {
  const S = C.scorch;
  for (let i = 0; i < S.count; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = radius * S.spread * Math.sqrt(Math.random());
    _at.set(x + Math.cos(a) * d, 0, z + Math.sin(a) * d);
    addSplat(_at, S.size * (0.6 + Math.random() * 0.8), S.tint, S.life, S.fadeIn,
             SCORCH_TEX);
  }

  const M = C.smoke;
  Object.assign(_smoke, M);
  for (let i = 0; i < M.count; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = radius * M.spread * Math.sqrt(Math.random());
    _at.set(x + Math.cos(a) * d, 0, z + Math.sin(a) * d);
    _from.set(Math.cos(a), 0, Math.sin(a));
    smokePuffs.spawn(_at, _from, _smoke, M.puff);
  }
}

export function open(x, z, radius) {
  const C = W();
  Object.assign(live, { on: true, x, z, t: 0, dur: C.time, max: radius, arc: 0, dust: 0 });
  if (live.light < 0) live.light = claimLight(C.keepFree);

  sheet.position.set(x, 0.06, z);
  wall.position.set(x, 0, z);
  core.position.set(x, C.coreLift, z);
  sheet.visible = wall.visible = core.visible = true;
  mark(C, x, z, radius);
}

export function clear() {
  live.on = false;
  sheet.visible = wall.visible = core.visible = false;
  if (live.light >= 0) { releaseLight(live.light); live.light = -1; }
}

function arcs(C, r, dt) {
  live.arc -= dt;
  if (live.arc > 0) return;
  live.arc = C.arcEvery;

  for (let i = 0; i < C.arcs; i++) {
    const a = Math.random() * Math.PI * 2;
    const near = r * (0.15 + Math.random() * 0.25);
    _from.set(live.x + Math.cos(a) * near, C.arcLift * (0.4 + Math.random()), live.z + Math.sin(a) * near);
    _to.set(live.x + Math.cos(a) * r, 0.2, live.z + Math.sin(a) * r);
    lightning(_from, _to);
  }
}

function grit(C, r, dt) {
  live.dust -= dt;
  if (live.dust > 0) return;
  live.dust = C.dust.every;

  Object.assign(_dust, C.dust, { y: C.dust.y });
  for (let i = 0; i < C.dust.count; i++) {
    const a = Math.random() * Math.PI * 2;
    _at.set(live.x + Math.cos(a) * r, 0, live.z + Math.sin(a) * r);
    _from.set(Math.cos(a), 0, Math.sin(a));
    dustPuffs.spawn(_at, _from, _dust, C.dust.size * 2);
  }
}

export function update(dt) {
  if (!live.on) return;
  const C = W();
  live.t += dt;

  const k = Math.min(1, live.t / live.dur);
  const r = live.max * ease(k);
  const fade = 1 - k;

  sheet.scale.setScalar((r * 2) / ZONE_FILL);
  sheet.material.color.setHex(C.color);
  sheet.material.opacity = C.sheet * fade;

  wall.scale.set(r, C.tall * (0.35 + 0.65 * fade), r);
  wall.position.y = wall.scale.y / 2;
  wall.material.color.setHex(C.rim);
  wall.material.opacity = C.wallOpacity * Math.pow(fade, 0.6);

  core.scale.setScalar(C.coreSize * (1 - k) * (0.8 + 0.4 * Math.random()));
  core.material.opacity = Math.pow(fade, 2);

  if (live.light >= 0) {
    _at.set(live.x, C.coreLift, live.z);
    moveLight(live.light, _at, C.rim, C.light * fade, r * 2 + C.tall);
  }

  if (k < 1) { arcs(C, r, dt); grit(C, r, dt); return; }
  clear();
}
