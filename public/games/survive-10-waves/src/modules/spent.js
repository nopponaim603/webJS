import { state } from '../core/world.js';
import * as layout from './layout.js';
import * as sector from '../game/sector.js';
import * as fmt from '../ui/format.js';

const el = {};

const owned = (node) => (state.levels[node.id] | 0) >= node.level;
const onModules = () => layout.NODES.reduce((n, node) => n + (owned(node) ? node.cost : 0), 0);

const row = (label, value, cls = '') =>
  `<div class="t-stat${cls}"><span class="s-label">${label}</span>`
  + `<span class="s-coin"><span class="coin-dot"></span>${fmt.coins(value)}</span></div>`;

function paint() {
  const mods = onModules();
  const repairs = state.repaired | 0;
  el.card.innerHTML = `<div class="t-head"><span class="t-name">SPENT</span>`
    + `<span class="t-lv">SECTOR ${sector.current()}</span></div>`
    + row('MODULES', mods)
    + row('REPAIRS', repairs)
    + row('TOTAL', mods + repairs, ' sp-total');
}

export function hide() { el.card.classList.add('hidden'); }

export function init(purse) {
  el.card = document.getElementById('mod-spent');
  purse.onpointerenter = () => { paint(); el.card.classList.remove('hidden'); };
  purse.onpointerleave = hide;
}
