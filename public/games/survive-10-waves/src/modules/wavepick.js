import { CFG } from '../config/index.js';
import { state } from '../core/world.js';
import * as store from '../core/store.js';
import { onEscape } from '../engine/input.js';
import { KEY, LOCK, DRONE, svg } from '../ui/icons.js';
import * as sectorreset from './sectorreset.js';

// Whether the board has ever been opened outlives the run it was unlocked in:
// the NEW mark is about what the player has seen, not about this run.
const SEEN = 'survive10.seen.wavepick';

const KEY_ICON = svg(KEY);
const LOCK_ICON = svg(LOCK);
const REWARD_ICON = { key: KEY_ICON, drone: svg(DRONE) };

const el = { root: null, grid: null, close: null,
             deep: null, deepCard: null, deepGrid: null };
const chips = [];

let seen = !!store.load(SEEN);
let onPick = () => {};

export const fresh = () => !seen;
export const open = () => !el.root.classList.contains('hidden');

// Every wave the run has earned its way to: the one after the highest cleared,
// or the one it is standing on, whichever is further along. Clearing 6 opens 7.
const reached = () => Math.max(state.best + 1, state.wave);

const reachable = (n) => n <= reached();

// Where the mission ends and the endless run starts. The board is fixed up to
// the horizon and grows from there.
const deepFrom = () => CFG.mission.horizon + 1;

export function hide() {
  sectorreset.close();
  el.root.classList.add('hidden');
}

function take(n) {
  hide();
  onPick(n);
}

function paint() {
  for (let i = 0; i < chips.length; i++) {
    const n = i + 1;
    const chip = chips[i];
    chip.disabled = !reachable(n);
    chip.classList.toggle('locked', !reachable(n));
    chip.classList.toggle('now', n === state.wave);
    chip.classList.toggle('keyed', !!state.keys[n] && !CFG.mission.rewards[n]);
  }

  paintDeep();
}

// The tail past the last mission wave has no length of its own: it is as long as
// the run has made it, so its chips are built on every paint rather than once.
function paintDeep() {
  const reachedDeep = state.best >= CFG.mission.horizon;
  el.deep.classList.toggle('hidden', !reachedDeep);
  el.deepGrid.replaceChildren();
  if (!reachedDeep) return;

  const top = Math.max(state.best, state.wave);
  for (let n = deepFrom(); n <= top; n++) {
    const chip = document.createElement('button');
    chip.className = 'wp-wave deep';
    chip.classList.toggle('now', n === state.wave);
    chip.innerHTML = `<b>${n}</b>`;
    chip.onclick = () => take(n);
    el.deepGrid.appendChild(chip);
  }
}

export function init({ pick, reset }) {
  el.root = document.getElementById('wavepick');
  el.grid = document.getElementById('wp-grid');
  el.close = document.getElementById('btn-wp-close');
  el.deep = document.getElementById('wp-deep');
  el.deepCard = document.getElementById('btn-wp-deep');
  el.deepGrid = document.getElementById('wp-deep-grid');
  onPick = pick;

  sectorreset.init(() => { hide(); reset(); });
  el.close.onclick = () => hide();
  el.deepCard.innerHTML = `<b>THE DEEP</b><i>WAVE ${deepFrom()} AND BEYOND</i>`;
  el.deepCard.onclick = () => take(deepFrom());
  el.root.addEventListener('pointerdown', (e) => { if (e.target === el.root) hide(); });
  onEscape(() => (open() ? (hide(), true) : false));


  for (let n = 1; n <= CFG.mission.horizon; n++) {
    const chip = document.createElement('button');
    const reward = CFG.mission.rewards[n];
    chip.className = CFG.waves.bosses[n] ? 'wp-wave boss' : 'wp-wave';
    chip.innerHTML = `<b>${n}</b><span class="wp-lock">${LOCK_ICON}</span>`
      + `<span class="wp-key">${KEY_ICON}</span>`
      + (reward ? `<span class="wp-mark ${reward}">${REWARD_ICON[reward]}</span>` : '');
    chip.onclick = () => take(n);
    el.grid.appendChild(chip);
    chips.push(chip);
  }
}

export function forget() {
  seen = false;
  store.forget(SEEN);
}

export function show() {
  seen = true;
  store.save(SEEN, 1);
  paint();
  sectorreset.paint();
  el.root.classList.remove('hidden');
}
