import { CFG, CREDITS, DEDICATION, SOUNDTRACK_HEAD, SOUNDTRACK_LINK, THANKS, TRACKS,
         MENU_TRACK, WAVE_TRACKS } from '../config/index.js';
import { onEscape } from '../engine/input.js';
import * as sector from '../game/sector.js';
import { cue } from './buttons.js';

const el = {};
let built = false;

// The version in the credits foot is the one thing on this panel that does
// anything, and it takes ten goes to find out.
const SECRET = 10;
let taps = 0;
let stamp = '';

// A take letter is a variant of one piece, not a piece of its own, and the
// underscore in a filename stands in for the colon the title wants.
const titleOf = (path) => path.split('/').pop().replace(/\.\w+$/, '')
  .replace('_', ':').replace(/ [A-Z]$/, '');

const soundtrack = () => [...new Set([MENU_TRACK, ...TRACKS, ...Object.values(WAVE_TRACKS)]
  .map(titleOf))];

const make = (tag, className, text) => Object.assign(document.createElement(tag),
  { className, textContent: text || '' });

const moreLink = ({ label, href }) => Object.assign(make('a', 'cr-more', label),
  { href, target: '_blank', rel: 'noreferrer' });

function rowNode({ name, note, link, more }) {
  const row = make('div', 'cr-row');
  const who = make(link ? 'a' : 'b', '', name);
  if (link) { who.href = link; who.target = '_blank'; who.rel = 'noreferrer'; }
  const what = make('i', '', note);
  if (more) what.append(make('br'), moreLink(more));
  row.append(who, what);
  return row;
}

function blockNode(head, nodes) {
  const block = make('div', 'cr-block');
  block.append(make('h4', '', head), ...nodes);
  return block;
}

function build() {
  built = true;
  el.body.append(...CREDITS.map((b) => blockNode(b.head, b.rows.map(rowNode))));
  const tracks = make('div', 'cr-tracks');
  tracks.append(...soundtrack().map((name) => make('span', '', name)));
  el.body.append(blockNode(SOUNDTRACK_HEAD, [tracks, moreLink(SOUNDTRACK_LINK)]),
                 make('div', 'cr-thanks', THANKS),
                 make('div', 'cr-dedication', DEDICATION));

  // The welcome screen states the version and tools/bump.py edits it there, so
  // the credits read it off that rather than keeping a second copy.
  const version = document.querySelector('.menu-panel .title .sub');
  stamp = version ? version.textContent : '';
  el.version.textContent = stamp;
}

function tap() {
  taps += 1;
  el.version.classList.remove('tapped');
  void el.version.offsetWidth;
  el.version.classList.add('tapped');
  if (taps < SECRET) return;

  taps = 0;
  sector.openAll();
  el.version.textContent = 'ALL SECTORS OPEN';
  el.version.classList.add('opened');
  cue('sectorOpen', CFG.ui.synth.sectorOpen);
}

const open = () => !el.root.classList.contains('hidden');

export function show() {
  if (!built) build();
  taps = 0;
  el.version.textContent = stamp;
  el.version.classList.remove('opened');
  el.root.classList.remove('hidden');
  el.body.scrollTop = 0;
}

export function hide() { el.root.classList.add('hidden'); }

export function init() {
  el.root = document.getElementById('credits');
  el.body = document.getElementById('credits-body');
  el.version = document.getElementById('credits-version');
  const button = document.getElementById('btn-credits');
  if (!el.root || !button) return;

  button.onclick = show;
  el.version.onclick = tap;
  document.getElementById('btn-credits-close').onclick = hide;
  el.root.addEventListener('pointerdown', (e) => { if (e.target === el.root) hide(); });
  onEscape(() => (open() ? (hide(), true) : false));
}
