import { world } from '../../core/world.js';
import * as arena from '../../arena/size.js';

export function clampToArena(x, z, margin = 1.5) {
  const r = Math.max(1, arena.radius() - margin);
  const d = Math.hypot(x, z);
  return d <= r ? { x, z } : { x: (x / d) * r, z: (z / d) * r };
}

export function nearest(x, z, range, skip = null) {
  const list = world.bugs;
  let best = null, bestD2 = range * range;
  for (let i = 0; i < list.length; i++) {
    const bug = list[i];
    if (bug.hp <= 0 || (skip && skip.has(bug))) continue;
    const dx = bug.pos.x - x, dz = bug.pos.z - z;
    const d2 = dx * dx + dz * dz;
    if (d2 < bestD2) { bestD2 = d2; best = bug; }
  }
  return best;
}

export function within(x, z, range, out = []) {
  out.length = 0;
  const list = world.bugs;
  const r2 = range * range;
  for (let i = 0; i < list.length; i++) {
    const bug = list[i];
    if (bug.hp <= 0) continue;
    const dx = bug.pos.x - x, dz = bug.pos.z - z;
    if (dx * dx + dz * dz <= r2) out.push(bug);
  }
  return out;
}

// The bug furthest along the aim line and no further than `spread` off it: what
// a beam, a rail slug or a lane wants, rather than the nearest body to a point.
export function alongLine(x, z, dx, dz, reach, spread, out = []) {
  out.length = 0;
  const list = world.bugs;
  for (let i = 0; i < list.length; i++) {
    const bug = list[i];
    if (bug.hp <= 0) continue;
    const ox = bug.pos.x - x, oz = bug.pos.z - z;
    const t = ox * dx + oz * dz;
    if (t < 0 || t > reach) continue;
    const px = ox - dx * t, pz = oz - dz * t;
    const room = spread + bug.radius;
    if (px * px + pz * pz <= room * room) out.push(bug);
  }
  return out;
}

export function ringPoint(x, z, radius, angle) {
  return { x: x + Math.cos(angle) * radius, z: z + Math.sin(angle) * radius };
}
