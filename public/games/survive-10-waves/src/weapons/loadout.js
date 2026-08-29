import { CFG } from '../config/index.js';
import * as modules from '../modules/index.js';

const N = CFG.gunSlots;

let slots = [];
const off = new Set();

export function reset() {
  slots = Array.from({ length: N }, () => null);
  off.clear();
  sync();
}

// So the HUD can skip a repaint without walking the rack. Over-counting is
// free and missing a change is not, so sync() bumps whether or not it moved one.
let rev = 0;
export const revision = () => rev;

// A gun the modules have since unlocked drops into the first free slot, and one
// that is no longer owned leaves — the player's own arrangement is left alone.
// What arrived is handed back, since the bench has an arrival to draw and the
// rack is the one place that knows a gun went somewhere it was not before.
export function sync() {
  rev++;
  const arrived = [];
  for (let g = 0; g < CFG.guns.length; g++) {
    const owned = modules.gunOwned(CFG.guns[g]);
    const at = slots.indexOf(g);
    if (owned && at < 0) {
      const free = slots.indexOf(null);
      if (free >= 0) { slots[free] = g; arrived.push({ gun: g, slot: free }); }
    } else if (!owned && at >= 0) {
      slots[at] = null;
      off.delete(g);
    }
  }
  return arrived;
}
reset();

export const list = () => slots;
export const gunAt = (slot) => (slot >= 0 && slot < N ? slots[slot] : null);
export const slotOf = (gun) => slots.indexOf(gun);
export const disabled = (gun) => off.has(gun);

export const usable = (slot) => {
  const g = gunAt(slot);
  return g !== null && !off.has(g);
};

export function move(a, b) {
  if (a === b || a < 0 || b < 0 || a >= N || b >= N) return false;
  [slots[a], slots[b]] = [slots[b], slots[a]];
  rev++;
  return true;
}

export function toggle(gun) {
  if (gun === null) return false;
  if (!off.has(gun)) {
    if (enabledCount() <= 1) return false;
    off.add(gun);
  } else off.delete(gun);
  rev++;
  return true;
}

function enabledCount() {
  let n = 0;
  for (const g of slots) if (g !== null && !off.has(g)) n++;
  return n;
}

export const disabledList = () => [...off];

// A saved rack is a hint, not a contract: anything it names that is no longer
// owned is dropped, and anything newly owned is added by sync().
export function restore(slots_, off_) {
  slots = Array.from({ length: N }, (_, i) => {
    const g = slots_ && slots_[i];
    return Number.isInteger(g) && g >= 0 && g < CFG.guns.length ? g : null;
  });
  const seen = new Set();
  for (let i = 0; i < N; i++) {
    if (slots[i] === null) continue;
    if (seen.has(slots[i]) || !modules.gunOwned(CFG.guns[slots[i]])) slots[i] = null;
    else seen.add(slots[i]);
  }
  off.clear();
  for (const g of off_ || []) if (seen.has(g)) off.add(g);
  if (off.size >= seen.size) off.clear();
  sync();
}

export function next(slot) {
  for (let i = 1; i <= N; i++) {
    const s = (slot + i) % N;
    if (usable(s)) return s;
  }
  return slot;
}

export function firstUsable() {
  for (let s = 0; s < N; s++) if (usable(s)) return s;
  return 0;
}
