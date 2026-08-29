import { massOf } from './mass.js';
import * as crowd from './crowd.js';

export function separate(bug, out) {
  out.set(0, 0, 0);
  const myMass = massOf(bug.type);
  const flies = !!bug.type.fly;
  const x = bug.pos.x, z = bug.pos.z, r = bug.radius;

  const bx = crowd.body.x, bz = crowd.body.z, br = crowd.body.r;
  const hits = crowd.hits;
  const found = crowd.touching(x, z, r);

  for (let j = 0; j < found; j++) {
    const i = hits[j];
    const dx = x - bx[i];
    const dz = z - bz[i];
    const min = r + br[i];
    const d2 = dx * dx + dz * dz;
    // Answered in numbers, before the bug itself is ever reached for. The grid
    // answers about a square and the question is about a circle inside it, so
    // most of what comes back is simply too far away. Zero distance is the bug
    // itself, and two bodies in exactly the same spot have no direction to be
    // pushed apart along.
    if (d2 >= min * min || d2 < 0.0001) continue;

    const o = crowd.bugAt(i);
    if (o.hp <= 0) continue;
    // Nothing in the air crowds anything on the ground, or the other way about,
    // and nothing being carried or thrown is standing anywhere at all.
    if (o.rider || o.carried || o.flight || !!o.type.fly !== flies) continue;

    const d = Math.sqrt(d2);
    const oMass = massOf(o.type);
    const share = oMass / (myMass + oMass);
    out.x += (dx / d) * (min - d) * share;
    out.z += (dz / d) * (min - d) * share;
  }
  return out;
}
