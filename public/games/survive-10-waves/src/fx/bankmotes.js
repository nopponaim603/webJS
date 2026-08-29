import { CFG } from '../config/index.js';
import { world, state } from '../core/world.js';
import { scene } from '../engine/view.js';
import { makeGlow } from './glow.js';
import * as adrenaline from '../character/adrenaline.js';

// The bank, worn rather than read: one mote a banked charge, riding round the
// player. They are spread over the circle so three of them are a ring and one is
// a spark, and a charge going cold dims and shrinks its own rather than the
// whole set stepping down at once.
const M = () => CFG.adrenaline.mote;

const motes = [];
const pops = [];
let spin = 0;

function moteAt(i) {
  if (!motes[i]) {
    const m = makeGlow(CFG.adrenaline.color, 1, 0);
    m.renderOrder = 7;
    m.visible = false;
    scene.add(m);
    motes[i] = m;
  }
  return motes[i];
}

// The flare a charge arrives on, so banking one is felt as well as counted.
export function pop(n) {
  pops[n - 1] = M().popTime;
}

export function update(dt) {
  const held = world.player && state.mode === 'playing' ? adrenaline.held() : null;
  if (!held || !held.length) {
    for (const m of motes) m.visible = false;
    return;
  }

  const C = M();
  const p = world.player;
  spin += dt * C.spin;

  for (let i = 0; i < motes.length; i++) if (i >= held.length) motes[i].visible = false;

  for (let i = 0; i < held.length; i++) {
    const m = moteAt(i);
    const a = spin + (i / held.length) * Math.PI * 2;
    m.position.set(p.pos.x + Math.cos(a) * C.radius,
                   CFG.player.height * C.height,
                   p.pos.z + Math.sin(a) * C.radius);
    m.visible = true;

    // Whole until the last of its clock, then plainly on the way out.
    const left = Math.max(0, Math.min(1, held[i] / C.fade));
    pops[i] = Math.max(0, (pops[i] || 0) - dt);
    const flare = 1 + (C.pop - 1) * (pops[i] / C.popTime);
    m.scale.setScalar(C.size * (0.55 + 0.45 * left) * flare);
    m.material.opacity = Math.min(1, (left * 0.85 + 0.15) * (0.6 + 0.4 * flare));
  }
}

export function clear() {
  for (const m of motes) m.visible = false;
  pops.length = 0;
}
