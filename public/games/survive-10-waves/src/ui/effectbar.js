import { world } from '../core/world.js';
import * as effects from '../items/effects.js';

const root = document.getElementById('effects');

// One row an effect, kept by the effect's own key so a second helping of the
// same thing refills the bar that is already there rather than stacking a rival
// beside it. Two different effects are two rows, each on its own clock. What an
// effect does reads beside its name on one line, short enough to take in without
// looking away from the fight.
const rows = new Map();

const hex = (color) => `#${color.toString(16).padStart(6, '0')}`;

function build(state) {
  const el = document.createElement('div');
  el.className = 'fx-row';
  el.innerHTML = '<span class="fx-head"><span class="fx-name"></span></span>'
    + '<i class="fx-bar"><b></b></i>';
  const fill = el.querySelector('.fx-bar > b');
  const name = el.querySelector('.fx-name');
  name.textContent = state.name;
  if (state.hint) {
    const hint = document.createElement('span');
    hint.className = 'fx-hint';
    hint.textContent = state.hint;
    name.after(hint);
  }
  if (state.color !== undefined) {
    el.style.setProperty('--fx', hex(state.color));
  }
  root.appendChild(el);
  return { el, fill };
}

export function update() {
  const p = world.player;
  const live = p ? effects.active(p) : null;

  for (const [key, row] of rows) {
    if (live && live.has(key)) continue;
    row.el.remove();
    rows.delete(key);
  }
  if (!live) return;

  for (const [key, state] of live) {
    let row = rows.get(key);
    if (!row) { row = build(state); rows.set(key, row); }
    // An effect with no clock of its own reads as full rather than as empty:
    // it is running, and that is all its bar has to say.
    const left = state.span ? Math.max(0, state.left / state.span) : 1;
    row.fill.style.width = `${(left * 100).toFixed(1)}%`;
  }
}
