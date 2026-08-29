import { CFG } from '../config/index.js';
import * as walls from '../arena/walls.js';
import * as arena from '../arena/size.js';
import * as evolve from './evolve.js';

function pickHop(bug, p, H, S, mode) {
  const lim = arena.limitFor(bug.pos.x, bug.pos.z, 2);

  // Whatever called it, if anything did: a bug on its way to be ridden on or
  // thrown is covering ground to the tank, not to the player.
  const called = bug.board || bug.haul;
  const routed = mode === 'close' && bug.way && !called;
  const goal = called ? called.pos : (routed ? bug.way : p.pos);
  const gx = goal.x;
  const gz = goal.z;
  const toGoal = Math.hypot(bug.pos.x - gx, bug.pos.z - gz);
  const toPlayer = Math.hypot(bug.pos.x - p.pos.x, bug.pos.z - p.pos.z);
  const solid = !bug.type.throughWalls;
  const bearing = Math.atan2(gz - bug.pos.z, gx - bug.pos.x);
  const want = mode === 'close'
    ? bearing
    : Math.atan2(p.pos.z - bug.pos.z, p.pos.x - bug.pos.x) + Math.PI;

  for (let k = 0; k < 10; k++) {
    const wander = H.wander !== undefined ? H.wander : CFG.bugAnim.hopWander;
    const spread = (mode === 'band' || mode === 'any')
      ? Math.PI : Math.min(Math.PI, wander + k * 0.32);
    const a = want + (Math.random() * 2 - 1) * spread;
    const step = H.dist * (0.5 + Math.random());
    const x = bug.pos.x + Math.cos(a) * step;
    const z = bug.pos.z + Math.sin(a) * step;
    if (Math.hypot(x, z) > lim) continue;
    const dp = Math.hypot(x - p.pos.x, z - p.pos.z);
    const band = evolve.rangeMult(bug);
    if (mode === 'band' && (dp < S.minRange * band || dp > S.range * band)) continue;

    if (mode === 'flee' && dp <= toPlayer) continue;
    if (mode === 'close' && Math.hypot(x - gx, z - gz) >= toGoal) continue;
    if (solid && walls.inside(x, z, bug.radius + 0.4)) continue;
    if (solid && !walls.pathClear(bug.pos.x, bug.pos.z, x, z, bug.radius)) continue;
    bug.repos = { x, z };
    bug.reposT = H.time;
    return true;
  }
  return false;
}

// `p` is what the bug is going for, which is not always the player: a hop is
// how a rigged bug covers ground, so aiming it anywhere else would leave the
// animal walking at somebody it is not attacking.
export function tryHop(bug, p, H, S, ...modes) {
  if (bug.hopWait > 0) return false;
  for (const m of modes) if (pickHop(bug, p, H, S, m)) return true;
  bug.hopWait = 0.3;
  return false;
}
