import * as THREE from 'three';
import { CFG, BUG_TYPES, SPECIAL, SPECIAL_TRACK } from '../config/index.js';
import { world, state } from '../core/world.js';
import { openClock } from '../music/clock.js';
import { SpecialWave } from '../music/specialwave.js';
import { audio } from '../engine/audio.js';
import { music } from '../engine/music.js';
import * as waves from './waves.js';
import * as coins from './coins.js';
import * as drops from '../items/drops.js';
import { ITEMS } from '../items/catalog.js';
import * as effects from '../items/effects.js';
import * as drone from '../allies/drone.js';
import * as arena from '../arena/size.js';
import * as open from './specialopen.js';
import * as walls from '../arena/walls.js';
import * as modules from '../modules/index.js';
import * as sector from './sector.js';

// The scripted wave. The music holds each part until the group it released is
// dead, so the director's whole job is: fire what the part asks for, watch for
// the floor to clear, and tell the clock to move on.
let run = null;

const typeOf = (key) => BUG_TYPES.find((t) => t.key === key) || null;

export const due = (n) => n === SPECIAL.wave;
export const active = () => !!run;

// The track, fetched and decoded once and kept for the rest of the session: a
// retry must not pay 9MB again. Warmed in the background at boot beside the
// rest of the music, because the wave can be picked from the selector at any
// time — never through the loading bar, which nothing should wait 9MB for.
let deck = null;
let warming = null;

export function warm() {
  if (deck || warming) return warming;
  warming = (async () => {
    try {
      const player = new SpecialWave({ track: SPECIAL_TRACK, rig: () => audio.musicRig() });
      await player.load();
      deck = player;
    } catch (e) {
      console.warn('special wave: no music, the wave runs silent', e);
      deck = null;
    }
    return deck;
  })();
  return warming;
}

// The track arriving late — the wave started before the boot warm reached it.
// Rather than play the whole wave silent it comes in at the top, but only while
// the opening part is still up: past that the score would land somewhere the
// fight has already left.
function goLoud() {
  if (!run || run.loud || !deck || run.part !== SPECIAL.order[0]) return;
  const rig = audio.musicRig();
  if (!rig || rig.ac.state !== 'running' || music.muted) return;
  hush();
  run.loud = true;
  run.clock.stop();
  run.clock = openClock({ music: deck, onEvent: (e) => run.events.push(e) });
  run.clock.start(0);
}

// The deck, taken before the wave rather than at its first bar: the briefing
// ahead of it is silent, and the shuffle coming back for the second between the
// button and the track starting would step on the opening.
let ceded = false;

export function hush() {
  ceded = true;
  music.takeOver(deck && deck.url);
}

function giveBack() {
  if (!ceded) return;
  ceded = false;
  music.release();
}

export function begin() {
  clear();
  const events = [];
  // Audio only if the track is decoded and the context is actually running —
  // a wave that would play in silence should say so up front rather than sit
  // waiting for a gesture that is not coming.
  const rig = audio.musicRig();
  const loud = deck && rig && rig.ac.state === 'running' && !music.muted;
  if (loud) hush(); else giveBack();
  const clock = openClock({ music: loud ? deck : null, onEvent: (e) => events.push(e) });
  run = {
    clock,
    events,
    loud: !!loud,
    part: null,
    flight: null,
    fired: new Set(),
    queue: [],
    held: [],
    coined: 0,
    plan: null,
    owed: 0,
    asked: null,
    spill: 0,
    siege: 0,
    sieged: false,
    lent: false,
    stream: 0,
    streamed: false,
    tick: 0,
    bounty: [],
    clocks: SPECIAL.clocks.map((c) => c.every),
    over: false,
  };
  // Whole, however the last wave ended: this one is long, there is no pad to
  // reach until the music has run out, and it opens in the dark.
  if (world.player) world.player.health = modules.maxHealth();
  open.begin();
  clock.start(0);
  waves.useScript(over);
  if (!loud) warm().then(goLoud);
}

export function clear() {
  giveBack();
  if (!run) return;
  if (run.flight) drone.dismiss(run.flight);
  modules.lendDrones(false);
  coins.setPayRate(1);
  open.clear();
  run.clock.stop();
  run = null;
  waves.useScript(null);
}

export function pause() { if (run) { run.clock.pause(); open.pause(); } }
export function resume() { if (run) run.clock.resume(); }

// The wave is over when the music has run out, not when the floor has: the
// outro is a lap of honour and the pad waits for it.
export const over = () => !!run && run.over && standing() === 0;

const standing = () =>
  SPECIAL.order.reduce((n, name) => n + waves.standingTagged(name), 0);

const spec = (name) => SPECIAL.parts[name] || { hold: 0, groups: [] };

function enter(name) {
  // A part start for the part already up is a repeat, not a new one — a pause
  // and a resume re-announce it, and so does swapping the clock underneath.
  // Acting on it twice would fire the part's groups a second time.
  if (name === run.part) return;

  // Machines called up for the part that is ending go home with it: they were
  // lent to a stretch of music, not bought.
  if (run.flight) { drone.dismiss(run.flight); run.flight = null; }

  run.part = name;
  run.fired.clear();
  run.queue.length = 0;
  run.owed = 0;
  run.siege = 0;
  run.sieged = false;
  run.stream = 0;
  run.streamed = false;
  run.bounty.length = 0;
  run.coined = 0;
  run.asked = null;
  state.phase = Math.max(1, SPECIAL.order.indexOf(name) + 1);

  const p = spec(name);
  run.plan = p.coins ? plot(p.coins.step) : null;
  if (p.radius) arena.setRadius(p.radius, p.over === undefined ? CFG.arena.growTime : p.over);
  for (const id of p.drops || []) {
    const item = ITEMS.find((i) => i.id === id);
    if (item) drops.drop(scatter(_spot), item);
  }
  if (p.drones) run.flight = drone.callIn(p.drones);
}

const _spot = new THREE.Vector3();

// Anywhere on the floor the player has to walk to. Uniform over the disc rather
// than over the radius, so coins do not bunch up in the middle.
function scatter(out) {
  const r = Math.max(4, arena.radius() - CFG.coins.radius - 3);
  const a = Math.random() * Math.PI * 2;
  const d = Math.sqrt(Math.random()) * r;
  out.set(Math.cos(a) * d, 0, Math.sin(a) * d);
  if (walls.push(out.x, out.z, 1, out)) out.y = 0;
  return out;
}

// The next batch the part still owes and the mark it comes out on — its own if
// it named one, the part's handover otherwise. Read in one place so what lets a
// push out and what fills in for it can never disagree about the number.
function owed() {
  const p = spec(run.part);
  const next = p.groups.reduce((m, g, i) => (run.fired.has(i) ? m : Math.min(m, g.at)), Infinity);
  if (next === Infinity) return null;
  const lead = p.groups.find((g, i) => !run.fired.has(i) && g.at === next);
  return { next, mark: lead && lead.floor !== undefined ? lead.floor : p.handover };
}

function fireDue() {
  const p = spec(run.part);
  const at = run.clock.secsInto();
  const due = owed();
  if (!due) return;
  const next = due.next;

  // Groups written at the same second are one push and go together. A part with
  // a `handover` is paced by the fight rather than the clock: the next push
  // waits for the last to thin out, however long the player takes. The pending
  // count is what stops it cascading — bugs still climbing out of a fresh
  // breach are already standing.
  // Bars first, then the siege. A push paced by the fight must not go out while
  // the score still owes the part a group, or over the empty floor a part opens
  // on before its siege has even started.
  if (p.groups.some((g, i) => g.bar !== undefined && !run.fired.has(i))) return;
  if (p.stream && !run.streamed) return;
  if (p.siege && !run.sieged) return;

  // Nothing owed. A push still coming out a group at a time is not a floor that
  // has thinned: `standingTagged` cannot see what is waiting in the queue, so a
  // scattered push would read as almost cleared on the frame after it fires.
  if (run.queue.length) return;

  const paced = p.handover !== undefined;
  if (paced ? waves.standingTagged(run.part) >= due.mark : at < next) return;
  const upto = paced ? next : at;

  p.groups.forEach((g, i) => {
    if (run.fired.has(i) || g.at > upto) return;
    release(g, i);
  });
}

// A gift is named by id, or by an object when it wants more than the default:
// `seconds` overrides how long it runs and `own` keeps whatever the catalog
// gave it, `wait` holds it back until the player has nothing running, `last`
// until every bug of the part is dead.
const giftOf = (spec) => {
  if (!spec) return null;
  const opt = typeof spec === 'string' ? { id: spec } : spec;
  const item = ITEMS.find((i) => i.id === opt.id);
  if (!item) return null;
  const runs = opt.own ? item.seconds : opt.seconds || SPECIAL.gift.seconds;
  return { ...item, seconds: runs,
           wait: !!opt.wait, last: !!opt.last,
           keep: !!opt.keep, entry: !!opt.entry };
};

const busy = () => !!world.player && effects.active(world.player).size > 0;
const under = (name) => !!world.player && effects.active(world.player).has(name);

// Where the part's own last bug went down, so a gift owed to the end of a group
// lands where the group ended rather than where its carrier happened to fall.
const _fell = new THREE.Vector3();

export function fell(at, bug) {
  if (!run || !bug) return;
  if (bug.tag === run.part) _fell.copy(at);
  // The first kills out of a stream are paid what it was sent with, in the
  // order it was written: whatever dies first is what was carrying.
  if (bug.bounty && run.bounty.length) drops.drop(at, giftOf(run.bounty.shift()));
}

// What a carrier was holding. A gift that waits is kept back rather than laid
// on the floor: an item picked up under a buff already on the clock is half
// spent before it is felt, and one owed to the end of a group is not earned
// until the group is gone.
export function gift(at, item) {
  if (!run || !(item.last || (item.wait && busy()))) { drops.drop(at, item); return; }
  run.held.push({ at: item.last ? null : at.clone(), item, tag: run.part });
}

function tickHeld() {
  for (let i = run.held.length - 1; i >= 0; i--) {
    const h = run.held[i];
    if (h.item.last && waves.standingTagged(h.tag) > 0) continue;
    if (h.item.wait && busy()) continue;
    drops.drop(h.at || _fell, h.item);
    run.held.splice(i, 1);
  }
}

// Where a group is told to come up, when it is told at all. Nudged clear of the
// walls the same way anything else placed by hand is.
const _hole = new THREE.Vector3();

function spotOf(g) {
  const a = Math.random() * Math.PI * 2;
  if (g.near) {
    const p = world.player.pos;
    const d = g.near[0] + Math.random() * (g.near[1] - g.near[0]);
    _hole.set(p.x + Math.cos(a) * d, 0, p.z + Math.sin(a) * d);
  } else if (g.deg !== undefined) {
    const d = arena.radius() * g.r;
    _hole.set(Math.cos((g.deg * Math.PI) / 180) * d, 0, Math.sin((g.deg * Math.PI) / 180) * d);
  } else {
    return null;
  }
  arena.ring(_hole, CFG.spawn.breach, 1);
  if (walls.push(_hole.x, _hole.z, 1, _hole)) _hole.y = 0;
  return _hole;
}

function send(g, tag) {
  waves.breach(g.count, spotOf(g), 1, {
    species: g.species ? typeOf(g.species) : null,
    level: SPECIAL.level,
    tag,
    gift: giftOf(g.gift),
    bounty: !!g.bounty,
  });
}

// Held back groups keep the part they were armed for: a queue outliving its
// part would put its bugs on the next one's tab.
function release(g, i) {
  run.fired.add(i);
  if (g.after > 0) run.queue.push({ g, wait: g.after, tag: run.part });
  else send(g, run.part);
}

function tickQueue(dt) {
  for (let i = run.queue.length - 1; i >= 0; i--) {
    const q = run.queue[i];
    q.wait -= dt;
    if (q.wait > 0) continue;
    send(q.g, q.tag);
    run.queue.splice(i, 1);
  }
}

// A stretch of time the part keeps stocked. It is not a list of groups: while
// it runs, the floor is topped back up whenever it drops below the mark, for
// however many that takes.
// A drip rather than a wall: a small set every `every` seconds for `seconds`,
// so the floor is never empty and never filled either.
function openStream(n) {
  if (!run.part) return;
  const s = spec(run.part).stream;
  if (!s || run.streamed || run.stream > 0 || s.bar !== n) return;
  run.stream = s.seconds;
  run.tick = 0;
  run.bounty = [...(s.bounty || [])];
}

// Owed to a clock rather than to a kill, so these land whatever the floor is
// doing — including in the middle of a push, which is when they are wanted.
// One that is held back keeps counting past zero and drops as soon as it can.
function tickClocks(dt) {
  SPECIAL.clocks.forEach((c, i) => {
    run.clocks[i] -= dt;
    if (run.clocks[i] > 0 || (c.not && under(c.not))) return;
    run.clocks[i] = c.every;
    drops.drop(scatter(_spot), giftOf(c));
  });
}

function tickStream(dt) {
  if (run.stream <= 0) return;
  const s = spec(run.part).stream;
  run.stream -= dt;
  if (run.stream <= 0) { run.stream = 0; run.streamed = true; return; }
  run.tick -= dt;
  if (run.tick > 0) return;
  run.tick = s.every;
  for (const [count, species] of s.each) send({ count, species, bounty: true }, run.part);
}

// A part may fly the player better machines than they own, in one sector, for
// as long as the beacons it handed out are still up. A loan, never banked.
function loan() {
  // Latched on the first beacon and held for the rest of the wave: the machines
  // it called up stay, so what they fly with has to stay with them.
  if (!run.lent && under('support')) run.lent = true;
  modules.lendDrones(run.lent && sector.current() === SPECIAL.lend);
}

function openSiege(n) {
  if (!run.part) return;
  const s = spec(run.part).siege;
  if (!s || run.sieged || run.siege > 0 || s.bar !== n) return;
  run.siege = s.seconds;
}

function tickSiege(dt) {
  const s = spec(run.part).siege;
  // A siege pays its own way down: it puts out more than a floor is worth, and
  // what it is worth is set against it rather than against the wave.
  coins.setPayRate(run.siege > 0 && s && s.pay !== undefined ? s.pay : 1);
  if (run.siege <= 0) return;
  run.siege -= dt;
  if (run.siege <= 0) { run.siege = 0; run.sieged = true; return; }
  let n = waves.standingTagged(run.part);
  if (n >= s.low) return;
  for (let hole = 0; hole < 24 && n + s.count <= s.aim; hole++) {
    send({ count: s.count }, run.part);
    n += s.count;
  }
}

// A group written against a bar rather than a stopwatch. The bar comes round
// every time the part loops; `fired` is what keeps it to one release.
function fireAtBar(n) {
  if (!run.part) return;
  spec(run.part).groups.forEach((g, i) => {
    if (g.bar === n && !run.fired.has(i)) release(g, i);
  });
}

// Every spot the outro will lay a coin on, worked out once when the part opens.
// A jittered grid rather than a scatter: `step` under five root two is what puts
// one inside any five-unit circle you could stand in, which random placement
// leaves to luck. Shuffled, so the floor fills all over at once rather than
// sweeping across in rows.
function plot(step) {
  const r = arena.radius() - CFG.coins.radius - 1;
  const out = [];
  for (let x = -r; x <= r; x += step) {
    for (let z = -r; z <= r; z += step) {
      const jx = x + (Math.random() - 0.5) * step * 0.7;
      const jz = z + (Math.random() - 0.5) * step * 0.7;
      if (Math.hypot(jx, jz) <= r) out.push({ x: jx, z: jz });
    }
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function rain(dt) {
  const p = spec(run.part);
  if (!p.coins || !run.plan) return;
  run.owed += (run.plan.length / p.coins.seconds) * dt;
  while (run.coined < run.owed && run.coined < run.plan.length) {
    const s = run.plan[run.coined++];
    _spot.set(s.x, 0, s.z);
    if (walls.push(_spot.x, _spot.z, 1, _spot)) _spot.y = 0;
    coins.drop(_spot, p.coins.value);
  }
}

// The part is done and the music has not come to its exit yet. Rather than
// leave the player on an empty floor for what may be most of a loop, one more
// climbs out every few seconds until the next part lands.
// Filler, and only ever filler. There are two waits worth filling: one before
// the part has finished releasing, and one after it has been handed over and is
// waiting on the music to find its exit. Between them — everything out and the
// player working through it — the floor is left alone, or standing would never
// reach nought and the part could never be called clear.
function spill(dt) {
  const S = SPECIAL.spill;
  const p = spec(run.part);
  const owing = p.groups.some((g, i) => !run.fired.has(i))
    || (p.siege && !run.sieged) || (p.stream && !run.streamed);
  // Under whatever the next push is actually waiting for — which may be its own
  // mark rather than the part's — so filling the floor can never hold off the
  // very push it is filling in for. A batch that wants an empty floor gets one.
  const due = owed();
  const mark = due && due.mark !== undefined ? due.mark : Infinity;
  const cap = Math.min(S.keep, mark - 1);

  // Nothing before the part has put anything out — the intro's dark opening is
  // meant to be empty — and nothing while the queue still owes it bugs, which
  // is a floor about to fill rather than one that has run dry.
  if (p.spill === false || !run.fired.size || run.queue.length
      || (!owing && run.asked !== run.part)
      || waves.standingTagged(run.part) >= cap
      || waves.standingTagged(run.part, S.species) >= S.most) {
    run.spill = S.every;
    return;
  }
  run.spill -= dt;
  if (run.spill > 0) return;
  run.spill = S.every;
  send({ count: 1, species: S.species }, run.part);
}

function cleared() {
  const p = spec(run.part);
  if (run.fired.size < p.groups.length) return false;
  if (p.stream && !run.streamed) return false;
  // What the part handed out is part of the part: it is not done until what its
  // carriers were holding has been picked up off the floor. Named rather than
  // counted in the round, so the plating on its own clock cannot hold a part
  // open by lying somewhere unfound.
  if (p.awaits && [].concat(p.awaits).some((id) => drops.lying(id) > 0)) return false;
  if (p.siege && !run.sieged) return false;
  // A group counted as fired but still waiting out its delay is a floor about
  // to fill: calling the part clear now would cut the music off over it.
  if (run.queue.length) return false;
  if (run.clock.barsInto() < (p.hold || 0)) return false;
  return waves.standingTagged(run.part) === 0;
}

export function update(dt) {
  if (!run) return;
  run.clock.update(dt);

  for (const e of run.events.splice(0)) {
    if (e.kind === 'part') enter(e.name);
    else if (e.kind === 'beat') open.beat();
    else if (e.kind === 'finish') run.over = true;
    else if (e.kind === 'bar') {
      open.bar(e.bar);
      fireAtBar(e.bar);
      openStream(e.bar);
      openSiege(e.bar);
    }
  }
  open.update(dt);

  // Owed to the clock rather than to a kill, so it lands whatever the floor is
  // doing — including in the middle of a push, which is when it is wanted.
  tickClocks(dt);

  if (!run.part) return;

  loan();
  tickStream(dt);
  tickSiege(dt);
  fireDue();
  tickQueue(dt);
  rain(dt);
  if (run.held.length) tickHeld();
  // The last part is not cleared by killing anything — it ends when the music
  // does, which `finish` has already latched.
  const last = run.part === SPECIAL.order[SPECIAL.order.length - 1];
  if (!last && run.asked !== run.part && cleared()) {
    run.asked = run.part;
    run.spill = SPECIAL.spill.every;
    run.clock.markDone(run.part);
  }
  spill(dt);
}

// What the director thinks is going on. The debug menu and the headless tests
// both read it; nothing in the game does.
export function probe() {
  if (!run) return null;
  const p = spec(run.part);
  const at = run.clock.where();
  return {
    clock: run.loud ? 'audio' : 'silent',
    warmed: !!deck,
    part: run.part,
    step: SPECIAL.order.indexOf(run.part) + 1,
    steps: SPECIAL.order.length,
    bar: at.bar,
    beat: at.beat,
    time: +run.clock.time().toFixed(2),
    secsInto: +run.clock.secsInto().toFixed(1),
    barsInto: +run.clock.barsInto().toFixed(1),
    hold: p.hold || 0,
    siege: +run.siege.toFixed(1),
    stream: +run.stream.toFixed(1),
    fired: run.fired.size,
    groups: p.groups.length,
    mine: run.part ? waves.standingTagged(run.part) : 0,
    standing: standing(),
    done: run.clock.done(),
    asked: run.asked === run.part,
    ready: !!run.part && cleared(),
    over: run.over,
    finished: run.clock.finished(),
    coined: run.coined,
  };
}

// Everything the wave will send, in order, so `beginWave` can fill the quota and
// the watchtower sign off the script rather than off the curve.
export const phasePlan = () =>
  SPECIAL.order.map((name) => spec(name).groups.reduce((n, g) => n + g.count, 0));

export const groupPlan = () =>
  SPECIAL.order.map((name) => spec(name).groups.map((g) => g.count));
