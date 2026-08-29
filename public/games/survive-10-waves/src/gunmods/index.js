import * as rifle from './rifle/index.js';
import * as shotgun from './shotgun/index.js';
import * as lance from './lance/index.js';
import * as launcher from './launcher/index.js';
import * as look from './shared/look.js';

// One place the guns' own branches are plugged into the fight. Every hook is
// optional: a kit implements the ones its modules need and the rest cost a
// property lookup. Dispatch is by gun, so nothing a shotgun module does is ever
// asked of a lance round.

const KITS = { rifle, shotgun, laser: lance, launcher };
const ALL = Object.values(KITS);

const kitOf = (gun) => (gun ? KITS[gun.id || gun] : null);

const call = (gun, name, ...args) => {
  const kit = kitOf(gun);
  return kit && kit[name] ? kit[name](...args) : undefined;
};

// The pattern the gun is about to lay down, before a single round has left it:
// a kit may widen it, replace it with one heavy round, or leave it alone. It
// answers with the number of rounds actually fired, or nothing to say "as
// written".
export const plan = (p, gun, shot) => call(gun, 'plan', p, gun, shot);

// Stamped onto every round so a module can find its own work later.
export function tag(p, gun, bag) {
  bag.gun = gun.id;
  call(gun, 'tag', p, gun, bag);
  return bag;
}

export const shot = (p, gun, muzzle, dir, info) => call(gun, 'shot', p, gun, muzzle, dir, info);

// Per-round, per-frame. Answering true takes the round off the field, which is
// how an airburst opens before it has hit anything.
export function stepBullet(b, dt) {
  const kit = KITS[b.gun];
  return !!(kit && kit.stepBullet && kit.stepBullet(b, dt));
}

// A round that ran out rather than being spent on a body. The kit that fired it
// gets one last say before it is gone, which is how a slug that touched nothing
// still opens where it stopped.
export function endBullet(b, on) {
  const kit = KITS[b.gun];
  if (kit && kit.endBullet) kit.endBullet(b, on);
}

export function hit(bug, bullet, amount, at, crit) {
  const kit = KITS[bullet.gun];
  if (kit && kit.hit) kit.hit(bug, bullet, amount, at, crit);
}

// Anything a module hung on a body has to come off when the body does, whoever
// killed it, so this one goes to every kit rather than to the gun that fired.
export function killed(bug) {
  for (const kit of ALL) if (kit.killed) kit.killed(bug);
}

export const grenadeFired = (g) => call('launcher', 'grenadeFired', g);
// Answering true means the kit has taken the detonation over and the launcher
// should not run its own.
export const grenadeBlast = (g, at) => !!call('launcher', 'grenadeBlast', g, at);

export const beam = (p, gun, legs, damage, charge) =>
  call(gun, 'beam', p, gun, legs, damage, charge);
// What a body is carrying from the player's side. Read by the bug's own step,
// so every kit gets a say and the answers stack the same way every time.
export function slowOn(bug) {
  let keep = 1;
  for (const kit of ALL) if (kit.slowOn) keep *= 1 - Math.min(0.95, kit.slowOn(bug) || 0);
  return 1 - keep;
}

export function update(dt) {
  for (const kit of ALL) if (kit.update) kit.update(dt);
  look.update(dt);
}

export function clear() {
  for (const kit of ALL) if (kit.clear) kit.clear();
  look.clear();
}

export { KITS };
