import { CFG } from '../config/index.js';

const levelOf = (bug) => bug.level || 1;

const under = (bug, mark) => !!bug.hpMax && bug.hp <= bug.hpMax * mark;

function rung(ladder, level) {
  let best;
  for (const at in ladder) {
    if (+at <= level && (best === undefined || +at > best)) best = +at;
  }
  return best === undefined ? undefined : ladder[best];
}

export const knows = (bug, attack) => levelOf(bug) >= (CFG.boss.unlock[attack] || 1);

// A ceiling over what the attack's own config rolls, never a replacement for it:
// the top of the ladder leaves the roll alone rather than restating its numbers.
export function cap(bug, stat, full) {
  const lid = rung(CFG.boss[stat], levelOf(bug));
  return lid === undefined ? full : Math.min(full, lid);
}

// How many of a thing it throws at its level, rolled out of that level's own
// range. A ladder wins over the attack's config wherever it has a rung.
export function rolls(bug, stat, full) {
  const own = rung(CFG.boss[stat], levelOf(bug));
  const [lo, hi] = own || full;
  return lo + ((Math.random() * (hi - lo + 1)) | 0);
}

// Hurt and quickened: under a share of its health everything the boss has comes
// round sooner. Spent against the clock rather than against the roll, so
// crossing the line speeds up a cooldown that is already running.
export function cooling(bug, dt) {
  if (!bug.type.kit) return dt;
  const R = CFG.boss.rage;
  return under(bug, R.below) ? dt / R.cooldowns : dt;
}

// The beat it owes after an attack before the next one may start.
export function rest(bug) {
  if (!bug.type.kit) return 0;
  const R = CFG.boss.rest;
  return under(bug, R.below) ? R.low : R.high;
}

export const slams = (bug) => !bug.type.kit || under(bug, CFG.boss.slamAt);
