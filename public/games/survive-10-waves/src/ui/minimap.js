import { CFG } from '../config/index.js';
import { world, state } from '../core/world.js';
import * as modules from '../modules/index.js';
import * as arena from '../arena/size.js';
import * as extraction from '../game/extraction.js';
import * as drone from '../allies/drone.js';

const el = {
  root: document.getElementById('minimap'),
  canvas: document.getElementById('mm-canvas'),
};

const ctx = el.canvas ? el.canvas.getContext('2d') : null;

let wait = 0;
let wide = 0;
let ratio = 0;
let shown = false;
// Measuring the canvas forces a layout, so it is measured when something could
// have changed its size and not on every redraw.
let remeasure = true;
addEventListener('resize', () => { remeasure = true; });

// The stylesheet owns how big the map is drawn — it is smaller on a phone — so
// every measure below is in CSS pixels and the backing store carries the screen
// density on its own transform.
function resize() {
  if (!remeasure) return;
  remeasure = false;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const w = el.canvas.clientWidth || CFG.minimap.size;
  if (wide === w && ratio === dpr) return;
  wide = w;
  ratio = dpr;
  el.canvas.width = Math.round(w * dpr);
  el.canvas.height = Math.round(w * dpr);
}

function dot(x, z, r, colour, k, half) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(half + x * k, half + z * k, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawWalls(k, half) {
  const M = CFG.minimap;
  ctx.fillStyle = M.wall;
  for (const b of CFG.walls.boxes) {
    if (b.hidden) continue;
    ctx.fillRect(half + (b.x - b.hx) * k, half + (b.z - b.hz) * k,
                 Math.max(1, b.hx * 2 * k), Math.max(1, b.hz * 2 * k));
  }
}

// A wedge rather than a dot, because on a map of the whole arena which way you
// are facing is most of what you want to know about yourself.
function drawPlayer(k, half) {
  const M = CFG.minimap;
  const p = world.player;
  const x = half + p.pos.x * k;
  const y = half + p.pos.z * k;
  const a = Math.atan2(p.aim ? p.aim.x : 0, p.aim ? p.aim.z : 1);

  ctx.fillStyle = M.player.color;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const t = a + (i === 0 ? 0 : i === 1 ? Math.PI * 0.78 : -Math.PI * 0.78);
    const r = i === 0 ? M.player.nose : M.player.tail;
    const px = x + Math.sin(t) * r;
    const py = y + Math.cos(t) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;

function paint() {
  const M = CFG.minimap;
  const half = wide / 2;
  // The whole arena, always: a map that scrolls is a map you have to read, and
  // what this answers is "where is everything", which only fits if it all fits.
  const k = (half - M.inset) / Math.max(1, arena.radius());

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, wide, wide);

  ctx.save();
  ctx.beginPath();
  ctx.arc(half, half, arena.radius() * k, 0, Math.PI * 2);
  ctx.fillStyle = M.ground;
  ctx.fill();
  ctx.clip();
  drawWalls(k, half);
  ctx.restore();

  ctx.strokeStyle = M.ring;
  ctx.lineWidth = M.ringWidth;
  ctx.beginPath();
  ctx.arc(half, half, arena.radius() * k, 0, Math.PI * 2);
  ctx.stroke();

  if (extraction.raised()) {
    const pad = extraction.spot();
    dot(pad.x, pad.z, M.padSize, M.padColor, k, half);
  }

  for (const b of world.bugs) {
    if (b.dummy) continue;
    const r = b.type.finale ? M.bossSize : M.bugSize;
    dot(b.pos.x, b.pos.z, r, hex(b.type.color), k, half);
  }

  for (const d of drone.list()) dot(d.pos.x, d.pos.z, M.droneSize, M.drone, k, half);

  drawPlayer(k, half);
}

export function update(dt) {
  if (!ctx) return;

  const want = modules.sees('minimap') && state.mode === 'playing';
  if (want !== shown) {
    shown = want;
    remeasure = true;
    el.root.classList.toggle('hidden', !want);
  }
  if (!want) return;

  // Redrawn on its own beat: a few hundred dots on a small canvas is cheap, but
  // not so cheap it is worth doing twice between two frames of the fight.
  wait -= dt;
  if (wait > 0) return;
  wait = CFG.minimap.every;

  resize();
  paint();
}

export function hide() {
  shown = false;
  if (el.root) el.root.classList.add('hidden');
}
