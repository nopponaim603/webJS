import { state } from '../core/world.js';
import { clock } from '../core/time.js';
import * as fmt from '../ui/format.js';

const big = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M`
  : n >= 1e4 ? `${Math.round(n / 1e3)}k`
    : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(Math.round(n)));

let step = 0;

const stagger = () => `style="--i: ${step++}"`;

const row = (label, value) =>
  `<div class="s-row" ${stagger()}><span>${label}</span><b>${value}</b></div>`;

const head = (label) => `<div class="s-head" ${stagger()}>${label}</div>`;

const ledger = (book) => Object.entries(book)
  .sort((a, b) => b[1] - a[1])
  .map(([who, sum]) => row(who, big(sum)))
  .join('') || row('nothing', 0);

// One line a wave played: how long it took and what it cost. A wave that took
// nobody says so by leaving the mark off rather than by printing a nought.
const waveRow = (wave) => {
  const secs = state.waveTimes[wave];
  const dead = state.deaths[wave] || 0;
  return `<div class="s-row" ${stagger()}><span>WAVE ${wave}</span>`
    + `<b>${secs ? clock(secs) : '—'}`
    + (dead ? `<i class="s-dead-mark">&times;${dead}</i>` : '')
    + `</b></div>`;
};

// Every wave the run has behind it, whether it was timed, paid for in bodies,
// or both: a retry that killed everyone still belongs on the list.
const pastWaves = () => {
  const waves = [...new Set([...Object.keys(state.waveTimes), ...Object.keys(state.deaths)])]
    .map(Number).sort((a, b) => a - b);
  if (!waves.length) return '';
  return `<details class="s-fold" ${stagger()}>`
    + `<summary class="s-head">PAST WAVES</summary>`
    + waves.map(waveRow).join('')
    + `</details>`;
};

const deadRoll = () => {
  const total = Object.values(state.deaths).reduce((n, dead) => n + dead, 0);
  return `<div class="s-dead" ${stagger()}>`
    + `<div class="s-dead-n">${total}</div><div class="s-dead-label">TOTAL DEAD</div>`
    + `</div>`;
};

const playTime = () => `<div class="s-foot">`
  + row('PLAY TIME', clock(state.played))
  + `</div>`;

export function paint(el) {
  step = 0;
  el.innerHTML = `<div class="s-list">`
    + row('KILLS', state.waveKills)
    + row('COINS', fmt.coins(state.waveEarned))
    + head('DAMAGE TAKEN') + ledger(state.hurtBy)
    + head('DAMAGE DEALT') + ledger(state.dealtBy)
    + pastWaves()
    + `</div>`
    + deadRoll()
    + playTime();
}
