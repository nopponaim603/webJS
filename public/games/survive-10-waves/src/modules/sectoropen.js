import { CFG } from '../config/index.js';
import * as store from '../core/store.js';
import * as sector from '../game/sector.js';
import { cue } from '../ui/buttons.js';
import { audio } from '../engine/audio.js';

// Kept apart from the meta save: the meta knows which sectors are open, not
// which ones the player has been shown opening.
const SEEN = 'survive10.seen.open';

const el = { card: () => null, note: () => {} };
const beats = [];

let told = null;
let armed = false;
let clock = 0;
let card = null;

const T = () => CFG.sectorOpen;

const open = () => sector.list().map((s) => s.id).filter(sector.unlocked);

// Seeded from what is already open, so a save from before the bench could
// celebrate one is not handed every sector at once.
function seen() {
  if (told) return told;
  const saved = store.load(SEEN);
  told = new Set(saved || open());
  if (!saved) store.save(SEEN, [...told]);
  return told;
}

export const pending = () => open().find((id) => !seen().has(id)) || null;

export function init(refs) { Object.assign(el, refs); }

export function forget() {
  store.forget(SEEN);
  told = null;
}

export function arm(shown) { armed = shown && !!pending(); }

export function clear() {
  beats.length = 0;
  clock = 0;
  if (!card) return;
  card.classList.remove('cracking', 'opening');
  card = null;
}

const at = (time, run) => beats.push({ time, run });

export function begin() {
  if (!armed) return false;
  const id = pending();
  clear();
  card = id && el.card(id);
  if (!card) return false;
  armed = false;
  seen().add(id);
  store.save(SEEN, [...told]);

  card.classList.add('cracking');
  audio.play('rigHeavy', { rate: 0.62, gainScale: 2.6 })
    || cue('sectorCrack', CFG.ui.synth.sectorCrack);

  at(T().open, () => {
    card.classList.remove('sealed', 'cracking');
    card.classList.add('opening');
    cue('sectorOpen', CFG.ui.synth.sectorOpen);
    el.note(`SECTOR ${id} OPEN — ${sector.nameOf(id).toUpperCase()}`);
  });
  at(T().end, () => clear());
  return true;
}

export function update(dt) {
  if (!beats.length) return;
  clock += dt;
  while (beats.length && beats[0].time <= clock) beats.shift().run();
}
