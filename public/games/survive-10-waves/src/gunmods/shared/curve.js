import { state } from '../../core/world.js';
import * as layout from '../../modules/layout.js';

const level = (id) => (state.levels && state.levels[id]) || 0;

const maxLevel = (id) => Math.max(1, layout.levelsOf(id));

export const has = (id) => level(id) > 0;

// 0 with nothing bought, 0 on the first level and 1 on the last, so a module's
// looks can grow with it without every curve repeating the same arithmetic.
export function frac(id) {
  const lv = level(id);
  if (lv <= 0) return 0;
  const top = maxLevel(id);
  return top <= 1 ? 1 : Math.min(1, (lv - 1) / (top - 1));
}

// Even steps: the first level lands on `base`, the last on `cap`.
const climb = (id, base, cap) => (has(id) ? base + (cap - base) * frac(id) : 0);

// Even multiples: what a number climbing from tens into thousands needs, where
// a flat step would make the first level worthless or the last one meaningless.
const ramp = (id, base, cap) =>
  (has(id) ? base * Math.pow(cap / base, frac(id)) : 0);

// A pair written in config as { base, cap }, read off the same level.
export const pair = (id, p) => (p ? climb(id, p.base, p.cap) : 0);
export const pairUp = (id, p) => (p ? ramp(id, p.base, p.cap) : 0);
export const pairStep = (id, p) => (p ? Math.round(climb(id, p.base, p.cap)) : 0);

export const pct = (v) => `${Math.round(v * 100)}%`;
export const plus = (v) => `+${Math.round(v * 100)}%`;
export const units = (v) => `${v.toFixed(1)}u`;
export const secs = (v) => `${v.toFixed(2)}s`;
export const round = (v) => String(Math.round(v));
