import { CFG } from '../config/index.js';

// What one bug will ever pay, counted across both modules together: a near miss
// and a dash out of the way come out of the same three. The count rides on the
// bug, so it dies with it and nothing has to be swept up.
const cap = () => CFG.nearmiss.perBug;

// The boss is the one fight long enough to drain a bug dry, and draining it
// would take the pair away for the stretch that needs them most.
const endless = (bug) => !!bug.type && !!bug.type.kit;

export const left = (bug) => (bug ? Math.max(0, cap() - (bug.payouts || 0)) : cap());

export const spent = (bug) => !!bug && left(bug) <= 0;

export function take(bug) {
  if (bug && !endless(bug)) bug.payouts = (bug.payouts || 0) + 1;
}
