import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { world } from '../core/world.js';
import { audio } from '../engine/audio.js';
import * as fx from '../fx/spatter.js';
import * as floaters from '../ui/floaters.js';
import * as coins from '../game/coins.js';
import * as effects from '../items/effects.js';
import * as bugmodel from './model.js';
import { setFlash } from './model.js';
import * as corpses from './corpses.js';
import { endRush, unseat } from './rush.js';
import * as fling from './fling.js';
import * as fuse from './fuse.js';
import * as jump from './jump.js';
import { step } from './step.js';
import { voiceOf, jitterOnly } from './voice.js';
import * as evolve from './evolve.js';
import * as flinch from './flinch.js';
import * as drone from '../allies/drone.js';
import { surgeNow } from '../game/waveplan.js';
import * as horde from './horde.js';
import * as crowd from './crowd.js';
import * as detail from './detail.js';
import * as skin from './skin.js';

export function spawn(type, pos, level = 1) {
  const grown = evolve.harden(evolve.hatchAt(type, level), surgeNow());
  const model = bugmodel.take(type, grown.level);
  model.object.visible = !model.standIn;
  model.object.scale.setScalar(type.scale * grown.grow);
  scene.add(model.object);

  const bug = {
    type, model,
    ...grown,
    pos: pos.clone(),
    // Where it broke ground is the ground it holds when it is not wanted at the
    // front, and `r` is how far over that ground it mills. See bug/horde.js.
    home: { x: pos.x, z: pos.z, r: CFG.horde.home },
    chase: true,
    roam: null,
    roamT: 0,
    attackCd: 0,
    walk: Math.random() * 10,
    pulse: Math.random() * 10,
    vein: Math.random() * 10,
    rush: null,
    rushCd: 3 + Math.random() * 5,
    leap: null,
    leapCd: 0.3 + Math.random() * 1.2,
    slam: null,
    slamCd: 1.5 + Math.random() * 3,
    spill: null,
    spillCd: 4 + Math.random() * 6,
    douse: null,
    douseCd: 2 + Math.random() * 4,
    jab: null,
    jabCd: 1 + Math.random() * 3,
    hurl: null,
    hurlCd: 2 + Math.random() * 4,
    toss: null,
    tossCd: 3 + Math.random() * 5,
    fling: null,
    flingCd: 6 + Math.random() * 8,
    haul: null,
    carried: null,
    flight: null,
    leapY: 0,
    // The bug itself, never an index: a kill swap-pops the list.
    rider: null,
    board: null,
    seat: 0,
    climb: null,
    knock: new THREE.Vector3(),
    spitCd: 0.6 + Math.random() * CFG.spit.cooldown,
    windup: 0,
    lunge: 0,
    repos: null,
    reposT: 0,
    jump: null,
    hopWait: 0,
    fireNow: false,
    yaw: 0,
    yawSet: false,
    emerge: 0,
    // True because the model was just added to the scene: detail.mark() takes it
    // back out on the first frame nobody can see it.
    shown: true,
    flash: 0,
    flinch: 0,
    flinchAngle: 0,
    flinchDir: { x: 0, z: 1 },
    way: null,
    path: null,
    // Staggered, so a wave that breaks ground together does not plan together.
    plan: Math.random() * CFG.bugAnim.replan,
    brood: false,
    tag: null,
    gift: null,
    bounty: false,
    rest: 0,
  };
  model.object.position.copy(pos);
  world.bugs.push(bug);
  return bug;
}

export function despawn(i) {
  const list = world.bugs;
  const bug = list[i];
  scene.remove(bug.model.object);
  bugmodel.recycle(bug.model, bug.type.key);
  list[i] = list[list.length - 1];
  list.pop();
}

const _num = new THREE.Vector3();
const _spray = new THREE.Vector3();

// By identity, never an index: a caller's index goes stale the moment the death
// hook bursts and swap-pops the roster.
export function kill(bug) {
  const i = world.bugs.indexOf(bug);
  if (i < 0) return false;

  if (bug.flash > 0) { bug.flash = 0; setFlash(bug, false); }

  if (bug.model.parts.glow) bug.model.parts.glow.visible = false;

  if (bug.rush) endRush(bug);
  if (bug.fling) fling.drop(bug);
  fling.forget(bug);
  fuse.forget(bug);

  if (bug.rider && bug.rider.rush) {
    const seats = bug.rider.rush.riders;
    const at = seats.indexOf(bug);
    if (at >= 0) seats.splice(at, 1);

    for (let s = at; s < seats.length; s++) seats[s].seat = s;
    bug.rider = null;
  }
  unseat(bug);

  corpses.add(i);
  world.hooks.onKill(bug.type, bug.pos, bug);
  return true;
}

export function clear() {
  while (world.bugs.length) despawn(world.bugs.length - 1);
  corpses.clear();
}

// Bug-widths across the mark a kill leaves. `MOST` stops the boss, which in
// proportion would pool a quarter of the way across the arena.
const MARK = 1.75;
const MOST = 9;

export function damage(bug, dmg, hitPos, strength = 0.5, crit = false) {
  bug.hp -= dmg;

  _num.set(bug.pos.x,
           (bug.alt || 0) + (bug.model.parts.height || 1) * 0.95 * bug.grow, bug.pos.z);
  floaters.damage(_num, dmg, bug.hp <= 0, strength, crit);
  audio.playAt('hit', bug.pos.x, bug.pos.z, voiceOf(bug.type)) || audio.hit();

  _spray.set(bug.pos.x - hitPos.x, 0.35, bug.pos.z - hitPos.z).normalize();

  fx.blood(hitPos, { power: 0.62, count: 7 + Math.floor(Math.random() * 4),
                     dir: _spray, size: 0.75 * Math.sqrt(bug.grow || 1) });

  flinch.begin(bug, hitPos, crit);

  if (crit) {
    bug.flash = CFG.crit.flash.time;
    setFlash(bug, true);
    audio.playAt('crit', bug.pos.x, bug.pos.z, { rate: 0.94 + Math.random() * 0.12 });
  }

  if (bug.hp <= 0) {
    bug.knock.set(bug.pos.x - hitPos.x, 0, bug.pos.z - hitPos.z);
    if (bug.knock.lengthSq() > 1e-6) bug.knock.normalize().multiplyScalar(7);

    // The animal's own footprint, never `type.scale`: that ignores `grow`, and
    // the boss's scale is 1.
    const wide = bug.radius || bug.type.radius;
    const n = Math.floor(10 + wide * 9.4);
    fx.blood(bug.model.object.position,
             { power: 1.05, count: n, dir: _spray, mark: true, size: 1 });
    fx.splatter(bug.pos, Math.min(MARK * wide, MOST), bug.knock);
    const killCue = bug.type.killSfx || 'kill';
    audio.playAt(killCue, bug.pos.x, bug.pos.z, jitterOnly())
      || audio.playAt('kill', bug.pos.x, bug.pos.z, voiceOf(bug.type))
      || audio.kill();
    if (!bug.type.finale) {
      coins.fromKill(bug.pos, bug.coins * effects.payMult(world.player));
    }
    return true;
  }
  return false;
}

const _soil = new THREE.Vector3();

// Sunk under the floor and clawing upward: the ground mesh hides the rest, so
// what shows is a bug hauling itself out of the hole it just broke open.
function rising(bug, dt) {
  if (bug.emerge <= 0) return false;
  bug.emerge -= dt;

  const E = CFG.spawn.emerge;
  const left = Math.max(0, bug.emerge) / E.time;
  const deep = (bug.model.parts.height || 1) * E.depth;
  const obj = bug.model.object;

  obj.position.set(bug.pos.x, -deep * left * left, bug.pos.z);
  obj.rotation.y = bug.yaw + Math.sin(bug.emerge * E.shudder) * E.wobble * left;

  if (Math.random() < E.grit * dt) {
    _soil.set(bug.pos.x, 0.05, bug.pos.z);
    fx.dirt(_soil, 1, 0.45);
  }
  if (bug.emerge > 0) return true;

  bug.emerge = 0;
  obj.position.y = 0;
  return false;
}

// What a bug is going for: whichever of the player and the machines flying with
// them is nearer to it — unless the species has no interest in machines, in
// which case there is only ever one thing it wants. Everything downstream reads
// a mark's `pos` and `vel`, which is all a drone has to offer to stand in for
// the player.
function markOf(bug) {
  const p = world.player;
  if (bug.type.ignoresDrones) return p;

  // A machine flying higher than the animal can jump is not prey: it would walk
  // under it for ever waiting for a bite it can never take.
  const d = drone.nearest(bug.pos.x, bug.pos.z);
  if (!d || !jump.able(bug, d)) return p;

  const toDrone = Math.hypot(d.pos.x - bug.pos.x, d.pos.z - bug.pos.z);
  const toPlayer = Math.hypot(p.pos.x - bug.pos.x, p.pos.z - bug.pos.z);
  return toDrone < toPlayer ? d : p;
}

export function update(dt) {
  const list = world.bugs;
  crowd.rebuild();
  detail.survey();
  horde.assign(dt, markOf);
  for (let i = list.length - 1; i >= 0; i--) {
    const bug = list[i];
    if (detail.mark(bug)) skin.beat(bug, dt);
    if (rising(bug, dt)) continue;
    if (!step(bug, markOf(bug), dt)) return;
  }
}
