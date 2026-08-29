import { CFG } from '../config/index.js';
import * as modules from '../modules/index.js';

// What one machine gets out of the others flying with it. The swarm modules pay
// per neighbour, so the flight's numbers are read a drone at a time rather than
// once for all of them.
export function count(d, flight) {
  const reach = CFG.drone.swarm;
  let near = 0;
  for (const o of flight) {
    if (o === d) continue;
    if (Math.hypot(o.pos.x - d.pos.x, o.pos.z - d.pos.z) <= reach) near++;
  }
  return near;
}

export const kit = (D, near) => (near === 0 ? D : {
  ...D,
  speed: D.speed * (1 + modules.droneSwarmSpeed(near)),
  damage: D.damage * (1 + modules.droneSwarmDamage(near)),
});

// A band a bonus, in the colour the config gives it, and each one worn only
// while it is worth something: shielding multiplies what the plating blocks, so
// with no plating bought there is nothing for it to multiply and no band.
const RINGS = [
  { key: 'damage', gain: modules.droneSwarmDamage },
  { key: 'speed', gain: modules.droneSwarmSpeed },
  { key: 'shield', gain: (near) => modules.droneSwarmSoak(near) - modules.droneSoak() },
];

// They stack from the keel up, closing the gaps: two bands are two rungs
// whichever two they are. Turned at their own rate and their own way round, so
// a stack reads as separate bands rather than one thick one.
export function rings(d, dt) {
  const R = CFG.drone.rings;
  d.turn += dt * R.spin;
  let slot = 0;
  for (let i = 0; i < RINGS.length; i++) {
    const ring = d.rings[RINGS[i].key];
    ring.visible = RINGS[i].gain(d.near) > 0;
    if (!ring.visible) continue;
    ring.position.y = CFG.drone.size * (R.lift + slot * R.gap);
    ring.rotation.y = d.turn * (1 + i * 0.23) * (i % 2 ? -1 : 1);
    slot++;
  }
}
