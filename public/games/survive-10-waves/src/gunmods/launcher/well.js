import * as THREE from 'three';
import { CFG } from '../../config/index.js';
import { world } from '../../core/world.js';
import { audio } from '../../engine/audio.js';
import { shakeAt } from '../../engine/view.js';
import { pushGive } from '../../bug/mass.js';
import { ZONE_FILL } from '../../fx/textures.js';
import * as blast from '../../fx/blast.js';
import * as combat from '../../game/combat.js';
import * as modules from '../../modules/index.js';
import * as look from '../shared/look.js';
import * as aim from '../shared/aim.js';
import { well } from '../values/launcher.js';
import * as emp from './emp.js';

// Gravity Well. Some shells fold inward before they go off: the ground around
// the point is dragged onto it for a beat and the blast lands on the pile that
// makes. The pull is for the animals alone — the player walks through it as
// though it were not there, and only has to be clear of the blast it ends on.

const LAUNCHER = CFG.guns.find((g) => g.projectile === 'grenade');

const wells = [];

const _at = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _out = new THREE.Vector3();

// A zone texture fills `ZONE_FILL` of its own quad, so a rim that is to sit on
// the edge of the pull is asked for wider than the pull is.
const ringOf = (radius) => radius / ZONE_FILL;

export function grenadeFired(g) {
  if (g.mod || !well.on() || Math.random() >= well.chance()) return;
  g.mod = 'well';
}

export function grenadeBlast(g, at) {
  if (g.mod !== 'well') return false;
  open(at.x, at.z, g.dmg);
  return true;
}

function open(x, z, dmg) {
  const L = well.look();
  const reach = well.reach();
  const w = {
    x, z, dmg, reach, t: 0, hold: well.hold(),
    thread: 0, mote: 0, dust: 0, edge: 0, grit: 0,
    lens: null, rim: null, ring: null,
  };

  w.lens = look.mark(x, z, ringOf(reach * L.lens), {
    tex: look.TEX.ZONE_TEX.disc, color: L.core, blend: 'normal',
    opacity: 0.95, life: w.hold + 0.4, hold: true, y: 0.06,
  });
  w.rim = look.mark(x, z, ringOf(reach * L.lens), {
    tex: look.TEX.ZONE_TEX.annulus, color: L.edge,
    opacity: 1, life: w.hold + 0.4, hold: true, y: 0.07,
  });
  // The wash the arcs are drawn over, not the edge itself: a ring this wide at
  // full strength is a violet fog bank from the game's camera.
  w.ring = look.mark(x, z, ringOf(reach), {
    tex: look.TEX.ZONE_TEX.annulus, color: L.edge,
    opacity: 0.4, life: w.hold + 0.4, spin: -2.2, hold: true,
  });

  wells.push(w);
  audio.playAt(CFG.gunmods.launcher.well.sfx, x, z,
               { rate: 0.94 + Math.random() * 0.1, force: true });
}

// A hand on the back rather than a hand round the throat, borrowed from the
// singularity: the ground under a body is moving, and a heavy one is shifted
// less than a light one.
function haul(w, dt) {
  const D = well.pull() * CFG.bugAnim.knockDecay * dt;
  const list = world.bugs;

  for (let i = 0; i < list.length; i++) {
    const bug = list[i];
    if (bug.hp <= 0 || bug.type.finale) continue;
    const dx = w.x - bug.pos.x, dz = w.z - bug.pos.z;
    const far = Math.hypot(dx, dz);
    if (far > w.reach || far < 1e-3) continue;
    bug.knock.x += (dx / far) * D * pushGive(bug);
    bug.knock.z += (dz / far) * D * pushGive(bug);
  }
}

// Light does not fall straight into a hole: every thread is laid off the rim on
// a turn, so the whole shape reads as spinning down rather than closing.
function threads(w, L, k) {
  const n = L.threadCount + Math.round(well.grade() * 8);
  const twist = 0.7 + 1.3 * k;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const far = w.reach * (0.55 + 0.45 * Math.random());
    const o = { color: i % 3 ? L.edge : L.ring, width: L.threadWidth * (1 + k),
                life: 0.13, opacity: 0.3 + 0.25 * k, taper: 0.7 };
    on(_a, w, far, a);
    on(_b, w, far * 0.62, a + twist * 0.4);
    look.beam(_a, _b, o);
    on(_c, w, far * 0.3, a + twist * 0.75);
    look.beam(_b, _c, o);
    on(_a, w, w.reach * 0.08, a + twist * 1.15);
    look.beam(_c, _a, o);
  }
}

const on = (v, w, radius, angle) =>
  v.set(w.x + Math.cos(angle) * radius, 0.12, w.z + Math.sin(angle) * radius);

function arcRing(w, radius, n, lead, y, o) {
  for (let i = 0; i < n; i++) {
    const a = lead + (i / n) * Math.PI * 2;
    const b = a + ((Math.PI * 2) / n) * (0.42 + Math.random() * 0.34);
    const from = aim.ringPoint(w.x, w.z, radius, a);
    const to = aim.ringPoint(w.x, w.z, radius, b);
    _a.set(from.x, y, from.z);
    _b.set(to.x, y, to.z);
    look.beam(_a, _b, o);
  }
}

// Two edges, both built from arcs rather than painted: the ground the pull owns,
// and a white horizon on the lens that stays legible over a blast's own smoke.
function edge(w, L, k) {
  const grade = well.grade();
  arcRing(w, w.reach * (1 - 0.35 * k), L.rimSegments + Math.round(grade * 6),
          w.t * 2.4, 0.14, {
            color: L.edge, width: L.rimWidth * (0.75 + 0.5 * k), taper: 0.6,
            life: L.rimLife * (0.7 + Math.random() * 0.6), opacity: 0.5 + 0.35 * k,
          });
  arcRing(w, w.reach * L.lens * (1 - 0.75 * k) * 1.22, L.hornSegments,
          -w.t * 5.5, 0.2, {
            color: L.snapCore, width: L.rimWidth * 0.5, taper: 0.5,
            life: L.rimLife * 0.7, opacity: 0.6 + 0.4 * k,
          });
}

// Solid ground coming off the rim and thrown at the middle. Warm and lit
// against the violet: light alone reads as a projection on the grass, and
// debris in the well's own colour reads as boxes lying in it.
function grit(w, L) {
  const a = Math.random() * Math.PI * 2;
  const d = w.reach * (0.62 + 0.38 * Math.random());
  _at.set(w.x + Math.cos(a) * d, 0.12 + Math.random() * 0.35,
          w.z + Math.sin(a) * d);
  const speed = w.reach * (1.2 + Math.random() * 0.8);
  _b.set(-Math.cos(a) * speed, 1.6 + Math.random() * 2.2, -Math.sin(a) * speed);
  look.shard(_at, {
    color: Math.random() < 0.3 ? L.gritCore : L.gritColor, vel: _b,
    size: 0.8 + Math.random() * 1.2, life: 0.34 + Math.random() * 0.2,
    gravity: 7,
  });
}

function motes(w, L) {
  const a = Math.random() * Math.PI * 2;
  const d = w.reach * (0.6 + 0.4 * Math.random());
  _at.set(w.x + Math.cos(a) * d, 0.2 + Math.random() * 0.9, w.z + Math.sin(a) * d);
  _b.set((w.x - _at.x) * 1.9, -0.4, (w.z - _at.z) * 1.9);
  look.orb(_at, 0.15, {
    color: L.moteColor, from: 1, to: 0.1, life: 0.5, opacity: 0.95,
    vel: _b, drag: 0.3,
  });
}

function dust(w, L) {
  const a = Math.random() * Math.PI * 2;
  const d = w.reach * (0.6 + 0.4 * Math.random());
  _at.set(w.x + Math.cos(a) * d, 0, w.z + Math.sin(a) * d);
  _out.set(-Math.cos(a), 0, -Math.sin(a));
  blast.dustPuffs.spawn(_at, _out, L.dust, 1);
}

// The lens shuts on the pile it made, so the mark is always the ground the well
// still owns rather than the ground it claimed.
function show(w, L, k) {
  const shut = 1 - 0.75 * k;
  look.holdMark(w.lens, w.x, w.z, ringOf(w.reach * L.lens * shut));
  look.holdMark(w.rim, w.x, w.z, ringOf(w.reach * L.lens * shut * 1.14));
  look.holdMark(w.ring, w.x, w.z, ringOf(w.reach * (1 - 0.35 * k)));
  w.lens.peak = 0.7 + 0.3 * k;
  w.rim.peak = 0.7 + 0.3 * k;
  w.ring.peak = 0.24 + 0.2 * k;
}

// The threads run the other way once: what was being wound in is thrown back
// out along the same lines, past the edge of the blast.
function spokes(w, L, radius, grade) {
  const n = L.spokeCount + Math.round(grade * 9);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const from = aim.ringPoint(w.x, w.z, radius * 0.5, a);
    const to = aim.ringPoint(w.x, w.z, radius * (1.05 + Math.random() * 0.35), a);
    _a.set(from.x, 0.16, from.z);
    _b.set(to.x, 0.16, to.z);
    look.beam(_a, _b, {
      color: i % 2 ? L.ring : L.edge, width: L.spokeWidth * (1 + grade * 0.6),
      life: L.spokeLife * (0.7 + Math.random() * 0.6), opacity: 0.9, taper: 0.85,
    });
  }
}

// A hard collapse and a bright snap outward: everything the well was holding
// closed is thrown back through the blast it was gathered for.
function fall(w) {
  const L = well.look();
  const grade = well.grade();
  const radius = modules.splashRadius() * well.spread();

  look.dropMark(w.lens, 0.12);
  look.dropMark(w.rim, 0.12);
  look.dropMark(w.ring, 0.12);

  combat.explode({
    x: w.x, z: w.z, radius, damage: w.dmg,
    edge: CFG.grenade.edge, knock: CFG.grenade.knock, blame: LAUNCHER.name,
    selfDamage: LAUNCHER.damage * CFG.grenade.selfDamage,
    crit: combat.rollCrit(),
  });
  emp.field(w.x, w.z, w.dmg);

  // The launcher's own flash owns the middle of a blast, so the well's colour is
  // put where the flash is not: a wide violet wave and spokes thrown past it.
  _at.set(w.x, 0.3, w.z);
  look.mark(w.x, w.z, ringOf(radius), {
    tex: look.TEX.ZONE_TEX.annulus, color: L.snapCore, from: 0.85, to: 1.35,
    life: 0.18, opacity: 1,
  });
  look.mark(w.x, w.z, ringOf(radius), {
    tex: look.TEX.ZONE_TEX.annulus, color: L.edge, from: 1, to: L.snapTo,
    life: L.snapLife, opacity: 0.95, rise: L.snapLife * 0.2,
  });
  look.mark(w.x, w.z, ringOf(radius) * 0.55, {
    tex: look.TEX.ZONE_TEX.disc, color: L.core, blend: 'normal',
    from: 1, to: 0.05, life: 0.18, opacity: 0.9, y: 0.05,
  });
  spokes(w, L, radius, grade);
  look.orb(_at, radius * 0.22, {
    color: L.ring, from: 0.15, to: 1.2, life: 0.26, opacity: 0.7,
  });
  look.orb(_at, radius * 0.1, {
    color: L.snapColor, from: 0.2, to: 1.4, life: 0.14, opacity: 1,
  });
  // Everything the well gathered is thrown back out as hot metal, not as violet
  // cubes: the colour of the effect belongs in the light, never in the debris.
  look.burst(_at, 11 + Math.round(grade * 13), {
    color: L.sparkColor, speed: 15, rise: 0.85, size: 1.5, life: 0.5,
  });
  look.burst(_at, 4 + Math.round(grade * 5), {
    color: L.sparkCore, speed: 9, rise: 1.5, size: 1, life: 0.3,
  });
  look.burst(_at, 5 + Math.round(grade * 6), {
    color: L.rubble, speed: 7, rise: 1.2, size: 2.4, life: 0.7, gravity: 20,
  });

  audio.playAt(CFG.gunmods.launcher.well.sfx, w.x, w.z, { rate: 1.35, force: true });
  shakeAt(w.x, w.z, 0.45 + grade * 0.45, radius * 4);
}

export function update(dt) {
  if (!wells.length) return;
  const L = well.look();

  for (let i = wells.length - 1; i >= 0; i--) {
    const w = wells[i];
    w.t += dt;
    const k = Math.min(1, w.t / w.hold);

    haul(w, dt);
    show(w, L, k);

    w.thread -= dt;
    if (w.thread <= 0) { w.thread = L.threadEvery; threads(w, L, k); }
    w.edge -= dt;
    if (w.edge <= 0) { w.edge = L.rimEvery; edge(w, L, k); }
    w.grit -= dt;
    while (w.grit <= 0) { w.grit += L.gritEvery; grit(w, L); }
    w.mote -= dt;
    while (w.mote <= 0) { w.mote += L.motesEvery; motes(w, L); }
    w.dust -= dt;
    while (w.dust <= 0) { w.dust += L.dust.every; dust(w, L); }

    if (k < 1) continue;
    fall(w);
    wells.splice(i, 1);
  }
}

export function clear() {
  for (const w of wells) {
    look.dropMark(w.lens, 0.05);
    look.dropMark(w.rim, 0.05);
    look.dropMark(w.ring, 0.05);
  }
  wells.length = 0;
}
