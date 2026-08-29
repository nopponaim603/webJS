import * as THREE from 'three';
import { CFG } from '../config/index.js';
import * as evolve from './evolve.js';
import { knows, cooling } from './kit.js';
import * as modules from '../modules/index.js';
import { world } from '../core/world.js';
import { audio } from '../engine/audio.js';
import * as walls from '../arena/walls.js';
import { shakeAt } from '../engine/view.js';
import * as lane from '../fx/lane.js';
import * as bugmodel from './model.js';
import { segDist2, wrapPi } from '../core/geom2.js';
import { burst } from './stomp.js';
import * as drone from '../allies/drone.js';
import * as graze from '../character/graze.js';
import * as dodge from '../character/dodge.js';
import { pour } from './spit.js';
import { between } from '../core/rng.js';
import * as arena from '../arena/size.js';
import { aloft } from '../character/jetpack.js';

const _seat = new THREE.Vector3();
const _box = new THREE.Box3();

// Seats are laid out across the back it actually has: the rows are spread over
// the host's own length, so a full load rides on it however big it has grown.
function seatAt(host, i, riders, out) {
  const S = CFG.rush.seat;
  const r = host.radius;
  const rows = Math.max(1, Math.ceil(riders / 2));
  const along = rows > 1 ? Math.floor(i / 2) / (rows - 1) : 0;

  const lat = ((i % 2) * 2 - 1) * r * S.lat * (riders > 1 ? 1 : 0);
  const fwd = r * (S.fwd + (S.back - S.fwd) * along);
  const s = Math.sin(host.yaw), c = Math.cos(host.yaw);
  out.set(host.pos.x + s * fwd + c * lat, 0, host.pos.z + c * fwd - s * lat);
  return out;
}

// Which charge is running. A species may carry more than one — the boss has a
// dry one and a wet one — and the pick is held for as long as the run lasts.
export const chargeOf = (bug) => CFG[bug.charging || firstCharge(bug.type)];

const firstCharge = (type) =>
  (Array.isArray(type.charge) ? type.charge[0] : type.charge);

const rollCharge = (bug) => {
  const learnt = [].concat(bug.type.charge || []).filter((k) => knows(bug, k));
  const open = learnt.length ? learnt : [firstCharge(bug.type)];
  return open[(Math.random() * open.length) | 0];
};

export function mount(host, bug) {
  const S = chargeOf(host).seat;
  bug.seat = host.rush.riders.length;
  host.rush.riders.push(bug);
  bug.rider = host;
  bug.climb = { t: 0, dur: S.climb, x: bug.pos.x, z: bug.pos.z, yaw: bug.yaw };
}

export function unseat(bug) {
  bug.climb = null;
  bug.pos.y = 0;
  bug.model.object.rotation.x = 0;
}

// Measured off the carapace itself, once a charge starts: parts.height is a
// figure the model was built around, not where the shell actually tops out.
function backOf(host) {
  if (host.rush.back === undefined) {
    host.model.object.updateWorldMatrix(true, true);
    _box.setFromObject(host.model.parts.body || host.model.object);
    host.rush.back = Math.max(0.1, _box.max.y - host.pos.y);
  }
  return host.rush.back;
}

export function seatRiders(host, dt) {
  const S = chargeOf(host).seat;
  const lift = backOf(host) * S.lift;
  const riders = host.rush.riders.length;
  for (const r of host.rush.riders) {
    seatAt(host, r.seat, riders, _seat);
    const c = r.climb;

    if (c) {
      c.t += dt;
      const k = Math.min(1, c.t / c.dur);
      const e = k * k * (3 - 2 * k);
      r.pos.set(c.x + (_seat.x - c.x) * e, lift * e + Math.sin(Math.PI * k) * S.arc,
                c.z + (_seat.z - c.z) * e);
      r.yaw = c.yaw + wrapPi(host.yaw - c.yaw) * e;
      r.model.object.rotation.x = -Math.sin(Math.PI * k) * S.pitch;
      if (k >= 1) { r.climb = null; r.model.object.rotation.x = 0; }
    } else {
      r.pos.set(_seat.x, lift, _seat.z);
      r.yaw = host.yaw;
    }

    r.model.object.position.copy(r.pos);
    r.model.object.rotation.y = r.yaw;
  }
}

function ejectRiders(host) {
  if (!host.rush) return;
  const R = chargeOf(host);
  const heading = Math.atan2(host.rush.dir.x, host.rush.dir.z);
  for (const r of host.rush.riders) {
    r.rider = null;
    unseat(r);

    const a = heading + (Math.random() * 2 - 1) * R.ejectSpread;
    r.knock.set(Math.sin(a), 0, Math.cos(a)).multiplyScalar(R.eject * (0.6 + Math.random() * 0.7));

    r.repos = null;
    r.hopWait = 0;
  }
  host.rush.riders.length = 0;
}

export function endRush(bug) {
  const R = chargeOf(bug);
  ejectRiders(bug);
  graze.forget(bug.rush);

  lane.fade(bug.rush.lane);
  bug.rush = null;
  bug.rushCd = R.cooldown * (0.8 + Math.random() * 0.4);
}

function callRiders(host, R) {
  let room = evolve.riders(host) - host.rush.riders.length;
  for (const b of world.bugs) if (b.board === host) room--;
  if (room <= 0) return;
  for (const o of world.bugs) {
    if (room <= 0) break;
    if (o === host || o.rider || o.board) continue;
    if (bugmodel.spanOf(o.type) >= R.maxRiderLength) continue;
    if (Math.hypot(o.pos.x - host.pos.x, o.pos.z - host.pos.z) > R.call) continue;
    o.board = host;
    room--;
  }
}

export function runRush(bug, R, dt, p) {
  bug.rush.t -= dt;
  const step = R.speed * dt;
  const nx = bug.pos.x + bug.rush.dir.x * step;
  const nz = bug.pos.z + bug.rush.dir.z * step;

  bug.rush.dust -= dt;
  if (bug.rush.dust <= 0) {
    bug.rush.dust = R.dust.every;
    const side = (Math.random() * 2 - 1) * bug.radius;
    lane.dust(bug.pos.x - bug.rush.dir.x * bug.radius - bug.rush.dir.z * side,
            bug.pos.z - bug.rush.dir.z * bug.radius + bug.rush.dir.x * side,
            -bug.rush.dir.x, -bug.rush.dir.z, R.dust, bug.radius);
  }
  bug.rush.step -= dt;
  if (bug.rush.step <= 0) {
    bug.rush.step = R.dust.step;
    audio.playAt('hit', bug.pos.x, bug.pos.z, { rate: 0.42, gainScale: 0.7 });
  }

  // A charge is shoulder-high and stays on the floor. Someone off the ground is
  // not in the way of it: it takes nothing from them and loses nothing to them,
  // and runs on underneath. What is taller than the flight is not shrugged off
  // that way, and says so with `hitsAloft`.
  const reach = bug.radius + CFG.player.radius;
  const misses = aloft(p) && !R.hitsAloft;
  const near2 = segDist2(bug.pos.x, bug.pos.z, nx, nz, p.pos.x, p.pos.z);
  if (!misses && !p.drone) {
    graze.sweep(bug.rush, Math.sqrt(near2), reach, { from: bug });
    dodge.sweeping(bug.rush, Math.hypot(bug.pos.x - p.pos.x, bug.pos.z - p.pos.z), bug);
  }
  if (!misses && near2 < reach * reach) {
    const hurt = R.share ? evolve.share(bug, R.share) : evolve.hit(bug, R.damage);
    if (p.drone) drone.damage(p, hurt, true);
    else world.hooks.damagePlayer(hurt, { from: bug });
    audio.playAt('bugAttack', bug.pos.x, bug.pos.z, { rate: 0.5, gainScale: 1.3 });
    bug.pos.set(nx, 0, nz);
    crash(bug, R);
    return true;
  }

  const hit = bug.type.throughWalls
    ? -1 : walls.blocks(bug.pos.x, bug.pos.z, nx, nz, bug.radius);
  if (hit >= 0) {
    bug.pos.x += bug.rush.dir.x * step * hit;
    bug.pos.z += bug.rush.dir.z * step * hit;
    audio.playAt('explode', bug.pos.x, bug.pos.z, { rate: 0.55, gainScale: 0.55 });
    crash(bug, R);
    return true;
  }

  const lim = arena.limitFor(bug.pos.x, bug.pos.z, bug.radius);
  if (Math.hypot(nx, nz) > lim) { crash(bug, R); return true; }

  bug.pos.set(nx, 0, nz);
  shoveAside(bug, R);

  bug.rush.gone += step;
  // A wet charge lays its own ground behind it, as wide as the lane it drew.
  if (R.acid && bug.rush.gone >= bug.rush.wet) {
    bug.rush.wet += bug.radius * R.acid.step;
    pour(bug.pos.x, bug.pos.z, {
      grow: (bug.radius * R.acid.wide) / CFG.spit.pool.radius,
      blobs: R.acid.blobs, tick: R.acid.tick,
      burn: evolve.share(bug, R.acid.burn), life: between(R.acid.life),
    });
  }

  if (bug.rush.gone >= R.distance * evolve.rangeMult(bug)) return true;

  return bug.rush.t <= 0;
}

function shoveAside(bug, R) {
  for (const o of world.bugs) {
    if (o === bug || o.rider) continue;
    const dx = o.pos.x - bug.pos.x, dz = o.pos.z - bug.pos.z;
    const min = bug.radius + o.radius;
    const d2 = dx * dx + dz * dz;
    if (d2 >= min * min) continue;
    let ux, uz;
    if (d2 > 1e-6) { const d = Math.sqrt(d2); ux = dx / d; uz = dz / d; } else {
      ux = -bug.rush.dir.z; uz = bug.rush.dir.x;
    }
    o.pos.x = bug.pos.x + ux * min;
    o.pos.z = bug.pos.z + uz * min;
    o.knock.set(ux, 0, uz).multiplyScalar(R.shove);
  }
}

function crash(bug, R) {
  const I = R.impact;
  shakeAt(bug.pos.x, bug.pos.z, R.shake.power, R.shake.range);
  if (R.burst) burst(bug.pos.x, bug.pos.z, bug.radius * R.burst.reach, R.burst);
  for (let k = 0; k < I.count; k++) {
    const a = Math.atan2(bug.rush.dir.x, bug.rush.dir.z) + (Math.random() * 2 - 1) * 1.9;
    lane.dust(bug.pos.x, bug.pos.z, Math.sin(a), Math.cos(a),
            { ...R.dust, size: I.size, speed: I.speed }, bug.radius);
  }
}

// The whole run, cut where it will actually stop: at the ring, or at the wall
// it is going to hit.
function laneReach(bug, R) {
  const d = bug.rush.dir;
  const full = R.distance * evolve.rangeMult(bug);
  const ring = arena.roomTo(bug.pos.x, bug.pos.z, d.x, d.z, bug.radius);

  const reach = Math.min(full, ring);
  if (bug.type.throughWalls) return reach;

  const wall = walls.blocks(bug.pos.x, bug.pos.z,
                            bug.pos.x + d.x * reach, bug.pos.z + d.z * reach, bug.radius);
  return wall >= 0 ? reach * wall : reach;
}

export function tickGather(bug, R, dt, p) {
  bug.rush.t -= dt;
  callRiders(bug, R);
  seatRiders(bug, dt);

  bug.rush.dir.set(Math.sin(bug.yaw), 0, Math.cos(bug.yaw));
  lane.aim(bug.rush.lane, bug.pos.x, bug.pos.z, bug.rush.dir.x, bug.rush.dir.z,
           1 - Math.max(0, bug.rush.t) / bug.rush.dur, laneReach(bug, R));

  bug.rush.dust -= dt;
  if (bug.rush.dust <= 0) {
    bug.rush.dust = R.dust.every * 4;
    const a = Math.random() * Math.PI * 2;
    lane.dust(bug.pos.x + Math.cos(a) * bug.radius,
              bug.pos.z + Math.sin(a) * bug.radius,
              Math.cos(a), Math.sin(a), R.dust, bug.radius * 0.5);
  }

  if (bug.rush.t <= 0) {
    bug.rush.phase = 'run';
    bug.rush.t = R.time;

    audio.playAt('launch', bug.pos.x, bug.pos.z, { rate: 0.5, gainScale: 1.2 });
    for (const r of world.bugs) if (r.board === bug) r.board = null;
  }
}

// Started on demand, whatever the range: the cooldown and the line of sight are
// the caller's business, not this one's.
export function begin(bug, R, dir) {
  const dur = R.gather[0] + Math.random() * (R.gather[1] - R.gather[0]);
  // A charge that crosses the arena and comes through the walls is not
  // something to hide behind a purchase: `alwaysWarn` draws the lane whether or
  // not the augur has been bought.
  bug.rush = { phase: 'gather', t: dur, dur, dir: dir.clone(), riders: [],
               lane: R.alwaysWarn || modules.sees('attacks')
                 ? lane.claim(bug.radius * 2) : -1,
               dust: 0, step: 0, gone: 0, wet: 0 };
  bug.repos = null;
  audio.playAt('bugAttack', bug.pos.x, bug.pos.z, { rate: 0.6 });
}

export function maybeStart(bug, R, dt, dist, p, dir) {
  bug.rushCd -= cooling(bug, dt);

  if (bug.rushCd > 0 || dist <= R.minRange || dist >= R.distance * evolve.rangeMult(bug)) return;
  if (!bug.type.throughWalls
      && !walls.pathClear(bug.pos.x, bug.pos.z, p.pos.x, p.pos.z, bug.radius)) return;

  bug.charging = rollCharge(bug);
  begin(bug, chargeOf(bug), dir);
}
