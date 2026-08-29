import { CFG } from '../../config/index.js';
import * as snowfield from './snowfield.js';
import * as dunes from './dunes.js';
import * as nightglass from './nightglass.js';
import * as ferric from './ferric.js';

const THEMES = { snowfield, dunes, nightglass, ferric };

// Nothing heavy is imported here on purpose: this module runs its merge before
// view.js, walls.js and ground.js evaluate, and importing them would flip that
// order. The runtime swap lives in swap.js.

const ARENA_KEYS = ['terrain', 'normal', 'tileWorldSize', 'bumpScale', 'roughness', 'tint'];
const WALL_KEYS = ['texture', 'normalMap', 'roughnessMap', 'tileWorldSize', 'normalStrength', 'color'];

const clone = (v) => (v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v);
const pick = (from, keys) => Object.fromEntries(keys.map((k) => [k, from[k]]));

// Snapshotted before any theme lands, so switching between two themes restores
// what the second one does not override. CFG.walls.boxes is live and must not
// be cloned, which is why the wall and arena keys are listed rather than swept.
const BASE = {
  sky: clone(CFG.sky),
  sun: clone(CFG.sun),
  scatter: clone(CFG.scatter),
  arena: pick(CFG.arena, ARENA_KEYS),
  walls: pick(CFG.walls, WALL_KEYS),
};

function merge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    const into = target[key];
    if (value && typeof value === 'object' && !Array.isArray(value)
        && into && typeof into === 'object' && !Array.isArray(into)) merge(into, value);
    else target[key] = value;
  }
}

let slug = null;

export function configure(next) {
  if (next && !THEMES[next]) {
    console.warn(`unknown terrain "${next}" — have ${Object.keys(THEMES).join(', ')}`);
    next = null;
  }
  merge(CFG, clone(BASE));
  slug = next;
  if (!next) return null;

  const theme = THEMES[next];
  const { sky, sun, ground, walls, scatter } = theme.THEME;
  const { texture, normal, ...surface } = ground;
  merge(CFG, {
    sky, sun, walls, scatter,
    arena: { terrain: texture, normal, ...surface },
  });
  return theme;
}

export const THEME_URLS = (name) => {
  const { ground, walls, scatter } = THEMES[name].THEME;
  return [ground.texture, ground.normal, walls.texture, walls.normalMap,
          walls.roughnessMap, scatter.rockTexture, scatter.rockNormal,
          scatter.pathTexture].filter(Boolean);
};

export const active = () => (slug ? THEMES[slug] : null);
export const current = () => slug;
export const names = () => Object.keys(THEMES);
