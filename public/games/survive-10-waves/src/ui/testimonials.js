// Leaf imports, not the config barrel: index.html runs this before the game's
// module graph so the strip is up while the rest is still arriving, and the
// barrel would drag every other config file into that early pass.
import { AVATAR_ROWS } from '../config/avatars.js';
import { TESTIMONIALS, TESTIMONIALS_HEAD } from '../config/testimonials.js';

const PIXELS_PER_SECOND = 42;

const el = {};

const rowOf = (handle) => AVATAR_ROWS.indexOf(handle.toLowerCase());

function make(tag, className, text) {
  return Object.assign(document.createElement(tag), { className, textContent: text || '' });
}

function cardNode({ name, handle, quote }) {
  const card = make('div', 'tm-card');

  const row = rowOf(handle);
  const face = make('span', 'tm-face');
  if (row < 0) face.classList.add('blank');
  else face.style.setProperty('--tm-i', row);

  const who = make('span', 'tm-who');
  who.append(make('b', '', name), make('i', '', `@${handle}`));

  const body = make('span', 'tm-body');
  body.append(who, make('span', 'tm-say', quote));

  card.append(face, body);
  return card;
}

function setNode(cards) {
  const set = make('span', 'tm-set');
  set.append(...cards);
  return set;
}

// One run's width at a fixed crawl: another quote lengthens the loop rather
// than speeding the whole strip up.
function syncSpeed() {
  const span = el.track.scrollWidth / 2;
  if (span > 0) el.track.style.setProperty('--tm-dur', `${span / PIXELS_PER_SECOND}s`);
}

// Two identical runs, and the track slides exactly one of them before it
// repeats, so the seam never shows.
function build() {
  const clone = setNode(TESTIMONIALS.map(cardNode));
  clone.setAttribute('aria-hidden', 'true');

  el.track.append(setNode(TESTIMONIALS.map(cardNode)), clone);
  el.rail.append(el.track);
  el.root.append(make('div', 'tm-head', TESTIMONIALS_HEAD), el.rail);
}

export function init() {
  el.root = document.getElementById('testimonials');
  if (!el.root || !TESTIMONIALS.length) return;

  el.root.style.setProperty('--tm-n', AVATAR_ROWS.length);
  el.rail = make('div', 'tm-rail');
  el.track = make('div', 'tm-track');
  build();

  syncSpeed();
  new ResizeObserver(syncSpeed).observe(el.track);
}
