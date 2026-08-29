import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { audio } from '../engine/audio.js';
import { makePool } from '../core/pool.js';
import { ZONE_TEX, ZONE_FILL } from '../fx/textures.js';
import { world } from '../core/world.js';
import { segDist2 } from '../core/geom2.js';
import * as combat from '../game/combat.js';
import * as drone from './drone.js';
import * as arena from '../arena/size.js';
import * as modules from '../modules/index.js';
import * as booked from './booked.js';
import { clip } from '../arena/clip.js';

const B = () => CFG.drone.bombs;

const PLANE = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const SHELL = new THREE.SphereGeometry(0.26, 10, 7);

// The ground the run has claimed, in the same soft red every telegraph on this
// ground wears. A band runs along (sin yaw, cos yaw), so the lane is laid with
// its width across the line and its length down it.
const lanes = makePool(
  () => {
    const mesh = new THREE.Mesh(PLANE, clip(new THREE.MeshBasicMaterial({
      map: ZONE_TEX.lane, color: B().lane.color, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })));
    mesh.renderOrder = 3;
    scene.add(mesh);
    return { mesh };
  },
  (m, x, z, wide, long, yaw) => {
    m.mesh.position.set(x, B().lane.y, z);
    m.mesh.rotation.set(0, yaw, 0);
    m.mesh.scale.set((wide * 2) / ZONE_FILL, 1, long / ZONE_FILL);
    m.mesh.material.opacity = 0;
  },
);

const shells = makePool(
  () => {
    const mesh = new THREE.Mesh(SHELL, new THREE.MeshStandardMaterial({
      color: B().shell, metalness: 0.6, roughness: 0.4,
    }));
    mesh.castShadow = true;
    scene.add(mesh);
    return { mesh, x: 0, z: 0, from: 0, fall: 1, off: { x: 0, z: 0 }, t: 0,
             radius: 1, damage: 0 };
  },
  (b, x, z, from, radius, damage, ox, oz) => {
    b.x = x + ox;
    b.z = z + oz;
    b.from = from;
    b.fall = fallFrom(from);
    b.off.x = -ox;
    b.off.z = -oz;
    b.t = 0;
    b.radius = radius;
    b.damage = damage;
    b.mesh.position.set(x, from, z);
  },
);

// A charge is simply dropped, so how long it hangs is the height it was let go
// at and nothing else.
const fallFrom = (high) => Math.sqrt(Math.max(0, 2 * high) / B().gravity);

const runs = [];

// The drone's own clock for it, like the singularity's: the moment it is off
// cooldown with something it is working on, the lane goes down and the machine
// starts for it. Nothing to bomb costs it `retry` rather than another look next
// frame.
export function tick(d, dt) {
  d.bombCd -= dt;
  if (d.bombCd > 0 || d.bombing || !modules.droneBombs()) return;
  d.bombCd = begin(d) ? modules.droneBombCooldown() : B().retry;
}

const _dir = new THREE.Vector2();

// Laid across what the machine is shooting, on the bearing it is already looking
// down: the target sits in the middle of the run, and the lane lights up while
// the machine flies for the head of it.
function begin(d) {
  const bug = d.target;
  if (!bug || bug.hp <= 0) return false;

  _dir.set(bug.pos.x - d.pos.x, bug.pos.z - d.pos.z);
  if (_dir.lengthSq() < 1e-6) return false;
  _dir.normalize();

  const speed = modules.droneSpeed() * B().dash;
  const radius = modules.droneBombRadius();

  // High enough that a charge is still in the air while the machine flies out of
  // its blast, and a run-out past the last of them for the same reason: what is
  // dropped at the far end has the whole of its fall to be left behind in.
  const away = (radius + d.radius + B().clear) / speed;
  const least = 0.5 * B().gravity * away * away;
  const fall = fallFrom(Math.max(d.pos.y * B().stoop, least));
  const runout = speed * fall + radius + B().clear;

  const half = fitHalf(bug.pos, _dir, modules.droneBombRange() / 2, runout);
  if (half < radius) return false;

  // The target is the middle of the run, not the head of it: the lane opens half
  // its length short of what it is going for and carries the same distance past.
  const r = { x: bug.pos.x - _dir.x * half, z: bug.pos.z - _dir.y * half,
              dx: _dir.x, dz: _dir.y,
              len: half * 2, radius, least, fall, tail: 0,
              wide: radius * (1 + B().spread),
              count: modules.droneBombCount(),
              damage: modules.droneBombDamage(),
              speed,
              yaw: Math.atan2(_dir.x, _dir.y), by: d,
              t: 0, flew: 0, since: 0, done: 0, laid: 0, slipX: 0, slipZ: 0,
              phase: 'lineup', lane: null };
  if (friendlyIn(r, d)) return false;
  r.tail = Math.max(r.len * B().outrun, runout);

  // Ground another machine's attack already owns is left to it.
  r.mark = booked.lane(r.x, r.z, r.x + r.dx * r.len, r.z + r.dz * r.len, r.wide);
  if (!booked.open(r.mark)) return false;
  booked.take(r.mark);

  runs.push(r);
  d.bombing = r;
  return true;
}

const outside = (r, x, z, pad) => segDist2(r.x, r.z, r.x + r.dx * r.len,
                                           r.z + r.dz * r.len, x, z) >= (r.wide + pad) ** 2;

// Nothing of ours is bombed: a lane with the player or another machine standing
// in it is not laid at all. Only what is there when it is called — the mark is
// on the ground from then on, and anything that walks into it afterwards has
// been told.
function friendlyIn(r, by) {
  const p = world.player;
  if (!outside(r, p.pos.x, p.pos.z, CFG.player.radius)) return true;

  for (const d of drone.list()) {
    if (d !== by && !outside(r, d.pos.x, d.pos.z, d.radius)) return true;
  }
  return false;
}

// Room from a point out to the rim of the ring the flight keeps to, along a
// bearing.
function roomFrom(x, z, dx, dz) {
  const lim = arena.radius() - CFG.drone.inset;
  const dot = x * dx + z * dz;
  return Math.sqrt(Math.max(0, dot * dot - (x * x + z * z - lim * lim))) - dot;
}

// A lane is flown and it is centred on what it is going for, so what will not
// fit inside the ring comes off both ends alike: the target stays in the middle
// of a shorter run rather than sliding down the length of a full one. The
// run-out is part of what has to fit ahead of it — a machine pinned on the rim
// has nowhere to fly its last charges off.
function fitHalf(at, dir, half, runout) {
  return Math.min(half,
                  roomFrom(at.x, at.z, dir.x, dir.y) - runout,
                  roomFrom(at.x, at.z, -dir.x, -dir.y));
}

// Where the run wants the machine before it flies: the head of its lane. The
// pass takes over from `grip` out, so it is flown into rather than stopped on.
export function waypoint(d, out) {
  const r = d.bombing;
  if (!r || r.phase !== 'lineup') return false;
  out.set(r.x, d.pos.y, r.z);
  return true;
}

// The pass itself is flown by the run rather than steered into: the machine is
// carried down its own lane at `dash` times its speed, and the charges come off
// it evenly along the way rather than on a clock of their own.
export function carry(d, dt) {
  const r = d.bombing;
  if (!r || r.phase !== 'run') return false;

  const W = B();
  r.since += dt;
  r.flew = Math.min(r.len + r.tail, r.flew + r.speed * dt);
  const slip = Math.exp(-W.settle * r.since);

  d.pos.x = r.x + r.dx * r.flew + r.slipX * slip;
  d.pos.z = r.z + r.dz * r.flew + r.slipZ * slip;
  d.vel.set(r.dx, 0, r.dz).multiplyScalar(r.speed);

  // The run-out can reach the rim, and a machine put through it is still a
  // machine held inside the ring.
  const lim = arena.radius() - CFG.drone.inset;
  const out = Math.hypot(d.pos.x, d.pos.z);
  if (out > lim) { d.pos.x *= lim / out; d.pos.z *= lim / out; }
  d.spot.set(d.pos.x, d.pos.y, d.pos.z);

  const gap = r.len / r.count;
  while (r.laid < r.count && r.flew >= (r.laid + 0.5) * gap) {
    const at = (r.laid + 0.5) * gap;
    drop(r, r.x + r.dx * at, r.z + r.dz * at);
  }
  if (r.flew >= r.len + r.tail) finish(r);
  return true;
}

// A pass is flown a little under the height it cruises at — but never lower than
// the drop needs. A charge has to hang in the air for as long as the machine
// takes to put its own blast behind it, and that is what sets the floor.
export function height(d, cruise) {
  const r = d.bombing;
  return r ? Math.max(cruise * B().stoop, r.least) : cruise;
}

// How far the machine still is from the near end of its own lane.
const short = (r) => Math.hypot(r.by.pos.x - r.x, r.by.pos.z - r.z);

function paint(r) {
  if (!r.lane) {
    r.lane = lanes.spawn(r.x + r.dx * r.len / 2, r.z + r.dz * r.len / 2,
                         r.wide, r.len, r.yaw);
  }
  r.lane.mesh.material.opacity = B().lane.opacity * shade(r);
}

// Lit while the machine lines the run up, held for as long as it is flying it,
// and gone once the last charge has landed.
function shade(r) {
  const W = B();
  if (r.phase === 'lineup') {
    const k = Math.min(1, r.t / W.warn);
    return (0.3 + 0.7 * k) * (0.78 + 0.22 * Math.sin(r.t * W.blink));
  }
  if (r.phase === 'run') return 1;
  return Math.max(0, 1 - (r.t - r.done) / (r.fall + W.fade));
}

// Off the machine at the height it is flying at, on its own mark down the lane
// rather than wherever the frame caught it: the charges are spaced by the line,
// not by the tick rate. One tumbles as it falls, so where it lands is off the
// line by up to `spread` of its own blast.
function drop(r, x, z) {
  const a = Math.random() * Math.PI * 2;
  const off = r.radius * B().spread * Math.sqrt(Math.random());
  r.fall = fallFrom(r.by.pos.y);
  if (r.laid + 1 >= r.count) {
    r.tail = Math.max(r.tail, r.speed * r.fall + r.radius + B().clear);
  }
  shells.spawn(x, z, r.by.pos.y, r.radius, r.damage,
               Math.cos(a) * off, Math.sin(a) * off);
  audio.playAt('jetMine', x, z, { rate: 1.3, gainScale: 0.45 });
  r.laid += 1;
}

function finish(r) {
  r.phase = 'spent';
  r.done = r.t;
  if (r.by.bombing === r) r.by.bombing = null;
}

function douse(r) {
  booked.free(r.mark);
  if (r.lane) lanes.releaseObject(r.lane);
  r.lane = null;
}

// The beat the lane stands on the ground for is the flight in: when it is up the
// machine should be on the near end, and whatever is left between the two is
// flown out under `settle`. A machine that was held up and is nowhere near gives
// the run up rather than being dragged onto it, and tries again shortly.
function step(r, dt) {
  const W = B();
  r.t += dt;

  if (r.phase !== 'spent' && r.by.hp <= 0) finish(r);

  if (r.phase === 'lineup') {
    if (r.t >= W.warn && short(r) <= W.grip) {
      r.slipX = r.by.pos.x - r.x;
      r.slipZ = r.by.pos.z - r.z;
      r.phase = 'run';
    } else if (r.t >= W.lineup) {
      r.by.bombCd = W.retry;
      finish(r);
    }
  }

  paint(r);
  return r.phase === 'spent' && r.t >= r.done + r.fall + W.fade;
}

// A charge does not ask what it is under: the flight is in its own blast the
// same as anything else standing in one, the machine that dropped it included.
// Flying on is what keeps a bomber out of them.
function land(b) {
  combat.explode({ x: b.x, z: b.z, radius: b.radius, damage: b.damage,
                   edge: B().edge, knock: B().knock,
                   selfDamage: b.damage * B().selfShare,
                   blame: 'drone bombing run' });
}

export function update(dt) {
  for (let i = shells.live.length - 1; i >= 0; i--) {
    const b = shells.live[i];
    b.t += dt;

    const k = Math.min(1, b.t / b.fall);
    b.mesh.position.set(b.x + b.off.x * (1 - k),
                        Math.max(0, b.from - 0.5 * B().gravity * b.t * b.t),
                        b.z + b.off.z * (1 - k));
    b.mesh.rotation.x += B().spin * dt;
    if (k < 1) continue;

    land(b);
    shells.release(i);
  }

  for (let i = runs.length - 1; i >= 0; i--) {
    if (step(runs[i], dt)) {
      douse(runs[i]);
      runs.splice(i, 1);
    }
  }
}

export function clear() {
  for (const r of runs) {
    douse(r);
    if (r.by.bombing === r) r.by.bombing = null;
  }
  runs.length = 0;
  shells.clear();
  lanes.clear();
}
