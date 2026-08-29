import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import * as modules from '../modules/index.js';
import * as floaters from '../ui/floaters.js';
import * as grazering from '../fx/grazering.js';
import * as firing from '../weapons/firing.js';
import * as hud from '../ui/hud.js';
import { audio } from '../engine/audio.js';
import * as adrenaline from './adrenaline.js';
import * as nearmiss from './nearmiss.js';
import * as jetpack from './jetpack.js';
import * as health from './health.js';

const _at = new THREE.Vector3();

// An attack that missed by no more than the band, judged where it came closest.
// Each pass is kept by the record the attack already owns, so one swing pays
// once however many frames or bodies it resolves over.
const passes = new Map();
// A field that comes down a piece at a time is one attack however many pieces
// land: the first inside the band is the near miss, and the rest of the fall is
// that same one still arriving.
const fell = new WeakSet();
let owed = 0;

const armed = () => modules.grazeOn() && world.player && !world.player.dead;

const still = () => !world.player.walking;

function pay(out, o) {
  if (!armed() || out <= 0 || out > modules.grazeBand()) return;
  const p = world.player;
  if (o.ground && jetpack.aloft(p)) return;
  if (nearmiss.spent(o.from)) return;
  if (o.volley) {
    if (fell.has(o.volley)) return;
    fell.add(o.volley);
  }
  nearmiss.take(o.from);

  _at.set(p.pos.x, CFG.player.height * 1.05, p.pos.z);
  grazering.pulse(p.pos.x, p.pos.z, modules.grazeBand());
  hud.flashGraze();
  const R = CFG.graze.sound.rate;
  audio.playAt('graze', p.pos.x, p.pos.z,
               { rate: R[0] + Math.random() * (R[1] - R[0]),
                 gainScale: CFG.graze.sound.gain });
  // The ring and the cue are said even when the bar is full and the heal pays
  // nothing: the dodge still happened, and going quiet there reads as the module
  // being broken.
  firing.topUpGuns(p, modules.grazeCharge());
  owed += health.heal(p, modules.grazeHeal(adrenaline.scored()));
  if (owed < 1) return;
  floaters.heal(_at, Math.round(owed));
  owed = 0;
}

export function edge(out, o = {}) {
  if (still()) pay(out, o);
}

export const at = (dist, reach, o) => edge(dist - reach, o);

function close(s) {
  if (s.done) return;
  s.done = true;
  if (s.still) pay(s.out, s.o);
}

// Every frame of a pass, so what is judged is where it came closest rather than
// wherever it happened to be looked at. Paid on the frame it starts opening the
// distance again — the moment it went by is the moment it missed by, and waiting
// for the charge to finish its run says it a second too late. A pass that landed
// recorded a distance inside its own reach, so it pays nothing without being
// told it hit.
export function sweep(key, dist, reach, o = {}) {
  if (!armed() || nearmiss.spent(o.from)) return;
  const s = passes.get(key)
    || { out: Infinity, last: Infinity, still: false, left: 0, done: false, o };
  s.left = modules.grazeHold();
  passes.set(key, s);
  if (s.done) return;

  const out = dist - reach;
  if (out < s.out) { s.out = out; s.still = still(); }
  const going = out > s.last;
  s.last = out;
  if (going) close(s);
}

// The end of a pass that never turned away — a charge that stopped dead at its
// closest — and the last word on one already paid for.
export function settle(key) {
  const s = passes.get(key);
  if (!s) return;
  passes.delete(key);
  close(s);
}

// A pass nobody came back to close — a volley whose thrower died mid-air —
// settles on its own rather than sitting in the map waiting for a frame that is
// not coming.
export function step(dt) {
  for (const [key, s] of passes) {
    s.left -= dt;
    if (s.left <= 0) settle(key);
  }
}

// Taken off the board rather than finished — the charger shot off its feet.
// Dropped, not settled: what never ran its course was not dodged.
export const forget = (key) => passes.delete(key);

export function clear() {
  passes.clear();
  owed = 0;
}
