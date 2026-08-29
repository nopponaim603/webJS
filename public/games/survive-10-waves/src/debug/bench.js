import * as THREE from 'three';
import { CFG, BUG_TYPES, STORY } from '../config/index.js';
import { world, state } from '../core/world.js';
import * as view from '../engine/view.js';
import { renderer, sun } from '../engine/view.js';
import * as input from '../engine/input.js';
import * as arena from '../arena/size.js';
import * as walls from '../arena/walls.js';
import * as bugs from '../bug/roster.js';
import * as modules from '../modules/index.js';
import { levelNow } from '../game/waveplan.js';
import { rngFrom } from '../core/rng.js';
import * as perf from '../core/perf.js';

const _p = new THREE.Vector3();

const fieldable = (wave) => BUG_TYPES.filter((t) => wave >= t.minWave && !t.finale && !t.kit);

function place(out, radius) {
  for (let tries = 0; tries < 12; tries++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * Math.max(1, arena.radius() - CFG.spawn.inset);
    out.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    if (!walls.inside(out.x, out.z, radius)) break;
  }
  return out;
}

// A wave, straight in: no briefing, no spawning of its own, and the player left
// standing up so a benchmark measures the fight rather than a death.
function wave(n, { maxed = true } = {}) {
  for (const key of Object.keys(STORY)) state.told[key] = true;
  if (maxed) for (const u of modules.MODULES) state.levels[u.id] = modules.maxLevel(u.id);
  world.hooks.startWave(n);
  world.debug.noSpawn = true;
  world.debug.invuln = true;
  world.debug.autoHeal = true;
  world.debug.infiniteCharges = true;
  world.debug.infiniteEnergy = true;
}

function fill(n, { level = 0 } = {}) {
  const roster = fieldable(state.wave);
  const at = level || levelNow();
  for (let i = 0; i < n; i++) {
    const type = roster[i % roster.length];
    bugs.spawn(type, place(_p, type.radius), at);
  }
  for (const bug of world.bugs) bug.emerge = 0;
  return world.bugs.length;
}

// A software rasteriser makes a mockery of the draw: on a machine with no GPU the
// frame is all raster, the simulation being measured is lost in it, and the frames
// come so slowly that every step is a tenth of a second long. So the raster goes,
// and what is left of the draw is the scene graph walk — that cost is the game's
// own, and it grows with the horde.
function tiny() {
  renderer.shadowMap.enabled = false;
  sun.castShadow = false;
  renderer.setSize(64, 64, false);
  renderer.render = (graph) => graph.updateMatrixWorld();
}

// Two runs of the benchmark have to be the same run — the same animals in the
// same places doing the same things, stepped at the same rate — or a change
// worth a millisecond is lost in which way the dice fell.
function fixed(seed = 20250820, step = 1 / 60) {
  Math.random = rngFrom(seed);
  world.debug.fixedStep = step;
}

// The controls, held rather than pressed. A dispatched event arrives between
// frames, so which frame it lands on decides where the player is two hundred
// frames later, and a crowd this size amplifies that until two runs of the same
// build no longer agree on what they were measuring.
function drive({ move = 'KeyW', firing = true, aim = [0.35, 0.55] } = {}) {
  input.keys.clear();
  if (move) input.keys.add(move);
  input.mouse.down = firing;
  input.mouse.ndc.set(aim[0], aim[1]);
}

export function install() {
  window.__bench = {
    wave,
    fill,
    tiny,
    fixed,
    drive,
    profile: perf.profile,
    report: perf.report,
    scene() {
      let shown = 0;
      for (const bug of world.bugs) if (bug.shown) shown += 1;
      let drawn = 0;
      view.scene.traverse(() => { drawn += 1; });
      return { drawn, bugs: world.bugs.length, shown,
               corpses: world.corpses.length, mode: state.mode };
    },
  };
}
