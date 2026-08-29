import * as THREE from 'three';
import { CFG } from '../../config/index.js';
import { audio } from '../../engine/audio.js';
import { shakeAt } from '../../engine/view.js';
import { ZONE_FILL } from '../../fx/textures.js';
import * as combat from '../../game/combat.js';
import * as look from '../shared/look.js';
import * as aim from '../shared/aim.js';
import { emp } from '../values/launcher.js';

// EMP Shells. The blast is not the whole of the shell: what it leaves is a
// patch of ground nothing crosses at its own speed, ticking on whatever stands
// in it and walking the charge between them. It is the branch's answer to a
// lane that has to stay shut after the grenade has already gone off.

const FIELD = 'EMP field';

const fields = [];
const caught = [];

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _at = new THREE.Vector3();
const _mid = new THREE.Vector3();

// A zone texture fills `ZONE_FILL` of its own quad, so a rim that is to sit on
// the edge of the field is asked for wider than the field is.
const ringOf = (radius) => radius / ZONE_FILL;

// Nobody else took the shell over, so the launcher is about to run its own
// detonation and the field belongs on top of it. The modules that do take a
// shell over call `field` themselves when their own blast finally lands.
export function grenadeBlast(g, at) {
  if (g.mod) return false;
  field(at.x, at.z, g.dmg);
  return false;
}

export function field(x, z, dmg) {
  if (!emp.on() || Math.random() >= emp.chance()) return;
  const radius = emp.radius();
  const bite = dmg * emp.damage();
  const near = fielded(x, z, radius);
  if (near) return feed(near, x, z, radius, bite);

  const f = {
    x, z, radius, t: 0, life: emp.life(), damage: bite,
    bite: 0, arc: 0, mote: 0, post: 0, wire: 0, spark: 0,
    // The bearing the first post is driven on, so two fences on one floor are
    // not the same fence twice.
    turn: Math.random() * Math.PI * 2,
    fill: null, rim: null,
  };
  fields.push(f);
  surge(f);
  open(f);
}

const fielded = (x, z, radius) => fields.find((f) =>
  Math.hypot(f.x - x, f.z - z) < Math.max(f.radius, radius)
    * CFG.gunmods.launcher.emp.merge);

// A second shell into live ground drags the field onto it and puts the clock
// back, so the charge that arrived is still an event on the floor.
function feed(f, x, z, radius, bite) {
  f.x = (f.x + x) / 2;
  f.z = (f.z + z) / 2;
  f.radius = Math.max(f.radius, radius);
  f.damage = Math.max(f.damage, bite);
  f.life = Math.max(f.life - f.t, emp.life());
  f.t = 0;
  surge(f);
}

export const slowOn = (bug) => {
  let worst = 0;
  for (const f of fields) {
    const d = Math.hypot(bug.pos.x - f.x, bug.pos.z - f.z);
    if (d <= f.radius + bug.radius) worst = Math.max(worst, emp.slow());
  }
  return worst;
};

// One bright frame at the rim and a hard ring thrown outward. Fired again every
// time the ground is re-charged, so a fed field still has an onset.
function surge(f) {
  const L = emp.look();
  const grade = emp.grade();
  _at.set(f.x, 0.3, f.z);

  look.orb(_at, f.radius * 0.24, {
    color: L.field, from: 0.3, to: 1.5, life: L.popLife, opacity: 0.6,
  });
  look.orb(_at, f.radius * 0.13, {
    color: L.edge, from: 0.25, to: 1.7, life: 0.16, opacity: 1,
  });
  look.orb(_at, f.radius * 0.055, {
    color: L.core, from: 0.3, to: 2, life: 0.09, opacity: 1,
  });
  look.mark(f.x, f.z, ringOf(f.radius), {
    tex: look.TEX.ZONE_TEX.annulus, color: L.edge,
    from: 0.15, to: L.popTo, life: L.popLife, opacity: 0.95,
  });
  look.burst(_at, 7 + Math.round(grade * 9), {
    color: L.sparkColor, speed: 13, rise: 1, size: 1.5, life: 0.42,
  });
  look.burst(_at, 3 + Math.round(grade * 4), {
    color: L.sparkCore, speed: 8, rise: 1.6, size: 1, life: 0.28,
  });
  look.burst(_at, 4 + Math.round(grade * 5), {
    color: L.scrap, speed: 9, rise: 0.9, size: 2.3, life: 0.6, gravity: 22,
  });

  audio.playAt(CFG.gunmods.launcher.emp.sfx, f.x, f.z,
               { rate: 0.94 + Math.random() * 0.12, force: true });
  shakeAt(f.x, f.z, 0.2 + grade * 0.25, f.radius * 2);
}

// The ground marks the field keeps for as long as it is live.
function open(f) {
  const L = emp.look();
  f.fill = look.mark(f.x, f.z, ringOf(f.radius), {
    tex: look.TEX.ZONE_TEX.disc, color: L.field, life: f.life,
    opacity: L.fill, hold: true,
  });
  // Held still: it is the line the fence is standing on, and ground does not
  // turn under a fence.
  f.rim = look.mark(f.x, f.z, ringOf(f.radius), {
    tex: look.TEX.ZONE_TEX.annulus, color: L.edge, life: f.life,
    opacity: L.rimOpacity, hold: true,
  });
}

const bays = (L, grade) => L.posts + Math.round(grade * L.postStep);

// The wire runs straight from post to post, so the posts stand a little further
// out than the field does: it is the middle of each span that has to sit on the
// edge of the ground the field owns, not the corners.
const postAt = (f, n, i) => aim.ringPoint(
  f.x, f.z, f.radius / Math.cos(Math.PI / n), f.turn + (i / n) * Math.PI * 2);

// The posts the wire is strung on. Lit points rather than standing quads: a
// quad on a chord leans away from an overhead camera and paints a pale band
// outside the ring it was meant to draw. Two to a post, the lower one dimmer,
// so what the camera reads is a short upright rather than a floating bead.
function posts(f, L, n) {
  for (let i = 0; i < n; i++) {
    const p = postAt(f, n, i);
    _at.set(p.x, L.postLift, p.z);
    look.orb(_at, L.postSize, {
      color: i % 3 ? L.edge : L.core, from: 1, to: 0.7,
      life: L.postLife * (0.7 + 0.6 * Math.random()),
      opacity: 0.65 + 0.35 * Math.random(),
    });
    _at.y = L.postLift * 0.4;
    look.orb(_at, L.postSize * 0.72, {
      color: L.field, from: 1, to: 0.8, life: L.postLife, opacity: 0.45,
    });
  }
}

// The wire between them, held taut and level. It is the one part of the fence
// that is always there: the posts buzz and the charge comes and goes, and the
// line stays drawn.
function wires(f, L, n) {
  for (let i = 0; i < n; i++) {
    const a = postAt(f, n, i);
    const b = postAt(f, n, (i + 1) % n);
    _a.set(a.x, L.postLift, a.z);
    _b.set(b.x, L.postLift, b.z);
    look.beam(_a, _b, {
      color: L.field, width: L.wireWidth,
      life: L.wireLife, opacity: L.wireOpacity * (0.78 + 0.22 * Math.random()),
    });
  }
}

// One bay at a time, so the fence reads as live rather than as lit: the charge
// jumps a span, earths on the post at the end of it, and is gone before the
// next one goes.
function crackle(f, L, n) {
  const i = (Math.random() * n) | 0;
  const a = postAt(f, n, i);
  const b = postAt(f, n, (i + 1) % n);
  _a.set(a.x, L.postLift, a.z);
  _b.set(b.x, L.postLift, b.z);
  kink(_a, _b, L.crackleKink, {
    color: L.edge, core: L.core, width: L.crackleWidth,
    life: L.crackleLife, opacity: 0.9, coreWidth: 0.4,
  });
  look.orb(_b, L.postSize * 1.6, {
    color: L.core, from: 0.4, to: 1.3, life: 0.1, opacity: 1,
  });
}

// The charge walks the crowd rather than striking it: a chain from body to
// body, redrawn every `arcEvery`, so a field with a dozen animals in it is
// visibly busier than a field with two.
function arcs(f, L) {
  aim.within(f.x, f.z, f.radius, caught);
  if (!caught.length) return;

  const n = Math.min(emp.jumps(), caught.length);
  _a.set(f.x, 0.55, f.z);
  for (let i = 0; i < n; i++) {
    const bug = caught[(Math.random() * caught.length) | 0];
    _b.set(bug.pos.x, (bug.alt || 0) + 0.55, bug.pos.z);
    kink(_a, _b, L.arcKink, {
      color: L.field, core: L.core, width: L.arcWidth,
      life: L.arcLife, opacity: 0.85, coreWidth: 0.34,
    });
    look.orb(_b, 0.3, { color: L.edge, from: 0.4, to: 1.6, life: 0.12, opacity: 0.95 });
    _a.copy(_b);
  }
}

// Charge does not travel in straight lines. The jump is drawn as two segments
// off a shoved midpoint, which is the cheapest thing that stops a bolt reading
// as a scratch on the lens.
function kink(from, to, bow, o) {
  const mx = (from.x + to.x) / 2, mz = (from.z + to.z) / 2;
  const dx = to.x - from.x, dz = to.z - from.z;
  const off = (Math.random() - 0.5) * 2 * bow;
  _mid.set(mx - dz * off, (from.y + to.y) / 2 + 0.25, mz + dx * off);
  look.bolt(from, _mid, o);
  look.bolt(_mid, to, o);
}

function tick(f) {
  aim.within(f.x, f.z, f.radius, caught);
  for (let i = caught.length - 1; i >= 0; i--) {
    const bug = caught[i];
    if (bug.hp <= 0) continue;
    _at.set(bug.pos.x, (bug.alt || 0) + 0.4, bug.pos.z);
    combat.hurt(bug, Math.max(1, Math.round(f.damage)), _at, 0.3, FIELD);
  }
}

function motes(f, L) {
  const a = Math.random() * Math.PI * 2;
  const d = f.radius * Math.sqrt(Math.random());
  _at.set(f.x + Math.cos(a) * d, 0.1, f.z + Math.sin(a) * d);
  _b.set(0, 1.4 + Math.random() * 1.6, 0);
  look.orb(_at, 0.13, {
    color: L.moteColor, from: 1, to: 0.15, life: 0.5, opacity: 0.9,
    vel: _b, drag: 1.6,
  });
}

function douse(f) {
  look.dropMark(f.fill, 0.2);
  look.dropMark(f.rim, 0.2);
  f.fill = f.rim = null;
}

export function update(dt) {
  if (!fields.length) return;
  const L = emp.look();
  const grade = emp.grade();

  for (let i = fields.length - 1; i >= 0; i--) {
    const f = fields[i];
    f.t += dt;
    if (f.t >= f.life) { douse(f); fields.splice(i, 1); continue; }

    const left = 1 - f.t / f.life;
    look.holdMark(f.fill, f.x, f.z, ringOf(f.radius));
    look.holdMark(f.rim, f.x, f.z, ringOf(f.radius));
    f.fill.peak = L.fill * (0.7 + 0.3 * left) * (0.8 + 0.2 * Math.sin(f.t * 9));
    f.rim.peak = (L.rimOpacity + 0.15 * grade) * (0.72 + 0.28 * left)
      * (0.82 + 0.18 * Math.sin(f.t * 13));

    const n = bays(L, grade);
    f.post -= dt;
    if (f.post <= 0) { f.post = L.postEvery; posts(f, L, n); }

    f.wire -= dt;
    if (f.wire <= 0) { f.wire = L.wireEvery; wires(f, L, n); }

    f.spark -= dt;
    if (f.spark <= 0) { f.spark = L.crackleEvery; crackle(f, L, n); }

    f.arc -= dt;
    if (f.arc <= 0) { f.arc = L.arcEvery; arcs(f, L); }

    f.mote -= dt;
    while (f.mote <= 0) { f.mote += L.motesEvery; motes(f, L); }

    f.bite -= dt;
    if (f.bite > 0) continue;
    f.bite = emp.tick();
    tick(f);
  }
}

export function clear() {
  for (const f of fields) douse(f);
  fields.length = 0;
  caught.length = 0;
}
