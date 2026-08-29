import { CFG } from '../config/index.js';
import * as store from '../core/store.js';
import { cue } from '../ui/buttons.js';
import { audio } from '../engine/audio.js';

// The one beat that hands the player the run. The sector is dealt to the middle
// of the screen at a size worth looking at, then flies to the place it will live
// from now on — so where it ends up is learnt by watching it go there rather
// than by being told. The board's button opens behind it.
// Told once ever: a thing introduced twice is a thing the player is being told
// they missed.
const SEEN = 'survive10.seen.travel';

const el = { bar: null, veil: null, layer: null, select: null, badge: null };

let seen = !!store.load(SEEN);
let armed = false;
let clock = 0;
let hero = null;
const beats = [];

const T = () => CFG.travel;

const at = (time, run) => beats.push({ time, run });

export function init(refs) { Object.assign(el, refs); }

export function forget() {
  store.forget(SEEN);
  seen = false;
}

// Read as the screen opens, spent when the payout has finished counting: the
// intro is the last thing the bench says, not something laid over the coins.
export function arm(open) { armed = open && !seen; }

export function clear() {
  beats.length = 0;
  clock = 0;
  if (hero) { hero.remove(); hero = null; }
  if (!el.bar) return;
  el.veil.classList.remove('on');
  el.bar.classList.remove('intro', 'waiting');
  for (const card of el.bar.querySelectorAll('.mod-sector')) card.classList.remove('hero');
  el.select.classList.remove('unlocking');
  el.badge.classList.remove('pop');
}

// A card seating is a part seating, so it speaks with the rig's own voice rather
// than growing a private one. Up the row as it goes: the same part, one card
// higher every time, so the bar reads as one thing coming on rather than three.
const tick = (i) => audio.play('rigSmall', { rate: 1 + i * 0.13 })
  || cue('travelTick', { ...CFG.ui.synth.travelTick,
                         freq: Math.round(CFG.ui.synth.travelTick.freq * (1 + i * 0.14)) });

// Dealt from the place it will land in, so the flight home is the card going
// back where it came from rather than a second card arriving from nowhere.
function deal(card) {
  const r = card.getBoundingClientRect();
  const box = document.createElement('div');
  box.className = 'travel-hero';
  box.style.left = `${r.left}px`;
  box.style.top = `${r.top}px`;
  box.style.width = `${r.width}px`;
  box.style.height = `${r.height}px`;
  box.style.transform = `translate(${innerWidth / 2 - (r.left + r.width / 2)}px, `
    + `${innerHeight / 2 - (r.top + r.height / 2)}px) scale(${T().scale})`;
  box.appendChild(card.cloneNode(true));
  el.layer.appendChild(box);
  return box;
}

function fly() {
  if (!hero) return;
  hero.style.transition = `transform ${T().fly}s cubic-bezier(.5, .02, .2, 1)`;
  hero.style.transform = 'none';
  hero.classList.add('flying');
  el.veil.classList.remove('on');
  cue('travelFly', CFG.ui.synth.travelFly);
}

function land(card) {
  if (hero) { hero.remove(); hero = null; }
  el.bar.classList.remove('waiting');
  el.bar.classList.add('intro');
  card.classList.add('hero');
  tick(0);
}

export function begin() {
  if (!armed || !el.bar) return false;
  armed = false;
  seen = true;
  store.save(SEEN, 1);

  clear();
  const cards = [...el.bar.querySelectorAll('.mod-sector')];
  const card = el.bar.querySelector('.mod-sector.on') || cards[0];
  if (!card) return false;

  el.bar.classList.add('waiting');
  el.veil.classList.add('on');
  hero = deal(card);
  cue('travelCard', CFG.ui.synth.travelCard);

  at(T().hold, fly);
  at(T().land, () => land(card));
  // The rest of the bar comes on behind the one that flew, a card at a time.
  // Declared here rather than on landing so the queue stays in play order.
  cards.filter((c) => c !== card)
    .forEach((_, i) => at(T().land + T().card * (i + 1), () => tick(i + 1)));
  at(T().unlock, () => {
    el.select.classList.add('unlocking');
    cue('travelOpen', CFG.ui.synth.travelOpen);
  });
  at(T().badge, () => {
    el.badge.classList.add('pop');
    audio.play('rigStow', { rate: 1.18 }) || cue('travelDone', CFG.ui.synth.travelDone);
  });
  at(T().end, () => clear());
  return true;
}

// The beats are declared in the order they are played, so the front of the queue
// is always the next one due — and the last of them empties the queue behind it.
export function update(dt) {
  if (!beats.length) return;
  clock += dt;
  while (beats.length && beats[0].time <= clock) beats.shift().run();
}
