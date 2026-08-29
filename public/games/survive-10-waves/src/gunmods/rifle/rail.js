import * as THREE from 'three';
import { CFG } from '../../config/index.js';
import { world } from '../../core/world.js';
import { audio } from '../../engine/audio.js';
import { shakeAt } from '../../engine/view.js';
import * as fx from '../../fx/spatter.js';
import { pushGive } from '../../bug/mass.js';
import * as combat from '../../game/combat.js';
import * as look from '../shared/look.js';
import * as aim from '../shared/aim.js';
import { rail } from '../values/rifle.js';

// Rail Slug. Every so many rounds the rifle stops being a rifle: the coils dump
// into one slug and the line it takes is emptied. It is the branch's answer to
// a rank of bodies lining up, and the reason to keep firing rather than to
// reposition — which is exactly the choice the arena is meant to force.

const RIFLE = CFG.guns[0];

let counted = 0;
const hits = [];

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _at = new THREE.Vector3();
const _push = new THREE.Vector3();

const due = () => rail.on() && counted + 1 >= rail.every();

// The slug is fired instead of the round, not beside it: the pattern is emptied
// and the gun's own report is held back so the rail is the only thing heard.
export function plan(p, gun, shot) {
  if (gun.id !== 'rifle' || !rail.on()) return;
  counted += 1;
  if (counted < rail.every()) return;
  counted = 0;
  shot.pellets = 0;
  shot.quiet = true;
  shot.railed = true;
}

export function shot(p, gun, muzzle, dir, plan) {
  if (!plan.railed) return;
  fire(muzzle, dir, plan.base);
}

function fire(muzzle, dir, base) {
  const L = rail.look();
  const reach = rail.reach();
  const width = rail.width();
  const dx = dir.x, dz = dir.z;

  _a.set(muzzle.x, CFG.laser.height, muzzle.z);
  const end = aim.clampToArena(muzzle.x + dx * reach, muzzle.z + dz * reach, 0.5);
  _b.set(end.x, CFG.laser.height, end.z);

  strike(muzzle.x, muzzle.z, dx, dz, reach, width, base);
  draw(_a, _b, width, L);

  audio.play(CFG.gunmods.rifle.rail.sfx, { rate: 0.94 + Math.random() * 0.12, force: true })
    || audio.zap();
  const S = CFG.gunmods.rifle.rail.shake;
  shakeAt(muzzle.x, muzzle.z, S.power * (0.6 + 0.4 * rail.grade()), S.range);
}

// Sorted along the line, so the falloff walks front to back: a slug spends
// itself on the rank it arrived at rather than on whichever body the roster
// happened to list first.
function strike(x, z, dx, dz, reach, width, base) {
  aim.alongLine(x, z, dx, dz, reach, width * 0.5, hits);
  hits.sort((a, b) => ((a.pos.x - x) * dx + (a.pos.z - z) * dz)
                    - ((b.pos.x - x) * dx + (b.pos.z - z) * dz));

  const crit = combat.rollCrit();
  const retain = rail.retain();
  const knock = rail.knock();
  let carry = base * rail.damage() * combat.critMultiplier(crit);

  for (const bug of hits) {
    if (bug.hp <= 0) continue;
    const along = (bug.pos.x - x) * dx + (bug.pos.z - z) * dz;
    _at.set(x + dx * along, CFG.laser.height, z + dz * along);

    if (knock > 0) {
      _push.set(dx, 0, dz).multiplyScalar(knock * pushGive(bug));
      bug.knock.add(_push);
    }
    combat.hurt(bug, Math.round(carry), _at, 1, RIFLE.name, crit);
    look.orb(_at, width * 1.6, {
      color: 0xffffff, from: 0.5, to: 2.2, life: 0.18, opacity: 0.9,
    });
    fx.sparks(_at, 5);
    carry *= retain;
    if (carry < CFG.bullet.minDamage) break;
  }
}

// Four passes, none of which is the line itself: a wide bloom for the light, a
// hard core for the shot, a scar on the floor for where it went, and dust off
// the ground because a slug this size moves air.
function draw(from, to, width, L) {
  const grade = rail.grade();

  look.beam(from, to, {
    color: L.beam, width: width * 1.7, life: L.life * 0.55, opacity: 0.34, taper: 0.75,
  });
  look.beam(from, to, {
    color: L.beam, width: width * 0.7, life: L.life, opacity: 0.95, taper: 0.5,
  });
  look.beam(from, to, {
    color: L.core, width: width * 0.22, life: L.life * 0.8, opacity: 1,
  });

  filaments(from, to, width, L, 1 + Math.round(grade * 3));
  scar(from, to, width, L);
  wake(from, to, width, L);

  look.mark(from.x, from.z, width * 1.1, {
    tex: look.TEX.ZONE_TEX.annulus, color: L.muzzle, life: L.muzzleLife * 0.7,
    from: 0.3, to: L.muzzleTo * 0.55, opacity: 0.7, y: 0.35,
  });
  look.orb(from, width * 2, {
    color: L.core, from: 0.35, to: 1.9, life: L.muzzleLife * 0.6, opacity: 1,
  });
  look.burst(from, 5 + Math.round(grade * 7), {
    color: L.beam, speed: 12, rise: 0.5, size: 0.7, life: 0.3,
  });
}

// The line frays as the module grows: one clean shot at the first level, a
// braid of current by the last.
function filaments(from, to, width, L, n) {
  for (let i = 1; i < n; i++) {
    const off = (i % 2 ? 1 : -1) * width * (0.35 + i * 0.22);
    const nx = -(to.z - from.z), nz = to.x - from.x;
    const len = Math.hypot(nx, nz) || 1;
    _a.set(from.x + (nx / len) * off, from.y, from.z + (nz / len) * off);
    _b.set(to.x + (nx / len) * off * 0.4, to.y, to.z + (nz / len) * off * 0.4);
    look.beam(_a, _b, {
      color: L.scar, width: width * 0.22, life: L.life * (0.5 + Math.random() * 0.4),
      opacity: 0.55, taper: 0.8,
    });
  }
}

function scar(from, to, width, L) {
  const mid = { x: (from.x + to.x) / 2, z: (from.z + to.z) / 2 };
  const len = Math.hypot(to.x - from.x, to.z - from.z);
  look.mark(mid.x, mid.z, width * 0.42, {
    tex: look.TEX.ZONE_TEX.lane, color: L.scar, long: len,
    angle: look.layAngle(to.x - from.x, to.z - from.z),
    life: L.scarLife, opacity: 0.42, rise: 0.03,
  });
}

// Dust off the floor the slug ran over, thrown up along the line rather than
// sprayed over it: the ground has to look shoved aside, not smoked.
function wake(from, to, width, L) {
  const len = Math.hypot(to.x - from.x, to.z - from.z);
  const n = Math.max(2, Math.min(9, Math.round(len / L.dustEvery)));
  const nx = -(to.z - from.z) / (len || 1), nz = (to.x - from.x) / (len || 1);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const side = i % 2 ? 1 : -1;
    _at.set(from.x + (to.x - from.x) * t + nx * width * 0.4 * side, 0.08,
            from.z + (to.z - from.z) * t + nz * width * 0.4 * side);
    look.puff(_at, width * (0.34 + Math.random() * 0.3), {
      color: L.dustColor, opacity: 0.2, grow: 2.4, life: 0.45,
      vel: _push.set(nx * side * 2.4, 1.1 + Math.random(), nz * side * 2.4),
    });
  }
}

// The barrel says what is coming: the round before a slug the coils are already
// lit, which is the only warning anyone gets and the reason it never feels
// random.
export function update() {
  if (!rail.on() || !world.player) return;
  const p = world.player;
  if (!due() || !p.parts || !p.parts.muzzle) return;
  p.parts.muzzle.getWorldPosition(_at);
  look.orb(_at, rail.width() * 1.5, {
    color: rail.look().core, from: 0.9, to: 0.2, life: 0.07, opacity: 0.75,
  });
}

export function clear() { counted = 0; hits.length = 0; }
