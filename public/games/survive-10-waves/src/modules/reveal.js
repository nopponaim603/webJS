import { CFG } from '../config/index.js';
import * as payout from './payout.js';
import { take } from '../game/ledger.js';

const STAGES = ['tally', 'repair', 'held', 'bank', 'tree', 'stats'];

let root = null;
let step = null;
let wait = 0;
let running = false;
let holding = false;
let done = () => {};

// What the screen does once the payout has been counted and the board is up.
export function onDone(fn) { done = fn; }

const at = (stage) => root.classList.add(`stage-${stage}`);
const replay = () => void root.offsetWidth;

function after(delay, next) {
  wait = delay;
  step = next;
}

function tally() {
  at('tally');
  payout.tally(() => after(CFG.reveal.hold, repair));
}

// The one beat the player has to read rather than watch, so it gets a moment
// before the count moves and another before it is taken away.
function repair() {
  if (!payout.hasRepair()) { bank(); return; }
  const R = CFG.reveal.repair;
  at('repair');
  after(R.read, () => payout.repair(() => after(R.hold, hold)));
}

// A wave that cost a machine does not bank itself: what was earned and what it
// paid for the wreck are both on the screen, and they stay there until the
// player says they have read them.
function hold() {
  holding = true;
  at('held');
}

export function go() {
  if (!holding) return;
  holding = false;
  root.classList.remove('stage-held');
  bank();
}

function bank() {
  at('bank');
  payout.bank(() => after(CFG.reveal.settle, tree));
}

function tree() {
  at('tree');
  after(CFG.reveal.tree, stats);
}

function stats() {
  at('stats');
  running = false;
  done();
}

export function init(el, button) {
  root = el;
  button.onclick = () => go();
}

export function clear() {
  step = null;
  running = false;
  holding = false;
  payout.stop();
  root.classList.remove('reveal');
  for (const stage of STAGES) root.classList.remove(`stage-${stage}`);
}

export function start(withPayout = true) {
  clear();
  const counting = withPayout && take() > 0;
  payout.reset(counting);
  replay();
  root.classList.add('reveal');
  running = true;
  after(CFG.reveal.frame, counting ? tally : tree);
}

export function skip() {
  if (!running || holding) return;
  // A cost still to be read is not skipped past: the counts are landed where
  // they stand and the sequence waits on the button instead.
  if (payout.hasRepair()) {
    step = null;
    payout.settle();
    at('tally');
    at('repair');
    hold();
    return;
  }

  running = false;
  step = null;
  payout.finish();
  root.classList.remove('reveal');
  for (const stage of STAGES) at(stage);
  done();
}

export function update(dt) {
  payout.update(dt);
  if (!step) return;
  wait -= dt;
  if (wait > 0) return;
  const next = step;
  step = null;
  next();
}
