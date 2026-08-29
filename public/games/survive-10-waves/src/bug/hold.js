import { CFG } from '../config/index.js';
import { between } from '../core/rng.js';
import * as arena from '../arena/size.js';
import * as walls from '../arena/walls.js';

const H = () => CFG.horde;

// A bug that stands down holds the ground it climbed out of: the patch of floor
// `home.r` around it, sized off the hole it was born in so a big pack is not
// asked to squeeze into the same circle a small one gets. What it walks at is a
// spot somewhere in there, swapped for another every few seconds, so a pack told
// to wait mills about instead of freezing where the order caught it.
// A mark is read for its `pos` and its `vel`, the same as the player or a drone
// is. A patch of ground is going nowhere, so its velocity is the zero it stays.
const _mark = { pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 } };

function pick(bug) {
  const lim = arena.radius() - bug.radius - 1;
  for (let k = 0; k < 8; k++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.sqrt(Math.random()) * bug.home.r;
    const x = bug.home.x + Math.cos(a) * d;
    const z = bug.home.z + Math.sin(a) * d;
    if (Math.hypot(x, z) > lim) continue;
    if (!bug.type.throughWalls && walls.inside(x, z, bug.radius + 0.4)) continue;
    bug.roam = { x, z };
    bug.roamT = between(H().dwell);
    return;
  }
  bug.roam = { x: bug.pos.x, z: bug.pos.z };
  bug.roamT = between(H().dwell);
}

export function markOf(bug, dt) {
  bug.roamT -= dt;
  const arrived = bug.roam
    && Math.hypot(bug.roam.x - bug.pos.x, bug.roam.z - bug.pos.z) < H().arrive;
  if (!bug.roam || arrived || bug.roamT <= 0) pick(bug);
  _mark.pos.x = bug.roam.x;
  _mark.pos.z = bug.roam.z;
  return _mark;
}

export function release(bug) {
  bug.roam = null;
  bug.windup = 0;
  bug.lunge = 0;
  bug.fireNow = false;
}
