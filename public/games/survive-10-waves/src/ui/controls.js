import { MOUSE, svg } from './icons.js';

const el = document.getElementById('controls');

// Everything the game answers to, grouped the way a player thinks about it
// rather than the way the handlers are written. The whole list is shown whether
// or not the bench has sold the move yet: this is the sheet a player checks to
// find out what the game can do, and a key that is missing from it cannot be
// looked up.
const GROUPS = [
  { name: 'MOVEMENT', rows: [
    { label: 'MOVE', keys: ['W', 'A', 'S', 'D'], or: ['↑', '←', '↓', '→'] },
    { label: 'DASH', keys: ['SHIFT'] },
    { label: 'FLY', keys: ['SPACE'] },
    { label: 'THUNDER DROP', keys: ['E'] },
  ] },
  { name: 'WEAPONS', rows: [
    { label: 'AIM', keys: ['MOUSE'] },
    { label: 'FIRE', mouse: 'left' },
    { label: 'PICK A GUN', keys: ['1', '2', '3', '4'] },
    { label: 'NEXT GUN', keys: ['Q'], orMouse: 'right' },
  ] },
  { name: 'GAME', rows: [
    { label: 'PAUSE', keys: ['ESC'], or: ['P'] },
    { label: 'MUSIC', keys: ['M'] },
  ] },
];

const caps = (keys) => keys.map((k) => `<kbd>${k}</kbd>`).join('');

const orElse = (html) => `<span class="ctl-or">OR</span>${html}`;

const keysOf = (row) => (row.mouse ? svg(MOUSE[row.mouse], 'mbtn')
  : caps(row.keys)
    + (row.or ? orElse(caps(row.or)) : '')
    + (row.orMouse ? orElse(svg(MOUSE[row.orMouse], 'mbtn')) : ''));

const rowHTML = (row) => `<div class="ctl-row"><span>${row.label}</span>`
  + `<span class="ctl-keys">${keysOf(row)}</span></div>`;

const groupHTML = (name, rows) => `<div class="ctl-group"><div class="ctl-head">${name}</div>`
  + rows.map(rowHTML).join('') + '</div>';

if (el) el.innerHTML = GROUPS.map((g) => groupHTML(g.name, g.rows)).join('');

// The racks' own legends are written in the markup, and name the button they
// point at rather than drawing it: the mouse is only ever drawn here.
for (const slot of document.querySelectorAll('[data-btn]')) {
  slot.outerHTML = svg(MOUSE[slot.dataset.btn], 'mbtn');
}
