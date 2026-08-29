import { CFG, BUG_TYPES, SPECIAL } from '../config/index.js';
import { state } from '../core/world.js';
import * as store from '../core/store.js';
import * as sector from './sector.js';
import { hatchAt, maxLevel } from '../bug/evolve.js';
import { between } from '../core/rng.js';

const KEY = 'survive10.waveplan';

function defaults() {
  const W = CFG.waves;
  return { first: W.first, growth: W.growth, cap: W.cap, countByWave: { ...W.countByWave } };
}

let plan = defaults();
let fromStore = false;

export function currentPlan() { return plan; }

export function usingSaved() { return fromStore; }

export function setPlan(next) {
  plan = { ...next, countByWave: { ...next.countByWave } };
}

export function savePlan() {
  fromStore = store.save(KEY, plan);
  return fromStore;
}

export function clearPlan() {
  store.forget(KEY);
  fromStore = false;
  plan = defaults();
}

export function formulaQuota(wave, p = plan) {
  return Math.min(p.cap, Math.round(p.first * Math.pow(p.growth, wave - 1)));
}

// The sector's multiplier lands here rather than at the spawn site, so every
// page that reads a wave off the plan reports the sector actually being played.
// The saved plan stays baseline: the multiplier is laid over it, not into it.
export function rawQuota(wave, p = plan) {
  const own = p.countByWave[wave];
  const base = Number.isFinite(own) ? Math.max(0, Math.round(own)) : formulaQuota(wave, p);
  return Math.round(base * sector.scale());
}

// How far up the late ladder a wave stands: nothing before `from`, a step every
// `every` waves after it.
const lateStep = (wave) => {
  const L = CFG.spawn.late;
  return wave < L.from ? -1 : Math.floor((wave - L.from) / L.every);
};

export const isLate = (wave) => lateStep(wave) >= 0;

// The holes the widest phase of this wave may open, and the most that climbs out
// of one.
export function holeCap(wave) {
  const L = CFG.spawn.late;
  const step = lateStep(wave);
  return step < 0 ? CFG.spawn.groups : L.holes + step * L.holeStep;
}

export function groupCap(wave) {
  const L = CFG.spawn.late;
  const step = lateStep(wave);
  return step < 0 ? CFG.spawn.group.max : L.per + step * L.perStep;
}

// The most that climbs out of one hole on this wave.
export const depthCap = (wave) => {
  const own = CFG.spawn.phaseDepth[wave];
  return own ? Math.round(own * sector.scale()) : groupCap(wave);
};

// What one phase can open: its own holes, that deep.
export const phaseCap = (wave, phase = 0) => holesAt(wave, phase) * depthCap(wave);

// A wave fields what its phases can carry and not a bug more, so the count a
// page prints is the count that walks out of the ground. A late wave is its
// shape: what the ramp of holes carries is the whole of it.
export function quotaOf(wave, p = plan) {
  if (scripted(wave)) return partCounts().reduce((a, c) => a + c, 0);
  if (isLate(wave)) return phaseShare(wave).reduce((a, c) => a + c, 0);
  let room = 0;
  for (let i = 1; i <= phasesOf(wave); i++) room += phaseCap(wave, i);
  return Math.min(room, rawQuota(wave, p));
}

// Levels come slowly at first and then in a rush. A bug is whatever its level
// says it is — this is the only place that decides which level a wave hands out.
const bend = () => {
  const L = CFG.waves.levels;
  return Math.log((L.midLevel - 1) / (maxLevel() - 1))
    / Math.log((L.midWave - 1) / (L.peak - 1));
};

export function levelAt(wave) {
  const L = CFG.waves.levels;
  const top = maxLevel();
  if (wave >= 1 && wave <= L.early.length) return Math.min(top, L.early[wave - 1]);

  const t = Math.max(0, wave - 1) / (L.peak - 1);
  return Math.min(top, Math.max(1, Math.round(1 + (top - 1) * Math.pow(t, bend()))));
}

export const levelNow = () => levelAt(state.wave);

// A wave is not all one age: a few of its bugs are already what the next wave
// fields, so the step up is met before it arrives.
export function rollLevel(wave = state.wave) {
  const now = levelAt(wave);
  const next = levelAt(wave + 1);
  if (next <= now) return now;
  return Math.random() < between(CFG.waves.levels.ahead) ? next : now;
}

// A number the run hands out rather than a module: `from` at wave 1, `to` by
// wave `by`, and level from there on.
export const overWaves = (r, wave = state.wave) =>
  r.from + (r.to - r.from) * Math.min(1, Math.max(0, (wave - 1) / (r.by - 1)));

export const bossesAt = (wave) => CFG.waves.bosses[wave] || 0;

// Levels stop climbing long before the waves do. Past that point a wave fields
// not an older bug but a harder one: what it hits for and what it can take both
// go up, and go up again for every wave after it.
export function surgeAt(wave) {
  const S = CFG.waves.surge;
  return Math.pow(1 + S.per, Math.max(0, wave - S.from + 1));
}

export const surgeNow = () => surgeAt(state.wave);

// The regular phases only. A wave climbs a phase at a time to `maxPhases` and
// stays there, so a wave is a shape a player learns rather than a length they
// have to guess at. A wave that ends with a boss gives one of them up to it, so
// its count is shared out over fewer, heavier phases.
// Wave 14 is written out rather than rolled, so the four questions the rest of
// the game asks about a wave are answered from the script. Everything that reads
// a wave analytically — the watchtower sign, the wave board, waves.html, what the
// wave is worth — then agrees with what actually turns up.
const scripted = (n) => n === SPECIAL.wave;
const partCounts = () => SPECIAL.order
  .map((name) => (SPECIAL.parts[name].groups || []).reduce((a, g) => a + g.count, 0));

export function phasesOf(n) {
  if (scripted(n)) return SPECIAL.order.length;
  if (!rawQuota(n)) return 0;
  const all = Math.min(CFG.spawn.maxPhases, Math.ceil(Math.sqrt(n)));
  return Math.max(1, all - (bossesAt(n) ? 1 : 0));
}

export const groupGrown = (wave) => Math.min(CFG.spawn.group.max,
  CFG.spawn.group.first + (wave - 1) * CFG.spawn.group.perWave);

// Every hole a late phase opens is a full one, so its share is simply the width
// it was given. The sector's multiplier rides on the depth rather than the
// width: a harder sector opens the same holes and more comes out of them.
function lateShare(n, phases) {
  const per = groupCap(n) * sector.scale();
  const cut = [];
  for (let i = 1; i <= phases; i++) cut.push(Math.round(holesAt(n, i, phases) * per));
  return cut;
}

// Later phases are the bigger ones: the wave's count is shared out by phase
// number, so a wave builds instead of arriving all at once. A share past what
// one phase can open spills back down the wave rather than going unfielded.
export function phaseShare(n, phases = phasesOf(n)) {
  if (scripted(n)) return partCounts();
  if (isLate(n)) return lateShare(n, phases);
  const cap = (i) => phaseCap(n, i);
  const quota = quotaOf(n);
  const whole = (phases * (phases + 1)) / 2;
  const cut = new Array(phases).fill(0);
  let left = quota;
  for (let i = phases; i >= 1; i--) {
    const want = i === 1 ? left : Math.max(1, Math.round(quota * i / whole));
    cut[i - 1] = Math.min(want, left, cap(i));
    left -= cut[i - 1];
  }
  for (let i = phases - 1; i >= 0 && left > 0; i--) {
    const take = Math.min(cap(i + 1) - cut[i], left);
    cut[i] += take;
    left -= take;
  }
  return cut;
}

// A late wave opens wider as it goes: the last phase gets the wave's full width
// and the ones before it their share of it, so no phase is ever narrower than
// the one before.
export function holesAt(wave, phase, phases = phasesOf(wave)) {
  const own = CFG.spawn.phaseGroups[wave]?.[phase];
  if (own) return own;
  if (!isLate(wave) || !phases) return holeCap(wave);
  return Math.max(1, Math.ceil(holeCap(wave) * phase / phases));
}

// The holes one phase opens: groups of the wave's own size until the share runs
// short and the last hole takes what is left. Once the phase's holes would not
// carry the share, they deepen instead of multiplying — up to `groupCap`. A late
// phase is already the width it was given, so its share is only divided.
export function groupsFor(share, wave, phase = 0) {
  if (share <= 0) return [];
  const holes = holesAt(wave, phase);
  const set = isLate(wave) || !!CFG.spawn.phaseGroups[wave]?.[phase];
  const grown = Math.max(1, Math.round(groupGrown(wave)));
  const per = Math.min(depthCap(wave),
                       set ? Math.ceil(share / holes)
                           : Math.max(grown, Math.ceil(share / holes)));
  const groups = [];
  for (let left = share; left > 0; left -= per) groups.push(Math.min(per, left));
  return groups;
}

export function groupPlan(wave) {
  if (scripted(wave)) {
    return SPECIAL.order.map((name) => (SPECIAL.parts[name].groups || []).map((g) => g.count));
  }
  return phaseShare(wave).map((share, i) => groupsFor(share, wave, i + 1));
}

const bossPurse = () => CFG.bossFall.ones + CFG.bossFall.tens * 10;

// What a wave pays a player who kills everything it fields and leaves no coin on
// the floor: the drops, and the purse a boss empties over the ground. A boss
// leaves nothing where it falls —
// its purse is the whole of what it is worth. The roster is rolled by weight as
// it spawns, so the drops are the mean they are rolled around, not a promise.
export function takeParts(wave, p = plan) {
  const pool = BUG_TYPES.filter((t) => wave >= t.minWave && !t.finale);
  const weight = pool.reduce((n, t) => n + t.weight, 0);
  const per = weight
    ? pool.reduce((n, t) => n + t.weight * hatchAt(t, levelAt(wave)).coins, 0) / weight : 0;
  const drops = Math.round(quotaOf(wave, p) * per * surgeAt(wave));
  const boss = bossesAt(wave) * bossPurse();
  return { drops, boss };
}

export function takeOf(wave, p = plan) {
  const { drops, boss } = takeParts(wave, p);
  return drops + boss;
}

// What the purse holds walking into `wave` having cleared everything before it.
export function purseBefore(wave, p = plan) {
  let sum = 0;
  for (let w = 1; w < wave; w++) sum += takeOf(w, p);
  return sum;
}

export function exportText(p = plan) {
  const W = CFG.waves;
  const listed = Object.keys(p.countByWave).map(Number).sort((a, b) => a - b);
  const counts = listed.map((w) => `${w}: ${p.countByWave[w]}`).join(', ');
  return `  waves: {\n`
    + `    first: ${p.first},\n`
    + `    growth: ${p.growth},\n`
    + `    cap: ${p.cap},\n`
    + `    clearDelay: ${W.clearDelay},\n`
    + `    countByWave: { ${counts} },\n`
    + `  },`;
}

const saved = store.load(KEY);
if (saved) {
  plan = { ...defaults(), ...saved, countByWave: { ...saved.countByWave } };
  fromStore = true;
}
