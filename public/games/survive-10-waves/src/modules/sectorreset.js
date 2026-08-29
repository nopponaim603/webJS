import { state } from '../core/world.js';
import * as sector from '../game/sector.js';
import * as fmt from '../ui/format.js';

// Two presses and a plain list of what goes, because nothing else on the bench
// takes anything away. The armed press falls back to the first one on its own:
// a confirm left waiting is a confirm the player walked away from.
const ARM_MS = 6000;
const DOUBLE_CLICK_MS = 450;

const el = {};
let onReset = () => {};
let armAt = 0;
let armTimer = 0;

const bought = () => Object.values(state.levels || {}).reduce((n, lv) => n + (lv | 0), 0);

const losses = () => [
  `${bought()} module ${bought() === 1 ? 'level' : 'levels'}`,
  `${fmt.coins(state.coins)} coins`,
  `wave ${Math.max(state.best, 1)} reached`,
  `${fmt.coins(state.kills)} kills`,
].join('  ·  ');

function paintArmed() {
  el.head.textContent = `ERASE SECTOR ${sector.current()}?`;
  el.say.innerHTML = `<b>This cannot be undone.</b> Press the button again to`
    + ` erase Sector ${sector.current()} and start it from wave 1.`;
  el.kept.textContent = losses();
  el.keptRow.dataset.label = 'ERASING';
  el.go.textContent = `CONFIRM · ERASE SECTOR ${sector.current()}`;
}

function paintAsking() {
  const id = sector.current();
  el.head.textContent = `RESET SECTOR ${id} — ${sector.nameOf(id)}?`;
  el.say.innerHTML = `Sector ${id} goes back to the start: every module in its tree,`
    + ` its coins, its wave records and keys, and the guns those modules unlocked.`
    + ` You play it again from wave 1 with an empty tree.`
    + `<i>Your other sectors keep everything — their runs, their trees, the drones`
    + ` they pay, and the sectors this one opened stay open.</i>`;
  el.kept.textContent = losses();
  el.keptRow.dataset.label = 'YOU LOSE';
  el.go.textContent = `RESET SECTOR ${id}`;
}

function disarm() {
  clearTimeout(armTimer);
  armAt = 0;
  if (!el.panel.classList.contains('hidden')) paintAsking();
}

export function close() {
  disarm();
  el.panel.classList.add('hidden');
}

function ask() {
  paintAsking();
  el.panel.classList.remove('hidden');
  el.panel.scrollIntoView({ block: 'nearest' });
}

// The armed press is deaf for a moment: a double click on the first button is
// one gesture, and it must not carry through to the confirm underneath it.
function go(now) {
  if (!armAt) {
    armAt = now;
    paintArmed();
    armTimer = setTimeout(disarm, ARM_MS);
    return;
  }
  if (now - armAt < DOUBLE_CLICK_MS) return;
  disarm();
  close();
  onReset();
}

// Any sector may be taken back, the one you are standing in being the one on
// offer: a sector opens the next one once and for all, so nothing behind you is
// holding anything up.
export function paint() {
  el.open.disabled = false;
  el.why.textContent = '';
}

export function init(reset) {
  onReset = reset;
  el.panel = document.getElementById('wp-reset');
  el.head = document.getElementById('wp-reset-head');
  el.say = document.getElementById('wp-reset-say');
  el.kept = document.getElementById('wp-reset-kept');
  el.keptRow = el.kept.parentElement;
  el.go = document.getElementById('btn-wp-go');
  el.open = document.getElementById('btn-wp-reset');
  el.why = document.getElementById('wp-reset-why');

  el.open.onclick = ask;
  document.getElementById('btn-wp-keep').onclick = close;
  el.go.onclick = (e) => go(e.timeStamp);
}
