import * as THREE from 'three';
import { CFG } from '../config/index.js';
import * as walls from './walls.js';

// A steady step a wave out to the full map, then it stops growing.
export function radiusFor(wave) {
  const A = CFG.arena;
  return Math.min(A.max, Math.round(A.first + A.step * (wave - 1)));
}

let grown = radiusFor(1);
let flat = false;
let from = grown;
let to = grown;
let t = 1;
let span = CFG.arena.growTime;

// How far the ring has closed in on the wave's own radius. The two are kept
// apart so the wave step can finish its ease while the floor is already going.
let taken = 0;
let sinkOn = false;
let shown = grown;

export function radius() { return shown; }

// What the wave would be standing on if nothing were closing in on it.
export function waveRadius() { return grown; }

export function sinking() { return sinkOn; }

export function startSink(on = true) { sinkOn = on; }

export function resetSink() { sinkOn = false; taken = 0; shown = grown; }

export function sink(dt) {
  if (!sinkOn) return;
  const C = CFG.arena.collapse;
  taken = Math.min(Math.max(0, grown - C.floor), taken + C.rate * dt);
  shown = grown - taken;
}

// How far out a body may be. A bug shoved past the ring by a blast is allowed to
// be where it is — it just cannot go further out, and is held once back inside.
// Clamping it hard instead would strand it: every hop it could reach would be
// rejected as out of bounds.
export function limitFor(x, z, margin) {
  return Math.max(shown - margin, Math.hypot(x, z));
}

const _out = new THREE.Vector3();

// Inside the ring and out of the walls. Anything that moves a body other than
// its own legs — a shove, a blast — has to put it back somewhere legal.
export function ring(pos, r, margin = 0) {
  const lim = shown - r - margin;
  const d = Math.hypot(pos.x, pos.z);
  if (d > lim) { pos.x *= lim / d; pos.z *= lim / d; }
}

// How far a body at (x, z) can travel along a unit direction before it is at the
// ring. What anything that throws a body has to cut its throw to.
export function roomTo(x, z, dx, dz, r) {
  const lim = shown - r;
  const b = x * dx + z * dz;
  const c = x * x + z * z - lim * lim;
  return Math.max(0, Math.sqrt(Math.max(0, b * b - c)) - b);
}

export function confine(pos, r, margin = 0) {
  ring(pos, r, margin);
  if (walls.push(pos.x, pos.z, r, _out)) { pos.x = _out.x; pos.z = _out.z; }
}

export function moving() { return t < 1; }

// An arbitrary radius over an arbitrary time. `goTo` is this with the wave's own
// radius and the wave's own pace; a script wants both of those loose — 0.9s is
// right for a wave stepping out, far too quick for a reveal you are meant to
// watch. Unlike `goTo` it leaves the collapse alone: a scripted grow must not
// silently call off a ring that is closing in.
export function setRadius(r, over = CFG.arena.growTime, linear = false) {
  from = grown;
  to = Math.max(0, Math.min(CFG.arena.max, r));
  span = Math.max(0, over);
  flat = linear;
  t = span > 0 && to !== from ? 0 : 1;
  if (!moving()) grown = to;
  shown = grown - taken;
}

export function goTo(wave, animate = true) {
  resetSink();
  setRadius(radiusFor(wave), animate ? CFG.arena.growTime : 0);
}

// Eased out by default, which is right for the second a wave takes to step its
// ring out and never seen. A reveal the player watches for a minute wants the
// straight line: the same curve stretched that far is a pop and then a crawl.
export function advance(dt) {
  t = Math.min(1, t + dt / Math.max(0.0001, span));
  grown = from + (to - from) * (flat ? t : 1 - Math.pow(1 - t, 3));
  shown = grown - taken;
}
