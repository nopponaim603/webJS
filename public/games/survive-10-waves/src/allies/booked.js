import { segDist2 } from '../core/geom2.js';

// Ground a machine's special attack has already spoken for. Two wells opened on
// one crowd, or a second lane walked down the first, is a flight paying twice
// for the same kill: whichever machine asks second is turned away and takes its
// attack somewhere else.
//
// A run is a line and a well is a point, so a claim is a segment with a width
// about it — a well is simply a segment that goes nowhere.
const marks = [];

export const disc = (x, z, r) => ({ x, z, x2: x, z2: z, r });
export const lane = (x, z, x2, z2, r) => ({ x, z, x2, z2, r });

// Stepped along the asking claim rather than solved for: two capsules crossing
// at an angle is more arithmetic than a step every few metres is worth.
const STEP = 4;

export function open(mark) {
  const run = Math.hypot(mark.x2 - mark.x, mark.z2 - mark.z);
  const steps = Math.max(1, Math.ceil(run / STEP));

  for (const m of marks) {
    for (let i = 0; i <= steps; i++) {
      const k = i / steps;
      const x = mark.x + (mark.x2 - mark.x) * k;
      const z = mark.z + (mark.z2 - mark.z) * k;
      if (segDist2(m.x, m.z, m.x2, m.z2, x, z) < (m.r + mark.r) ** 2) return false;
    }
  }
  return true;
}

export function take(mark) {
  marks.push(mark);
  return mark;
}

export function free(mark) {
  const at = marks.indexOf(mark);
  if (at >= 0) marks.splice(at, 1);
}

export function clear() { marks.length = 0; }
