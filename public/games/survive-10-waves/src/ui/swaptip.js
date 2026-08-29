import * as store from '../core/store.js';
import * as loadout from '../weapons/loadout.js';
import { MOUSE, svg } from './icons.js';
import { touchDevice } from '../mobile/detect.js';

// The swap is the one control a player can finish a whole run without ever
// finding, so it is offered until it is used and never again — the flag outlives
// the run, because a player who has learnt it has learnt it for good.
const KEY = 'survive10.learned.gunswap';

// Drawn rather than spelled: a player reading either of these is mid-fight, and
// a glyph is found faster than a sentence. Both places that say it say it the
// same way, so it is written once here.
export const hintHTML = touchDevice
  ? '<span>Tap a slot to switch gun</span>'
  : '<span>Switch gun:</span><kbd>Q</kbd>'
    + `<span class="ch-or">or</span>${svg(MOUSE.right, 'mbtn')}`;

let learned = !!store.load(KEY);

export const known = () => learned;

const el = () => document.getElementById('gunswap-tip');

// Only worth saying with somewhere to swap to: a rack holding one gun has no
// second gun to find.
const worthSaying = () => !learned
  && loadout.list().filter((g, i) => g !== null && loadout.usable(i)).length > 1;

export function sync() {
  const tip = el();
  if (!tip) return;
  if (worthSaying() && !tip.innerHTML) tip.innerHTML = hintHTML;
  tip.classList.toggle('hidden', !worthSaying());
}

export function mark() {
  if (learned) return;
  learned = true;
  store.save(KEY, 1);
  sync();
}

export function forget() {
  learned = false;
  store.forget(KEY);
  sync();
}
