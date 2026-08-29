import { CFG, BUG_TYPES } from '../config/index.js';
import { world } from '../core/world.js';
import * as spikes from '../bug/spikes.js';
import * as spit from '../bug/spit.js';
import * as bombs from '../bug/bombs.js';
import * as boomerangs from '../bug/boomerangs.js';

// Everything on the floor that is about to hurt, or already is, as circles.
// Rebuilt each time it is asked for rather than kept: what is dangerous changes
// every frame, and a stale list is worse than none.
const spikeZones = [];

export function claim(out) {
  out.length = 0;

  for (const z of spikes.claimed(spikeZones)) out.push(z);
  for (const a of spit.burning()) out.push({ x: a.x, z: a.z, r: a.bound });
  spit.threat(out);

  const boom = BUG_TYPES.find((t) => t.key === 'bomber').burst.radius;
  for (const b of bombs.flying()) out.push({ x: b.to.x, z: b.to.z, r: boom });

  boomerangs.threat(out);

  for (const bug of world.bugs) {
    // A boss winding up a slam has claimed the ring it stands in.
    if (bug.slam) out.push({ x: bug.pos.x, z: bug.pos.z, r: CFG.slam.radius * (bug.grow || 1) });

    // A charge has claimed the whole line it is pointed down.
    if (bug.rush && bug.rush.phase === 'gather') {
      const R = CFG[bug.charging || bug.type.charge];
      const half = R.distance * 0.5;
      out.push({ x: bug.pos.x + bug.rush.dir.x * half,
                 z: bug.pos.z + bug.rush.dir.z * half,
                 r: half + bug.radius });
    }
  }
  return out;
}

export function safe(zones, x, z, pad) {
  for (const d of zones) {
    if (Math.hypot(d.x - x, d.z - z) < d.r + pad) return false;
  }
  return true;
}
