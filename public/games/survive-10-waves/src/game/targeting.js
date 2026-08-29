import { world } from '../core/world.js';
import * as walls from '../arena/walls.js';

function reachable(bug) {
  return bug.hp > 0 && bug.emerge <= 0;
}

// `min` keeps a target out of the blast the shot is about to make; `sight`
// throws out one the round would only meet a wall on the way to.
export const ANY = { min: 0, sight: false };

// Switching costs the shot you were lining up, so a rival has to be clearly
// closer before the aim leaves the bug it is already on.
export function nearestBug(from, range, current = null, stickiness = 1, rule = ANY) {
  let best = null;
  let bestD2 = range * range;
  const minD2 = rule.min * rule.min;

  for (const bug of world.bugs) {
    if (!reachable(bug)) continue;
    const dx = bug.pos.x - from.x, dz = bug.pos.z - from.z;
    const flat = dx * dx + dz * dz;
    if (flat < minD2) continue;
    const d2 = flat * (bug === current ? stickiness * stickiness : 1);
    if (d2 >= bestD2) continue;
    // Last, and only for a bug that would win: the cast is the dear part.
    if (rule.sight && walls.blocks(from.x, from.z, bug.pos.x, bug.pos.z) >= 0) continue;
    bestD2 = d2; best = bug;
  }
  return best;
}
