import { CFG, SECTORS } from '../config/index.js';
import * as store from '../core/store.js';
import { track, slug } from '../core/track.js';

// What outlives a run: which finale waves each sector has had cleared, and which
// sector to come back to. Everything else is per sector, in its own run blob
// beside this one. Reveal, entry and the drone count are all read back out of
// those clears rather than kept as counters of their own.
const KEY = 'survive10.meta';

const IDS = SECTORS.map((s) => s.id);
const BY_ID = Object.fromEntries(SECTORS.map((s) => [s.id, s]));

// `seen` and `open` are how far the run has ever got: the last sector sighted
// and the last one opened, held as marks rather than read back off the sector
// behind them. A sector opens once and stays open — what resetting one takes
// away is its own run and records, never the ground it opened for the others.
const blank = () => ({ done: {}, last: IDS[0], seen: 0, open: 0 });

let meta = { ...blank(), ...(store.load(KEY) || {}) };
let now = BY_ID[meta.last] ? meta.last : IDS[0];

const write = () => store.save(KEY, meta);

const at = (id) => IDS.indexOf(id);
const cleared = (id, wave) => !!meta.done[`${id}${wave}`];

// A save written before the marks existed knows how far it got all the same:
// the clears it is carrying say it.
const reachedOn = (wave) => IDS.reduce((far, id, i) =>
  (cleared(id, wave) ? Math.max(far, i + 1) : far), 0);

meta.seen = Math.max(meta.seen | 0, reachedOn(CFG.mission.waves));
meta.open = Math.max(meta.open | 0, reachedOn(CFG.mission.horizon));

export const list = () => SECTORS;
export const current = () => now;

// How far along the run of sectors this one is. Zero is the first.
export const index = (id = now) => at(id);
export const runKey = (id = now) => `survive10.run.${id}`;
export const terrain = () => BY_ID[now].terrain;
export const scale = () => BY_ID[now].count;
export const hpScale = () => BY_ID[now].hp;

// The reference pages read every sector in turn. They switch with this rather
// than `go`, which would move the player's own saved sector out from under them.
export const preview = (id) => { if (BY_ID[id]) now = id; };
export const next = () => IDS[at(now) + 1] || null;
export const prevOf = (id) => IDS[at(id) - 1] || null;
export const nameOf = (id = now) => (BY_ID[id] ? BY_ID[id].name : '');

export const revealed = (id) => at(id) <= meta.seen;
export const unlocked = (id) => at(id) <= meta.open;
export const openCount = () => IDS.filter(unlocked).length;

// A drone flies for the sector after the one that handed it over, so what is in
// the air here is how many sectors behind this one were taken to the horizon —
// off the mark rather than off their clears, so a sector reset behind you does
// not ground a machine you already earned.
export const drones = () => Math.min(at(now), meta.open);

export const won = (wave) => cleared(now, wave);

export function go(id) {
  if (!BY_ID[id] || id === now) return;
  now = id;
  meta.last = id;
  write();
  track(`sector_${slug(id)}_entered`);
}

export function markClear(wave) {
  if (won(wave)) return false;
  meta.done[`${now}${wave}`] = true;
  if (wave === CFG.mission.waves) meta.seen = Math.max(meta.seen, at(now) + 1);
  if (wave === CFG.mission.horizon) meta.open = Math.max(meta.open, at(now) + 1);
  write();
  return true;
}

// The clears of one sector, taken back. The marks are left where they are: the
// sectors it opened stay open, and re-clearing it simply sets its own flags
// again.
export function forget(id = now) {
  meta.done = Object.fromEntries(
    Object.entries(meta.done).filter(([key]) => !key.startsWith(id)));
  write();
}

// Every sector open at once, however the run actually got on. Only the marks
// move: the clears stay where they are, so a sector opened this way still has
// all of its own waves to play.
export function openAll() {
  meta.seen = meta.open = IDS.length;
  write();
}

export function wipe() {
  meta = blank();
  now = IDS[0];
  store.forget(KEY);
}
