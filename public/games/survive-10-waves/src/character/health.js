import * as modules from '../modules/index.js';

// The one place health is put back. Nothing else in the game clamps to the
// maximum, so the ceiling is kept here; the gain is answered so a caller can
// say what it actually paid rather than what it offered.
export function heal(p, amount) {
  const got = Math.max(0, Math.min(modules.maxHealth() - p.health, amount));
  p.health += got;
  return got;
}
