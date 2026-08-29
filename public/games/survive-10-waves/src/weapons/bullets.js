import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { makePool } from '../core/pool.js';
import * as fx from '../fx/spatter.js';
import * as walls from '../arena/walls.js';
import * as arena from '../arena/size.js';
import * as gunmods from '../gunmods/index.js';

const LOOK = {
  bullet: {
    geo: new THREE.CapsuleGeometry(CFG.bullet.thickness, 0.55, 4, 8),
    mat: new THREE.MeshBasicMaterial({ color: 0xffe08a }),
  },
  pellet: {
    geo: new THREE.CapsuleGeometry(CFG.bullet.thickness * 1.35, 0.16, 4, 6),
    mat: new THREE.MeshBasicMaterial({ color: 0xff9d3d }),
  },
};
const GEO = LOOK.bullet.geo;
const MAT = LOOK.bullet.mat;
const UP = new THREE.Vector3(0, 1, 0);

export function rangeFactor(d) {
  const B = CFG.bullet;
  return Math.pow(B.remain, d / B.halfAt);
}

const pool = makePool(
  () => {
    const mesh = new THREE.Mesh(GEO, MAT);
    scene.add(mesh);

    return { mesh, vel: new THREE.Vector3(), prev: new THREE.Vector3(),
             from: new THREE.Vector3(), life: 0, fresh: false, hits: 0,
             base: 0, knock: 0, retain: 0, arcs: false, overWalls: false,
             by: '', gun: '', mod: null, flown: 0, seen: new Set() };
  },
  (b, pos, dir, shot) => {
    const { origin, base, range = 0, look = 'bullet', knock = 0,
            retain = 0, arcs = false, overWalls = false, by = '',
            gun = '', mod = null, scale = 1, tint = 0 } = shot;
    const L = LOOK[look] || LOOK.bullet;
    b.mesh.geometry = L.geo;
    b.mesh.material = tint ? tinted(L, tint) : L.mat;
    b.mesh.scale.setScalar(scale);
    b.mesh.position.copy(pos);
    b.prev.copy(origin || pos);

    b.from.copy(origin || pos);
    b.fresh = true;
    b.mesh.quaternion.setFromUnitVectors(UP, dir);
    b.vel.copy(dir).multiplyScalar(CFG.bullet.speed);

    b.life = range > 0 ? range / CFG.bullet.speed : CFG.bullet.life;

    b.hits = 0;

    b.base = base;
    b.knock = knock;
    b.retain = retain;
    b.arcs = arcs;
    b.overWalls = overWalls;
    b.by = by;
    b.gun = gun;
    b.mod = mod;
    b.flown = 0;
    b.seen.clear();
  },
);

// A module that wants its round to look like its own thing gets a material
// rather than a pool: one per colour, kept, so a burning pellet and a rail slug
// are not two more object churns a frame.
const tints = new Map();

function tinted(look, colour) {
  let mat = tints.get(colour);
  if (!mat) {
    mat = look.mat.clone();
    mat.color.setHex(colour);
    tints.set(colour, mat);
  }
  return mat;
}

export const live = pool.live;
export function spawn(pos, dir, shot) { return pool.spawn(pos, dir, shot); }
export function release(i) { pool.release(i); }

// Held back a few milliseconds each, so a pattern leaves the barrel ragged
// instead of as one clean rank. The muzzle is remembered from the shot, not
// read again when the pellet finally goes.
const queued = [];

export function spawnLater(delay, pos, dir, shot) {
  if (delay <= 0) return spawn(pos, dir, shot);
  queued.push({ t: delay, pos: pos.clone(), dir: dir.clone(),
                shot: { ...shot, origin: shot.origin.clone() } });
  return null;
}

function releaseQueued(dt) {
  for (let i = queued.length - 1; i >= 0; i--) {
    const q = queued[i];
    q.t -= dt;
    if (q.t > 0) continue;
    spawn(q.pos, q.dir, q.shot);
    queued[i] = queued[queued.length - 1];
    queued.pop();
  }
}

export function clear() { pool.clear(); queued.length = 0; }

// A round that ran out rather than being spent on a body, so the kit that fired
// it hears about it before it is gone.
function ran(b, i) {
  gunmods.endBullet(b);
  pool.release(i);
}

export function update(dt) {
  releaseQueued(dt);
  const R2 = arena.radius() * arena.radius();
  for (let i = pool.live.length - 1; i >= 0; i--) {
    const b = pool.live[i];
    b.life -= dt;

    // Swept, not sampled: at this speed a round crosses a bug within one frame.
    if (b.fresh) b.fresh = false;
    else b.prev.copy(b.mesh.position);
    b.mesh.position.addScaledVector(b.vel, dt);

    const bp = b.mesh.position;
    b.flown = Math.hypot(bp.x - b.from.x, bp.z - b.from.z);

    const t = b.overWalls ? -1 : walls.blocks(b.prev.x, b.prev.z, bp.x, bp.z);
    if (t >= 0) {
      bp.set(b.prev.x + (bp.x - b.prev.x) * t, bp.y, b.prev.z + (bp.z - b.prev.z) * t);
      fx.sparks(bp);
      ran(b, i);
      continue;
    }

    // Before the range checks: a round that opens in the air on its own terms
    // has not run out of anything, and must not be sparked away as if it had.
    if (gunmods.stepBullet(b, dt)) { pool.release(i); continue; }

    if (b.life <= 0) { ran(b, i); continue; }
    if (bp.x * bp.x + bp.z * bp.z > R2) {
      fx.sparks(bp);
      ran(b, i);
      continue;
    }

    if (b.base * rangeFactor(b.flown) < CFG.bullet.minDamage) {
      fx.sparks(bp);
      ran(b, i);
    }
  }
}
