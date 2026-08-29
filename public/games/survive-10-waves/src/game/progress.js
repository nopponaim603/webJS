import { state, world } from '../core/world.js';
import * as store from '../core/store.js';
import * as sector from './sector.js';
import * as modules from '../modules/index.js';
import * as loadout from '../weapons/loadout.js';

const VERSION = 2;

// Only what a run needs to resume at the top of a wave. Nothing mid-wave is
// worth keeping: a resumed wave starts clean, which is also how a retry works.
// The wave recorded is the one to play next; `cleared` says the one before it was
// finished, so a run resumed there picks up on the clear screen with the next
// wave open rather than on a screen that has forgotten it.
export function capture() {
  return {
    v: VERSION,
    wave: state.wave + (state.cleared ? 1 : 0),
    cleared: state.cleared,
    kills: state.kills,
    coins: state.coins,
    earned: state.earned,
    played: state.played,
    times: { ...state.waveTimes },
    deaths: { ...state.deaths },
    told: { ...state.told },
    keys: { ...state.keys },
    best: state.best,
    // The wave's own books, so the stats panel reads the same after a reload as
    // it did on the screen the run was left on.
    waveKills: state.waveKills,
    waveEarned: state.waveEarned,
    waveRepair: state.waveRepair,
    repaired: state.repaired,
    waveLost: state.waveLost,
    hurtBy: { ...state.hurtBy },
    dealtBy: { ...state.dealtBy },
    levels: { ...state.levels },
    slots: loadout.list().slice(),
    off: loadout.disabledList(),
    // Health is the run's, not the wave's: leaving and coming back is not a
    // heal, and the bar picks up where it was put down. The flight's is kept the
    // same way, one figure a machine — a broken one leaves no figure behind and
    // flies again whole.
    health: world.player ? Math.max(1, Math.round(world.player.health)) : 0,
    drones: (state.droneHp || []).slice(),
  };
}

export function save() {
  return store.save(sector.runKey(), capture());
}

export function load() {
  const raw = store.load(sector.runKey());
  if (!raw || raw.v !== VERSION || !(raw.wave > 0)) return null;
  return raw;
}

export function forget(id = sector.current()) {
  store.forget(sector.runKey(id));
}

export function forgetAll() {
  for (const s of sector.list()) store.forget(sector.runKey(s.id));
}

export function apply(run) {
  state.cleared = !!run.cleared;
  state.wave = run.wave - (state.cleared ? 1 : 0);
  state.kills = run.kills || 0;
  state.coins = run.coins || 0;
  state.earned = run.earned || 0;
  state.played = run.played || 0;
  state.waveTime = 0;
  state.waveTimes = { ...(run.times || {}) };
  state.deaths = { ...(run.deaths || {}) };
  state.told = { ...(run.told || {}) };
  state.keys = { ...(run.keys || {}) };
  state.drones = sector.drones();
  state.droneHp = (run.drones || []).slice(0, state.drones);
  state.waveKills = run.waveKills || 0;
  state.waveEarned = run.waveEarned || 0;
  state.waveRepair = run.waveRepair || 0;
  state.repaired = run.repaired || 0;
  state.waveLost = run.waveLost || 0;
  state.hurtBy = { ...(run.hurtBy || {}) };
  state.dealtBy = { ...(run.dealtBy || {}) };
  // The wave it stopped on is the one after the last one done, so the record is
  // never lower than that — a save from before the board existed knows what it
  // cleared even without being told.
  state.best = Math.max(run.best || 0, (run.wave || 1) - 1);

  modules.reset();
  for (const u of modules.MODULES) {
    const lv = run.levels ? run.levels[u.id] : 0;
    state.levels[u.id] = Math.max(0, Math.min(modules.capLevel(u.id), lv | 0));
  }
  loadout.restore(run.slots, run.off);

  // After the levels: what the bar holds is read against the tree the run was
  // saved with. A save from before health was kept comes back full.
  if (world.player) {
    const max = modules.maxHealth();
    world.player.health = run.health ? Math.min(max, Math.max(1, run.health)) : max;
  }
}

