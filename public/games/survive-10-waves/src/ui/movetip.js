import * as THREE from 'three';
import { state, world } from '../core/world.js';
import { camera } from '../engine/view.js';
import * as store from '../core/store.js';
import { touchDevice } from '../mobile/detect.js';
import * as modules from '../modules/index.js';
import * as energy from '../character/energy.js';
import * as jetpack from '../character/jetpack.js';

// Below the feet rather than over the head: what is above the player is where
// the bugs come from, and the tip is not something to read through a fight.
const DROP = 38;

// A move is learned once, not once a run, so what the player already knows
// outlives the run they learned it on. First unlearned move that is ready to
// press wins the line, so the dash is taught before the pack.
const TIPS = [
  {
    key: 'survive10.seen.dash',
    text: touchDevice ? 'TAP <b>DASH</b> WITH THE STICK PUSHED' : 'PRESS <b>SHIFT</b> TO DASH',
    used: (p) => p.dashTimer > 0,
    ready: (p) => modules.hasDash() && energy.has(p, modules.dashCost()),
  },
  {
    key: 'survive10.seen.jetpack',
    text: 'PRESS <b>SPACE</b> TO FLY',
    used: (p) => jetpack.flying(p),
    ready: (p) => !touchDevice && jetpack.canLift(p),
  },
];

const el = document.getElementById('movetip');
const _at = new THREE.Vector3();

const learned = new Map(TIPS.map((t) => [t.key, !!store.load(t.key)]));
let shown = null;

export function forget() {
  for (const t of TIPS) {
    learned.set(t.key, false);
    store.forget(t.key);
  }
}

function pick(p) {
  for (const t of TIPS) {
    if (learned.get(t.key)) continue;
    if (t.used(p)) {
      learned.set(t.key, true);
      store.save(t.key, 1);
      continue;
    }
    if (t.ready(p)) return t;
  }
  return null;
}

export function update() {
  const p = world.player;
  const tip = p ? pick(p) : null;
  const show = !!tip && state.mode === 'playing' && !p.dead && p.held <= 0;
  el.classList.toggle('hidden', !show);
  if (!show) return;

  if (shown !== tip) {
    el.innerHTML = tip.text;
    shown = tip;
  }

  _at.set(p.pos.x, 0, p.pos.z).project(camera);
  if (_at.z > 1) { el.classList.add('hidden'); return; }

  const x = (_at.x * 0.5 + 0.5) * innerWidth;
  const y = (-_at.y * 0.5 + 0.5) * innerHeight + DROP;
  el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
}
