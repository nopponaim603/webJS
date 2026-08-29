import * as THREE from 'three';
import { CFG } from '../../config/index.js';
import { world } from '../../core/world.js';
import { audio } from '../../engine/audio.js';
import { shakeAt } from '../../engine/view.js';
import * as fx from '../../fx/spatter.js';
import * as bullets from '../../weapons/bullets.js';
import * as modules from '../../modules/index.js';
import * as look from '../shared/look.js';
import { slug } from '../values/shotgun.js';

// Breaching Slug. Every so many shells the pattern is not a pattern: the pellets
// are one round carrying a share of the shell down a line. How far it goes, what
// it keeps through a body and how hard it shoves are all the gun's own — the
// module owns nothing but that share.

const C = () => CFG.gunmods.shotgun.slug;

const SHOTGUN = CFG.guns[1];

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _push = new THREE.Vector3();

let counted = 0;
let loaded = false;

const due = () => slug.on() && counted + 1 >= slug.every();

export function plan(p, gun, shot) {
  if (gun.id !== 'shotgun' || !slug.on()) return;
  counted += 1;
  if (counted < slug.every()) return;
  counted = 0;
  loaded = true;

  shot.base *= shot.pellets * slug.damage();
  shot.pellets = 1;
  shot.choke = 0;
  shot.jitter = 0;
  shot.stagger = 0;
  shot.scale = C().scale;
  shot.tint = C().look.tint;
}

export function tag(p, gun, bag) {
  if (!loaded) return;
  const m = bag.mod || (bag.mod = {});
  m.slug = true;
}

export function shot(p, gun, muzzle, dir) {
  if (!loaded) return;
  loaded = false;
  blast(muzzle, dir);
  audio.play(C().sfx, { rate: 0.93 + Math.random() * 0.1, force: true });
  const S = C().shake;
  shakeAt(muzzle.x, muzzle.z, S.power * (0.6 + 0.6 * slug.grade()), S.range);
}

// A tracer laid down where the round actually went, frame by frame. Each pass
// overlaps the last by a third, so its alpha is spent twice where they meet:
// written at the opacity a single quad wants, this is a white bar.
export function stepBullet(b, dt) {
  if (!b.mod || !b.mod.slug) return false;
  const L = C().look;
  const grade = slug.grade();
  _a.lerpVectors(b.mesh.position, b.prev, 1.3);
  look.beam(_a, b.mesh.position, {
    color: L.bloom, width: L.width * (2.2 + grade * 1.8), life: 0.16, opacity: 0.13,
  });
  look.beam(_a, b.mesh.position, {
    color: L.body, width: L.width * (1 + grade * 0.8), life: 0.14, opacity: 0.3,
  });
  look.beam(_a, b.mesh.position, {
    color: L.core, width: L.width * (0.32 + grade * 0.2), life: 0.09, opacity: 0.85,
  });
  wake(b, L, grade);
  return false;
}

// A round this heavy drags the floor along under it. Laid off where it actually
// is rather than along the line it was aimed down, so the dust stops where the
// slug stopped.
function wake(b, L, grade) {
  b.mod.wake = (b.mod.wake || 0) + b.mesh.position.distanceTo(b.prev);
  if (b.mod.wake < L.wakeEvery) return;
  b.mod.wake = 0;
  const side = Math.random() < 0.5 ? 1 : -1;
  const nx = -b.vel.z, nz = b.vel.x;
  const len = Math.hypot(nx, nz) || 1;
  _a.set(b.mesh.position.x + (nx / len) * side * 0.4, 0.12,
         b.mesh.position.z + (nz / len) * side * 0.4);
  look.puff(_a, 0.3 + grade * 0.24, {
    color: L.dustColor, opacity: 0.28, grow: 2.6, life: 0.4,
    vel: _push.set((nx / len) * side * 3, 1.4 + Math.random(), (nz / len) * side * 3),
  });
}

// The round's run is over — spent on the rank it went through, out of reach, or
// stopped by a wall. Either way a slug is the shell's pellets fused into one, so
// this is where they come apart, thrown out of wherever the slug stopped and
// past whatever stopped it.
export function endBullet(b, on) {
  if (!b.mod || !b.mod.slug) return;
  open(b.mesh.position, b.by, on);
}

// A full turn rather than a cone, each pellet off its own spoke: the slug is not
// pointed at anything any more, and a pattern that still favoured the way it was
// travelling would read as a ricochet.
function open(at, by, on) {
  const B = C().burst;
  const n = Math.max(1, modules.gunPellets(SHOTGUN));
  const reach = modules.gunRange(SHOTGUN);
  // The round comes apart into what it was carrying, not into what the gun would
  // have thrown: a slug that hits five times as hard scatters five times as hard.
  const base = modules.gunBase(SHOTGUN) * slug.damage();
  const knock = modules.gunKnock(SHOTGUN) / n;
  const step = (Math.PI * 2) / n;
  const turn = Math.random() * step;

  _a.set(at.x, at.y, at.z);
  for (let i = 0; i < n; i++) {
    const a = turn + i * step + (Math.random() - 0.5) * step * B.spray;
    _b.set(Math.cos(a), 0, Math.sin(a));
    const far = reach * (1 - SHOTGUN.rangeJitter + Math.random() * SHOTGUN.rangeJitter * 2);
    // No `mod`, so a pellet thrown by a burst is never itself a slug: the round
    // that opens is the one the gun fired, and it opens once.
    const pellet = bullets.spawn(_a, _b, {
      origin: _a, base, range: far, look: SHOTGUN.look, knock,
      retain: modules.gunPierce(SHOTGUN), arcs: modules.gunArcs(SHOTGUN),
      by: by || SHOTGUN.name, gun: SHOTGUN.id, mod: null,
    });
    // The body it stopped on has already had the whole round. A pattern thrown
    // from inside it would land every pellet back in the same animal without
    // ever leaving it, which is the slug paid twice.
    if (on) pellet.seen.add(on);
  }
  opening(_a, n);
}

// The round coming apart: an ember core where it went, brass out of it, and the
// floor under it thrown up. The pellets are their own picture from here.
function opening(at, n) {
  const L = C().look;
  const grade = slug.grade();

  look.orb(at, 0.9 + grade * 0.5, {
    color: L.core, from: 0.35, to: 1.7, life: 0.13, opacity: 1,
  });
  look.orb(at, 1.5 + grade * 0.8, {
    color: L.bloom, from: 0.3, to: 2, life: 0.28, opacity: 0.5,
  });
  look.mark(at.x, at.z, 1.2 + grade * 0.8, {
    tex: look.TEX.ZONE_TEX.annulus, color: L.ringColor, life: 0.28,
    from: 0.35, to: 2.4, opacity: 0.5, y: 0.05,
  });
  look.burst(at, n, {
    color: L.brass, speed: 15, rise: 0.7, size: 2.2 + grade * 1.4, life: 0.4,
  });
  look.puff(at, 0.8, {
    color: L.dustColor, opacity: 0.3, grow: 2.8, life: 0.5,
    vel: _push.set(0, 1.8, 0),
  });
  _push.set(at.x, 0.12, at.z);
  fx.dirt(_push, 4 + Math.round(grade * 5), 0.9);
  fx.sparks(at, 5 + Math.round(grade * 5));

  audio.playAt(C().sfx, at.x, at.z, { rate: 1.22 + Math.random() * 0.16 });
  const S = C().shake;
  shakeAt(at.x, at.z, S.power * 0.5, S.range * 0.6);
}

export function hit(bug, b, amount, at) {
  if (!b.mod || !b.mod.slug || bug.hp <= 0) return;
  impact(at, bug.radius);
}

export function update(dt) {
  charge();
}

// The barrel says a slug is next. The only warning the crowd in front of you
// gets, and the reason firing into a rank is a decision rather than a habit.
function charge() {
  const p = world.player;
  if (!due() || !p || !p.parts || !p.parts.muzzle) return;
  p.parts.muzzle.getWorldPosition(_a);
  look.orb(_a, C().look.width * 2.2, {
    color: C().look.muzzle, from: 0.9, to: 0.2, life: 0.07, opacity: 0.8,
  });
}

// A shell this size moves air: a deep ember halo, an amber body, a white core
// the width of the bore, and a fan of side licks off the ports. Kept short —
// stacked quads long enough to run past the shooter clip to white throughout.
function blast(muzzle, dir) {
  const L = C().look;
  const grade = slug.grade();
  const long = 1.4 + grade * 1.5;
  const fat = 0.8 + grade * 0.6;

  _a.set(muzzle.x, muzzle.y, muzzle.z);
  _b.set(muzzle.x + dir.x * long, muzzle.y, muzzle.z + dir.z * long);
  look.beam(_a, _b, { color: L.bloom, width: L.width * 4.4 * fat, life: L.life * 0.6,
                      opacity: 0.2, taper: 0.9 });
  look.beam(_a, _b, { color: L.body, width: L.width * 1.7 * fat, life: L.life * 0.85,
                      opacity: 0.48, taper: 0.85 });
  look.beam(_a, _b, { color: L.core, width: L.width * 0.5 * fat, life: L.life * 0.5,
                      opacity: 1, taper: 0.8 });
  licks(muzzle, dir, long, fat, L, grade);

  look.orb(_a, L.width * 2.4 * fat, {
    color: L.muzzle, from: 0.75, to: L.muzzleTo, life: L.muzzleLife, opacity: 0.55,
  });
  look.orb(_a, L.width * 0.9 * fat, {
    color: L.core, from: 0.9, to: 1.4, life: L.muzzleLife * 0.4, opacity: 1,
  });
  look.mark(muzzle.x + dir.x * 0.7, muzzle.z + dir.z * 0.7, 0.9 + grade * 1.9, {
    tex: look.TEX.ZONE_TEX.annulus, color: L.ringColor, life: L.ringLife,
    from: 0.5, to: L.ringTo, opacity: 0.42, y: 0.05,
  });
  hull(muzzle, dir, L, grade);
}

// Gas out of the ports either side of the bore, uneven and shorter than the
// blast. Kept inside forty degrees: wider and the muzzle is a symmetric star
// centred on the shooter, which reads as the player going off, not the gun.
function licks(muzzle, dir, long, fat, L, grade) {
  for (let i = 0, n = 3 + Math.round(grade * 4); i < n; i++) {
    const a = (i % 2 ? 1 : -1) * (0.22 + Math.random() * 0.48);
    const out = long * (0.4 + Math.random() * 0.45);
    const cx = dir.x * Math.cos(a) - dir.z * Math.sin(a);
    const cz = dir.x * Math.sin(a) + dir.z * Math.cos(a);
    _a.set(muzzle.x + dir.x * 0.2, muzzle.y, muzzle.z + dir.z * 0.2);
    _b.set(_a.x + cx * out, muzzle.y, _a.z + cz * out);
    look.beam(_a, _b, {
      color: i % 3 ? L.body : L.muzzle, width: L.width * (0.45 + Math.random() * 0.45) * fat,
      life: L.life * (0.35 + Math.random() * 0.35), opacity: 0.5, taper: 0.9,
    });
  }
}

// The gun answering the round: a brass case out of the port, soil off the floor
// the muzzle blast reached, and sparks. Light alone is not a shotgun.
function hull(muzzle, dir, L, grade) {
  const side = Math.random() < 0.5 ? 1 : -1;
  _push.set(-dir.z * side * (5 + Math.random() * 3), 6 + Math.random() * 3,
            dir.x * side * (5 + Math.random() * 3));
  _a.set(muzzle.x, muzzle.y, muzzle.z);
  look.shard(_a, { color: L.brass, vel: _push, size: 2.2 + grade * 1.2,
                   life: 0.7, gravity: 24 });

  look.burst(_a, 4 + Math.round(grade * 6), {
    color: L.brass, speed: 13, rise: 0.5, size: 2.4 + grade * 1.4, life: 0.34,
  });
  for (let i = 0, n = 3 + Math.round(grade * 4); i < n; i++) {
    const s = i % 2 ? 1 : -1;
    _b.set(muzzle.x - dir.z * s * 0.5 + dir.x, 0.15, muzzle.z + dir.x * s * 0.5 + dir.z);
    look.puff(_b, 0.45 + Math.random() * 0.4 + grade * 0.3, {
      color: L.dustColor, opacity: 0.34, grow: 3, life: 0.55,
      vel: _push.set(-dir.z * s * 5 + dir.x * 3, 1.4 + Math.random(),
                     dir.x * s * 5 + dir.z * 3),
    });
  }
  _b.set(muzzle.x + dir.x * 1.4, 0.14, muzzle.z + dir.z * 1.4);
  fx.dirt(_b, 4 + Math.round(grade * 6), 0.8);
  fx.sparks(_a, 4 + Math.round(grade * 5));
}

// Something physical came apart where it landed, and whatever was standing is
// not any more: a white frame, brass out of it and the floor it went down on.
function impact(at, radius) {
  const L = C().look;
  const grade = slug.grade();
  look.orb(at, radius * (0.75 + grade * 0.6), {
    color: L.core, from: 0.9, to: 1.5, life: 0.13, opacity: 1,
  });
  look.orb(at, radius * (1.3 + grade * 0.7), {
    color: L.bloom, from: 0.7, to: 1.9, life: 0.26, opacity: 0.45,
  });
  look.mark(at.x, at.z, radius * (1.1 + grade * 0.8), {
    tex: look.TEX.ZONE_TEX.annulus, color: L.ringColor, life: 0.26,
    from: 0.5, to: 1.7, opacity: 0.5, y: 0.05,
  });
  look.burst(at, 5 + Math.round(grade * 7), {
    color: L.brass, speed: 11, rise: 0.8, size: 2.2 + grade * 1.6, life: 0.4,
  });
  look.puff(at, radius * 0.55, {
    color: L.dustColor, opacity: 0.3, grow: 2.6, life: 0.5,
    vel: _push.set(0, 1.6, 0),
  });
  _push.set(at.x, 0.12, at.z);
  fx.dirt(_push, 3 + Math.round(grade * 4), 0.7);
  fx.sparks(at, 5 + Math.round(grade * 5));
}

export function clear() {
  counted = 0;
  loaded = false;
}
