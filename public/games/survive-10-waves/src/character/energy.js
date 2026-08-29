import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import * as modules from '../modules/index.js';
import * as effects from '../items/effects.js';

// The one tank the dash and the jetpack both draw on. Neither owns it: a dash
// that emptied its own supply would leave the pack full, and the whole point is
// that the two moves are spending the same thing.
export const newState = () => ({ left: CFG.player.energy.tank,
                                 since: CFG.player.energy.delay });

export const share = (p) => p.energy.left / modules.energyMax();

// Nothing is taken and so nothing stops the refill: the bar sits full for as
// long as it runs, which is the whole of what the player is meant to see.
const free = (p) => world.debug.infiniteEnergy || effects.unlimitedEnergy(p);

export const has = (p, cost) => free(p) || p.energy.left >= cost;

// Refilling stands still for a beat after anything is taken. The burn spends
// every frame it runs, so that one rule is also what keeps a hover from paying
// for itself — there is no second flag saying the pack is lit.
export function spend(p, cost) {
  if (free(p)) return;
  p.energy.left = Math.max(0, p.energy.left - cost);
  p.energy.since = 0;
}

export function take(p, cost) {
  if (!has(p, cost)) return false;
  spend(p, cost);
  return true;
}

export function regen(p, dt) {
  const max = modules.energyMax();
  if (p.energy.left > max) p.energy.left = max;

  p.energy.since += dt;
  if (p.energy.since < CFG.player.energy.delay) return;
  p.energy.left = Math.min(max, p.energy.left + modules.energyRegen() * dt);
}

export function fill(p) {
  p.energy.left = modules.energyMax();
  p.energy.since = CFG.player.energy.delay;
}
