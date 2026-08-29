import { CFG } from '../config/index.js';

// A hit knocks the animal off its footing for a moment: one lean away from
// where the shot came from, straight back. Ridden by the model's group in world
// axes, so a bug's own yaw does not enter into it.
export function begin(bug, hitPos, crit = false) {
  const F = CFG.bugAnim.flinch;
  const dx = bug.pos.x - hitPos.x, dz = bug.pos.z - hitPos.z;
  const d = Math.hypot(dx, dz);

  const give = Math.min(1, Math.max(F.floor, Math.pow(F.ref / bug.radius, F.byRadius)));

  bug.flinch = F.time;
  bug.flinchAngle = F.angle * (crit ? F.crit : 1) * give;
  if (d > 1e-4) { bug.flinchDir.x = dx / d; bug.flinchDir.z = dz / d; }
}

export function apply(bug, obj, dt) {
  if (bug.flinch <= 0) return;

  const F = CFG.bugAnim.flinch;
  bug.flinch = Math.max(0, bug.flinch - dt);

  const left = bug.flinch / F.time;
  const lean = bug.flinchAngle * left * left;

  obj.rotation.x += lean * bug.flinchDir.z;
  obj.rotation.z += -lean * bug.flinchDir.x;
}
