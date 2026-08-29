import { CFG } from '../config/index.js';
import * as store from '../core/store.js';
import * as loadout from '../weapons/loadout.js';
import { MOUSE, svg } from './icons.js';
import { touchDevice } from '../mobile/detect.js';

const KEY = 'survive10.learned.rackmove';
const TEACH_AT = 3;

let learned = !!store.load(KEY);
let open = false;

const box = () => document.getElementById('rack-coach');
const board = () => document.getElementById('modules');
const owned = () => loadout.list().filter((g) => g !== null).length;

function icon(slot) {
  const gun = loadout.gunAt(slot);
  return `<svg class="gico" viewBox="0 0 24 24">${gun === null ? '' : CFG.guns[gun].icon}</svg>`;
}

const slots = [1, 2, 3].map((n) => `<i class="rc-slot"><b>${n}</b></i>`).join('');

const hand = (btn) => `<span class="rc-hand">${
  touchDevice ? '<span class="rc-dot"></span>' : svg(MOUSE[btn], 'mbtn')}</span>`;

const move = () => `<div class="rc-demo rc-move">${slots}`
  + `<span class="rc-gun rc-old">${icon(0)}</span>`
  + `<span class="rc-gun rc-mid">${icon(1)}</span>`
  + `<span class="rc-gun rc-new">${icon(2)}</span>${hand('left')}</div>`;

const drop = () => `<div class="rc-demo rc-drop">${slots}`
  + `<span class="rc-gun rc-p1">${icon(0)}</span>`
  + `<span class="rc-gun rc-p2">${icon(1)}</span>`
  + `<span class="rc-gun rc-p3">${icon(2)}</span>${hand('right')}</div>`;

const row = (demo, what) => `<div class="rc-row">${demo}<span class="rc-what">${what}</span></div>`;

const cardHTML = () => `
  <div class="rc-card">
    <div class="rc-title">WEAPON RACK</div>
    ${row(move(), 'REARRANGE')}
    ${touchDevice ? '' : row(drop(), 'REMOVE')}
    <button class="btn rc-got">GOT IT</button>
  </div>`;

function place() {
  const rack = document.getElementById('modrack');
  const card = box() && box().querySelector('.rc-card');
  if (!rack || !card) return;
  const r = rack.getBoundingClientRect();
  const right = Math.min(Math.max(12, innerWidth - r.right), innerWidth - card.offsetWidth - 12);
  card.style.top = `${r.bottom + 18}px`;
  card.style.right = `${Math.max(12, right)}px`;
  const arrow = innerWidth - (r.left + r.width / 2) - Math.max(12, right);
  card.style.setProperty('--rc-arrow', `${Math.min(Math.max(18, arrow), card.offsetWidth - 18)}px`);
}

export function arrived() {
  if (learned || open) return;
  if (owned() < TEACH_AT) return;
  const layer = box();
  const screen = board();
  if (!layer || !screen || screen.classList.contains('hidden')) return;

  layer.innerHTML = cardHTML();
  layer.classList.remove('hidden');
  screen.classList.add('coaching');
  open = true;
  place();
  layer.querySelector('.rc-got').addEventListener('click', dismiss);
  addEventListener('resize', place);
}

// The card is only ever taken down by its own button: it covers a board full of
// things worth clicking, and closing it by missing one teaches nothing.
export function dismiss() {
  learn();
  clear();
}

export function learn() {
  if (learned) return;
  learned = true;
  store.save(KEY, 1);
}

export function clear() {
  if (!open) return;
  open = false;
  removeEventListener('resize', place);
  if (box()) box().classList.add('hidden');
  if (board()) board().classList.remove('coaching');
}

export function forget() {
  learned = false;
  store.forget(KEY);
}
