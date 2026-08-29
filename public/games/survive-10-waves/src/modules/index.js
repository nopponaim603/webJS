import { CFG } from '../config/index.js';
import { state, world } from '../core/world.js';
import { overWaves } from '../game/waveplan.js';
import * as layout from './layout.js';
import { MODULES } from './catalog/index.js';
import { GUNMOD_STATS } from '../gunmods/values/index.js';

export { MODULES };

const BY_ID = Object.fromEntries(MODULES.map((u) => [u.id, u]));

export function reset() {
  state.levels = {};
  for (const u of MODULES) state.levels[u.id] = 0;
}

// A loan against the tree rather than a purchase: a wave that lends the player
// better machines than it sold them raises the drone branch to its cap while the
// loan is out. Never written to state.levels — progress.save() runs mid-wave and
// would bank it into the run for good.
let lent = false;
export const lendDrones = (on) => { lent = !!on; };
const loaned = (id) => lent && id.startsWith('dr');

export function level(id) {
  const own = (state.levels && state.levels[id]) || 0;
  return loaned(id) ? Math.max(own, maxLevel(id)) : own;
}

export const maxLevel = (id) => layout.levelsOf(id);

// The mission's last wave is what opens the bench's endless half: from there the
// marked modules sell levels for ever, each paying the same flat step on the one
// number the catalog names and on nothing else.
export const deepOpen = () => state.best >= CFG.mission.horizon;

export const endless = (id) => !!(BY_ID[id] && BY_ID[id].endless) && deepOpen();

export const capLevel = (id) => (endless(id) ? Infinity : maxLevel(id));

// Only ever one rung past what is bought: a tail with no end is not a thing to
// draw, and the next level is the whole of what the player has to decide about.
export const deepReach = (id) =>
  (endless(id) ? Math.max(0, level(id) + 1 - maxLevel(id)) : 0);

layout.setDeep(deepReach);

const tableLevel = (id) => Math.min(level(id), maxLevel(id));
const deepLevel = (id) => Math.max(0, level(id) - maxLevel(id));

const deepGain = (id, stat) => (BY_ID[id] && BY_ID[id].endless === stat
  ? Math.pow(1 + CFG.mission.endless.per, deepLevel(id)) : 1);

// A module can climb more than one number: `per` is the one it is named for,
// and the rest are read the same way off the same level. Past the table only
// the endless number keeps moving, and by the flat step rather than its own.
function gain(id, stat) {
  const u = BY_ID[id];
  return u ? Math.pow(1 + u[stat], tableLevel(id)) * deepGain(id, stat) : 1;
}

export const mult = (id) => gain(id, 'per');

export function maxed(id) { return level(id) >= capLevel(id); }

export function ownsNode(key) {
  const n = layout.BY_KEY.get(key);
  return !!n && level(n.id) >= n.level;
}

// A branch can wait on the run rather than on another node: the drone's own
// modules are not part of the tree until a drone flies for this sector.
const GATES = {
  drone: () => state.drones > 0,
  // Late in the run, on every sector: the lance is what surviving to wave 8
  // pays for, so no earlier board shows it.
  wave8: () => state.wave >= 8,
};

export function gateOpen(id) {
  const gate = layout.gateOf(id);
  return !gate || GATES[gate]();
}

export function nodeUnlocked(key) {
  const n = layout.BY_KEY.get(key);
  return !!n && gateOpen(n.id) && n.needs.every((k) => ownsNode(k));
}

export function canBuyNode(key) {
  const n = layout.BY_KEY.get(key);
  if (!n || ownsNode(key)) return false;

  if (n.level !== level(n.id) + 1) return false;
  return nodeUnlocked(key) && state.coins >= n.cost;
}

export function buyNode(key) {
  if (!canBuyNode(key)) return false;
  const n = layout.BY_KEY.get(key);
  const was = maxHealth();
  const flight = droneHealth();
  state.coins -= n.cost;
  state.levels[n.id] = n.level;
  keepHealthShare(was);
  keepFlightShare(flight);
  return true;
}

// A bigger tank is not a heal: the bar keeps the share of itself it held before
// the level was bought.
function keepHealthShare(was) {
  const p = world.player;
  if (!p || was <= 0) return;
  const now = maxHealth();
  if (now !== was) p.health = Math.min(now, p.health * (now / was));
}

// And the same for the flight, whose health is kept by slot rather than on the
// machines: a level of plating is a bigger hull, not a repair, so what each one
// is carrying keeps the share of itself it had. A slot with nothing in it was
// broken and flies again whole either way.
function keepFlightShare(was) {
  const kept = state.droneHp;
  if (!kept || was <= 0) return;

  const now = droneHealth();
  if (now === was) return;
  for (let i = 0; i < kept.length; i++) {
    if (kept[i] > 0) kept[i] = Math.min(now, Math.round(kept[i] * (now / was)));
  }
}

export function nodeMissing(key) {
  const n = layout.BY_KEY.get(key);
  if (!n) return [];
  return n.needs.filter((k) => !ownsNode(k)).map((k) => {
    const d = layout.partsOf(k);
    return { id: d.id, name: BY_ID[d.id] ? BY_ID[d.id].name : d.id, need: d.level, have: level(d.id) };
  });
}

export const aimCone = () => CFG.player.coneDeg * Math.PI / 180;

function critOf(id) {
  const u = BY_ID[id];
  const base = CFG.crit.chance;
  const rate = Math.pow(u.cap / base, 1 / maxLevel(id)) - 1;
  return Math.min(u.cap, base * Math.pow(1 + rate, level(id)));
}

export const critChance = () => critOf('crit');

// One thing a level, in the order it is learnt. `attacks` is every telegraph at
// once: knowing a tank charges but not that a runner leaps was never a choice
// worth selling a level on.
const SIGHT = ['attacks', 'health', 'count', 'minimap'];

export const sees = (what) => level('foresight') >= SIGHT.indexOf(what) + 1;

const SEEN = {
  attacks: 'attack warnings',
  health: 'enemy health bars',
  count: 'enemy health and level',
  minimap: 'a map of the arena',
};

export const sightAt = (lv) => (lv <= 0 ? 'nothing' : SEEN[SIGHT[Math.min(lv, SIGHT.length) - 1]]);

// Standing your ground, paid for. The band is a width of floor, the same off a
// bomb as off a boss; what it pays is a share of the tank, so a bigger tank is
// not a smaller reward.
export const grazeOn = () => level('nerve') > 0;
export const grazeBand = () => BY_ID.nerve.band;
export const grazeHold = () => BY_ID.nerve.hold;
export const grazeShare = () => curveOf('nerve', 'share');
export const grazeHeal = (streak = 0) => maxHealth() * (grazeShare() + runOn(streak));
export const grazeCharge = () => curveOf('nerve', 'charge');

// The other half of getting out of the way: not standing your ground but
// leaving it, inside the moment the attack lands.
export const reflexOn = () => level('reflex') > 0;
export const dodgeWindow = () => BY_ID.reflex.window;
// A sweep has no ground to have been standing in, so what counts is how close
// the thing was when the dash went in.
export const dodgeReach = () => BY_ID.reflex.reach;
export const dodgeShare = () => curveOf('reflex', 'share');
export const dodgeHeal = (streak = 0) => maxHealth() * (dodgeShare() + runOn(streak));
export const dodgeCharge = () => curveOf('reflex', 'charge');

// The run pays for itself: every near miss still banked when the next one lands
// adds a step, up to a full bank's worth.
const runOn = (streak) =>
  CFG.nearmiss.step * Math.max(0, Math.min(streak, adrenalineChain() - 1));

// What stringing those two together is worth: near misses counted over a window,
// and the guns answering when enough of them land.
const ADREN = () => BY_ID.adrenaline;
export const adrenalineOn = () => level('adrenaline') > 0;
export const adrenalineChain = () => ADREN().chain;
// How long a banked charge keeps before it goes cold.
export const adrenalineWithin = () => ADREN().within;
export const adrenalineMult = () => 1 + curveOf('adrenaline', 'rate');
export const adrenalineSeconds = () => curveOf('adrenaline', 'seconds');
export const adrenalineCharge = () => curveOf('adrenaline', 'charge');
export const adrenalineDamage = () => 1 + curveOf('adrenaline', 'hurt');

// The arc is bought twice over — once for the rifle, once for the drone's — and
// both read the same way off their own module: a jump a level, reach a tenth
// further a level, and a chance climbing from the config's to its cap.
const jumpsOf = (id) => level(id);
const reachOf = (id) => CFG.chain.range * Math.pow(1.10, level(id));

const arcRate = (id) =>
  Math.pow(CFG.chain.chanceCap / CFG.chain.chance, 1 / maxLevel(id)) - 1;

const chanceOf = (id) => Math.min(CFG.chain.chanceCap,
                                  CFG.chain.chance * Math.pow(1 + arcRate(id), level(id)));

export const chainJumps = () => jumpsOf('rfChain');
export const arcRange = () => reachOf('rfChain');
export const arcChance = () => chanceOf('rfChain');

// The singularity is priced in its own right rather than off the cannon: the
// cannon's levels open it, but nothing they buy reaches it — what it gathers is
// the attack, and its own levels are what sharpen that.
export const droneVoids = () => level('drVoid') > 0;

export const droneJumps = () => jumpsOf('drZap');
export const droneArcRange = () => reachOf('drZap');
export const droneArcChance = () => chanceOf('drZap');
export const droneArcs = () => level('drZap') > 0;

const REF = () => CFG.guns[0];
const SHOT = () => CFG.guns.find((g) => (g.pellets || 1) > 1);
const LANCE = () => CFG.guns.find((g) => g.charge);
const LAUNCH = () => CFG.guns.find((g) => g.projectile === 'grenade');

export const gunDamage = (gun) => gun.damage * gunPower(gun);
export const gunFireRate = (gun) => gun.fireRate * gunStat(gun, 'rate');
export const gunRecovery = (gun) => gun.recovery * gunStat(gun, 'recov');
// A gun that holds exactly one shot keeps holding one: the ring is its wind-up
// meter, so a hidden second charge would have nowhere to show.
// Whole shots only: a capacity of 2.8 is a gun that never fills, since the ring
// draws three segments and the recovery stops inside the last one.
export const gunCharges = (gun) =>
  Math.round(gun.charges * (gun.fixedCharges ? 1 : gunStat(gun, 'cap')));

export const gunUsesCone = (gun) => gun.projectile === 'bullet';

function pierceOf(id) {
  const u = BY_ID[id];
  const lv = u ? level(id) : 0;
  return lv > 0 ? Math.min(u.cap, u.base + u.per * lv) : 0;
}

export const gunPierce = (gun) => pierceOf(modOf(gun, 'pierce'));
export const dronePierce = () => pierceOf('drPierce');

export const gunArcs = (gun) => !!modOf(gun, 'chain') && level(modOf(gun, 'chain')) > 0;

const modOf = (gun, slot) => (gun.mods && gun.mods[slot]) || null;
const gunLevel = (gun, slot) => (modOf(gun, slot) ? level(modOf(gun, slot)) : 0);

// One module carries a whole gun. On the guns you have to buy, the first level
// is the purchase, so the stats start climbing from the second.
const gunModOf = (gun) => (gun.mod ? BY_ID[gun.mod] : null);
const gunSteps = (u) => Math.max(0, tableLevel(u.id) - (u.unlocks ? 1 : 0));

function gunStat(gun, stat) {
  const u = gunModOf(gun);
  if (!u) return 1;
  const rate = u.stats[stat];
  return (rate ? Math.pow(1 + rate, gunSteps(u)) : 1) * deepGain(u.id, stat);
}

function gunClimb(gun, stat) {
  const u = gunModOf(gun);
  const top = u && u.climbs && u.climbs[stat];
  const base = gun[stat] || 1;
  if (!top) return base;
  const steps = Math.max(1, maxLevel(u.id) - (u.unlocks ? 1 : 0));
  return base + (top - base) * gunSteps(u) / steps;
}

export const gunOwned = (gun) => !gun.unlock || level(gun.unlock) > 0;
export const gunPower = (gun) => gunStat(gun, 'power');
export const gunBase = (gun) => gun.damage * gunPower(gun);
export const gunPellets = (gun) => Math.round(gunClimb(gun, 'pellets'));
export const gunSpread = (gun) => (gun.spreadDeg || 0) * gunStat(gun, 'spread');
// A gun with a range module wears the number that module sets; the rest keep
// whatever their own module's `reach` earns them.
export function gunRange(gun) {
  const mod = modOf(gun, 'reach');
  const set = mod ? climb(mod) : 0;
  return set > 0 ? set : (gun.range || 0) * gunStat(gun, 'reach');
}
export const gunKnock = (gun) => {
  const lv = gunLevel(gun, 'knock');
  return lv > 0 ? CFG.bullet.knockBase + lv * CFG.bullet.knockPer : 0;
};

export const moveSpeed = () => CFG.player.speed * mult('speed');
export const maxHealth = () => CFG.player.maxHealth * mult('health');

// The drone flies on its own bench: nothing bought for the player's guns or
// body reaches it, and nothing bought here reaches the player.
export const droneHealth = () => CFG.drone.hp * mult('drHealth');
export const droneScale = () => 1 + CFG.drone.swell * level('drHealth');
export const droneSpeed = () => CFG.drone.speed * mult('drSpeed');
export const droneDamage = () => CFG.drone.damage * mult('drDamage');
// The cannon's reach is a distance of its own, not a multiple of the machine's:
// a drone with no cannon levels sees as far as the config says, the first level
// sets it to `base`, and the last lands it on `cap` — where it stops, since the
// endless half of the tree only ever climbs the one number it names.
export const droneRange = () => (level('drDamage') > 0
  ? Math.min(BY_ID.drDamage.reach.cap, pairOf('drDamage', 'reach'))
  : CFG.drone.range);
export const droneFireGap = () => CFG.drone.fireGap / gain('drDamage', 'rate');
export const droneCrit = () => critOf('drCrit');

// The first level pays `base` and the last pays `cap`, with the same step
// between every pair in between. A step here is a multiple rather than an
// amount, so the last levels are worth far more than the first ones — which is
// what a number that has to climb from hundreds into the thousands needs.
function rampTo(id, base, cap) {
  const lv = level(id);
  const top = maxLevel(id);
  if (lv <= 0) return 0;
  if (top <= 1) return cap;
  return Math.min(cap, base * Math.pow(cap / base, (lv - 1) / (top - 1)));
}

const ramp = (id) => rampTo(id, BY_ID[id].base, BY_ID[id].cap);

// A module's second and third numbers on the same curve as its first.
const curveOf = (id, stat) => rampTo(id, BY_ID[id][stat].base, BY_ID[id][stat].cap);

export const damageSoak = () => ramp('shield');
export const droneSoak = () => ramp('drShield');

// Machines that fly together fight better: every other drone inside the
// flight's reach pays the module's share again, up to the share it caps at.
function swarmOf(id, near) {
  const u = BY_ID[id];
  return Math.min(u.cap, u.per * level(id) * near);
}

export const droneSwarmDamage = (near) => swarmOf('drSwarmDamage', near);
export const droneSwarmSpeed = (near) => swarmOf('drSwarmSpeed', near);
export const droneSwarmShield = (near) => swarmOf('drSwarmShield', near);

// The share of what the plating already blocks, held to a ceiling of its own
// above the plating's: a flight is harder to break, never unbreakable.
export const droneSwarmSoak = (near) =>
  Math.min(BY_ID.drSwarmShield.roof, droneSoak() * (1 + droneSwarmShield(near)));

export const damageTaken = (amount) => amount * (1 - damageSoak());
export const droneTaken = (amount, near = 0) => amount * (1 - droneSwarmSoak(near));

// A level buys part of one. The game only ever hands over whole ones; the card
// shows the fraction, so a level that changes nothing still reads as progress.
const partOf = (id, base = 0) => base + level(id) * BY_ID[id].per;

// A module's second and third numbers, written beside its first as their own
// base/cap pair.
const pairOf = (id, stat) => climbTo(id, BY_ID[id][stat].base, BY_ID[id][stat].cap);

// The first level lands on `base` and the last on `cap`, in even steps between.
function climbTo(id, base, cap) {
  const lv = level(id);
  const top = maxLevel(id);
  if (lv <= 0) return 0;
  return top <= 1 ? cap : base + (cap - base) * ((lv - 1) / (top - 1));
}

function climb(id) {
  const u = BY_ID[id];
  return climbTo(id, u.base, u.cap);
}

// The singularity is priced in its own right rather than off the cannon: the
// cannon's levels open it, but nothing they buy reaches it — what it gathers is
// the attack, and its own levels are what sharpen that.
export const droneVoidRange = () => climb('drVoid');
export const droneVoidDamage = () =>
  climbTo('drVoid', BY_ID.drVoid.burn.base, BY_ID.drVoid.burn.cap);
export const droneVoidCooldown = () =>
  climbTo('drVoid', BY_ID.drVoid.cool.base, BY_ID.drVoid.cool.cap);

// The bombing run is the cannon's other half: the cannon's levels open it, and
// its own say how far the line runs, what a charge on it hits for and how wide.
export const droneBombs = () => level('drBomb') > 0;
export const droneBombRange = () => climb('drBomb');
export const droneBombCount = () => Math.min(CFG.drone.bombs.most,
  Math.round(climbTo('drBomb', BY_ID.drBomb.drops.base, BY_ID.drBomb.drops.cap)));
export const droneBombDamage = () =>
  climbTo('drBomb', BY_ID.drBomb.hit.base, BY_ID.drBomb.hit.cap);
export const droneBombRadius = () =>
  climbTo('drBomb', BY_ID.drBomb.blast.base, BY_ID.drBomb.blast.cap);
export const droneBombCooldown = () =>
  climbTo('drBomb', BY_ID.drBomb.cool.base, BY_ID.drBomb.cool.cap);

export const hasDash = () => level('dash') > 0;
export const hasJetpack = () => level('jetpack') > 0;
export const dashInvuln = () => pairOf('dash', 'invuln');
export const dashSpeed = () => moveSpeed() * CFG.player.dashMult;

// One tank, two ways to spend it: the cell says how much there is and how fast
// it comes back, and each move's own module says how little of it that move
// takes.
export const hasBomb = () => level('jetBomb') > 0;
export const hasStrike = () => level('jetStrike') > 0;
export const bombDamage = () => ramp('jetBomb');
export const bombRadius = () => curveOf('jetBomb', 'radius');
// Flat, unlike the Thunder Drop's share of the tank: a charge is a charge
// however big the cell behind it, so a bigger tank really does carry more.
export const bombCost = () => curveOf('jetBomb', 'cost');
export const strikeDamage = () => ramp('jetStrike');
export const strikeCast = () => curveOf('jetStrike', 'cast');
export const strikeReach = () => curveOf('jetStrike', 'reach');
export const hasKick = () => level('jetKick') > 0;
// The bonus is what ramps, not the multiplier: read the other way round an
// unbought module would answer zero and stop every gun in the rack dead.
export const kickMult = () => 1 + ramp('jetKick');
export const kickSeconds = () => curveOf('jetKick', 'seconds');

export const energyMax = () => CFG.player.energy.tank * mult('cell');
export const energyRegen = () => CFG.player.energy.regen * gain('cell', 'regen');
export const dashCost = () => CFG.player.energy.dash / mult('dash');
// A share of the tank rather than a number of its own: a strike is always the
// same bite out of whatever the player is carrying.
export const strikeCost = () => energyMax() * CFG.player.energy.strike;
export const flyDrain = () => CFG.player.energy.fly / mult('jetpack');
export const splashRadius = () => CFG.grenade.splash * gunStat(LAUNCH(), 'blast');
export const laserWidth = (gun) => CFG.laser.width * gunStat(gun, 'width');
export const laserBounce = () => level('lzBounce');
export const laserDamage = (gun) => CFG.laser.maxDamage * gunPower(gun);
export const grenadeRange = () => CFG.grenade.range * gunStat(LAUNCH(), 'throw');
export const grenadePart = () => partOf('lnCount', 1);
export const napalmLevel = () => level('napalm');
// The share is per second; the pool is handed what one tick of it costs.
export const napalmShare = () => ramp('napalm');
// How big the fire looks — 0 at the first level, 1 at the last. The pool's reach
// is the damage area and stays honest about it; only the flames grow.
export function napalmHeat() {
  const u = BY_ID.napalm;
  const share = napalmShare();
  return share <= 0 ? 0 : (share - u.base) / (u.cap - u.base);
}
export const napalmDamage = (dmg) => dmg * napalmShare() * CFG.napalm.tick;

export const zoomMax = () => overWaves(CFG.camera.zoom.ceiling);

function withLevel(id, lv, fn) {
  const prev = state.levels[id];
  state.levels[id] = lv;
  try { return fn(); } finally { state.levels[id] = prev; }
}

const pct = (v) => `${Math.round(v * 100)}%`;

const rack = (owned) => (owned ? 'yes' : 'no');

const STAT = {
  rfGun: [
    { label: 'Unlocked', read: () => gunOwned(REF()), fmt: rack },
    { label: 'Damage', read: () => gunDamage(REF()), fmt: (v) => v.toFixed(1) },
    { label: 'Fire rate', read: () => gunFireRate(REF()), fmt: (v) => `${v.toFixed(2)}/s` },
    { label: 'Charges', read: () => gunCharges(REF()), fmt: String },
    { label: 'Recovery', read: () => gunRecovery(REF()), fmt: (v) => `${v.toFixed(2)}/s` },
  ],
  lnGun: [
    { label: 'Unlocked', read: () => gunOwned(LAUNCH()), fmt: rack },
    { label: 'Grenade damage', read: () => gunDamage(LAUNCH()), fmt: (v) => v.toFixed(0) },
    { label: 'Fire rate', read: () => gunFireRate(LAUNCH()), fmt: (v) => `${v.toFixed(2)}/s` },
    { label: 'Charges', read: () => gunCharges(LAUNCH()), fmt: String },
    { label: 'Recovery', read: () => gunRecovery(LAUNCH()), fmt: (v) => `${v.toFixed(2)}/s` },
    { label: 'Throw range', read: () => grenadeRange(), fmt: (v) => v.toFixed(1) },
    { label: 'Blast radius', read: () => splashRadius(), fmt: (v) => v.toFixed(1) },
  ],
  sgGun: [
    { label: 'Unlocked', read: () => gunOwned(SHOT()), fmt: rack },
    { label: 'Shell damage', read: () => gunDamage(SHOT()) * gunPellets(SHOT()),
      fmt: (v) => v.toFixed(0) },
    { label: 'Fire rate', read: () => gunFireRate(SHOT()), fmt: (v) => `${v.toFixed(2)}/s` },
    { label: 'Charges', read: () => gunCharges(SHOT()), fmt: String },
    { label: 'Recovery', read: () => gunRecovery(SHOT()), fmt: (v) => `${v.toFixed(2)}/s` },
    { label: 'Pellets a shell', read: () => gunPellets(SHOT()), fmt: String },
    { label: 'Pattern width', read: () => gunSpread(SHOT()), fmt: (v) => `${v.toFixed(1)} deg` },
  ],
  lzGun: [
    { label: 'Unlocked', read: () => gunOwned(LANCE()), fmt: rack },
    { label: 'Beam damage', read: () => laserDamage(LANCE()), fmt: (v) => v.toFixed(0) },
    { label: 'Recovery', read: () => gunRecovery(LANCE()), fmt: (v) => `${v.toFixed(2)}/s` },
    { label: 'Beam width', read: () => laserWidth(LANCE()), fmt: (v) => v.toFixed(2) },
  ],
  speed:       { label: 'Move speed',      read: () => moveSpeed(),        fmt: (v) => v.toFixed(1) },
  health:      { label: 'Max health',      read: () => maxHealth(),        fmt: (v) => String(Math.round(v)) },
  shield:      { label: 'Damage blocked',  read: () => damageSoak(),
                 fmt: (v) => `${(v * 100).toFixed(v < 0.095 ? 1 : 0)}%` },
  dash: [
    { label: 'Unlocked', read: () => hasDash(), fmt: rack },
    { label: 'Dash cost', read: () => dashCost(), fmt: (v) => v.toFixed(0) },
    { label: 'Dashes per tank', read: () => energyMax() / dashCost(), fmt: (v) => v.toFixed(1) },
    { label: 'Invulnerable', read: () => dashInvuln(), fmt: (v) => `${v.toFixed(2)}s` },
  ],
  cell: [
    { label: 'Energy', read: () => energyMax(), fmt: (v) => v.toFixed(0) },
    { label: 'Refill', read: () => energyRegen(), fmt: (v) => `${v.toFixed(0)}/s` },
  ],
  jetBomb: [
    { label: 'Unlocked', read: () => hasBomb(), fmt: rack },
    { label: 'Charge damage', read: () => bombDamage(), fmt: (v) => v.toFixed(0) },
    { label: 'Blast radius', read: () => bombRadius(), fmt: (v) => `${v.toFixed(1)}u` },
    { label: 'Energy cost', read: () => bombCost(), fmt: (v) => v.toFixed(0) },
  ],
  jetStrike: [
    { label: 'Unlocked', read: () => hasStrike(), fmt: rack },
    { label: 'Strike damage', read: () => strikeDamage(), fmt: (v) => v.toFixed(0) },
    { label: 'Field radius', read: () => strikeReach(), fmt: (v) => `${v.toFixed(1)}u` },
    { label: 'Marking range', read: () => strikeCast(), fmt: (v) => `${v.toFixed(0)}u` },
  ],
  jetKick: [
    { label: 'Unlocked', read: () => hasKick(), fmt: rack },
    { label: 'Fire rate', read: () => kickMult(),
      fmt: (v) => `+${Math.round((v - 1) * 100)}%` },
    { label: 'Lasts', read: () => kickSeconds(), fmt: (v) => `${v.toFixed(1)}s` },
  ],
  jetpack: [
    { label: 'Unlocked', read: () => hasJetpack(), fmt: rack },
    { label: 'Flight time', read: () => energyMax() / flyDrain(), fmt: (v) => `${v.toFixed(1)}s` },
    { label: 'Fuel burnt', read: () => flyDrain(), fmt: (v) => `${v.toFixed(0)}/s` },
  ],
  sgKnock:     { label: 'Pellet shove',    read: () => gunKnock(SHOT()),   fmt: (v) => v.toFixed(1) },
  sgReach:     { label: 'Pellet reach',    read: () => gunRange(SHOT()),   fmt: (v) => `${v.toFixed(1)}u` },
  lzBounce:    { label: 'Bounces',         read: () => laserBounce(),      fmt: String },
  lnCount:     { label: 'Grenades',        read: () => grenadePart(),      fmt: (v) => v.toFixed(1) },
  foresight:   { label: 'Unlocks',         read: () => sightAt(level('foresight')),
                 fmt: (v) => v, single: true },
  adrenaline: [
    { label: 'Fire rate', read: () => adrenalineMult(),
      fmt: (v) => `+${Math.round((v - 1) * 100)}%` },
    { label: 'Duration', read: () => adrenalineSeconds(), fmt: (v) => `${v.toFixed(1)}s` },
    { label: 'Damage', read: () => adrenalineDamage(),
      fmt: (v) => `+${Math.round((v - 1) * 100)}%` },
    { label: 'Gun recovery', read: () => adrenalineCharge(),
      fmt: (v) => `${Math.round(v * 100)}%` },
  ],
  reflex: [
    { label: 'Dash window',  read: () => dodgeWindow(),
      fmt: (v) => `${Math.round(v * 1000)}ms`, single: true },
    { label: 'Health back',  read: () => dodgeShare(),
      fmt: (v) => `${(v * 100).toFixed(2)}%` },
    { label: 'Gun recovery', read: () => dodgeCharge(), fmt: pct },
  ],
  nerve: [
    { label: 'Health back', read: () => grazeShare(),
      fmt: (v) => `${(v * 100).toFixed(2)}%` },
    { label: 'Gun recovery', read: () => grazeCharge(), fmt: pct },
  ],
  crit:        { label: 'Crit chance',     read: () => critChance(),
                 fmt: (v) => `${(v * 100).toFixed(v < 0.095 ? 1 : 0)}%` },
  drHealth:    { label: 'Drone health',    read: () => droneHealth(),
                 fmt: (v) => String(Math.round(v)) },
  drSpeed:     { label: 'Drone speed',     read: () => droneSpeed(),      fmt: (v) => v.toFixed(1) },
  drShield:    { label: 'Damage blocked',  read: () => droneSoak(),
                 fmt: (v) => `${(v * 100).toFixed(v < 0.095 ? 1 : 0)}%` },
  drDamage: [
    { label: 'Drone damage', read: () => droneDamage(), fmt: (v) => v.toFixed(v < 100 ? 1 : 0) },
    { label: 'Drone fire rate', read: () => 1 / droneFireGap(), fmt: (v) => `${v.toFixed(2)}/s` },
    { label: 'Drone range', read: () => droneRange(), fmt: (v) => `${v.toFixed(1)}u` },
  ],
  drCrit:      { label: 'Drone crit',      read: () => droneCrit(),
                 fmt: (v) => `${(v * 100).toFixed(v < 0.095 ? 1 : 0)}%` },
  drPierce:    { label: 'Damage retained', read: () => dronePierce(), fmt: pct },
  drSwarmDamage: { label: 'Damage a drone near', read: () => swarmOf('drSwarmDamage', 1),
                   fmt: (v) => `+${pct(v)}` },
  drSwarmSpeed:  { label: 'Speed a drone near',  read: () => swarmOf('drSwarmSpeed', 1),
                   fmt: (v) => `+${pct(v)}` },
  drSwarmShield: { label: 'Blocking a drone near', read: () => swarmOf('drSwarmShield', 1),
                   fmt: (v) => `+${pct(v)}` },
  drVoid: [
    { label: 'Pull range', read: () => droneVoidRange(), fmt: (v) => `${v.toFixed(1)}u` },
    { label: 'Burn damage', read: () => droneVoidDamage(), fmt: (v) => String(Math.round(v)) },
    { label: 'Every', read: () => droneVoidCooldown(), fmt: (v) => `${v.toFixed(1)}s` },
  ],
  drBomb: [
    { label: 'Run length', read: () => droneBombRange(), fmt: (v) => `${v.toFixed(1)}u` },
    { label: 'Bombs', read: () => droneBombCount(), fmt: String },
    { label: 'Bomb damage', read: () => droneBombDamage(), fmt: (v) => String(Math.round(v)) },
    { label: 'Blast radius', read: () => droneBombRadius(), fmt: (v) => `${v.toFixed(1)}u` },
    { label: 'Every', read: () => droneBombCooldown(), fmt: (v) => `${v.toFixed(1)}s` },
  ],
  drZap: [
    { label: 'Zap jumps', read: () => droneJumps(), fmt: String },
    { label: 'Zap chance', read: () => droneArcChance(), fmt: pct },
    { label: 'Zap reach', read: () => droneArcRange(), fmt: (v) => v.toFixed(1) },
  ],
  rfPierce:    { label: 'Damage retained', read: () => gunPierce(REF()),   fmt: pct },
  sgPierce:    { label: 'Damage retained', read: () => gunPierce(SHOT()),  fmt: pct },
  napalm:      { label: 'Burn per second', read: () => napalmShare(),         fmt: pct },
  rfChain: [
    { label: 'Arc jumps', read: () => chainJumps(), fmt: String },
    { label: 'Arc chance', read: () => arcChance(), fmt: pct },
    { label: 'Arc reach', read: () => arcRange(), fmt: (v) => v.toFixed(1) },
  ],
  // Every gun's own branch writes its card where its numbers live, so a module
  // and the rows that describe it never drift apart.
  ...GUNMOD_STATS,
};

// Most rows are a number getting better, and read as `before -> after`. A row
// marked `single` is not: it is what this level hands you, and an arrow from the
// last one would say you had traded it away.
export function previewAt(id, lv) {
  const st = STAT[id];
  if (!st) return [];
  return [].concat(st)
    .map((row) => (row.single
      ? { label: row.label, after: row.fmt(withLevel(id, lv, row.read)) }
      : {
        label: row.label,
        before: row.fmt(withLevel(id, Math.max(0, lv - 1), row.read)),
        after: row.fmt(withLevel(id, lv, row.read)),
      }))
    .filter((row) => row.before === undefined || row.before !== row.after);
}
