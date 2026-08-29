import * as THREE from 'three';
import { CFG } from '../../config/index.js';
import { world } from '../../core/world.js';
import { audio } from '../../engine/audio.js';
import * as fx from '../../fx/spatter.js';
import { SCORCH_TEX } from '../../fx/textures.js';
import * as combat from '../../game/combat.js';
import { pushGive } from '../../bug/mass.js';
import * as look from '../shared/look.js';
import { rift } from '../values/lance.js';

// Rift Lance. The cut does not close: for a few seconds the line the beam took
// is a seam that everything near it is dragged onto and cooked along. A shot
// stops being a shot and becomes a shape the fight has to move around, which is
// the only thing on this gun that changes the ground rather than what is on it.

const LANCE = CFG.guns.find((g) => g.charge);
// Three cuts on the field at once is a shape to move around; six is a cage of
// pink lines that nobody can read a fight through.
const MOST = 3;

const seams = [];

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _at = new THREE.Vector3();
const _vel = new THREE.Vector3();

export function beam(p, gun, info) {
  if (!rift.on() || !info || !info.path) return;
  const path = info.path;
  let opened = 0;
  for (let i = 0; i + 3 < path.length; i += 2) {
    if (open(path[i], path[i + 1], path[i + 2], path[i + 3])) opened += 1;
  }
  if (!opened) return;
  audio.play(CFG.gunmods.lance.rift.sfx, {
    rate: 1.04 - rift.grade() * 0.22 + Math.random() * 0.06, force: true,
  });
}

function open(ax, az, bx, bz) {
  const len = Math.hypot(bx - ax, bz - az);
  if (len < 0.8) return false;
  const L = rift.look();
  const life = rift.life();
  const bite = rift.bite();
  while (seams.length >= MOST) shut(seams.shift());

  const mx = (ax + bx) / 2, mz = (az + bz) / 2;
  const angle = look.layAngle(bx - ax, bz - az);

  const seam = {
    ax, az, bx, bz, len, bite,
    dx: (bx - ax) / len, dz: (bz - az) / len,
    life, maxLife: life, tick: 0, thread: 0, mote: 0, grit: 0, spark: 0, age: 0,
    trench: look.mark(mx, mz, bite * 0.92, {
      tex: look.TEX.ZONE_TEX.lane, color: L.core, long: len * 0.5, angle,
      blend: 'normal', opacity: 0.97, life, hold: true, y: 0.05,
    }),
    slit: look.mark(mx, mz, bite * 0.14, {
      tex: look.TEX.ZONE_TEX.lane, color: L.glow, long: len * 0.5, angle,
      opacity: 0.9, life, hold: true, y: 0.12,
    }),
    core: look.mark(mx, mz, bite * 0.05, {
      tex: look.TEX.ZONE_TEX.lane, color: 0xffffff, long: len * 0.5, angle,
      opacity: 1, life, hold: true, y: 0.16,
    }),
    edges: [],
  };
  lip(seam, L, angle, life);
  seams.push(seam);

  cracks(seam, L);
  tear(seam, L);
  return true;
}

function lip(s, L, angle, life) {
  const n = Math.max(3, Math.min(9, Math.round(s.len / L.edgeEvery)));
  for (const side of [1, -1]) {
    for (let i = 0; i < n; i++) {
      const t = (i + 0.3 + Math.random() * 0.4) / n;
      const out = s.bite * (0.3 + Math.random() * 0.3) * side;
      const radius = s.bite * (0.04 + Math.random() * 0.05);
      s.edges.push({
        radius,
        phase: Math.random() * Math.PI * 2,
        mark: look.mark(
          s.ax + (s.bx - s.ax) * t - s.dz * out,
          s.az + (s.bz - s.az) * t + s.dx * out,
          radius, {
            tex: look.TEX.ZONE_TEX.lane, color: L.edge,
            long: (s.len / n) * (0.26 + Math.random() * 0.24),
            angle: angle + (Math.random() - 0.5) * 0.16,
            opacity: 0.7, life, hold: true, y: 0.1,
          }),
      });
    }
  }
}

// The cut being made, before it is a seam: three passes down the line and a
// throw of floor off it, so the rift starts on a hit rather than easing open.
function tear(s, L) {
  const grade = rift.grade();
  const bite = s.bite;
  _a.set(s.ax, CFG.laser.height * 0.5, s.az);
  _b.set(s.bx, CFG.laser.height * 0.5, s.bz);
  look.beam(_a, _b, { color: L.edge, width: bite * 1.2, life: 0.07, opacity: 0.3, taper: 0.95 });
  look.beam(_a, _b, { color: L.glow, width: bite * 0.55, life: 0.14, opacity: 0.9, taper: 0.7 });
  look.beam(_a, _b, { color: 0xffffff, width: bite * 0.14, life: 0.1, opacity: 1 });

  const n = 3 + Math.round(grade * 4);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    _at.set(s.ax + (s.bx - s.ax) * t, 0.15, s.az + (s.bz - s.az) * t);
    look.orb(_at, bite * 0.55, {
      color: L.moteColor, from: 0.3, to: 1.2, life: 0.1, opacity: 1,
    });
    look.burst(_at, 5 + Math.round(grade * 7), {
      color: L.dust, speed: 7 + grade * 5, rise: 1.5,
      size: 1.5 + grade * 0.4, life: 0.32, gravity: 24,
    });
    fx.dirt(_at, 3 + Math.round(grade * 3), 0.9);
  }
}

// Scorch under the seam, so what the rift leaves behind when it closes is a
// scar rather than nothing at all.
function cracks(seam, L) {
  const n = Math.max(2, Math.min(10, Math.round(seam.len / (seam.bite * 1.6))));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    _at.set(seam.ax + (seam.bx - seam.ax) * t, 0, seam.az + (seam.bz - seam.az) * t);
    fx.addHazard(_at, seam.bite * (0.5 + Math.random() * 0.25), L.core,
                 seam.maxLife * (0.9 + Math.random() * 0.5), 0, SCORCH_TEX);
  }
}

const offSeam = (s, x, z) => {
  const along = Math.max(0, Math.min(s.len, (x - s.ax) * s.dx + (z - s.az) * s.dz));
  _at.set(s.ax + s.dx * along, 0, s.az + s.dz * along);
  return Math.hypot(x - _at.x, z - _at.z);
};

// A hand on the back, the way the drone's well does it: what is caught still
// walks and still bites, the ground under it is simply moving toward the seam.
function haul(s, dt) {
  const reach = rift.reach();
  const draw = rift.pull() * CFG.bugAnim.knockDecay * dt;
  const burn = Math.round(rift.damage() * rift.tick());
  const biting = s.tick <= 0;
  if (biting) s.tick = rift.tick();

  for (const bug of world.bugs) {
    if (bug.hp <= 0 || bug.carried || bug.flight) continue;
    const off = offSeam(s, bug.pos.x, bug.pos.z);
    if (off > reach) continue;
    if (off > 1e-3) {
      _vel.set(_at.x - bug.pos.x, 0, _at.z - bug.pos.z)
        .multiplyScalar((draw * pushGive(bug)) / off);
      bug.knock.add(_vel);
    }
    if (biting && burn >= 1 && off <= s.bite * 0.5 + bug.radius) {
      _at.y = 0.5;
      combat.hurt(bug, burn, _at, 0.4, LANCE.name);
      cook(bug, _at);
    }
  }
}

// A seam that only prints numbers is a decal the crowd happens to be standing on.
// Every body it bites is lit and struck back down onto the cut, so the line is
// read one target at a time the way a chain is.
function cook(bug, on) {
  const L = rift.look();
  const grade = rift.grade();
  _a.set(bug.pos.x, 0.55, bug.pos.z);
  look.orb(_a, 0.34 + grade * 0.26, {
    color: L.ember, from: 0.5, to: 1.5, life: 0.13, opacity: 0.95,
  });
  look.orb(_a, 0.14 + grade * 0.1, {
    color: 0xffffff, from: 0.6, to: 0.2, life: 0.09, opacity: 1,
  });
  _b.set(on.x, 0.3, on.z);
  look.beam(_a, _b, {
    color: L.ember, width: 0.13 + grade * 0.06, life: 0.11, opacity: 0.85, taper: 1,
  });
  fx.sparks(_a, 2 + Math.round(grade * 2));
}

// Light being drawn in from the sides. Every thread is a line that points at the
// seam, so the pull is legible before anything is standing in it.
function threads(s, dt) {
  const L = rift.look();
  const grade = rift.grade();
  const reach = rift.reach();
  const fade = Math.min(1, s.life / 0.3);

  s.thread -= dt;
  while (s.thread <= 0) {
    s.thread += L.threadLife / (L.threads * (1.1 + grade * 1.6));
    const t = Math.random();
    const side = Math.random() < 0.5 ? 1 : -1;
    const out = reach * (0.2 + Math.random() * 0.3);
    const nx = -s.dz * side, nz = s.dx * side;
    const skew = (Math.random() - 0.5) * out;
    const onx = s.ax + (s.bx - s.ax) * t, onz = s.az + (s.bz - s.az) * t;
    // A straight line from out there to the cut is a scratch. The bend is what
    // makes it light being dragged in rather than a spoke drawn on the floor.
    _a.set(onx + nx * out + s.dx * skew, 0.24, onz + nz * out + s.dz * skew);
    _at.set(onx + nx * out * 0.45 + s.dx * (skew * 0.3 + (Math.random() - 0.5) * out * 0.7),
            0.24, onz + nz * out * 0.45 + s.dz * (skew * 0.3 + (Math.random() - 0.5) * out * 0.7));
    _b.set(onx, 0.24, onz);
    look.beam(_a, _at, {
      color: L.edge, width: L.threadWidth * (0.7 + grade * 0.8), life: L.threadLife,
      opacity: 0.6 * fade, taper: 1,
    });
    look.beam(_at, _b, {
      color: L.edge, width: L.threadWidth * (1 + grade), life: L.threadLife,
      opacity: 0.8 * fade, taper: 1,
    });
    look.beam(_at, _b, {
      color: 0xffffff, width: L.threadWidth * 0.3 * (1 + grade * 0.8),
      life: L.threadLife * 0.5, opacity: fade, taper: 1,
    });
  }

  // Floor going the same way the light is: without grit in the pull the seam is
  // a light show that happens to move bugs.
  s.grit -= dt;
  while (s.grit <= 0) {
    s.grit += 0.075 / (0.6 + grade);
    const t = Math.random();
    const side = Math.random() < 0.5 ? 1 : -1;
    const out = reach * (0.45 + Math.random() * 0.5);
    const nx = -s.dz * side, nz = s.dx * side;
    _a.set(s.ax + (s.bx - s.ax) * t + nx * out, 0.16,
           s.az + (s.bz - s.az) * t + nz * out);
    look.puff(_a, 0.35 + grade * 0.2, {
      color: L.dust, opacity: 0.24 * fade, grow: 1.6, life: 0.3,
      vel: _vel.set(-nx * out * 2.6, 0.5, -nz * out * 2.6),
    });
    look.shard(_a, {
      color: L.dust, vel: _vel.set(-nx * out * 3.4, 2 + Math.random() * 2, -nz * out * 3.4),
      size: 1.4 + grade * 0.3, life: 0.24, gravity: 12,
    });
  }

  // Warm sparks off the cut. Violet threads over a violet seam is one colour
  // doing every job, and the eye stops reading it as heat.
  s.spark -= dt;
  while (s.spark <= 0) {
    s.spark += 0.06 / (0.5 + grade);
    const t = Math.random();
    _at.set(s.ax + (s.bx - s.ax) * t, 0.2,
            s.az + (s.bz - s.az) * t + (Math.random() - 0.5) * s.bite * 0.4);
    fx.sparks(_at, 2 + Math.round(grade * 2));
  }

  s.mote -= dt;
  while (s.mote <= 0) {
    s.mote += L.motesEvery / (0.5 + grade);
    const t = Math.random();
    const side = Math.random() < 0.5 ? 1 : -1;
    const out = reach * (0.5 + Math.random() * 0.5);
    const nx = -s.dz * side, nz = s.dx * side;
    _at.set(s.ax + (s.bx - s.ax) * t + nx * out, 0.3 + Math.random() * 0.5,
            s.az + (s.bz - s.az) * t + nz * out);
    look.orb(_at, 0.3 + grade * 0.2, {
      color: L.moteColor, from: 1, to: 0.15, life: 0.34, opacity: 0.95 * fade,
      vel: _vel.set(-nx * out * 3, -0.5, -nz * out * 3), drag: 1.5,
    });
  }
}

function show(s, dt) {
  const grade = rift.grade();
  const fade = Math.min(1, s.life / 0.25);
  const beat = 0.5 + 0.5 * Math.sin(s.age * 11);

  s.trench.peak = 0.97 * fade;
  s.trench.radius = s.bite * 0.92;
  for (const e of s.edges) {
    const flick = 0.5 + 0.5 * Math.sin(s.age * 11 + e.phase);
    e.mark.peak = (0.2 + 0.32 * flick + 0.12 * grade) * fade;
    e.mark.radius = e.radius * (0.85 + 0.3 * flick);
  }
  s.slit.peak = (0.6 + 0.4 * beat) * fade;
  s.slit.radius = s.bite * (0.1 + 0.07 * beat);
  s.core.peak = (0.55 + 0.45 * beat) * fade;
  s.core.radius = s.bite * (0.035 + 0.03 * beat);
  threads(s, dt);
}

function shut(s) {
  look.dropMark(s.trench, 0.25);
  look.dropMark(s.slit, 0.2);
  look.dropMark(s.core, 0.12);
  for (const e of s.edges) look.dropMark(e.mark, 0.2);
  s.edges.length = 0;
  _at.set((s.ax + s.bx) / 2, 0.3, (s.az + s.bz) / 2);
  look.orb(_at, s.bite, {
    color: rift.look().moteColor, from: 0.8, to: 0.05, life: 0.2, opacity: 0.7,
  });
  s.trench = s.slit = s.core = null;
}

export function update(dt) {
  for (let i = seams.length - 1; i >= 0; i--) {
    const s = seams[i];
    s.life -= dt;
    s.age += dt;
    if (s.life <= 0) { shut(s); seams.splice(i, 1); continue; }
    s.tick -= dt;
    haul(s, dt);
    show(s, dt);
  }
}

export function clear() {
  for (const s of seams) shut(s);
  seams.length = 0;
}
