import { state } from '../core/world.js';

// What actually happened: the wave's books, wiped every wave, and the run's
// death roll, which only a new run clears.
// The take is what the wave pays: everything picked up on it, less what the
// machines it broke cost to put back in the air.
export const take = () => state.waveEarned - state.waveRepair;

// What the flight dealt this wave against everything the player's side dealt.
// Every source a machine is credited under is named for it, so this is read off
// the same books the stats panel draws.
export function flightDealt() {
  let flight = 0, all = 0;
  for (const [by, amount] of Object.entries(state.dealtBy)) {
    all += amount;
    if (by.startsWith('drone')) flight += amount;
  }
  return { flight, all };
}

export function flightShare() {
  const { flight, all } = flightDealt();
  return all > 0 ? flight / all : 0;
}

export function reset() {
  state.waveKills = 0;
  state.waveEarned = 0;
  state.waveRepair = 0;
  state.waveLost = 0;
  state.hurtBy = {};
  state.dealtBy = {};
}

export function forgetDeaths() { state.deaths = {}; }

// Only the flight's own are written down: a machine the debug menu put up is not
// part of the wave's books.
export function droneLost() { state.waveLost += 1; }

export function died() {
  state.deaths[state.wave] = (state.deaths[state.wave] || 0) + 1;
}

export function taken(by, amount) {
  if (!by) return;
  state.hurtBy[by] = (state.hurtBy[by] || 0) + amount;
}

export function dealt(by, amount) {
  if (!by) return;
  state.dealtBy[by] = (state.dealtBy[by] || 0) + amount;
}
