import * as THREE from 'three';
import { rngFrom } from '../core/rng.js';

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];
const RGB = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const dim = (c, k) => c.map((v) => v * k);
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

function palette(hex) {
  const accent = RGB(hex);
  return {
    accent,
    hot: mix(accent, WHITE, 0.55),
    mid: dim(accent, 0.56),
    plate: dim(accent, 0.30),
    dark: dim(accent, 0.15),
    soot: mix(dim(accent, 0.14), BLACK, 0.35),
    skin: mix([168, 92, 74], accent, 0.2),
    horn: mix(accent, WHITE, 0.6),
  };
}

function canvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  return [cv, cv.getContext('2d')];
}

function colourMap(cv) {
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

// An alpha map is read as a number, not a colour: decoding it as sRGB would
// bend the cut-off the feather slots are drawn against.
function maskMap(cv) {
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function scallop(g, P, x, y, w, h, j) {
  const tone = mix(P.plate, P.mid, 0.2 + j * 0.55);
  const grad = g.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, css(mix(tone, P.hot, 0.16)));
  grad.addColorStop(0.55, css(tone));
  grad.addColorStop(1, css(P.soot));
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(x - w / 2, y);
  g.lineTo(x - w / 2, y + h * 0.3);
  g.quadraticCurveTo(x - w / 2, y + h, x, y + h);
  g.quadraticCurveTo(x + w / 2, y + h, x + w / 2, y + h * 0.3);
  g.lineTo(x + w / 2, y);
  g.closePath();
  g.fill();
  g.strokeStyle = css(P.accent, 0.14 + j * 0.16);
  g.lineWidth = 1.2;
  g.stroke();
}

function plates(g, S, P, rnd) {
  for (let i = 0; i < 44; i++) {
    const x = rnd() * S, y = rnd() * S, r = 7 + rnd() * 20;
    const n = 4 + ((rnd() * 3) | 0);
    g.fillStyle = css(mix(P.soot, P.plate, rnd()), 0.55);
    g.beginPath();
    for (let k = 0; k <= n; k++) {
      const a = (k / n) * Math.PI * 2;
      const rr = r * (0.6 + rnd() * 0.6);
      g[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.closePath();
    g.fill();
  }
}

function vents(g, w, h, P, rnd, count) {
  for (let i = 0; i < count; i++) {
    const long = 10 + rnd() * 18;
    const wide = 2.5 + rnd() * 2.5;
    g.save();
    g.translate(rnd() * w, rnd() * h);
    g.rotate((rnd() - 0.5) * 0.9);
    g.fillStyle = css(P.accent, 0.3);
    g.fillRect(-wide, -long / 2 - 3, wide * 2, long + 6);
    g.fillStyle = css(P.hot, 0.8);
    g.fillRect(-wide / 2, -long / 2, wide, long);
    g.restore();
  }
}

function speckle(g, w, h, P, rnd, count) {
  for (let i = 0; i < count; i++) {
    g.fillStyle = css(P.soot, 0.1 + rnd() * 0.3);
    g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 2, 1 + rnd() * 2);
  }
}

const SHEET = 256;

function plumeSheet(P, seed) {
  const [cv, g] = canvas(SHEET, SHEET);
  const rnd = rngFrom(seed);
  g.fillStyle = css(P.dark);
  g.fillRect(0, 0, SHEET, SHEET);
  plates(g, SHEET, P, rnd);

  const rows = 9, cols = 7;
  const rh = SHEET / rows, cw = SHEET / cols;
  for (let r = 0; r < rows; r++) {
    // Drawn one period wide on either side so the sheet meets itself where the
    // body wraps round.
    for (let c = -1; c <= cols; c++) {
      const j = rngFrom(r * 71 + (((c % cols) + cols) % cols) * 13)();
      const x = (c + (r % 2 ? 0.5 : 0)) * cw;
      scallop(g, P, x, r * rh - rh * 0.3, cw * 1.14, rh * 1.9, j);
    }
  }

  vents(g, SHEET, SHEET, P, rnd, 6);
  speckle(g, SHEET, SHEET, P, rnd, 180);
  return cv;
}

function hideSheet(P, seed) {
  const [cv, g] = canvas(SHEET, SHEET);
  const rnd = rngFrom(seed);
  g.fillStyle = css(P.skin);
  g.fillRect(0, 0, SHEET, SHEET);

  for (let i = 0; i < 26; i++) {
    const x = rnd() * SHEET, y = rnd() * SHEET, r = 12 + rnd() * 36;
    const tone = rnd() < 0.55 ? mix(P.skin, P.soot, 0.6) : mix(P.skin, P.hot, 0.35);
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, css(tone, 0.5));
    grd.addColorStop(1, css(tone, 0));
    g.fillStyle = grd;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }

  g.lineCap = 'round';
  for (let i = 0; i < 44; i++) {
    const x = rnd() * SHEET, y = rnd() * SHEET, len = 18 + rnd() * 54;
    const lift = rnd() < 0.5;
    g.strokeStyle = lift ? css(mix(P.skin, WHITE, 0.3), 0.22)
                         : css(mix(P.skin, P.soot, 0.7), 0.34);
    g.lineWidth = 0.9 + rnd() * 1.5;
    g.beginPath();
    for (let k = 0; k <= 8; k++) {
      const t = k / 8;
      g[k ? 'lineTo' : 'moveTo'](x + t * len, y + Math.sin(t * 5.5 + i) * 3.5);
    }
    g.stroke();
  }

  speckle(g, SHEET, SHEET, P, rnd, 260);
  return cv;
}

// Keratin runs pale at the root to near-black at the point, so a beak reads as
// worn down rather than painted on.
function hornSheet(P, seed) {
  const [cv, g] = canvas(64, 160);
  const rnd = rngFrom(seed);
  const grd = g.createLinearGradient(0, 0, 0, 160);
  grd.addColorStop(0.00, css(mix(P.soot, P.plate, 0.3)));
  grd.addColorStop(0.24, css(mix(P.plate, P.horn, 0.4)));
  grd.addColorStop(0.62, css(P.horn));
  grd.addColorStop(1.00, css(mix(P.horn, P.hot, 0.45)));
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 160);

  for (let i = 0; i < 11; i++) {
    g.fillStyle = css(P.soot, 0.08 + rnd() * 0.14);
    g.fillRect(0, 22 + rnd() * 130, 64, 1 + rnd() * 2);
  }
  speckle(g, 64, 160, P, rnd, 40);
  return cv;
}

// Root to tip runs left to right; leading edge is the foot of the sheet and the
// trailing edge its head, which is where the feathers are cut apart.
const WING_W = 256, WING_H = 192;

const EDGES = {
  inner: {
    lead: (u) => 0.13 + 0.05 * u,
    trail: (u) => 0.46 + 0.44 * Math.sin(Math.min(1, u * 1.25) * 1.1)
                       + 0.018 * Math.sin(u * 44),
  },
  outer: {
    lead: (u) => 0.15 + 0.06 * u,
    trail: (u) => 0.34 + 0.16 * u,
  },
};

function fingersOf(trail) {
  const N = 6;
  return Array.from({ length: N }, (_, i) => {
    const t = i / (N - 1);
    const u = 0.14 + t * 0.78;
    const len = 0.20 + 0.32 * Math.sin(Math.PI * (0.22 + 0.66 * t));
    return {
      x0: u * WING_W, y0: WING_H * (1 - (trail(u) - 0.08)),
      x1: (u + 0.05 + t * 0.05) * WING_W, y1: WING_H * (1 - (trail(u) + len)),
      w: WING_W * (0.054 - t * 0.01),
    };
  });
}

function planform(g, lead, trail) {
  g.beginPath();
  for (let i = 0; i <= 48; i++) {
    const u = i / 48;
    g[i ? 'lineTo' : 'moveTo'](u * WING_W, WING_H * (1 - lead(u)));
  }
  for (let i = 48; i >= 0; i--) {
    const u = i / 48;
    g.lineTo(u * WING_W, WING_H * (1 - trail(u)));
  }
  g.closePath();
  g.fill();
}

function wingMask(kind) {
  const [cv, g] = canvas(WING_W, WING_H);
  const e = EDGES[kind];
  g.fillStyle = '#000';
  g.fillRect(0, 0, WING_W, WING_H);
  g.fillStyle = '#fff';
  g.strokeStyle = '#fff';
  planform(g, e.lead, e.trail);

  if (kind === 'outer') {
    g.lineCap = 'round';
    for (const f of fingersOf(e.trail)) {
      g.lineWidth = f.w;
      g.beginPath();
      g.moveTo(f.x0, f.y0);
      g.lineTo(f.x1, f.y1);
      g.stroke();
    }
  }
  return cv;
}

function wingSheet(P, kind, seed) {
  const [cv, g] = canvas(WING_W, WING_H);
  const rnd = rngFrom(seed);
  g.fillStyle = css(P.dark);
  g.fillRect(0, 0, WING_W, WING_H);

  const quills = kind === 'outer' ? 16 : 26;
  const step = WING_W / quills;
  const lean = WING_W * (kind === 'outer' ? 0.075 : 0.04);
  for (let i = 0; i <= quills; i++) {
    const x = i * step + (rnd() - 0.5) * 3;
    const tone = mix(P.plate, P.soot, (i % 2) * 0.4 + rnd() * 0.25);
    g.fillStyle = css(tone);
    g.beginPath();
    g.moveTo(x, WING_H);
    g.lineTo(x + step, WING_H);
    g.lineTo(x + step + lean, 0);
    g.lineTo(x + lean, 0);
    g.closePath();
    g.fill();

    g.strokeStyle = css(mix(tone, P.hot, 0.5), 0.45);
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x + step / 2, WING_H);
    g.lineTo(x + step / 2 + lean, 0);
    g.stroke();
  }

  // Coverts shingle away from the leading edge, so the sheet is drawn upside
  // down for them and flipped back.
  g.save();
  g.translate(0, WING_H);
  g.scale(1, -1);
  const cw = WING_W / 12;
  for (let r = 0; r < 2; r++) {
    for (let c = -1; c <= 12; c++) {
      const j = rngFrom(r * 17 + c * 5 + 3)();
      scallop(g, P, (c + (r % 2 ? 0.5 : 0)) * cw, 20 + r * 24, cw * 1.1, 34, j);
    }
  }
  g.restore();

  vents(g, WING_W, WING_H * 0.65, P, rnd, 3);
  speckle(g, WING_W, WING_H, P, rnd, 200);
  return cv;
}

const TAIL_S = 192;

function rectrices() {
  const N = 7;
  return Array.from({ length: N }, (_, i) => {
    const t = i / (N - 1) - 0.5;
    const a = t * 0.92;
    const len = TAIL_S * (0.95 - Math.abs(t) * 0.36);
    return {
      x: TAIL_S / 2 + Math.sin(a) * len,
      y: TAIL_S - Math.cos(a) * len,
      w: TAIL_S * 0.115,
    };
  });
}

function tailMask() {
  const [cv, g] = canvas(TAIL_S, TAIL_S);
  g.fillStyle = '#000';
  g.fillRect(0, 0, TAIL_S, TAIL_S);
  g.strokeStyle = '#fff';
  g.lineCap = 'round';
  for (const f of rectrices()) {
    g.lineWidth = f.w;
    g.beginPath();
    g.moveTo(TAIL_S / 2, TAIL_S);
    g.lineTo(f.x, f.y);
    g.stroke();
  }
  return cv;
}

function tailSheet(P, seed) {
  const [cv, g] = canvas(TAIL_S, TAIL_S);
  const rnd = rngFrom(seed);
  g.fillStyle = css(P.dark);
  g.fillRect(0, 0, TAIL_S, TAIL_S);

  g.lineCap = 'round';
  let i = 0;
  for (const f of rectrices()) {
    const tone = mix(P.plate, P.soot, (i++ % 2) * 0.5 + rnd() * 0.25);
    g.strokeStyle = css(tone);
    g.lineWidth = f.w;
    g.beginPath();
    g.moveTo(TAIL_S / 2, TAIL_S);
    g.lineTo(f.x, f.y);
    g.stroke();

    g.strokeStyle = css(mix(tone, P.hot, 0.5), 0.5);
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(TAIL_S / 2, TAIL_S);
    g.lineTo(f.x, f.y);
    g.stroke();
  }

  const root = g.createRadialGradient(TAIL_S / 2, TAIL_S, 0, TAIL_S / 2, TAIL_S, TAIL_S * 0.4);
  root.addColorStop(0, css(P.mid, 0.55));
  root.addColorStop(1, css(P.mid, 0));
  g.fillStyle = root;
  g.fillRect(0, 0, TAIL_S, TAIL_S);
  speckle(g, TAIL_S, TAIL_S, P, rnd, 140);
  return cv;
}

const RUFF_W = 256, RUFF_H = 128;
const RUFF_STRANDS = 26;
const strandJitter = (i) => rngFrom(i * 29 + 7)();

function ruffMask() {
  const [cv, g] = canvas(RUFF_W, RUFF_H);
  g.fillStyle = '#000';
  g.fillRect(0, 0, RUFF_W, RUFF_H);
  g.fillStyle = '#fff';
  g.fillRect(0, 0, RUFF_W, RUFF_H * 0.5);

  g.strokeStyle = '#fff';
  g.lineCap = 'round';
  const step = RUFF_W / RUFF_STRANDS;
  for (let i = 0; i < RUFF_STRANDS; i++) {
    const j = strandJitter(i);
    g.lineWidth = step * (0.5 + j * 0.28);
    g.beginPath();
    g.moveTo((i + 0.5) * step, RUFF_H * 0.44);
    g.lineTo((i + 0.5 + (j - 0.5) * 0.3) * step, RUFF_H * (0.74 + j * 0.22));
    g.stroke();
  }
  return cv;
}

function ruffSheet(P, seed) {
  const [cv, g] = canvas(RUFF_W, RUFF_H);
  const rnd = rngFrom(seed);
  const grd = g.createLinearGradient(0, 0, 0, RUFF_H);
  grd.addColorStop(0, css(P.mid));
  grd.addColorStop(0.45, css(P.plate));
  grd.addColorStop(1, css(P.soot));
  g.fillStyle = grd;
  g.fillRect(0, 0, RUFF_W, RUFF_H);

  g.lineCap = 'round';
  const step = RUFF_W / RUFF_STRANDS;
  for (let i = 0; i < RUFF_STRANDS; i++) {
    const j = strandJitter(i);
    g.strokeStyle = css(mix(P.plate, P.hot, 0.2 + j * 0.3), 0.5);
    g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo((i + 0.5) * step, RUFF_H * 0.1);
    g.lineTo((i + 0.5 + (j - 0.5) * 0.3) * step, RUFF_H);
    g.stroke();
  }
  speckle(g, RUFF_W, RUFF_H, P, rnd, 120);
  return cv;
}

const CACHE = new Map();

export function plumage(hex) {
  if (CACHE.has(hex)) return CACHE.get(hex);
  const P = palette(hex);
  const kit = {
    plume: colourMap(plumeSheet(P, 11)),
    hide: colourMap(hideSheet(P, 17)),
    horn: colourMap(hornSheet(P, 23)),
    inner: { map: colourMap(wingSheet(P, 'inner', 29)), mask: maskMap(wingMask('inner')) },
    outer: { map: colourMap(wingSheet(P, 'outer', 31)), mask: maskMap(wingMask('outer')) },
    tail: { map: colourMap(tailSheet(P, 37)), mask: maskMap(tailMask()) },
    ruff: { map: colourMap(ruffSheet(P, 41)), mask: maskMap(ruffMask()) },
  };
  CACHE.set(hex, kit);
  return kit;
}
