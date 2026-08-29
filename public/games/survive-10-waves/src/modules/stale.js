import { CFG } from '../config/index.js';
import { state } from '../core/world.js';

// A run past the key wave with the board still shut was saved by a version that
// did not hand out the key, and nothing in the save can grow one. Said once a
// session: the player who chooses to play on is not asked again.
const el = {};
let onNew = () => {};
let told = false;

const stale = (boardOpen) => !boardOpen
  && Math.max(state.wave, state.best) > CFG.mission.waves;

export function close() { el.panel.classList.add('hidden'); }

export function check(boardOpen) {
  const say = !told && stale(boardOpen);
  told = told || say;
  el.panel.classList.toggle('hidden', !say);
}

export function init(fresh) {
  onNew = fresh || onNew;
  el.panel = document.getElementById('stale');
  document.getElementById('btn-stale-keep').onclick = close;
  document.getElementById('btn-stale-new').onclick = () => { close(); onNew(); };
}
