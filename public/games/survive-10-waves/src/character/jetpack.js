import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { takeFly } from '../engine/input.js';
import { audio } from '../engine/audio.js';
import { world } from '../core/world.js';
import { smokePuffs, dustPuffs, claimLight, moveLight, releaseLight } from '../fx/blast.js';
import { makeGlow } from '../fx/glow.js';
import { addSplat } from '../fx/spatter.js';
import { SCORCH_TEX } from '../fx/textures.js';
import { shake, tremble } from '../engine/view.js';
import * as modules from '../modules/index.js';
import * as energy from './energy.js';
import * as jetbomb from '../weapons/jetbomb.js';

const J = () => CFG.player.jetpack;

const ceiling = () => J().height;

// Half a body off the ground is where the jaws stop reaching. Tied to the
// height rather than the intent, so the moment of take-off is not already safe.
const aloftAt = () => CFG.player.height * 0.5;

// Small on purpose: a tank is a thumb wide on screen, so the map is a few bands
// of rolled metal rather than a picture. The rows run round it and the columns
// along it, which is the way a capsule's own seam lies.
function makeTankTexture() {
  const W = 16, H = 32;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');

  g.fillStyle = '#d9dfe5';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#8d99a6';
  g.fillRect(0, 0, W, 3);
  g.fillRect(0, H - 3, W, 3);
  g.fillRect(0, 18, W, 1);
  g.fillStyle = '#c8641e';
  g.fillRect(0, 8, W, 3);
  g.fillStyle = 'rgba(255,255,255,0.6)';
  g.fillRect(3, 3, 2, H - 6);
  g.fillStyle = 'rgba(38,48,58,0.35)';
  g.fillRect(11, 3, 3, H - 6);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const MAT = {
  pack: new THREE.MeshStandardMaterial({ color: 0x2c3742, roughness: 0.5, metalness: 0.55 }),
  trim: new THREE.MeshStandardMaterial({ color: 0x8fa4b4, roughness: 0.4, metalness: 0.7 }),
  tank: new THREE.MeshStandardMaterial({ map: makeTankTexture(), roughness: 0.45,
                                         metalness: 0.6 }),
  flame: new THREE.MeshBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.8,
                                       blending: THREE.AdditiveBlending, depthWrite: false }),
  core: new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0.9,
                                      blending: THREE.AdditiveBlending, depthWrite: false }),
};

export function newState() {
  return { on: false, alt: 0, thrust: 0, bob: 0, puff: 0,
           pitch: 0, roll: 0, voice: null, worn: false, light: -1, flames: [],
           sway: { fore: 0, foreV: 0, side: 0, sideV: 0, vx: 0, vz: 0 } };
}

export const flying = (p) => !!p.fly && p.fly.on;

// The height without the float on top: a camera that rode the bob would hold the
// player still and rock the world instead.
export const altitude = (p) => (p.fly ? p.fly.alt : 0);

export const aloft = (p) => !!p.fly && p.fly.alt >= aloftAt();

export const aboveWalls = (p) => !!p.fly && p.fly.alt >= CFG.walls.height;

// Ridden by the thrust rather than by the toggle, so the push comes in with the
// climb instead of arriving whole on the keypress.
export const speedScale = (p) => (p.fly ? 1 + (J().boost - 1) * p.fly.thrust : 1);

export function lift(p) {
  if (!p.fly) return 0;
  const B = J().bob;
  const b = p.fly.bob;
  const float = Math.sin(b) + B.second.amp * Math.sin(b * B.second.rate + 1.1);
  return p.fly.alt + float * B.amp * (p.fly.alt / ceiling());
}

// A jet is a bright throat, a body of burning gas and the heat around both. The
// two cones are given their own phase so the pair never pulses in step, which is
// what makes two thrusters read as two rather than as one drawn twice.
function flame(x, h, phase) {
  const F = J().flame;
  const g = new THREE.Group();
  g.position.set(x, h, 0);
  g.rotation.x = F.rake;

  const outer = new THREE.Mesh(new THREE.ConeGeometry(F.width, F.length, 12, 1, true),
                               MAT.flame.clone());
  outer.material.color.setHex(F.color);
  outer.position.y = -F.length / 2;
  outer.rotation.x = Math.PI;

  const core = new THREE.Mesh(new THREE.ConeGeometry(F.width * 0.5, F.length * 0.55, 10, 1, true),
                              MAT.core.clone());
  core.material.color.setHex(F.core);
  core.position.y = -F.length * 0.28;
  core.rotation.x = Math.PI;

  const glow = makeGlow(F.core, F.width * F.glow, 0.7);
  glow.renderOrder = 6;

  g.add(outer, core, glow);
  g.visible = false;
  return { g, outer, core, glow, phase };
}

export function attach(p) {
  const k = CFG.player.height;
  const pack = new THREE.Group();
  pack.position.set(0, k * 0.69, -k * 0.11);

  const shell = new THREE.Mesh(new THREE.BoxGeometry(k * 0.24, k * 0.26, k * 0.09), MAT.pack);
  shell.castShadow = true;
  pack.add(shell);

  for (const side of [-1, 1]) {
    const tank = new THREE.Mesh(
      new THREE.CapsuleGeometry(k * 0.045, k * 0.16, 4, 10), MAT.tank);
    tank.position.set(side * k * 0.085, 0, -k * 0.045);
    tank.castShadow = true;
    pack.add(tank);

    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(k * 0.032, k * 0.045, k * 0.06, 10), MAT.trim);
    nozzle.position.set(side * k * 0.085, -k * 0.16, 0);
    pack.add(nozzle);

    const jet = flame(side * k * 0.085, -k * 0.19, side > 0 ? 0 : 2.1);
    p.fly.flames.push(jet);
    pack.add(jet.g);
  }

  p.parts.jetpack = pack;
  p.object.add(pack);
}

// Worn, not carried: once the rig is posed the pack is handed to the back itself,
// so it rolls and dips with the spine instead of floating at a fixed spot behind
// the player. Done after the first pose rather than at load, or it would keep the
// bind pose's idea of which way the chest faces.
export function wear(p) {
  const f = p.fly;
  if (f.worn || !p.parts.jetpack) return;
  const B = p.parts.bones;
  const back = B && (B.Spine || B.Spine01 || B.Spine02);
  if (!back) return;

  p.object.updateWorldMatrix(true, true);
  back.attach(p.parts.jetpack);
  f.worn = true;
}

export const canLift = (p) => modules.hasJetpack()
  && energy.has(p, modules.flyDrain() * J().least);

// Nothing happens until the pack is bought, and a tank too low to hold a hover
// is refused with the dry click rather than a burn that dies on the way up.
function ignite(p, C) {
  const f = p.fly;
  if (!modules.hasJetpack()) return;
  if (!canLift(p)) {
    audio.play('jetDeny');
    return;
  }
  f.on = true;
  audio.play('jetpackOn');
  if (f.alt <= 0) { kick(p, C, true); jetbomb.drop(p); }
}

function cut(f) {
  if (!f.on) return;
  f.on = false;
  audio.play('jetpackOff');
}

export function update(p, dt) {
  const C = J();
  const f = p.fly;
  const grounded = p.dead || p.held > 0;

  if (takeFly() && !grounded) {
    if (f.on) cut(f);
    else ignite(p, C);
  }
  if (grounded) cut(f);
  // Flown dry: the burn stops itself, and the fall that follows is the same one
  // landing on purpose gives you.
  if (f.on && !energy.take(p, modules.flyDrain() * dt)) cut(f);

  const was = f.alt;
  const want = f.on ? ceiling() : 0;
  const climb = (want > f.alt ? C.rise : C.fall) * dt;
  f.alt += Math.max(-climb, Math.min(climb, want - f.alt));
  if (was > 0 && f.alt <= 0) kick(p, C);
  f.thrust += ((f.on ? 1 : 0) - f.thrust) * (1 - Math.exp(-9 * dt));
  f.bob += C.bob.rate * dt;

  burn(f, C, dt);
  tremble(C.shake.hum * f.thrust);
  lamp(p, C);
  bank(p, C, dt);
  dangle(p, C, dt);
  exhaust(f, C, dt);
  thrum(f, C);
}

const held = (v) => Math.max(-1, Math.min(1, v));

// Nothing that hovers moves flat: it leans the way it is going, since leaning is
// how it goes there at all. Read off the velocity in the player's own frame —
// nose down for forward, shoulder into the turn — and eased, so a change of
// direction rolls through the body instead of snapping to it.
function bank(p, C, dt) {
  const f = p.fly;
  const T = C.tilt;
  const top = CFG.player.speed * C.boost;
  const fwd = p.vel.z * p.aim.z + p.vel.x * p.aim.x;
  const side = p.vel.x * p.aim.z - p.vel.z * p.aim.x;
  const k = 1 - Math.exp(-T.ease * dt);

  f.pitch += (T.most * held(fwd / top) * f.thrust - f.pitch) * k;
  f.roll += (-T.most * held(side / top) * f.thrust - f.roll) * k;
}

const _at = new THREE.Vector3();
const _drift = new THREE.Vector3();
// The puff pool reads its height off the config it is handed, so the nozzle's
// own height is passed as one: everything else is the config as written.
const _puff = {};

function exhaust(f, C, dt) {
  if (f.thrust < 0.15 || !f.flames.length) return;
  f.puff -= dt;
  if (f.puff > 0) return;
  f.puff = C.smoke.every;

  f.flames[(Math.random() * f.flames.length) | 0].g.getWorldPosition(_at);
  const a = Math.random() * Math.PI * 2;
  _drift.set(Math.cos(a), 0, Math.sin(a));
  Object.assign(_puff, C.smoke, { y: _at.y });
  smokePuffs.spawn(_at, _drift, _puff, CFG.player.height * 0.5);
}

// Legs that hang rather than steer: they are dragged along by the body and are
// always a little behind it, and what they are behind by is what swings them.
// The spring is what turns that into a swing that overshoots and settles instead
// of a lean that snaps on.
function dangle(p, C, dt) {
  const D = C.dangle;
  const s = p.fly.sway;
  const k = 1 - Math.exp(-D.follow * dt);
  s.vx += (p.vel.x - s.vx) * k;
  s.vz += (p.vel.z - s.vz) * k;

  const lagX = p.vel.x - s.vx, lagZ = p.vel.z - s.vz;
  const fore = held((lagZ * p.aim.z + lagX * p.aim.x) / D.at) * D.most
             + Math.sin(p.fly.bob * D.idle.rate + 0.6) * D.idle.amp;
  // Negated where the pitch is not: in this rig a positive turn about the
  // forward axis carries the leg the way the body went, and a leg that is being
  // dragged goes the other way.
  const side = -held((lagX * p.aim.z - lagZ * p.aim.x) / D.at) * D.most;

  s.foreV += ((fore - s.fore) * D.stiff - s.foreV * D.damp) * dt;
  s.sideV += ((side - s.side) * D.stiff - s.sideV * D.damp) * dt;
  s.fore += s.foreV * dt;
  s.side += s.sideV * dt;
}

// One light for the pair of jets, hung in the exhaust under the pack. Taken only
// while it is burning and handed straight back, so a held light is never one a
// blast could have used.
function lamp(p, C) {
  const f = p.fly;
  const L = C.light;
  if (f.thrust <= 0.02) { douse(f); return; }
  if (f.light < 0) f.light = claimLight(L.keepFree);
  if (f.light < 0) return;

  p.parts.jetpack.getWorldPosition(_at);
  _at.y -= CFG.player.height * L.drop;
  const flicker = 0.82 + 0.18 * Math.sin(world.state.time * C.flame.churn);
  moveLight(f.light, _at, L.color, L.intensity * f.thrust * flicker, L.distance);
}

function douse(f) {
  if (f.light < 0) return;
  releaseLight(f.light);
  f.light = -1;
}

const _dust = {};

// Thrown at the feet, not at the pack: this is the floor answering, and it only
// has an answer while the feet are still on it.
function kick(p, C, mark = false) {
  const D = C.dust;
  shake(C.shake.kick);
  if (mark) {
    const S = C.scorch;
    addSplat(p.pos, S.size, S.tint, S.life, S.fadeIn, SCORCH_TEX);
  }
  Object.assign(_dust, D, { y: p.pos.y + D.y });
  for (let i = 0; i < D.count; i++) {
    const a = (i / D.count) * Math.PI * 2 + Math.random() * 0.5;
    _drift.set(Math.cos(a), 0, Math.sin(a));
    dustPuffs.spawn(p.pos, _drift, _dust, CFG.player.radius * D.spread);
  }
}

function thrum(f, C) {
  const V = C.voice;
  if (f.thrust <= 0.02) { hushVoice(f); return; }
  if (!f.voice || !f.voice.alive) f.voice = audio.sustain('jetpack', { rate: V.rate });
  if (f.voice) f.voice.set(f.thrust, V.rate + V.swell * f.thrust);
}

function hushVoice(f, fade = 0.3) {
  if (!f.voice) return;
  f.voice.stop(fade);
  f.voice = null;
}

// The pack is only stepped on a playing frame, so a game paused mid-flight
// would otherwise be paused with the thruster still running.
export function hush(p) {
  tremble(0);
  if (p && p.fly) hushVoice(p.fly, 0.15);
}

const _hot = new THREE.Color();

// Two beats at odds with each other rather than one: a jet that only breathes in
// and out reads as a balloon, while a long slow pulse crossed with a fast churn
// never repeats and looks like burning gas. The throat holds while the tongue
// flails, so the base of the flame stays put.
function burn(f, C, dt) {
  const F = C.flame;
  const lit = f.thrust > 0.02;
  for (const jet of f.flames) {
    jet.g.visible = lit;
    if (!lit) continue;

    const t = world.state.time;
    const slow = Math.sin(t * F.flare + jet.phase);
    const fast = Math.sin(t * F.churn + jet.phase * 1.7);
    const reach = 0.78 + 0.14 * slow + 0.08 * fast;
    const fat = 0.9 + 0.1 * fast - 0.06 * slow;

    jet.g.scale.set(fat, f.thrust * reach, fat);
    jet.outer.material.opacity = (0.5 + 0.4 * f.thrust) * (0.85 + 0.15 * fast);
    jet.outer.material.color.setHex(F.color).lerp(_hot.setHex(F.hot), 0.5 + 0.5 * fast);
    jet.core.material.opacity = (0.6 + 0.35 * f.thrust) * (0.8 + 0.2 * slow);
    // Undone by the group's own stretch, so the bloom at the mouth stays round
    // however far the tongue has been pulled.
    const bloom = F.width * F.glow * (0.85 + 0.2 * fast);
    jet.glow.scale.set(bloom * f.thrust / fat, bloom / reach, 1);
    jet.glow.material.opacity = 0.55 * f.thrust * (0.8 + 0.2 * slow);
  }
}

// What the legs are doing, for the rig to pose from: how much of the hang is on,
// and how far it has swung along and across.
const _stance = { k: 0, fore: 0, side: 0 };

export function stance(p) {
  if (!p.fly) return null;
  _stance.k = p.fly.thrust;
  _stance.fore = p.fly.sway.fore * p.fly.thrust;
  _stance.side = p.fly.sway.side * p.fly.thrust;
  return _stance;
}

export function pose(p) {
  if (!p.fly) return;
  p.object.rotation.x = p.fly.pitch;
  p.object.rotation.z = p.fly.roll;
}

export function reset(p) {
  hushVoice(p.fly, 0.1);
  douse(p.fly);
  p.fly.on = false;
  p.fly.alt = 0;
  p.fly.thrust = 0;
  p.fly.bob = 0;
  p.fly.puff = 0;
  p.fly.pitch = p.fly.roll = 0;
  const s = p.fly.sway;
  s.fore = s.foreV = s.side = s.sideV = s.vx = s.vz = 0;
  burn(p.fly, J(), 0);
}
