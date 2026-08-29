import * as THREE from 'three';
import { SPECIAL } from '../config/index.js';
import { audio } from '../engine/audio.js';
import { rumble, focusZoom, releaseZoom, zoomCeiling, pinZoomMax, sun }
  from '../engine/view.js';
import * as blast from '../fx/blast.js';
import * as ground from '../arena/ground.js';
import * as arena from '../arena/size.js';

// The opening of the scripted wave. The track has a lead-in before bar 1, and
// the player spends it black-screened and close-held on a floor that is already
// going. Bar 1 lights the ring, opens it out and lets the camera back off;
// everything settles from there.
let run = null;
let sheet = null;

const _spot = new THREE.Vector3();
const _out = new THREE.Vector3();
const clamp = (v) => Math.max(0, Math.min(1, v));
const between = ([lo, hi]) => lo + Math.random() * (hi - lo);

function paint(a) {
  if (!sheet) sheet = document.getElementById('blackout');
  if (sheet) sheet.style.opacity = clamp(a);
}

function quake(k) {
  const O = SPECIAL.open;
  const v = clamp(k);
  rumble(O.camera * v);
  if (run.voice) run.voice.set(O.sound * v, 1);
}

// What the shaking is throwing up. While the ring is still it comes off the
// floor the player is standing on, which is all the floor there is; once the
// ring is opening it hangs on the edge that is moving.
function smoke(dt, level) {
  if (level <= 0) return;
  run.puff -= dt;
  if (run.puff > 0) return;
  const S = SPECIAL.open.smoke;
  // Thinned rather than cut: as the floor settles the gaps stretch out, so the
  // last of it drifts off instead of stopping on a frame.
  run.puff = between(S.every) / Math.max(0.15, level);
  const r = arena.radius();
  const a = Math.random() * Math.PI * 2;
  const d = r * (run.lit < 0 ? Math.sqrt(Math.random()) : between(S.rim));
  _spot.set(Math.cos(a) * d, 0, Math.sin(a) * d);
  _out.set(Math.cos(a), 0, Math.sin(a));
  blast.dustPuffs.spawn(_spot, _out, S.puff, between(S.size));
}

// Held on the player, then let out to the zoom the wave would have had anyway,
// and handed back at the end: past the reveal the camera is the player's again.
function pull() {
  const O = SPECIAL.open;
  if (run.wide) return;
  const k = Math.min(1, run.lit / O.grow);
  focusZoom(O.close + (zoomCeiling() - O.close) * k);
  if (k < 1) return;
  run.wide = true;
  pinZoomMax();
  releaseZoom();
}

export function begin() {
  clear();
  arena.setRadius(SPECIAL.open.from, 0);
  ground.setHeat(0);
  ground.setPulse(0);
  // Whatever the sector's sky put up rather than the engine default: the sun
  // comes back to the light this ground is meant to be lit by.
  run = { dark: 0, lit: -1, heat: 0, puff: 0, calm: 0, hit: 0, wide: false,
          sun: sun.intensity,
          voice: audio.sustain('collapseRumble') };
  sun.intensity = 0;
  paint(1);
  quake(1);
}

// Struck on the beat, and only once the ring is lit: before that there is
// nothing on screen for it to show up on.
export function beat() {
  if (run && run.lit >= 0) run.hit = 1;
}

export function bar(n) {
  if (!run || n !== 1 || run.lit >= 0) return;
  run.lit = 0;
  run.heat = 1;
  // The wave's own full size rather than a number of its own: the ring opens
  // once, here, and every part after this fights on all of it.
  arena.setRadius(arena.radiusFor(SPECIAL.wave), SPECIAL.open.grow, true);
}

export function update(dt) {
  if (!run) return;
  if (!run.voice || !run.voice.alive) {
    run.voice = audio.sustain('collapseRumble');
    if (run.voice) run.voice.set(0, 1, 0.01);
  }
  const O = SPECIAL.open;
  run.dark += dt;
  paint(1 - run.dark / O.fade);
  sun.intensity = run.sun * clamp(run.dark / O.dawn);

  // Held at full while there is still ground arriving — under the black before
  // bar 1, and for the whole sweep after it — then run down once the ring has
  // nothing left to open.
  if (run.lit < 0 || arena.moving()) run.calm = 0;
  else run.calm += dt;
  const level = clamp(1 - run.calm / O.hush);
  quake(level);
  smoke(dt, level);

  // Re-asserted every frame rather than set once: the pad delivery takes the
  // same camera control on its way out and would hand it back mid-reveal.
  if (run.lit < 0) { focusZoom(O.close); return; }

  run.lit += dt;
  pull();
  // Hot for as long as the ring is still opening, and only then let down: the
  // colour is what the ring is doing rather than a clock of its own.
  run.heat = arena.moving() ? 1 : run.heat - dt / O.cool;
  run.hit = Math.max(0, run.hit - dt / O.pulse.fall);
  ground.setHeat(clamp(run.heat));
  ground.setPulse(clamp(run.heat) * O.pulse.depth * run.hit);
  if (level <= 0 && run.heat <= 0 && run.wide && run.dark >= O.fade) clear();
}

// A voice held at nothing behind the pause screen is still a voice, so it is
// taken away rather than turned down. update() puts a fresh one up on the way
// back in.
export function pause() {
  if (!run) return;
  rumble(0);
  if (run.voice) { run.voice.stop(0.15); run.voice = null; }
}

export function clear() {
  if (!run) return;
  sun.intensity = run.sun;
  if (run.voice) run.voice.stop(0.4);
  rumble(0);
  releaseZoom();
  ground.setHeat(0);
  ground.setPulse(0);
  paint(0);
  run = null;
}
