import { state } from '../core/world.js';
import { CFG } from '../config/index.js';
import { audio } from '../engine/audio.js';
import { take, flightDealt } from '../game/ledger.js';
import * as fmt from '../ui/format.js';

const el = { purse: null, layer: null, tally: null, count: null,
             repair: null, repairCount: null, repairTook: null,
             repairLost: null, repairDealt: null, repairNet: null };
const sprites = [];
const flights = [];

let run = null;
let toPurse = null;
let purse = null;
let pop = { purse: 0, tally: 0 };
const POPS = Object.keys(pop);

const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const smooth = (t) => t * t * (3 - 2 * t);
const beforeTake = () => state.coins - take();

const rolled = (from, to, rate, dt) => from + (to - from) * (1 - Math.exp(-rate * dt));

function acquire() {
  const sprite = sprites.pop() || (() => {
    const d = document.createElement('div');
    d.className = 'coinfly';
    el.layer.appendChild(d);
    return d;
  })();
  sprite.style.display = 'block';
  return sprite;
}

function recycle(f) {
  f.sprite.style.display = 'none';
  sprites.push(f.sprite);
}

function clearFlights() {
  for (const f of flights) recycle(f);
  flights.length = 0;
}

// Even shares that still sum to the whole take, so the last coin lands the
// remainder instead of the count stopping short.
const shareAt = (total, i, n) =>
  Math.floor((total * (i + 1)) / n) - Math.floor((total * i) / n);

const centreOf = (node) => {
  const r = node.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

const paintTally = () => { el.count.textContent = `+${fmt.coins(run ? run.shown : take())}`; };
const paintPurse = () => { el.purse.textContent = fmt.coins(purse ? purse.shown : state.coins); };

// Coins come in off the ring around the count and land on it — or leave it the
// same way, when what is being counted is a cost rather than a take.
function spawn() {
  const P = CFG.payout;
  const jitter = () => (Math.random() * 2 - 1) * P.jitter;
  const a = Math.random() * Math.PI * 2;
  const r = P.throw * (0.7 + Math.random() * 0.6);
  const out = { x: run.to.x + Math.cos(a) * r, y: run.to.y + Math.sin(a) * r * 0.62 };
  const from = run.away ? run.to : out;
  const to = run.away ? out : run.to;

  flights.push({
    sprite: acquire(), t: 0,
    from,
    to,
    bend: {
      x: (from.x + to.x) / 2 + jitter(),
      y: Math.min(from.y, to.y) - P.arc * (0.7 + Math.random() * 0.6),
    },
    share: shareAt(run.earned, run.sent, run.trips),
    pitch: run.sent / Math.max(1, run.trips - 1),
  });
  run.sent += 1;
}

// A cost is the same chime walked down rather than up: coins going out are the
// count coming apart.
function land(f) {
  const P = CFG.payout;
  run.counted += run.away ? -f.share : f.share;
  pop.tally = 1;
  audio.play('coin', {
    rate: P.chime.rate + P.chime.rise * (run.away ? -f.pitch : f.pitch),
    gainScale: P.chime.gain,
    force: true,
  });
}

function fly(f, dt) {
  const P = CFG.payout;
  f.t = Math.min(1, f.t + dt / P.flight);
  const t = easeOut(f.t);
  const u = 1 - t;
  const x = u * u * f.from.x + 2 * u * t * f.bend.x + t * t * f.to.x;
  const y = u * u * f.from.y + 2 * u * t * f.bend.y + t * t * f.to.y;
  const scale = 0.7 + Math.sin(t * Math.PI) * 0.5;
  f.sprite.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) `
    + `translate(-50%, -50%) scale(${scale.toFixed(2)})`;
  f.sprite.style.opacity = String(Math.min(1, (1 - f.t) * 4));
}

export function init(refs) { Object.assign(el, refs); }

// The purse opens short of the wave's take only when the count is about to hand
// it over. A screen that runs no payout — a resumed run, a sector picked back up
// — has already banked that take, and holding it back there reads as coins lost.
export const hasRepair = () => state.waveRepair > 0;

// The wave's books, so what was charged can be read rather than taken on trust:
// what was picked up, what it cost, and what is left once the flight's losses
// are paid for.
function paintBooks() {
  const { flight, all } = flightDealt();
  const share = all > 0 ? (flight / all) * 100 : 0;

  el.repairTook.textContent = fmt.coins(state.waveEarned);
  el.repairLost.textContent = String(state.waveLost);
  el.repairDealt.textContent = `${share.toFixed(2)}%`;
  el.repairCount.textContent = `-${fmt.coins(state.waveRepair)}`;
  el.repairNet.textContent = fmt.coins(take());
}

export function reset(counting = true) {
  stop();
  el.repair.classList.toggle('hidden', !hasRepair());
  paintBooks();
  el.count.textContent = '+0';
  el.purse.textContent = fmt.coins(counting ? beforeTake() : state.coins);
}

export function stop() {
  clearFlights();
  run = toPurse = purse = null;
  pop = { purse: 0, tally: 0 };
  el.purse.style.transform = '';
  el.tally.style.transform = '';
  el.tally.style.opacity = '';
  el.tally.style.transition = '';
  el.repair.classList.remove('paying');
  el.repairNet.style.transform = '';
  el.repairNet.style.opacity = '';
}

function count(amount, from, trips, spacing, done, away = false) {
  run = {
    earned: amount, counted: from, shown: from, sent: 0, wait: CFG.payout.lead,
    trips: Math.min(amount, trips),
    spacing,
    to: centreOf(el.tally),
    away,
    done,
  };
  paintTally();
}

export function tally(done) {
  const P = CFG.payout;
  count(state.waveEarned, 0, P.trips, P.spacing, done);
}

// The cost, counted the way the take was: the same coins, flying back off the
// total instead of onto it, until what is left is what the wave actually pays.
export function repair(done) {
  const P = CFG.payout;
  count(state.waveRepair, state.waveEarned, P.trips, P.spacing, done, true);
}

// What flies to the purse is what is actually being banked: the count, when the
// wave paid straight out, and the line under the books when a repair came off
// it. The rest of the screen is taken away as it goes.
export function bank(done) {
  pop.tally = 0;
  el.tally.style.transform = '';

  const paying = hasRepair();
  const node = paying ? el.repairNet : el.tally;
  node.style.transform = '';
  if (paying) {
    el.repair.classList.add('paying');
    el.tally.style.transition = 'opacity .28s ease';
    el.tally.style.opacity = '0';
  }

  const from = node.getBoundingClientRect();
  const to = el.purse.getBoundingClientRect();
  toPurse = {
    t: 0, done, node,
    dx: to.left + to.width / 2 - (from.left + from.width / 2),
    dy: to.top + to.height / 2 - (from.top + from.height / 2),
    shrink: to.height / from.height,
  };
}

// Everything counted, nothing hidden: what a skip does while the numbers still
// have to be read.
export function settle() {
  clearFlights();
  run = toPurse = purse = null;
  pop = { purse: 0, tally: 0 };
  el.tally.style.transform = '';
  el.count.textContent = `+${fmt.coins(take())}`;
  el.purse.textContent = fmt.coins(beforeTake());
}

export function finish() {
  clearFlights();
  run = toPurse = purse = null;
  pop = { purse: 0, tally: 0 };
  el.purse.style.transform = '';
  el.tally.style.opacity = '0';
  el.count.textContent = `+${fmt.coins(take())}`;
  el.purse.textContent = fmt.coins(state.coins);
}

function decayPops(dt) {
  const P = CFG.payout;
  for (const key of POPS) {
    if (!pop[key]) continue;
    pop[key] *= Math.exp(-P.popEase * dt);
    if (pop[key] < 0.004) { pop[key] = 0; el[key].style.transform = ''; continue; }
    el[key].style.transform = `scale(${(1 + pop[key] * P.pop).toFixed(3)})`;
  }
}

function countUp(dt) {
  const P = CFG.payout;
  run.wait -= dt;
  while (run.wait <= 0 && run.sent < run.trips) {
    spawn();
    run.wait += run.spacing;
  }

  for (let i = flights.length - 1; i >= 0; i--) {
    const f = flights[i];
    fly(f, dt);
    if (f.t < 1) continue;
    land(f);
    recycle(f);
    flights[i] = flights[flights.length - 1];
    flights.pop();
  }

  // The count rolls towards what has landed rather than stepping by whole
  // shares, so a big take reads as a spinning total.
  const before = Math.round(run.shown);
  run.shown = rolled(run.shown, run.counted, P.roll, dt);
  if (Math.round(run.shown) !== before) paintTally();

  if (run.sent < run.trips || flights.length || Math.abs(run.counted - run.shown) > 0.5) return;
  run.shown = run.counted;
  paintTally();
  const done = run.done;
  run = null;
  done();
}

function flyToPurse(dt) {
  const P = CFG.payout;
  toPurse.t = Math.min(1, toPurse.t + dt / P.bankFlight);
  const t = smooth(toPurse.t);
  const k = 1 + (toPurse.shrink - 1) * t;
  toPurse.node.style.transform =
    `translate(${(toPurse.dx * t).toFixed(1)}px, ${(toPurse.dy * t).toFixed(1)}px) scale(${k.toFixed(3)})`;
  toPurse.node.style.opacity = Math.min(1, (1 - toPurse.t) / P.bankFade).toFixed(3);
  if (toPurse.t < 1) return;

  pop.purse = 1.4;
  audio.play('coin', { rate: 1.3, gainScale: P.chime.gain, force: true });
  purse = { t: 0, from: beforeTake(), shown: beforeTake(), done: toPurse.done };
  toPurse = null;
}

function fillPurse(dt) {
  purse.t = Math.min(1, purse.t + dt / CFG.payout.fill);
  purse.shown = purse.from + (state.coins - purse.from) * easeOut(purse.t);
  paintPurse();
  if (purse.t < 1) return;
  const done = purse.done;
  purse = null;
  done();
}

export function update(dt) {
  decayPops(dt);
  if (run) countUp(dt);
  else if (toPurse) flyToPurse(dt);
  else if (purse) fillPurse(dt);
}
