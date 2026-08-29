import { CFG } from '../config/index.js';
import { world } from '../core/world.js';

const H = () => CFG.horde;

// Nothing already in the middle of something may be told to stand down: a
// charge, a throw, a ride — whatever has hold of the animal owns it until it is
// finished.
export const committed = (bug) => !!(bug.leap || bug.slam || bug.jab || bug.hurl
  || bug.toss || bug.spill || bug.douse || bug.rush || bug.fling
  || bug.board || bug.haul || bug.rider || bug.carried || bug.flight);

let wait = 0;

// Only so many bugs may work the mark at once — the same bargain the birds
// strike overhead, struck on the floor. Which ones is answered by distance
// rather than by whoever asked first, so a pack worked down at the front is fed
// from behind and the player is never left to go and find the rest of a wave.
export function assign(dt, markOf) {
  wait -= dt;
  if (wait > 0) return;
  wait = H().recheck;

  const queue = [];
  for (const bug of world.bugs) {
    // A bird keeps its own count, a boss was never one of a crowd, and a bug
    // that is mid-something is not standing anywhere to be counted.
    if (bug.dummy || bug.hp <= 0 || bug.type.fly || bug.type.kit || committed(bug)) {
      bug.chase = true;
      continue;
    }
    const m = markOf(bug).pos;
    const d = Math.hypot(m.x - bug.pos.x, m.z - bug.pos.z);
    // The chase is sticky: a bug already coming counts as nearer than one that
    // is not, so the pack does not swap places every time it is counted.
    queue.push({ bug, d, rank: d * (bug.chase ? H().stick : 1) });
  }

  queue.sort((a, b) => a.rank - b.rank);
  for (let i = 0; i < queue.length; i++) {
    const q = queue[i];
    q.bug.chase = i < H().chasers || q.d < H().giveUp;
  }
}
