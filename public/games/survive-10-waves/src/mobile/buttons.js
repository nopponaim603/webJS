import { CFG } from '../config/index.js';
import { setTrigger, requestCycle, requestDash } from '../engine/input.js';
import { createArc } from '../ui/chargearc.js';
import * as loadout from '../weapons/loadout.js';
import { dashReady } from '../character/player.js';
import * as modules from '../modules/index.js';
import { ARC, arcSpan } from './layout.js';

let syncArc = null;
let fireBtn = null;
let dashBtn = null;
let swapIcon = null;
let shownIcon = '';

let arcWidth = 0;
addEventListener('resize', () => { arcWidth = 0; });

function circumference(svg) {
  if (!arcWidth) arcWidth = svg.getBoundingClientRect().width;
  return (arcWidth || 120) * (ARC.radius / 100) * arcSpan;
}

function press(el, onDown, onUp) {
  let held = -1;
  el.addEventListener('pointerdown', (e) => {
    if (held >= 0) return;
    e.preventDefault();
    held = e.pointerId;
    el.setPointerCapture(e.pointerId);
    el.classList.add('down');
    onDown();
  });
  const lift = (e) => {
    if (e.pointerId !== held) return;
    held = -1;
    el.classList.remove('down');
    if (onUp) onUp();
  };
  el.addEventListener('pointerup', lift);
  el.addEventListener('pointercancel', lift);
}

export function wire({ fire, arc, swap, swapIcon: icon, dash, pause }, onPause) {
  fireBtn = fire;
  dashBtn = dash;
  swapIcon = icon;
  syncArc = createArc(arc, () => circumference(arc));

  press(fire, () => setTrigger(true), () => setTrigger(false));
  press(swap, requestCycle);
  press(dash, requestDash);
  press(pause, onPause);
}

function paintSwap(gun) {
  const next = loadout.gunAt(loadout.next(loadout.slotOf(gun)));
  const icon = next === null ? '' : CFG.guns[next].icon;
  if (icon === shownIcon) return;
  shownIcon = icon;
  swapIcon.innerHTML = icon;
}

// The dash is a module: no button until it is bought, dim while unaffordable.
function paintDash(p) {
  dashBtn.classList.toggle('hidden', !modules.hasDash());
  dashBtn.classList.toggle('spent', !dashReady(p));
}

// Always on, unlike the ring over the player: on a phone the gauge is the only
// place the ammo count lives, and it is next to the thumb that spends it.
export function sync(p, { fill, max, wind, warn }) {
  if (!syncArc) return;
  syncArc(fill, max, { show: true, wind, warn });
  fireBtn.classList.toggle('dry', !!warn);
  paintDash(p);
  paintSwap(p.gun);
}
