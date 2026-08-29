import * as THREE from 'three';
import { CFG } from '../../config/index.js';
import { scene } from '../../engine/view.js';
import { audio } from '../../engine/audio.js';
import { makePool } from '../../core/pool.js';
import * as fx from '../../fx/spatter.js';
import * as combat from '../../game/combat.js';
import * as look from '../shared/look.js';
import * as aim from '../shared/aim.js';
import { seeker } from '../values/rifle.js';

// Seeker Flechettes. The rifle's answer to a crowd it cannot see past: darts
// go up off the barrel, over the front rank, and come down on whatever the
// round itself was never going to reach. The whole flight is owned here rather
// than run through bullets.js, because nothing else in the game flies.

const RIFLE = CFG.guns[0];

const UP = new THREE.Vector3(0, 1, 0);
const DART_GEO = new THREE.ConeGeometry(0.17, 0.95, 5);
const DART_MAT = new THREE.MeshBasicMaterial({ color: CFG.gunmods.rifle.seeker.look.body });

const MOST = 56;

const _dir = new THREE.Vector3();
const _at = new THREE.Vector3();
const _vel = new THREE.Vector3();

const topOf = (bug) => (bug.alt || 0) + (bug.model.parts.height || 1) * (bug.grow || 1);

const darts = makePool(
  () => {
    const mesh = new THREE.Mesh(DART_GEO, DART_MAT);
    mesh.frustumCulled = false;
    scene.add(mesh);
    return { mesh, vel: new THREE.Vector3(), was: new THREE.Vector3(),
             target: null, base: 0, share: 0,
             speed: 0, turn: 0, reach: 0, hx: 1, hz: 0, vh: 0,
             cruise: 0, rising: true, trail: 0, life: 0 };
  },
  (d, pos, dir, base) => {
    const S = CFG.gunmods.rifle.seeker;
    d.mesh.position.copy(pos);
    d.mesh.scale.setScalar(0.95 + seeker.grade() * 0.5);
    d.base = base;
    d.share = seeker.share();
    d.speed = seeker.speed();
    d.turn = seeker.turn();
    d.reach = seeker.reach();
    d.hx = dir.x; d.hz = dir.z;
    d.vh = d.speed * S.launch;
    d.cruise = pos.y + seeker.loft();
    d.rising = true;
    d.vel.set(d.hx * d.vh, S.rise, d.hz * d.vh);
    d.was.copy(pos);
    d.target = null;
    d.trail = 0;
    d.life = seeker.life();
    point(d);
  },
);

function point(d) {
  _dir.copy(d.vel);
  if (_dir.lengthSq() < 1e-6) return;
  d.mesh.quaternion.setFromUnitVectors(UP, _dir.normalize());
}

export function shot(p, gun, muzzle, dir, plan) {
  if (gun.id !== RIFLE.id || !seeker.on()) return;
  if (Math.random() >= seeker.chance()) return;

  const n = seeker.count();
  const fan = CFG.gunmods.rifle.seeker.fan;
  for (let i = 0; i < n; i++) {
    if (darts.live.length >= MOST) break;
    const t = n > 1 ? (i / (n - 1)) * 2 - 1 : 0;
    _dir.copy(dir).applyAxisAngle(UP, t * fan);
    darts.spawn(muzzle, _dir, plan.base);
  }
  puff(muzzle);
  audio.play(CFG.gunmods.rifle.seeker.sfx, { rate: 0.92 + Math.random() * 0.16 });
}

function puff(muzzle) {
  const L = seeker.look();
  const grade = seeker.grade();
  _at.set(muzzle.x, muzzle.y + 0.2, muzzle.z);
  look.orb(_at, 0.5 + grade * 0.3, {
    color: L.flame, from: 0.3, to: 2.4, life: 0.13, opacity: 0.9,
  });
  look.orb(_at, 0.24, { color: L.core, from: 0.5, to: 1.5, life: 0.09, opacity: 1 });
  look.burst(_at, 3 + Math.round(grade * 5), {
    color: L.body, speed: 9, rise: 0.9, size: 0.6, life: 0.3,
  });
  _vel.set(0, 1.4, 0);
  look.puff(_at, 0.2, { color: 0x6a7278, opacity: 0.2, grow: 2.6, life: 0.4, vel: _vel });
}

export function update(dt) {
  const L = seeker.look();
  for (let i = darts.live.length - 1; i >= 0; i--) {
    const d = darts.live[i];
    d.life -= dt;
    if (d.life <= 0) { fizzle(d, L); darts.release(i); continue; }
    fly(d, dt);
    d.mesh.position.addScaledVector(d.vel, dt);
    point(d);
    trail(d, dt, L);

    const bug = touched(d);
    if (bug) { burst(d, bug, L); darts.release(i); continue; }
    if (d.mesh.position.y < 0.1) { fizzle(d, L); darts.release(i); }
  }
}

// Climb, then dive: the height is flown rather than thrown, so a dart is over
// the front rank for as long as it takes to get past it and comes down on the
// body instead of skating over the crowd on a ballistic guess.
function fly(d, dt) {
  const S = CFG.gunmods.rifle.seeker;
  const p = d.mesh.position;
  if (!d.target || d.target.hp <= 0) d.target = aim.nearest(p.x, p.z, d.reach);

  turn(d, dt);
  d.vh = Math.min(d.speed, d.vh + d.speed * 2 * dt);
  if (d.rising && p.y < d.cruise) {
    d.vel.set(d.hx * d.vh, S.rise, d.hz * d.vh);
    return;
  }
  d.rising = false;
  const floor = d.target ? topOf(d.target) * 0.5 : 0;
  d.vel.set(d.hx * d.vh,
            Math.max(-d.speed, Math.min(d.speed, (floor - p.y) * S.dive)),
            d.hz * d.vh);
}

// The heading is steered flat, at `turn` radians a second: a dart that could
// spin its whole velocity vector would come back on itself, which reads as a
// bug rather than as a guided round.
function turn(d, dt) {
  if (!d.target) return;
  const p = d.mesh.position;
  const dx = d.target.pos.x - p.x, dz = d.target.pos.z - p.z;
  const len = Math.hypot(dx, dz);
  if (len < 1e-4) return;
  const tx = dx / len, tz = dz / len;
  const off = Math.atan2(d.hx * tz - d.hz * tx, d.hx * tx + d.hz * tz);
  const step = Math.max(-d.turn * dt, Math.min(d.turn * dt, off));
  const a = Math.atan2(d.hz, d.hx) + step;
  d.hx = Math.cos(a);
  d.hz = Math.sin(a);
}

function touched(d) {
  const p = d.mesh.position;
  const bug = aim.nearest(p.x, p.z, 2.4);
  if (!bug) return null;
  const dx = bug.pos.x - p.x, dz = bug.pos.z - p.z;
  const r = bug.radius + CFG.gunmods.rifle.seeker.bite;
  if (dx * dx + dz * dz > r * r) return null;
  return p.y <= topOf(bug) + r ? bug : null;
}

// A ribbon laid down the ground the dart has already crossed, plus a flame
// thrown back off it: the ribbon is what makes the arc a line the eye can
// follow rather than a bead that happens to be somewhere new each frame.
function trail(d, dt, L) {
  d.trail -= dt;
  if (d.trail > 0) return;
  d.trail = L.trailEvery;
  const p = d.mesh.position;
  const grade = seeker.grade();

  look.beam(d.was, p, {
    color: L.flame, width: L.size * (2.2 + grade * 1),
    life: L.trailLife * 0.45, opacity: 0.3, taper: 0.95,
  });
  look.beam(d.was, p, {
    color: L.body, width: L.size * (0.7 + grade * 0.35),
    life: L.trailLife, opacity: 0.85, taper: 0.9,
  });
  look.beam(d.was, p, {
    color: L.core, width: L.size * 0.16, life: L.trailLife * 0.55, opacity: 1, taper: 0.7,
  });
  d.was.copy(p);

  _vel.copy(d.vel).multiplyScalar(-0.3);
  look.orb(p, L.size * (0.8 + grade * 0.45), {
    color: L.flame, from: 1, to: 0.12, life: L.trailLife * 0.55,
    opacity: 0.9, vel: _vel, drag: 4,
  });
  look.orb(p, L.size * 0.3, {
    color: L.core, from: 1, to: 0.1, life: L.trailLife * 0.6, opacity: 1,
  });
  if (Math.random() < 0.3) {
    _vel.set((Math.random() - 0.5) * 2, -1 - Math.random(), (Math.random() - 0.5) * 2);
    look.shard(p, { color: L.body, vel: _vel, size: 0.5, life: 0.4, gravity: 14 });
  }
}

function burst(d, bug, L) {
  const p = d.mesh.position;
  const grade = seeker.grade();
  const crit = combat.rollCrit();
  _at.copy(p);
  combat.hurt(bug, Math.round(d.base * d.share * combat.critMultiplier(crit)),
              _at, 1, RIFLE.name, crit);

  const size = L.size * (1.3 + grade * 1);
  look.orb(_at, size * 1.6, {
    color: L.flame, from: 0.25, to: L.hitTo * 0.9, life: L.hitLife, opacity: 0.45,
  });
  look.orb(_at, size, {
    tex: look.TEX.ZONE_TEX.annulus, color: L.hitColor,
    from: 0.15, to: L.hitTo * 1.3, life: L.hitLife * 0.7, opacity: 1,
  });
  look.orb(_at, size * 0.45, {
    color: L.core, from: 0.4, to: 1.5, life: L.hitLife * 0.28, opacity: 1,
  });
  look.burst(_at, 5 + Math.round(grade * 9), {
    color: L.core, speed: 13, rise: 0.7, size: 0.8, life: 0.36,
  });
  look.burst(_at, 2 + Math.round(grade * 4), {
    color: L.scorch, speed: 6, rise: 0.9, size: 0.6, life: 0.5, gravity: 28,
  });
  fx.sparks(_at, 5);
  look.mark(p.x, p.z, size * 1.1, {
    tex: look.TEX.ZONE_TEX.annulus, color: L.hitColor,
    from: 0.3, to: 1.6, life: 0.2, opacity: 0.5,
  });
  look.mark(p.x, p.z, size * 0.62, {
    tex: look.TEX.ZONE_TEX.disc, color: L.scorch, blend: 'normal',
    from: 0.5, to: 1, life: L.scorchLife, opacity: 0.16,
  });
  audio.playAt(CFG.gunmods.rifle.seeker.sfx, p.x, p.z,
               { rate: 1.16 + Math.random() * 0.2 });
}

// A dart that ran out of life or ran into the floor: it has to be seen to end,
// or the player learns that darts sometimes simply vanish.
function fizzle(d, L) {
  const p = d.mesh.position;
  look.orb(p, L.size * 0.8, {
    color: L.flame, from: 0.6, to: 1.5, life: 0.18, opacity: 0.4,
  });
  look.puff(p, L.size * 0.5, { color: 0x6a7278, opacity: 0.14, grow: 2.2, life: 0.28 });
  fx.sparks(p, 2);
}

export function clear() { darts.clear(); }
