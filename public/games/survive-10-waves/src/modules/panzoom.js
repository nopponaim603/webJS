import { touchDevice } from '../mobile/detect.js';

// A thumb needs bigger nodes than a mouse does, so touch starts closer in and
// pans more rather than reading the whole tree at once.
const ZOOM = touchDevice
  ? { min: 0.5, max: 2.8, fit: 1.8, floor: 0.85, speed: 0.0012 }
  : { min: 0.34, max: 2.2, fit: 1.5, floor: 0.34, speed: 0.0012 };

const PAD = touchDevice ? 90 : 130;
const DRAG_SLOP = 4;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

let el = null;
let pan = null;
let hooks = { tap: () => {}, drag: () => {}, move: () => {} };

const view = { x: 0, y: 0, k: 1 };
const points = new Map();
let drag = null;
let pinch = null;

function apply() {
  pan.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.k})`;
}

function zoomAt(cx, cy, factor) {
  const r = el.getBoundingClientRect();
  const mx = cx - r.left, my = cy - r.top;
  const k = clamp(view.k * factor, ZOOM.min, ZOOM.max);
  const ratio = k / view.k;
  view.x = mx - (mx - view.x) * ratio;
  view.y = my - (my - view.y) * ratio;
  view.k = k;
}

function grip() {
  const [a, b] = [...points.values()];
  return { dist: Math.hypot(a.x - b.x, a.y - b.y), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function startDrag(id, x, y, moved) {
  drag = { id, x, y, px: view.x, py: view.y, moved };
  el.classList.add('dragging');
}

function down(e) {
  // The right button is the tree's own: it buys a whole climb at once, and must
  // not also land as a tap or drag the board out from under itself.
  if (e.button > 0) return;
  points.set(e.pointerId, { x: e.clientX, y: e.clientY });
  el.setPointerCapture(e.pointerId);

  if (points.size === 2) { pinch = grip(); drag = null; el.classList.remove('dragging'); return; }
  if (points.size > 2) return;
  startDrag(e.pointerId, e.clientX, e.clientY, false);
}

// The midpoint anchors the scale and then carries the pan, so two fingers zoom
// and shove the tree in one gesture.
function pinchTo() {
  const now = grip();
  zoomAt(now.x, now.y, now.dist / (pinch.dist || now.dist));
  view.x += now.x - pinch.x;
  view.y += now.y - pinch.y;
  pinch = now;
  apply();
}

function move(e) {
  hooks.move(e.clientX, e.clientY);
  if (!points.has(e.pointerId)) return;
  points.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (pinch && points.size >= 2) { pinchTo(); return; }
  if (!drag || e.pointerId !== drag.id) return;

  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!drag.moved && Math.abs(dx) + Math.abs(dy) > DRAG_SLOP) { drag.moved = true; hooks.drag(); }
  view.x = drag.px + dx;
  view.y = drag.py + dy;
  apply();
}

function up(e, tapped) {
  points.delete(e.pointerId);
  if (points.size < 2) pinch = null;

  const wasDrag = drag && e.pointerId === drag.id;
  if (wasDrag) {
    const still = !drag.moved;
    drag = null;
    el.classList.remove('dragging');
    if (still && tapped) hooks.tap(e.clientX, e.clientY);
  }

  // The finger left behind takes over the pan, or the tree jumps the moment it
  // moves. It never counts as a tap: the gesture was a pinch.
  if (points.size === 1 && !drag) {
    const [id, p] = [...points.entries()][0];
    startDrag(id, p.x, p.y, true);
  }
}

export function init(viewEl, panEl, h) {
  el = viewEl;
  pan = panEl;
  hooks = { ...hooks, ...h };

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', (e) => up(e, true));
  el.addEventListener('pointercancel', (e) => up(e, false));

  el.addEventListener('wheel', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1;
    zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * unit * ZOOM.speed));
    apply();
  }, { passive: false });
}

// As close in as what is live will allow. `ZOOM.fit` is the ceiling, so the
// first board of a run — a handful of rungs around the hub — reads as a tree
// rather than filling the screen with eight icons.
export function fit(lo, hi) {
  const r = el.getBoundingClientRect();
  const span = (a, b) => b - a + PAD;
  view.k = clamp(Math.min(r.width / span(lo.x, hi.x), r.height / span(lo.y, hi.y)),
                 ZOOM.floor, ZOOM.fit);
  view.x = r.width / 2 - (lo.x + hi.x) / 2 * view.k;
  view.y = r.height / 2 - (lo.y + hi.y) / 2 * view.k;
  apply();
}
