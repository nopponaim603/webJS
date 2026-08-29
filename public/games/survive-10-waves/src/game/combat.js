import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import * as blast from '../fx/blast.js';
import { audio } from '../engine/audio.js';
import { shakeAt } from '../engine/view.js';
import * as bullets from '../weapons/bullets.js';
import * as bugs from '../bug/roster.js';
import { pushGive } from '../bug/mass.js';
import * as drone from '../allies/drone.js';
import * as boomerangs from '../bug/boomerangs.js';
import * as graze from '../character/graze.js';
import * as dodge from '../character/dodge.js';
import * as walls from '../arena/walls.js';
import * as modules from '../modules/index.js';
import { segDist2 } from '../core/geom2.js';
import * as ledger from './ledger.js';
import * as evolve from '../bug/evolve.js';
import * as effects from '../items/effects.js';
import * as gunmods from '../gunmods/index.js';

// A shot rolls once, whatever it goes on to hit: a beam crits down its whole
// length and a blast crits on every bug in it, rather than each bug getting its
// own dice on the same trigger pull.
export const rollCrit = (by = '') => Math.random() < critChance(by);

export const critMultiplier = (crit) => (crit ? CFG.crit.multiplier : 1);

// The bench upgrades the player's guns, not everything on the field: a drone
// carries its own rifle, and its own branch of the tree is what sharpens it.
const critChance = (by) => (by === 'drone' ? modules.droneCrit() : modules.critChance());

// The same, for the arc: a drone's chain is its own branch of the tree, so what
// a hop reaches and how often one starts depends on whose round landed.
const arcJumps = (by) => (by === 'drone' ? modules.droneJumps() : modules.chainJumps());
const arcChance = (by) => (by === 'drone' ? modules.droneArcChance() : modules.arcChance());
const arcRange = (by) => (by === 'drone' ? modules.droneArcRange() : modules.arcRange());
// And what the hop looks and sounds like: the drone's is a beam, the rifle's a
// crooked bolt.
const arcDraw = (by) => (by === 'drone' ? blast.zap : blast.lightning);
const arcSound = (by) => (by === 'drone' ? 'zapDrone' : 'zap');

export function rollDamage(base, dist = 0, by = '') {
  const damage = base * bullets.rangeFactor(dist);
  const { spread } = CFG.bullet;
  const t = (Math.random() + Math.random()) / 2;
  let amount = Math.round(damage * (1 + (t * 2 - 1) * spread));

  const crit = rollCrit(by);
  if (crit) amount = Math.round(amount * CFG.crit.multiplier);
  return { amount, strength: crit ? 1 : t, crit };
}

function hitBoomerangs(b, bp) {
  const F = CFG.boomerang;
  for (let k = boomerangs.live.length - 1; k >= 0; k--) {
    const { mesh: { position: p }, grow } = boomerangs.live[k];
    const r = F.shotRadius * grow + CFG.bullet.radius;
    if (segDist2(b.prev.x, b.prev.z, bp.x, bp.z, p.x, p.z) >= r * r) continue;
    const shot = rollDamage(b.base, Math.hypot(p.x - b.from.x, p.z - b.from.z), b.by);
    boomerangs.damage(k, shot.amount);
  }
}

const _arcFrom = new THREE.Vector3();
const _arcTo = new THREE.Vector3();

function nearestUnhit(x, z, range, hit) {
  const list = world.bugs;
  let best = -1, bestD2 = range * range;
  for (let j = 0; j < list.length; j++) {
    if (hit.has(list[j])) continue;
    const dx = list[j].pos.x - x, dz = list[j].pos.z - z;
    const d2 = dx * dx + dz * dz;
    if (d2 < bestD2) { bestD2 = d2; best = j; }
  }
  return best;
}

const chains = [];

export function clear() { chains.length = 0; pending.length = 0; }

const _at = new THREE.Vector3();
const _push = new THREE.Vector3();

// The one way a weapon's damage reaches a bug: crediting, hitting and taking a
// dead one off the roster always go together. It is also the only place the
// player's side takes health off anything, so an amplifier is applied here
// rather than at every gun — a chain hop and a blast both arrive with the
// damage they were rolled for and are multiplied once, on their way in.
export function hurt(bug, amount, at, strength, by, crit = false) {
  if (bug.hp <= 0) return false;
  const dealt = Math.round(amount * effects.damageMult(world.player));
  ledger.dealt(by, dealt);
  if (!bugs.damage(bug, dealt, at, strength, crit)) return false;
  const dead = bugs.kill(bug);
  gunmods.killed(bug);
  return dead;
}

function detonate({ x, z, radius, damage, edge, knock, selfDamage, blame, crit = false }) {
  const S = CFG.blast.shake;
  _at.set(x, 0, z);
  blast.explosion(_at, radius);
  audio.explode();
  // Off the blast itself, so a bomber hits harder than a grenade and a grenade
  // hits harder once the launcher has been upgraded.
  shakeAt(x, z, S.power * Math.min(1, radius / S.full), radius * S.reach);

  const reach = (d) => Math.min(1, d / radius);
  const share = (d) => 1 - (1 - edge) * reach(d);
  const list = world.bugs;

  for (let i = list.length - 1; i >= 0; i--) {
    const b = list[i];
    const d = Math.hypot(b.pos.x - x, b.pos.z - z);
    if (d > radius + b.radius) continue;
    if (walls.blocks(x, z, b.pos.x, b.pos.z, 0) >= 0) continue;

    b.knock.set(b.pos.x - x, 0, b.pos.z - z);
    if (b.knock.lengthSq() > 1e-6) b.knock.normalize().multiplyScalar(knock * (1 - reach(d)));
    hurt(b, Math.round(damage * critMultiplier(crit) * share(d)), _at, 0.9, blame, crit);
  }

  const p = world.player;
  const pd = Math.hypot(p.pos.x - x, p.pos.z - z);
  if (pd <= radius + CFG.player.radius && walls.blocks(x, z, p.pos.x, p.pos.z, 0) < 0) {
    world.hooks.damagePlayer(Math.round(selfDamage * share(pd)), { by: blame });
  }

  // Whatever set it off, a blast does not ask what it is hurting. A machine
  // hovering over one is in it the same as a body standing in it.
  for (const d of drone.list()) {
    const dd = Math.hypot(d.pos.x - x, d.pos.z - z);
    if (dd > radius + d.radius) continue;
    if (walls.blocks(x, z, d.pos.x, d.pos.z, 0) >= 0) continue;
    drone.damage(d, Math.round(selfDamage * share(dd)));
  }
}

// Queued, not recursive: a blast can kill a bomber mid-walk of world.bugs.
const pending = [];
let bursting = false;

export function explode(o) {
  pending.push(o);
  if (bursting) return;
  bursting = true;
  while (pending.length) detonate(pending.shift());
  bursting = false;
}

export function burst(type, pos, bug) {
  const B = type.burst;
  const damage = bug ? evolve.hit(bug, B.damage) : B.damage;
  const radius = bug ? evolve.burstRadius(bug) : B.radius;
  explode({ x: pos.x, z: pos.z, radius, damage, edge: B.edge,
            knock: B.knock, selfDamage: damage, blame: type.key });
  blastGraze(pos.x, pos.z, radius, bug);
}

// Only what a bug set off is a dodge. The player's own grenades go through
// explode() directly and cannot reach this, so nothing has to ask whose it was.
export function blastGraze(x, z, radius, by) {
  const p = world.player.pos;
  if (walls.blocks(x, z, p.x, p.z, 0) >= 0) return;
  const reach = radius + CFG.player.radius;
  if (Math.hypot(p.x - x, p.z - z) > reach) graze.at(Math.hypot(p.x - x, p.z - z), reach, { from: by });

  const was = dodge.leaving();
  if (was && Math.hypot(was.x - x, was.z - z) <= reach) dodge.paid(was.x, was.z, by);
}

function hop(c) {
  const C = CFG.chain;
  const j = nearestUnhit(c.from.x, c.from.z, arcRange(c.by), c.hit);
  if (j < 0) { c.left = 0; return; }

  const target = world.bugs[j];
  c.hit.add(target);
  _arcFrom.set(c.from.x, c.from.y + C.height, c.from.z);
  _arcTo.set(target.pos.x, (target.alt || 0) + C.height, target.pos.z);
  arcDraw(c.by)(_arcFrom, _arcTo);
  audio.zap(arcSound(c.by));

  hurt(target, Math.round(c.dmg), _arcFrom, 0.85, c.by);

  c.from.set(target.pos.x, target.alt || 0, target.pos.z);
  c.dmg *= C.falloff;
  c.left -= 1;
  c.t = C.jumpDelay;
}

export function arc(source, shotDamage, by) {
  const C = CFG.chain;
  const jumps = arcJumps(by);
  if (jumps <= 0 || Math.random() >= arcChance(by)) return;

  const c = {
    from: new THREE.Vector3(source.pos.x, source.alt || 0, source.pos.z),
    hit: new Set([source]),
    dmg: shotDamage * C.damage,
    left: jumps,
    t: 0,
    by,
  };
  chains.push(c);
  hop(c);
}

export function update(dt) {
  const C = CFG.chain;
  for (let i = chains.length - 1; i >= 0; i--) {
    const c = chains[i];
    if (c.left <= 0 || c.dmg < C.minDamage) { chains.splice(i, 1); continue; }
    c.t -= dt;
    if (c.t <= 0) hop(c);
  }
}

export function resolve() {
  const list = world.bugs;

  for (let i = bullets.live.length - 1; i >= 0; i--) {
    const b = bullets.live[i];
    const bp = b.mesh.position;

    hitBoomerangs(b, bp);

    let spent = false;
    for (let j = 0; j < list.length && !spent; j++) {
      const bug = list[j];
      if (b.seen.has(bug)) continue;
      const r = bug.radius + CFG.bullet.radius;
      if (segDist2(b.prev.x, b.prev.z, bp.x, bp.z, bug.pos.x, bug.pos.z) >= r * r) continue;

      const flown = Math.hypot(bug.pos.x - b.from.x, bug.pos.z - b.from.z);
      const shot = rollDamage(b.base, flown, b.by);

      const amount = shot.amount * Math.pow(b.retain, b.hits);
      b.seen.add(bug);
      b.hits += 1;

      if (b.knock > 0) {
        _push.set(bug.pos.x - b.from.x, 0, bug.pos.z - b.from.z);
        if (_push.lengthSq() > 1e-6) {
          bug.knock.addScaledVector(_push.normalize(), b.knock * pushGive(bug));
        }
      }

      const before = list.length;
      hurt(bug, amount, bp, shot.strength, b.by, shot.crit);
      gunmods.hit(bug, b, amount, bp, shot.crit);
      if (b.arcs) arc(bug, amount, b.by);
      // A death swap-pops the roster, so rescan; b.seen keeps it from repeating.
      if (list.length !== before) j = -1;

      if (b.retain <= 0 || amount * b.retain < CFG.bullet.minDamage) {
        gunmods.endBullet(b, bug);
        bullets.release(i);
        spent = true;
      }
    }
  }
}
