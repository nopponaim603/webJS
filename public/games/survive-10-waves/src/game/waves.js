import * as THREE from 'three';
import { CFG, BUG_TYPES, SPECIAL } from '../config/index.js';
import { world, state } from '../core/world.js';
import { between } from '../core/rng.js';
import { spawn } from '../bug/roster.js';
import { voiceOf, jitterOnly } from '../bug/voice.js';
import { phasesOf, phaseShare, groupsFor, rollLevel, bossesAt } from './waveplan.js';
import * as arena from '../arena/size.js';
import * as walls from '../arena/walls.js';
import * as spawnwarn from '../fx/spawnwarn.js';
import * as ledger from './ledger.js';
import * as fx from '../fx/spatter.js';
import { audio } from '../engine/audio.js';

function roll(pool) {
  let total = 0;
  for (const t of pool) total += t.weight;
  let r = Math.random() * total;
  for (const t of pool) { r -= t.weight; if (r <= 0) return t; }
  return pool[pool.length - 1];
}

// Some species come one to a hole at most, so a single breach never turns into
// a wall of them. Cap every species a wave has and the cap gives way, not the
// spawn.
function pickType(taken) {
  const eligible = BUG_TYPES.filter((t) => state.wave >= t.minWave);
  const uncapped = eligible.filter((t) => !t.maxPerHole
    || (taken.get(t) || 0) < t.maxPerHole);
  return roll(uncapped.length ? uncapped : eligible);
}

const _spawnPos = new THREE.Vector3();

const spawnRadius = () => arena.radius() - CFG.spawn.inset;

// Anywhere on the floor, so long as it is not on top of the player, inside a
// wall, or on a mark already counting down.
function pickSpot(out, radius) {
  const S = CFG.spawn;
  const p = world.player.pos;
  const rim = spawnRadius() - radius;

  for (let tries = 0; tries < 24; tries++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.sqrt(Math.random()) * rim;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;

    if (Math.hypot(x - p.x, z - p.z) < S.clearOfPlayer + radius) continue;
    if (walls.inside(x, z, S.wallClear + radius)) continue;
    if (pending.some((q) => Math.hypot(q.x - x, q.z - z) < S.apart + radius)) continue;
    return out.set(x, 0, z);
  }

  const a = Math.random() * Math.PI * 2;
  return out.set(Math.cos(a) * rim, 0, Math.sin(a) * rim);
}

const pending = [];

// One hole, one group: they claw up out of the same patch of ground, one at a
// time over `emerge.window`, so a breach reads as a hole feeding bugs.
// `level` pins what climbs out to a level rather than rolling the wave's; a hole
// torn open by something else is that thing's brood, not the wave's. `warn`
// stretches how long the ground works before anything comes out of it.
export function breach(count, spot = null, scale = 1,
                       { level = null, species = null, warn = 1,
                         brood = false, tag = null, gift = null, bounty = false } = {}) {
  const S = CFG.spawn;
  const W = S.warn;
  const radius = S.breach * Math.sqrt(count / S.group.first) * scale;
  const life = W.time * (0.9 + Math.random() * 0.2) * warn;

  if (spot) _spawnPos.set(spot.x, 0, spot.z);
  else pickSpot(_spawnPos, radius);
  const cx = _spawnPos.x, cz = _spawnPos.z;
  spawnwarn.warn(cx, cz, life, radius);

  const E = S.emerge;
  // How long the hole is working for: the mark burning down, then the last bug
  // hauling itself out. The rumble and the bursts both run the length of it.
  const spread = between(E.window);
  spawnwarn.quake(cx, cz, radius, life + spread, warn);

  // Not placed: a breach anywhere on the field is news wherever the player is
  // standing, so the rumble is heard flat rather than from over there.
  audio.play('spawn', { rate: 0.92 + Math.random() * 0.16 })
    || audio.play('spit', { rate: 0.5, gainScale: 0.4 });

  const gap = spread / count;
  const taken = new Map();
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = count > 1 ? Math.sqrt(Math.random()) * radius : 0;
    const type = species || pickType(taken);
    taken.set(type, (taken.get(type) || 0) + 1);
    // The first one out claws up as the mark finishes; the rest take their turn.
    const wait = i === 0 ? 0 : (i + Math.random() * E.jitter) * gap;
    // One carrier to a hole, not one per bug: a group sent out holding an item
    // is sent to deliver that item, not a pile of them.
    pending.push({ x: cx + Math.cos(a) * d, z: cz + Math.sin(a) * d, type,
                   t: life + wait, level, brood, tag, bounty, gift: i === 0 ? gift : null,
                   home: radius * CFG.horde.spread });
  }
}

const BOSS = BUG_TYPES.find((t) => t.key === 'boss');

// The holes this phase has left to open. A phase opens every one of them,
// `groupGap` apart, and only then waits on the player: nothing here reads how
// the fight is going.
const queue = [];
let opened = 0;

export const groupsOpened = () => opened;
export const groupsPlanned = () => opened + queue.length;

// One hole each, and nothing else with them: a boss phase is the boss. The
// ground opens under the player's own feet and works there long enough that
// getting off it is the first thing the fight asks of them.
function openBoss() {
  const S = CFG.spawn;
  // A breach carries the square root of the group it feeds, and a boss is one
  // animal — so that term is divided back out and `bossBreach` means what it
  // says: this many times the hole a normal spawn opens.
  const scale = S.bossBreach * Math.sqrt(S.group.first);
  breach(1, world.player.pos, scale, { species: BOSS, warn: S.bossWarn });
}

const standing = () => world.bugs.reduce((n, b) => n + (b.dummy ? 0 : 1), 0) + pending.length;

function tickPending(dt) {
  for (let i = pending.length - 1; i >= 0; i--) {
    const q = pending[i];
    q.t -= dt;
    if (q.t > 0) continue;

    _spawnPos.set(q.x, 0, q.z);
    const bug = spawn(q.type, _spawnPos, q.level || rollLevel());
    bug.emerge = CFG.spawn.emerge.time;
    bug.home.r = q.home;
    bug.brood = q.brood;
    bug.tag = q.tag;
    bug.gift = q.gift;
    bug.bounty = q.bounty;
    fx.dirt(_spawnPos, 5, 0.9);
    // The same cry it dies on: what a species sounds like, spent on breaking
    // the surface as well as on going back under it.
    const cry = q.type.killSfx || 'kill';
    audio.playAt(cry, q.x, q.z, jitterOnly())
      || audio.playAt('kill', q.x, q.z, voiceOf(q.type));
    state.spawned += 1;
    pending[i] = pending[pending.length - 1];
    pending.pop();
  }
}

function beginPhase(i) {
  const share = state.phasePlan[i - 1];
  state.phase = i;
  state.spawnTimer = between(CFG.spawn.groupGap);
  queue.length = 0;
  opened = 0;
  queue.push(...(i === state.bossPhase
    ? new Array(share).fill(1)
    : groupsFor(share, state.wave, i)));
}

export function beginWave(n) {
  state.wave = n;
  ledger.reset();
  pending.length = 0;
  state.phasePlan = phaseShare(n, phasesOf(n));
  const bosses = bossesAt(n);
  if (bosses) state.phasePlan.push(bosses);
  state.bossPhase = bosses ? state.phasePlan.length : 0;
  state.phases = state.phasePlan.length;
  state.quota = state.phasePlan.reduce((a, c) => a + c, 0);
  state.spawned = 0;
  state.phaseWait = 0;
  state.cleared = false;
  script = null;
  if (SPECIAL.wave === n) { state.phase = 1; queue.length = 0; opened = 0; }
  else beginPhase(1);
  state.spawnTimer = CFG.spawn.waveDelay;
}

const empty = () => !world.bugs.some((b) => !b.dummy) && pending.length === 0;

// What a scripted part still has on the field. Counting `pending` too matters:
// a bug whose mark is still burning down is owed to that part, and calling the
// part clear before it climbs out would cut the music off over an empty floor
// that is about to fill again.
export const standingTagged = (tag, kind = null) =>
  world.bugs.reduce((n, b) => n + (b.tag === tag && !b.dummy
    && (!kind || (b.type && b.type.key === kind)) ? 1 : 0), 0)
  + pending.reduce((n, q) => n + (q.tag === tag
    && (!kind || (q.type && q.type.key === kind)) ? 1 : 0), 0);

// A scripted wave drives its own spawning. The hook keeps the dependency one
// way: the script reaches for `breach`, never the other way round.
let script = null;
export function useScript(fn) { script = fn; }

export function updateSpawning(dt) {
  // Ahead of both gates: neither holds back a hole that is already open — a
  // breach triggered by hand, or one opened before the ring started moving,
  // still has to finish feeding.
  tickPending(dt);
  if (arena.moving()) return false;
  if (world.debug.noSpawn) return false;
  if (script) return script();

  // Between phases: the fight has thinned out and the next lot is on its way.
  if (state.phaseWait > 0) {
    state.phaseWait -= dt;
    if (state.phaseWait <= 0) beginPhase(state.phase + 1);
    return false;
  }

  if (queue.length) {
    state.spawnTimer -= dt;
    if (state.spawnTimer > 0) return false;
    // The one thing a hole waits on: a field already at `maxAlive` has nowhere
    // to put what would climb out of it, so it holds rather than spawning short.
    if (CFG.spawn.maxAlive - standing() < queue[0]) return false;

    const count = queue.shift();
    opened += 1;
    if (state.phase === state.bossPhase) openBoss();
    else breach(count);
    state.spawnTimer = between(CFG.spawn.groupGap);
    return false;
  }

  // The last phase is the wave, and a wave is over when the floor is — not when
  // it is nearly. Every phase before it hands over once the fight has thinned to
  // a handful, so the next lot is already climbing out while the stragglers are
  // being hunted down.
  if (state.phase >= state.phases) return empty();
  if (standing() >= CFG.spawn.handover) return false;
  state.phaseWait = CFG.spawn.phaseGap;
  return false;
}
