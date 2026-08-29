import { CFG } from '../config/index.js';
import * as sector from '../game/sector.js';

const E = () => CFG.evolve;

// A bug knows its level and nothing about waves: which wave hands out which
// level is a question about a run, and it is answered in game/waveplan.js.
export const maxLevel = () => E().hp.length;

const own = (key, stat) => {
  const s = E().species[key];
  return (s && s[stat]) || 0;
};

// Everything a bug is, it is because of its level. Two bugs wearing the same
// number are the same bug, whichever wave each of them walked out of — the
// sector they walked out of is the one thing that tells them apart, and it
// changes only what they can take.
const steps = (bug) => Math.max(0, (bug.level || 1) - 1);

// The shared climb is read off the table by level; what a species does of its
// own — and what only a species has, like an acid pool — still compounds.
const byLevel = (stat, level) => {
  const curve = E()[stat];
  return curve ? curve[Math.min(level, curve.length) - 1] : 1;
};

const climb = (bug, stat) =>
  byLevel(stat, bug.level || 1) * Math.pow(1 + own(bug.type.key, stat), steps(bug));

const rungOf = (ladder, level) => ladder[Math.min(level, ladder.length) - 1];

export function hatchAt(type, level) {
  const bug = { type, level: Math.min(maxLevel(), Math.max(1, level)) };
  const base = type.hpBy ? rungOf(type.hpBy, bug.level) : type.hp * climb(bug, 'hp');
  const hp = base * sector.hpScale();
  const grow = type.sizeBy ? rungOf(type.sizeBy, bug.level) : climb(bug, 'size');
  return {
    level: bug.level,
    hp,
    hpMax: hp,
    grow,
    radius: type.radius * grow,
    speed: type.speed * climb(bug, 'speed'),
    damage: Math.round(type.damage * climb(bug, 'damage')),
    attackGap: CFG.bugAnim.attackGap / climb(bug, 'rate'),
    coins: Math.max(1, Math.round((type.coins || 1) * climb(bug, 'coins'))),
  };
}

// A wave past the last level cannot hand a bug another one, so it hardens the
// bug it has: hp, damage and what it pays all scale by the surge of the wave it
// climbed out of, and it carries that number so anything priced off it later
// scales with it. The purse rides the same curve as the health bar on purpose —
// a bug that takes twice the killing is worth twice the coins.
export const harden = (grown, surge) => ({
  ...grown,
  surge,
  hp: Math.round(grown.hp * surge),
  hpMax: Math.round(grown.hp * surge),
  damage: Math.round(grown.damage * surge),
  coins: Math.max(1, Math.round(grown.coins * surge)),
});

export const rangeMult = (bug) => climb(bug, 'range');
// A blast rides the same reach curve as every other distance an animal works
// at, so a levelled bomber is a wider circle as well as a harder one.
export const burstRadius = (bug) => bug.type.burst.radius * rangeMult(bug);
export const poolMult = (bug) => climb(bug, 'pool');
export const spikeMult = (bug) => climb(bug, 'spike');
export const throwSpeedMult = (bug) => climb(bug, 'throwSpeed');
// How much ground a diving bird's attack takes: the corridor it strikes in,
// and the size of the figure it draws.
export const laneMult = (bug) => climb(bug, 'lane');
// Everything a bug lands, direct or left behind, grows with it.
export const hit = (bug, base) =>
  Math.round(base * climb(bug, 'damage') * (bug.surge || 1));

// What an attack costs, priced off what the animal's bite costs: everything a
// boss throws is worth a share of what it does with its mouth, and both climb
// together as it evolves.
export const share = (bug, k) => Math.max(1, Math.round(bug.damage * k));
export const hitAt = (type, level, base) => hit({ type, level }, base);

// Counts step rather than compound: a rider or a boomerang is a whole thing.
const addUp = (bug, stat, base) =>
  Math.floor(base + own(bug.type.key, stat) * steps(bug));

export const boomerangCount = (bug) => addUp(bug, 'boomerangs', CFG.brood.count);
export const riders = (bug) => addUp(bug, 'riders', CFG.rush.maxRiders);
