import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world, state } from '../core/world.js';
import { audio } from '../engine/audio.js';
import * as spit from './spit.js';
import * as boomerangs from './boomerangs.js';
import * as spikes from './spikes.js';
import * as patterns from './patterns.js';
import * as corpses from './corpses.js';
import * as walls from '../arena/walls.js';
import * as arena from '../arena/size.js';
import * as rush from './rush.js';
import * as graze from '../character/graze.js';
import { tryHop } from './hop.js';
import * as jump from './jump.js';
import { footfalls } from './stomp.js';
import * as pounce from './pounce.js';
import * as slam from './slam.js';
import * as spill from './spill.js';
import * as smallslam from './smallslam.js';
import * as fuse from './fuse.js';
import * as hurl from './hurl.js';
import * as toss from './toss.js';
import * as fling from './fling.js';
import * as gunmods from '../gunmods/index.js';
import { voiceOf } from './voice.js';
import { setFlash } from './model.js';
import { wrapPi } from '../core/geom2.js';
import { separate } from './separation.js';
import { massOf, PLAYER_MASS } from './mass.js';
import * as flinch from './flinch.js';
import { flyStep } from './flyer.js';
import { flying } from '../character/jetpack.js';
import * as evolve from './evolve.js';
import { knows, cooling, rest, slams } from './kit.js';
import { stepLegs, gaitStride, gaitRate, attackPose, bobScale } from './gait.js';
import * as horde from './horde.js';
import * as hold from './hold.js';

const _dir = new THREE.Vector3();
const _muzzle = new THREE.Vector3();
const _aimAt = new THREE.Vector3();
const _sep = new THREE.Vector3();
const _wallOut = new THREE.Vector3();
const _way = new THREE.Vector3();

const WAY_ARRIVE = 1.2;

const aimAt = (out, bug, mark) => {
  out.set(mark.pos.x - bug.pos.x, 0, mark.pos.z - bug.pos.z);
  const d = out.length();
  if (d > 0.001) out.divideScalar(d);
  return d;
};

// Where to go next to get round a wall, or nowhere when the way is already clear.
// The searching is all in here, and it is the expensive part.
function replan(bug, p) {
  if (bug.way && walls.pathClear(bug.pos.x, bug.pos.z, p.pos.x, p.pos.z, bug.radius)) {
    bug.way = null;
  }
  const showPaths = world.debug.showPaths;
  if (!bug.way && walls.detour(bug.pos.x, bug.pos.z, p.pos.x, p.pos.z,
                               bug.radius, 0.6, _way, showPaths)) {
    bug.way = { x: _way.x, z: _way.z };
    bug.path = showPaths ? walls.lastPath.map((q) => ({ x: q.x, z: q.z })) : null;
  }
  if (!bug.way) bug.path = null;
}

// Steers _dir at the next waypoint round a wall, or straight at the player when
// the way is clear. A bug that walks through walls never has one.
//
// Steering happens every frame; the search behind it does not. Walls stand still,
// so a plan a third of a second old is as good as a fresh one, and two thousand
// searches a frame was most of what routing cost.
function route(bug, p, dt) {
  if (bug.type.throughWalls) { bug.way = null; bug.path = null; return; }

  // Reaching the waypoint is the one thing that cannot wait for the next beat: a
  // bug still steering at a corner it has already turned walks circles round it.
  const arrived = bug.way
    && Math.hypot(bug.way.x - bug.pos.x, bug.way.z - bug.pos.z) < WAY_ARRIVE;
  if (arrived) bug.way = null;

  bug.plan -= dt;
  if (arrived || bug.plan <= 0) {
    bug.plan = CFG.bugAnim.replan * (0.75 + Math.random() * 0.5);
    replan(bug, p);
  }

  if (bug.way) {
    _dir.set(bug.way.x - bug.pos.x, 0, bug.way.z - bug.pos.z);
    const d = _dir.length();
    if (d > 0.001) _dir.divideScalar(d);
  }
}


function headMuzzle(bug, out) {
  const h = bug.model.parts.head;
  if (h) {
    h.updateWorldMatrix(true, false);
    out.setFromMatrixPosition(h.matrixWorld);
    return out;
  }
  const r = bug.radius * 0.9;
  return out.set(bug.pos.x + Math.sin(bug.yaw) * r,
                 (bug.model.parts.height || 1) * 0.7,
                 bug.pos.z + Math.cos(bug.yaw) * r);
}

function spitPose(bug, body, dt) {
  if (!bug.type.ranged) return;
  bug.lunge = Math.max(0, bug.lunge - dt / CFG.spit.lungeTime);
  if (bug.shown) attackPose(body, bug.windup, bug.lunge);
}

// Where the model stands. Only ever the model: `bug.pos` is the animal, and it
// keeps walking whether or not anything is drawn at the end of it.
//
// Kept true even for a bug out of frame, because it costs three writes and a
// great many things measure off it — a muzzle, a spark, a spatter. The flinch is
// not: that is a wobble, and a wobble nobody sees is worth nothing.
function place(bug, obj, dt) {
  obj.position.copy(bug.pos);
  obj.rotation.set(0, bug.yaw, 0);
  if (bug.shown) flinch.apply(bug, obj, dt);
}

// A modelled walker turns its own legs over: the clip is played at the rate that
// matches the ground it is covering, so it never skates.
function stepClips(bug, dt, speed) {
  const parts = bug.model.parts;
  const walk = parts.actions.walk;
  if (walk) walk.timeScale = speed / (parts.cruise * (bug.grow || 1));
  parts.mixer.update(dt);
}

function stepGait(bug, p, dt, speed, turned) {
  if (bug.model.parts.mixer) {
    if (bug.shown) stepClips(bug, dt, speed);
    return;
  }

  // Stride is measured on the legs it actually has: an evolved bug covers more
  // ground a step, so the same speed must turn its legs over more slowly.
  const size = bug.grow || 1;
  const wasWalk = bug.walk;
  if (bug.model.parts.rigged) {
    const walkRate = gaitRate(speed, gaitStride(bug.model.parts.reach * size));

    const turnRate = Math.abs(turned) / dt / (CFG.bugAnim.turnStride * size);
    bug.walk += Math.min(walkRate + turnRate, CFG.bugAnim.maxCycleRate) * Math.PI * 2 * dt;
  } else {
    bug.walk += (dt * speed * 2.4) / size;
  }
  const body = bug.model.parts.body;
  const baseY = body.userData.baseY !== undefined ? body.userData.baseY : 0.62;

  if (bug.model.parts.rigged) {
    if (bug.shown) {
      body.position.y = baseY
        + Math.abs(Math.sin(bug.walk)) * CFG.bugAnim.bodyBob * bobScale(bug.type);
      stepLegs(bug.model.parts.legs, bug.walk, bug.model.object.quaternion,
               bug.model.parts.hip);
      if (bug.type.stomp) footfalls(bug, wasWalk);
    }
    spitPose(bug, body, dt);

    if (bug.fireNow) {
      bug.fireNow = false;
      headMuzzle(bug, _muzzle);
      if (bug.type.projectile === 'boomerang') {
        boomerangs.release(bug, p);
      } else if (bug.type.projectile === 'spikes') {
        spikes.summon(world.player.pos.x, world.player.pos.z,
                      { grow: evolve.spikeMult(bug), yaw: bug.yaw,
                        hurt: evolve.hit(bug, CFG.spikes.damage),
                        kind: patterns.pick(bug.level), by: bug });
      } else {
        spit.fire(_muzzle, bug, p);
      }
    }
  } else if (bug.shown) {
    body.position.y = baseY + Math.sin(bug.walk * 2) * CFG.bugAnim.fallbackBob * bobScale(bug.type);
    for (const leg of bug.model.parts.legs) {
      leg.rotation.x = Math.sin(bug.walk + leg.userData.phase) * 0.6;
    }
  }
}

// Not separate(), which is the soft shove bugs give each other every frame.
function pushOut(bug, cx, cz, min) {
  const dx = bug.pos.x - cx, dz = bug.pos.z - cz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= min * min) return;
  if (d2 > 1e-6) {
    const d = Math.sqrt(d2);
    bug.pos.x = cx + (dx / d) * min;
    bug.pos.z = cz + (dz / d) * min;
  } else {
    // Dead centre there is no axis to normalise, so it backs off as it faces.
    bug.pos.x = cx - Math.sin(bug.yaw) * min;
    bug.pos.z = cz - Math.cos(bug.yaw) * min;
  }
}

function pushOutOfCorpses(bug) {
  const blk = CFG.bugDeath.block;
  if (blk <= 0) return;
  for (const c of world.corpses) {
    pushOut(bug, c.pos.x, c.pos.z, (bug.radius + c.radius * blk) * corpses.occupancy(c));
  }
}

// Both bodies give ground, split by mass the way two bugs split theirs: the
// player carves a grunt out of the way and is shouldered aside by the boss.
function pushOffPlayer(bug, p) {
  if (flying(p)) return;
  const min = bug.radius + CFG.player.radius;
  let dx = bug.pos.x - p.pos.x, dz = bug.pos.z - p.pos.z;
  const d2 = dx * dx + dz * dz;
  if (d2 >= min * min) return;

  let d = Math.sqrt(d2);
  if (d < 1e-3) { dx = -Math.sin(bug.yaw); dz = -Math.cos(bug.yaw); d = 1; }

  const over = min - d;
  const nx = dx / d, nz = dz / d;
  const mine = massOf(bug.type) * Math.pow(bug.grow || 1, CFG.bugAnim.massExp);
  const yields = PLAYER_MASS / (mine + PLAYER_MASS);

  bug.pos.x += nx * over * yields;
  bug.pos.z += nz * over * yields;
  p.pos.x -= nx * over * (1 - yields);
  p.pos.z -= nz * over * (1 - yields);
  arena.confine(p.pos, CFG.player.radius, 0.6);
}

// The last word on where a body ended up. Only the walls hold a bug in otherwise,
// and the arena's rim is not one of them, so a crowd shoving itself apart at the
// edge would walk the outside ones off the map. The limit is read before the step
// rather than after: a body already out there, thrown by a blast, is allowed to
// be where it is and simply cannot get further out.
function holdInRing(bug, lim) {
  const d = Math.hypot(bug.pos.x, bug.pos.z);
  if (d > lim) { bug.pos.x *= lim / d; bug.pos.z *= lim / d; }
}

function faceTarget(bug, p, dt) {
  let wantYaw = Math.atan2(_dir.x, _dir.z);
  if (bug.rush) wantYaw = Math.atan2(p.pos.x - bug.pos.x, p.pos.z - bug.pos.z);
  if (bug.type.ranged && (bug.windup > 0 || bug.lunge > 0 || bug.fireNow)) {
    if (bug.type.projectile === 'boomerang' || bug.type.projectile === 'spikes') _aimAt.copy(p.pos);
    else spit.predict(_aimAt, p);
    const ax = _aimAt.x - bug.pos.x, az = _aimAt.z - bug.pos.z;
    if (ax * ax + az * az > 0.04) wantYaw = Math.atan2(ax, az);
  }
  if (!bug.yawSet) { bug.yaw = wantYaw; bug.yawSet = true; }
  const maxTurn = (bug.type.turnRate || CFG.bugAnim.turnRate) * dt;
  const turned = Math.max(-maxTurn, Math.min(maxTurn, wrapPi(wantYaw - bug.yaw)));
  bug.yaw += turned;
  return turned;
}

// Everything an animal can do that owns the frame while it runs. The first one
// to take it wins: a bug is only ever doing one thing.
function specials(bug, p, dist, dt, held) {
  // Before everything else and past `held`: a lit bomber has already committed,
  // and nothing it might have been doing outranks going off.
  if (bug.type.fuse && fuse.update(bug, dist, dt)) return true;
  if (bug.type.leap && pounce.update(bug, p, dist, dt)) return true;
  if (bug.type.slam && knows(bug, 'slam') && slams(bug)
      && slam.update(bug, dist, dt, held)) return true;
  if (bug.type.spill && knows(bug, 'spill') && spill.update(bug, dist, dt, held)) return true;
  if (bug.type.smallSpill && spill.update(bug, dist, dt, held, spill.SMALL)) return true;
  if (bug.type.smallSlam && smallslam.update(bug, dist, dt, held)) return true;
  if (bug.type.hurl && hurl.update(bug, dist, dt, held)) return true;
  if (bug.type.toss && toss.update(bug, dist, dt, held)) return true;
  if (bug.type.fling && fling.update(bug, dist, dt, held)) return true;
  return false;
}

export function step(bug, p, dt) {
  if (bug.dummy) return true;
  if (bug.type.fly) return flyStep(bug, p, dt);
  const obj = bug.model.object;

  const dist = aimAt(_dir, bug, p);

  if (bug.rider) {
    if (!bug.rider.rush || bug.rider.hp <= 0) { bug.rider = null; rush.unseat(bug); }
    else return true;
  }

  if (fling.airborne(bug, dt)) return true;
  if (jump.airborne(bug, dt)) return true;

  const S = bug.type.ranged ? CFG[bug.type.attack || 'spit'] : null;

  const gait = bug.model.parts.rigged ? (bug.type.hop || CFG.bugAnim.hop) : null;
  const hops = !!gait;

  // No place in the pack: it is not fighting anybody, only walking back to the
  // ground it holds and milling about on it. See bug/horde.js.
  const holding = !bug.chase && !horde.committed(bug);
  let goal = p;
  if (holding) { goal = hold.markOf(bug, dt); aimAt(_dir, bug, goal); }
  else if (bug.roam) hold.release(bug);

  route(bug, goal, dt);

  separate(bug, _sep);

  const glow = bug.shown ? bug.model.parts.glow : null;
  if (glow) {
    const G = bug.type.glow;
    bug.pulse += dt * G.rate;
    const k = Math.sin(bug.pulse) ** 2;
    glow.material.opacity = G.min + (1 - G.min) * k;
    glow.scale.setScalar(bug.model.parts.span * G.size * (0.82 + 0.32 * k));
  }

  if (bug.flash > 0) {
    bug.flash -= dt;
    if (bug.flash <= 0) setFlash(bug, false);
  }

  if (world.debug.freezeBugs) { obj.position.copy(bug.pos); return true; }

  // One at a time: each of these owns the frame while it runs, so a second one
  // started underneath would freeze the first half-finished. Only starting is
  // held back — whatever is already running still gets its frame. The beat an
  // animal owes after one ends is held the same way, refreshed for as long as
  // anything is running and spent once nothing is.
  const busy = !!(bug.leap || bug.slam || bug.jab || bug.hurl || bug.toss
                  || bug.spill || bug.douse || bug.rush || bug.fling);
  if (busy) bug.rest = rest(bug);
  else if (bug.rest > 0) bug.rest = Math.max(0, bug.rest - dt);
  const held = busy || bug.rest > 0;

  if (!holding && specials(bug, p, dist, dt, held)) return state.mode === 'playing';

  if (state.mode !== 'playing') return false;

  // Anything the player's guns have hung on this body drags on it here, so the
  // legs turn over at the speed it is actually making rather than the speed it
  // was born with.
  let speed = bug.speed * (1 - gunmods.slowOn(bug));

  const CH = bug.type.charge ? rush.chargeOf(bug) : null;
  if (CH && bug.rush && bug.rush.phase === 'run') {
    const over = rush.runRush(bug, CH, dt, p);
    place(bug, obj, dt);
    if (!over) rush.seatRiders(bug, dt);
    else { graze.settle(bug.rush); rush.endRush(bug); }

    stepGait(bug, p, dt, CH.speed, 0);
    return true;
  }

  // Called up to ride: it breaks off whatever it was doing and runs at the
  // host, otherwise the tank rolls away with an empty back.
  let boarding = false;
  if (bug.board) {
    const h = bug.board;
    const gap = Math.hypot(h.pos.x - bug.pos.x, h.pos.z - bug.pos.z);
    if (!h.rush || h.rush.phase !== 'gather' || h.hp <= 0) {
      bug.board = null;
    } else if (gap < h.radius + bug.radius + CFG.bugAnim.mountReach
               && h.rush.riders.length < evolve.riders(h)) {
      rush.mount(h, bug);
      bug.board = null;
      bug.repos = null;
      return true;
    } else {
      boarding = true;
      bug.repos = null;
      _dir.set(h.pos.x - bug.pos.x, 0, h.pos.z - bug.pos.z).divideScalar(gap || 1);
    }
  }

  let moving = !hops;
  if (bug.hopWait > 0) bug.hopWait -= dt;
  const reach = bug.radius + CFG.player.radius + CFG.bugAnim.biteReach;

  const gathering = !!(CH && bug.rush);
  if (CH && !bug.rush && !held && !holding) rush.maybeStart(bug, CH, dt, dist, p, _dir);
  else if (gathering) {
    rush.tickGather(bug, CH, dt, p);
    moving = false;
  }

  // Called in to be thrown: answered the same way as a call aboard, since it is
  // the same thing — drop everything and run at the tank.
  if (!boarding) boarding = fling.steer(bug, _dir);

  if (boarding) moving = true;

  if (!boarding && !holding && S && bug.model.parts.rigged) {
    bug.spitCd -= dt;

    const band = evolve.rangeMult(bug);
    // Backing off is for something that can bite you. A machine hanging over
    // the field cannot, so nothing keeps its distance from one: it is shot at
    // from wherever the bug happens to be standing.
    const keeps = S.keeps && !p.drone;
    const tooClose = !p.drone && dist < S.minRange * band;
    const inBand = dist < S.range * band && (keeps || !tooClose);

    if (hops && keeps && tooClose) {
      bug.windup = 0;
      const opening = bug.repos &&
        Math.hypot(bug.repos.x - p.pos.x, bug.repos.z - p.pos.z) > dist;
      if (!opening) tryHop(bug, p, gait, S, 'flee');
    } else if (inBand) {
      moving = false;
      if (bug.windup > 0) {
        bug.windup -= dt;
        if (bug.windup <= 0) {
          bug.fireNow = true;
          bug.spitCd = S.cooldown * (0.8 + Math.random() * 0.4);
          bug.lunge = 1;

          if (hops && keeps) tryHop(bug, p, gait, S, 'band');
        }
      } else if (bug.spitCd <= 0) {
        bug.windup = S.windup;
      }
    } else if (dist >= S.range * band) {
      bug.windup = 0;
      if (hops && !bug.repos) tryHop(bug, p, gait, S, 'close', 'any');
    } else {
      bug.windup = 0;
      if (hops && !bug.repos && (bug.way || dist > reach)) {
        tryHop(bug, p, gait, S, 'close', 'any');
      }
    }
  } else if (hops && !gathering && !bug.repos
             && (bug.board || bug.haul || bug.way || dist > reach)) {
    tryHop(bug, goal, gait, null, 'close', 'any');
  }

  if (bug.repos) {
    bug.reposT -= dt;
    const rx = bug.repos.x - bug.pos.x, rz = bug.repos.z - bug.pos.z;
    const rd = Math.hypot(rx, rz);
    if (rd < 0.8 || bug.reposT <= 0) {
      bug.repos = null;
    } else {
      _dir.set(rx / rd, 0, rz / rd);
      if (!hops) moving = true;
      else {
        const off = wrapPi(Math.atan2(_dir.x, _dir.z) - bug.yaw);
        moving = Math.abs(off) <= gait.align;
      }
    }
  }

  if (!moving) speed = 0;

  const lim = arena.limitFor(bug.pos.x, bug.pos.z, bug.radius);
  bug.pos.addScaledVector(_dir, speed * dt);
  bug.pos.addScaledVector(_sep, CFG.bugAnim.separationPush * dt);
  bug.pos.addScaledVector(bug.knock, dt);
  bug.knock.multiplyScalar(Math.exp(-CFG.bugAnim.knockDecay * dt));

  if (!bug.type.throughWalls && walls.push(bug.pos.x, bug.pos.z, bug.radius, _wallOut)) {
    bug.pos.x = _wallOut.x; bug.pos.z = _wallOut.z;
  }

  pushOutOfCorpses(bug);
  pushOffPlayer(bug, world.player);
  holdInRing(bug, lim);

  const turned = faceTarget(bug, goal, dt);
  place(bug, obj, dt);

  stepGait(bug, p, dt, speed, turned);

  bug.attackCd -= cooling(bug, dt);
  if (dist < reach && bug.attackCd <= 0) {
    // A machine is taken out of the air or not at all: what an animal cannot
    // reach, standing or leaping, it is simply left alone by.
    if (p.drone && !jump.able(bug, p)) return true;
    // Whatever it came for takes the bite. A drone is not flesh and has no
    // grace window: it is simply worn down.
    if (p.drone) jump.strike(bug, p, bug.damage);
    else {
      audio.playAt('bugAttack', bug.pos.x, bug.pos.z, voiceOf(bug.type));
      world.hooks.damagePlayer(bug.damage, { from: bug, ground: true });
    }
    bug.attackCd = bug.attackGap;
    // Added, never assigned: a bug lunging in has to keep whatever is already
    // shoving it, or a point-blank shell is erased by the bite it provokes.
    bug.knock.addScaledVector(_dir, CFG.bugAnim.biteKnock);
    if (state.mode !== 'playing') return false;
  }

  return true;
}
