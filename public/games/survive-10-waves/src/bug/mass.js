import { CFG, BUG_TYPES } from '../config/index.js';

// Precomputed: pow() in an O(n^2) inner loop, for an answer that never changes.
const MASS = new Map();
for (const t of BUG_TYPES) MASS.set(t, Math.pow(t.radius, CFG.bugAnim.massExp));

export const massOf = (type) => MASS.get(type) ?? Math.pow(type.radius, CFG.bugAnim.massExp);

// The player counts for more than its footprint: on size alone a soldier would
// lose ground to a grunt.
export const PLAYER_MASS = Math.pow(CFG.player.radius, CFG.bugAnim.massExp)
  * CFG.player.heft;

// How much of a shove actually lands. Read off the species' own size, with the
// growth an evolved one has put on counting for far less: a grown grunt is
// still a grunt, and has to stay shovable long after it has outgrown a tank.
export function pushGive(bug) {
  const P = CFG.bugAnim.push;
  const size = Math.pow(P.ref / bug.type.radius, P.byRadius)
    / Math.pow(bug.grow || 1, P.byGrow);
  return Math.min(1, Math.max(P.floor, size));
}
