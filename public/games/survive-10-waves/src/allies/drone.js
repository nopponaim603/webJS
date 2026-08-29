import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world, state } from '../core/world.js';
import { scene } from '../engine/view.js';
import { audio } from '../engine/audio.js';
import * as beam from './dronebeam.js';
import * as fx from '../fx/spatter.js';
import * as arena from '../arena/size.js';
import * as modules from '../modules/index.js';
import * as jetpack from '../character/jetpack.js';
import { claim, safe } from './danger.js';
import * as singularity from './singularity.js';
import * as bombrun from './dronebomb.js';
import * as model from './dronemodel.js';
import * as swarm from './swarm.js';
import * as ledger from '../game/ledger.js';
import { between } from '../core/rng.js';
import { say, lamp, guard, face, bank } from './dronevoice.js';
import * as effects from '../items/effects.js';

// Kept clear of the walls it flies over rather than pinned to a number of its
// own: raise the walls and the drones rise with them. A player on the jetpack is
// flown with rather than looked down on, so the flight climbs to their altitude
// and never drops below the wall tops to meet them on the way down.
const flyAt = () => Math.max(CFG.walls.height * CFG.drone.overWall,
                             jetpack.altitude(world.player));

// The config numbers with the bench's own on top, read once a frame: nothing
// below has to know which of the two a number came from.
const kit = () => ({ ...CFG.drone,
                     hp: modules.droneHealth(),
                     speed: modules.droneSpeed(),
                     damage: modules.droneDamage(),
                     range: modules.droneRange(),
                     fireGap: modules.droneFireGap(),
                     retain: modules.dronePierce(),
                     arcs: modules.droneArcs() });

// Two rates that do not divide into each other, so the rise and fall never
// settles into a metronome — and deeper with nothing to shoot, since holding a
// firing line is the only time it bothers to hold an altitude.
const riseAt = (bob, drift, D, busy = false) => flyAt()
  + (Math.sin(bob) + Math.sin(bob * 0.41 + drift)) * D.bob * (busy ? 1 : D.bobIdle);

const _to = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _muzzle = new THREE.Vector3();
const _sep = new THREE.Vector3();
const _shy = new THREE.Vector3();
const zones = [];

const live = [];

export const count = () => live.length;
export const list = () => live;

// `slot` is the machine's place in the flight, which is what its health is kept
// against between waves; a machine spawned outside that — the debug menu's — has
// no slot and nothing is written down for it. `idle` is the debug menu's too: a
// machine that holds its air and does nothing at all, so what the field does
// about a hovering drone can be watched on its own.
export function add(idle = false, slot = -1, entry = false) {
  const D = kit();
  const parts = model.build();
  const grow = modules.droneScale();
  parts.object.scale.setScalar(grow);
  scene.add(parts.object);
  // Spread round whatever they gather on, rather than every machine taking the
  // same bearing and flying as one.
  const a = (live.length / Math.max(1, live.length + 1)) * Math.PI * 2 + Math.random();
  const bob = Math.random() * 10;
  const drift = Math.random() * 10;
  // Called up from off the board comes in over the edge of the floor; everything
  // else is simply handed over where the player is standing.
  const bearing = Math.random() * Math.PI * 2;
  const far = arena.radius() + CFG.drone.arrive.out;
  const x = entry ? Math.cos(bearing) * far : world.player.pos.x;
  const z = entry ? Math.sin(bearing) * far : world.player.pos.z;
  live.push({ ...parts, drone: true, hp: D.hp, hpMax: D.hp, radius: D.size * 1.7 * grow, level: 0,
              voidCd: 0, bombCd: 0, bombing: null, idle, slot,
              arrive: entry ? CFG.drone.arrive.circle : 0,
              pos: new THREE.Vector3(x, riseAt(bob, drift, D), z),
              vel: new THREE.Vector3(), orbit: a, bob,
              spot: new THREE.Vector3(world.player.pos.x, flyAt(), world.player.pos.z),
              cd: 0, pitch: 0, roll: 0, target: null, near: 0, turn: 0,
              look: a, drift,
              watch: between(D.watch), leaving: 0,
              // Staggered, so four called up together do not all report in on
              // the same frame.
              mutter: entry ? Math.random() * 0.8 : between(D.voice.idleEvery) });
  return live[live.length - 1];
}

// Machines an item called up rather than the bench bought: no slot, so nothing
// about them is written down and nothing about them is carried to the next wave.
export function callIn(n, entry = false) {
  const made = [];
  for (let i = 0; i < n; i++) made.push(add(false, -1, entry));
  if (made.length) audio.play('droneArrive');
  return made;
}

// Their time is up. Not drop(): nothing broke, so they climb out of the fight
// rather than being blown out of it.
export function dismiss(flight) {
  for (const d of flight) if (d.leaving <= 0) d.leaving = CFG.drone.leave.time;
}

function depart(dt) {
  const L = CFG.drone.leave;
  for (let i = live.length - 1; i >= 0; i--) {
    const d = live[i];
    if (d.leaving <= 0) continue;
    d.leaving -= dt;
    d.pos.y += L.climb * dt;
    d.object.position.copy(d.pos);
    d.object.rotation.y += L.spin * dt;
    if (d.leaving > 0) continue;
    scene.remove(d.object);
    live[i] = live[live.length - 1];
    live.pop();
  }
}

// Crossing in and taking station. It flies a lap of the player before it looks
// for anything to shoot, and the lap only starts counting once it has caught up
// — a machine still out over the edge has not arrived yet.
function arrive(d, D, dt) {
  const A = CFG.drone.arrive;
  const p = world.player.pos;
  d.orbit += A.spin * dt;
  if (Math.hypot(d.pos.x - p.x, d.pos.z - p.z) < A.ring * 1.4) d.arrive -= dt;

  _to.set(p.x + Math.cos(d.orbit) * A.ring, flyAt(), p.z + Math.sin(d.orbit) * A.ring);
  const dx = _to.x - d.pos.x, dy = _to.y - d.pos.y, dz = _to.z - d.pos.z;
  const len = Math.hypot(dx, dy, dz) || 1;
  const step = Math.min(len, A.speed * dt);
  d.pos.x += (dx / len) * step;
  d.pos.y += (dy / len) * step;
  d.pos.z += (dz / len) * step;

  d.mutter -= dt;
  if (d.mutter <= 0) {
    d.mutter = between(A.every);
    say(d, A.cue);
  }

  d.object.position.copy(d.pos);
  face(d, Math.atan2(dx, dz), D.aimTurn, dt);
  bank(d, D, dt);
  lamp(d, D, dt);
}

// The nearest one to a patch of ground, for anything deciding what to go for.
export function nearest(x, z) {
  let best = null, near = Infinity;
  for (const d of live) {
    if (d.leaving > 0) continue;
    const far = Math.hypot(d.pos.x - x, d.pos.z - z);
    if (far >= near) continue;
    near = far;
    best = d;
  }
  return best;
}

function drop(d) {
  const at = live.indexOf(d);
  if (at < 0) return;
  if (d.slot >= 0) ledger.droneLost();
  fx.sparks(d.pos, 12);
  audio.playAt('explode', d.pos.x, d.pos.z, { rate: 1.5, gainScale: 0.5 });
  scene.remove(d.object);
  live[at] = live[live.length - 1];
  live.pop();
}

// Broken rather than killed: it is a machine, and what is left of it is not a
// corpse for anything to climb over. Nothing with a mouth reaches it mid-run:
// the pass is flown through the crowd on purpose, and a machine that could be
// bitten out of the sky for it would never finish one.
export function damage(d, amount, melee = false) {
  if (melee && d.bombing) return;
  // The Aegis covers the whole flight, not only the pilot: a wave that hands one
  // out is buying the machines through the same push it buys the player through.
  if (effects.covered(world.player) > 0) return;
  fx.sparks(d.pos, 2);
  // The debug menu's machine takes the hit and shrugs it off: it is there to be
  // swung at for as long as you care to watch, not to be broken. One on its way
  // out is past being shot at.
  if (d.idle || d.leaving > 0) return;

  d.hp -= modules.droneTaken(amount, d.near);
  keep(d);
  if (d.hp <= 0) drop(d);
  else say(d, 'Hurt');
}

// Put back together, up to whatever plating it is carrying and no further.
// Answers what it actually took, which is what the floater over it reads.
export function mend(d, amount) {
  const room = d.hpMax - d.hp;
  if (room <= 0 || d.hp <= 0) return 0;

  const gain = Math.min(room, amount);
  d.hp += gain;
  keep(d);
  return gain;
}

// What it has left, written against its place in the flight so the next wave
// hands it back. Nothing left is nothing written: a broken machine is replaced
// rather than repaired, and flies out whole.
function keep(d) {
  if (d.slot >= 0) state.droneHp[d.slot] = Math.max(0, Math.round(d.hp));
}

export function clear() {
  for (const d of live) scene.remove(d.object);
  live.length = 0;
}

// The nearest bug it can see, cover or no cover: a drone shoots over the walls it
// flies over, so a wall between it and a bug is not a reason to pass the bug by.
// It looks `seek` times further than it can shoot and flies the difference — the
// gun's reach is what it fires at, not what it goes looking through.
// A bug another drone has already taken is passed over while anything else is
// on offer, so a flight spreads across the field instead of stacking on one.
function pick(d, D, taken) {
  const seen = D.range * D.seek;
  let best = null, near = seen * seen;
  let spare = null, spareNear = seen * seen;

  for (const bug of world.bugs) {
    if (bug.dummy) continue;
    const dx = bug.pos.x - d.pos.x, dz = bug.pos.z - d.pos.z;
    const far = dx * dx + dz * dz;
    if (far > near && far > spareNear) continue;

    if (taken.has(bug)) {
      if (far >= spareNear) continue;
      spareNear = far;
      spare = bug;
      continue;
    }
    if (far >= near) continue;
    near = far;
    best = bug;
  }
  return best || spare;
}

// No two share a berth. Checked when a station is chosen, so they spread of
// their own accord rather than being shoved apart after the fact.
// Room round every animal on the field, whether or not it is the one being
// shot at: the engagement ring already sits outside biting distance, so this
// only ever rejects ground it had no business hovering over.
function clearOfBugs(x, z, mind) {
  for (const bug of world.bugs) {
    if (bug.dummy) continue;
    if (Math.hypot(bug.pos.x - x, bug.pos.z - z) < bug.radius + mind) return false;
  }
  return true;
}

// Against where the others are AND where they are headed. Checking bodies
// alone lets a whole flight claim the same patch — it is empty at the moment
// each of them looks — and they only discover it once they arrive.
function clearOfKin(self, x, z, apart) {
  for (const o of live) {
    if (o === self) continue;
    if (Math.hypot(o.pos.x - x, o.pos.z - z) < apart) return false;
    if (Math.hypot(o.spot.x - x, o.spot.z - z) < apart) return false;
  }
  return true;
}

const room = (x, z) => zones.reduce((least, q) =>
  Math.min(least, Math.hypot(q.x - x, q.z - z) - q.r), Infinity);

function kinRoom(self, x, z) {
  let least = Infinity;
  for (const o of live) {
    if (o === self) continue;
    least = Math.min(least, Math.hypot(o.pos.x - x, o.pos.z - z),
                     Math.hypot(o.spot.x - x, o.spot.z - z));
  }
  return least;
}

// The rings it may stand on. A firing line is one exact distance off what it is
// shooting — that is what the range is for. Escorting is not: it only has to be
// about the player, so it is offered a band rather than a circle and a flight
// fills the band outward instead of fighting over one ring.
function offers(d, D) {
  const here = Math.hypot(d.pos.x - world.player.pos.x, d.pos.z - world.player.pos.z);
  const loose = [];
  for (let i = 0; i < D.bands; i++) {
    loose.push(D.standoff * (1 + i * ((D.loose - 1) / Math.max(1, D.bands - 1))));
  }
  // Nearest to the depth it is already flying at, not innermost first: offered
  // the inside every frame, a machine dives for it the moment the one holding
  // it drifts, and the flight spends the fight swapping places. It keeps the
  // depth it has and only changes depth when that one stops working.
  loose.sort((a, b) => Math.abs(a - here) - Math.abs(b - here));
  const escort = loose.map((at) => [world.player.pos, at]);
  if (!d.target) return escort;

  // The firing line is a band as well, and this one is taken from the outside
  // in: anywhere it can still hit from will do, and the furthest of those is
  // the one nothing on the ground can answer.
  const near = D.engage + d.target.radius;
  const far = Math.max(near, D.range * D.hold);
  const lines = [];
  for (let i = D.bands - 1; i >= 0; i--) {
    lines.push([d.target.pos, near + (far - near) * (i / Math.max(1, D.bands - 1))]);
  }
  return [...lines, ...escort];
}

// Where it wants to be: somewhere on one of those rings that nothing has
// claimed and nothing is about to cross. It walks each ring from the bearing it
// already holds, so it keeps its station while that station works and moves as
// little as it must. Keeping out of the way beats keeping the firing line, so a
// claimed engagement ring costs it the shot rather than the ground; when every
// offer is claimed it takes the airiest of them rather than standing in the worst.
function station(d, D, out) {
  const rings = offers(d, D);
  let bestA = d.orbit, bestRoom = -Infinity, bestOn = rings[0];

  for (const [on, at] of rings) {
    for (let i = 0; i < D.tries; i++) {
      const a = d.orbit + (i / D.tries) * Math.PI * 2;
      const x = on.x + Math.cos(a) * at;
      const z = on.z + Math.sin(a) * at;

      if (safe(zones, x, z, D.clear) && clearOfKin(d, x, z, D.apart)
          && clearOfBugs(x, z, D.mind)) {
        d.orbit = a;
        return d.spot.copy(out.set(x, flyAt(), z));
      }
      const air = Math.min(room(x, z), kinRoom(d, x, z));
      if (air > bestRoom) { bestRoom = air; bestA = a; bestOn = [on, at]; }
    }
  }

  d.orbit = bestA;
  return d.spot.copy(out.set(bestOn[0].x + Math.cos(bestA) * bestOn[1], flyAt(),
                             bestOn[0].z + Math.sin(bestA) * bestOn[1]));
}

function shoot(d, D, bug) {
  _muzzle.set(d.pos.x, d.pos.y, d.pos.z);
  // A flyer is shot at where it is flying, not at its shadow: the beam is cut
  // along the line to the middle of the body, however high that is.
  const high = (bug.alt || 0) + (bug.model.parts.height || 1) * (bug.grow || 1) * 0.5;
  _dir.set(bug.pos.x - d.pos.x, high - d.pos.y, bug.pos.z - d.pos.z);
  if (_dir.lengthSq() < 1e-6) return;
  _dir.normalize();

  beam.fire(_muzzle, _dir, { base: D.damage, range: D.range,
                             retain: D.retain, arcs: D.arcs });
  audio.playAt('zapDrone', d.pos.x, d.pos.z, { rate: 1.45, gainScale: 0.7 });
}

// Whatever the stations worked out, two machines that have ended up on top of
// each other give way. It is a wish to be elsewhere rather than a shove: it
// joins the velocity and is capped along with it, so nothing ever moves faster
// than its own speed however many neighbours are crowding it.
function apart(d, D, out) {
  out.set(0, 0, 0);
  for (const o of live) {
    if (o === d) continue;
    const dx = d.pos.x - o.pos.x, dz = d.pos.z - o.pos.z;
    const gap = Math.hypot(dx, dz);
    if (gap >= D.apart) continue;

    // Rising sharply as they close: a gentle wish to be elsewhere loses to the
    // pull of the station they both want.
    const urge = D.speed * Math.sqrt((D.apart - gap) / D.apart);
    if (gap < 1e-4) { out.x += urge; continue; }
    out.x += (dx / gap) * urge;
    out.z += (dz / gap) * urge;
  }
  return out;
}

// Steering away from anything with a mouth. Like the spacing between machines
// it is a wish rather than a shove, so it is capped along with everything else:
// crowded on all sides, a drone still only travels at its own speed.
function shy(d, D, out) {
  out.set(0, 0, 0);
  for (const bug of world.bugs) {
    if (bug.dummy) continue;
    const dx = d.pos.x - bug.pos.x, dz = d.pos.z - bug.pos.z;
    const gap = Math.hypot(dx, dz);
    const want = bug.radius + D.mind;
    if (gap >= want) continue;

    // Weighted above its own speed so that, once summed with the pull toward
    // its station and clamped back, getting clear is what wins.
    const urge = D.speed * D.shy * Math.sqrt((want - gap) / want);
    if (gap < 1e-4) { out.x += urge; continue; }
    out.x += (dx / gap) * urge;
    out.z += (dz / gap) * urge;
  }
  return out;
}

// It closes on its station at `chase` per unit of distance and eases into the
// new heading rather than snapping to it — but `speed` is a wall, not a
// suggestion: whatever it is chasing, it never travels faster than that.
function fly(d, D, dt) {
  // A machine on its way to a run holds the near end of the lane as its station.
  if (bombrun.waypoint(d, _to)) d.spot.copy(_to);
  else station(d, D, _to);

  _dir.subVectors(_to, d.pos);
  _dir.y = 0;
  const want = Math.min(D.speed, _dir.length() * D.chase);
  if (_dir.lengthSq() > 1e-8) _dir.setLength(want);

  _dir.add(apart(d, D, _sep));
  // Standing off a mouth is for a machine holding a firing line. A run is
  // flown: what is under the lane is what the charges are for.
  if (!d.bombing) _dir.add(shy(d, D, _shy));
  _dir.y = 0;
  if (_dir.length() > D.speed) _dir.setLength(D.speed);

  d.vel.lerp(_dir, 1 - Math.exp(-D.ease * dt));
  if (d.vel.length() > D.speed) d.vel.setLength(D.speed);
  d.pos.addScaledVector(d.vel, dt);

  // Held inside the ring outright: it flies over the walls that keep everything
  // else in, so nothing else would stop it drifting off the map.
  const lim = arena.radius() - D.inset;
  const out = Math.hypot(d.pos.x, d.pos.z);
  if (out > lim) { d.pos.x *= lim / out; d.pos.z *= lim / out; }
}

// Everything a machine does when it is doing nothing: it breathes on its bob and
// keeps its lamp lit. Nothing picks a target, flies a station or shoots.
function hover(d, D, dt) {
  d.bob += dt * D.bobRate;
  d.pos.y = riseAt(d.bob, d.drift, D);
  d.object.position.copy(d.pos);
  lamp(d, D, dt);
}

export function update(dt) {
  if (!live.length || !world.player) return;
  depart(dt);
  if (!live.length) return;
  const base = kit();
  claim(zones);

  const taken = new Set();
  for (const d of live) {
    if (d.leaving > 0) continue;
    if (d.arrive > 0) { arrive(d, base, dt); continue; }
    if (d.idle) { hover(d, base, dt); continue; }
    d.near = swarm.count(d, live);
    const D = swarm.kit(base, d.near);
    const was = d.target;
    d.target = pick(d, D, taken);
    if (d.target) taken.add(d.target);

    d.orbit += D.drift * dt;
    // A run flies itself: the machine is put down the lane it marked rather than
    // steered at it, so the whole line is laid in one pass.
    if (!bombrun.carry(d, dt)) fly(d, D, dt);

    // On its own clock, not on the orbit angle: that angle jumps whenever it
    // picks a different station, and the height jumped with it. Two rates that
    // do not divide into each other, so the rise and fall never settles into a
    // metronome — and deeper with nothing to shoot, since holding a firing
    // line is the only time it bothers to hold an altitude.
    d.bob += dt * D.bobRate;
    d.pos.y = bombrun.height(d, riseAt(d.bob, d.drift, D, d.target));

    d.object.position.copy(d.pos);
    lamp(d, D, dt);
    swarm.rings(d, dt);

    let off = Infinity;
    if (d.target) {
      if (was !== d.target) say(d, was ? 'Switch' : 'Attack');
      off = face(d, Math.atan2(d.target.pos.x - d.pos.x, d.target.pos.z - d.pos.z),
                 D.aimTurn, dt);
    } else {
      if (was) d.look = d.object.rotation.y;
      guard(d, D, dt);
    }
    bank(d, D, dt);

    // The cooldown runs whatever it is pointed at, but the shot waits until the
    // barrel is: swinging onto a new target costs it the time it takes to come
    // round, rather than the round leaving sideways.
    // The singularity runs on a clock of its own and needs nothing aimed: it
    // takes the crowd under it, not the one thing the barrel is pointed at.
    singularity.tick(d, dt);
    bombrun.tick(d, dt);

    d.cd -= dt;
    if (d.cd > 0 || !d.target || off > D.aimed) continue;
    // Lined up is not the same as in range: what it has flown at may still be
    // out past the beam, and a round loosed at it would reach nothing.
    if (Math.hypot(d.target.pos.x - d.pos.x, d.target.pos.z - d.pos.z) > D.range) continue;
    d.cd = D.fireGap;
    shoot(d, D, d.target);
  }
}
