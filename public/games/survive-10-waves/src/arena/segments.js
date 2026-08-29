import { CFG } from '../config/index.js';
import { rngFrom } from '../core/rng.js';
import { onPath } from './footpath.js';
import * as walls from './walls.js';

const S = () => CFG.walls.segments;

const laid = [];

export function clear() {
  for (const b of laid) {
    const i = CFG.walls.boxes.indexOf(b);
    if (i >= 0) CFG.walls.boxes.splice(i, 1);
  }
  laid.length = 0;
}

// Every shape is drawn lying along x, then turned in quarters — the boxes are
// axis-aligned, so those are the only turns that keep them square to the world.
const SHAPES = {
  bar: (long, arm, t) => [{ dx: 0, dz: 0, hx: long, hz: t }],
  ell: (long, arm, t) => [
    { dx: 0, dz: 0, hx: long, hz: t },
    { dx: long - t, dz: arm + t, hx: t, hz: arm },
  ],
  tee: (long, arm, t) => [
    { dx: 0, dz: 0, hx: long, hz: t },
    { dx: 0, dz: arm + t, hx: t, hz: arm },
  ],
  yoke: (long, arm, t) => [
    { dx: 0, dz: 0, hx: long, hz: t },
    { dx: long - t, dz: arm + t, hx: t, hz: arm },
    { dx: -(long - t), dz: arm + t, hx: t, hz: arm },
  ],
  step: (long, arm, t) => [
    { dx: -arm, dz: 0, hx: arm, hz: t },
    { dx: 0, dz: arm + t, hx: t, hz: arm },
    { dx: arm, dz: 2 * (arm + t), hx: arm, hz: t },
  ],
};

function turn(box, quarter, x, z) {
  const flip = quarter % 2 === 1;
  const c = [1, 0, -1, 0][quarter], s = [0, 1, 0, -1][quarter];
  return {
    x: x + box.dx * c - box.dz * s,
    z: z + box.dx * s + box.dz * c,
    hx: flip ? box.hz : box.hx,
    hz: flip ? box.hx : box.hz,
    gen: true,
  };
}

// Sampled along its length: a piece is long enough to straddle a rock or the
// footpath while its middle sits clear of both.
function fits(b, gap) {
  const R = CFG.arena.max - CFG.arena.obstacleEdge;
  const steps = 10;
  for (let i = -steps; i <= steps; i++) {
    const t = i / steps;
    const px = b.x + b.hx * t, pz = b.z + b.hz * t;
    const out = Math.hypot(px, pz);
    if (out > R || out < S().clear) return false;
    if (onPath(px, pz)) return false;
    if (walls.inside(px, pz, gap)) return false;
  }
  return true;
}

// Biased short: most pieces are stubs to weave around, with the odd long wall
// that has to be walked the whole way round.
const roll = (rnd, span, bias) => span.min + Math.pow(rnd(), bias) * (span.max - span.min);

function pickShape(rnd) {
  const mix = S().shapes;
  const keys = Object.keys(mix);
  let pick = rnd() * keys.reduce((a, k) => a + mix[k], 0);
  for (const k of keys) { pick -= mix[k]; if (pick <= 0) return SHAPES[k]; }
  return SHAPES.bar;
}

export function build() {
  clear();
  const C = S();
  if (!C || !C.count) return;

  const rnd = rngFrom(C.seed);
  const R = CFG.arena.max - CFG.arena.obstacleEdge;

  for (let guard = 0, placed = 0; placed < C.count && guard < C.count * 300; guard++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * R;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;

    const long = roll(rnd, C.length, C.bias) / 2;
    const arm = Math.min(long, roll(rnd, C.arm, C.bias)) / 2;
    const t = roll(rnd, C.thick, 1) / 2;
    const quarter = (rnd() * 4) | 0;
    const piece = pickShape(rnd)(long, arm, t).map((b) => turn(b, quarter, x, z));

    if (!piece.every((b) => fits(b, C.gap))) continue;

    laid.push(...piece);
    CFG.walls.boxes.push(...piece);
    placed++;
  }
  walls.build();
}
