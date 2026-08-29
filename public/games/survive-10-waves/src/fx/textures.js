import * as THREE from 'three';
import { rngFrom } from '../core/rng.js';
import { CFG } from '../config/index.js';
import { wobble, softly, fieldOf } from './canvasfx.js';

export const GEO = {
  gib: new THREE.BoxGeometry(0.18, 0.18, 0.18),
  spark: new THREE.BoxGeometry(0.1, 0.1, 0.1),
  splat: new THREE.PlaneGeometry(2, 2),
  drop: new THREE.SphereGeometry(0.095, 6, 4),
  // Pivoted on its base, so a flame is scaled and stood on the ground.
  flame: new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0),
};

// The shape is painted inside this much of the canvas; the rest is room for the
// rim to fade into, so nothing is clipped at the border.
export const ZONE_FILL = 0.76;

function makeZoneTexture(kind, seed) {
  const S = 256, R = (S / 2) * ZONE_FILL;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);
  g.fillStyle = '#fff';

  const mid = S / 2;
  const ring = (edge, r0, sweep) => {
    g.beginPath();
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2;
      const r = r0 * edge(a) * sweep;
      const x = mid + Math.cos(a) * r, y = mid + Math.sin(a) * r;
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.closePath();
    g.fill();
  };

  if (kind === 'lane') {
    const edge = wobble(rnd, 0.05);
    const x0 = mid - R, x1 = mid + R;
    g.beginPath();
    for (let i = 0; i <= 64; i++) {
      const x = x0 + (i / 64) * (x1 - x0);
      const y = mid - R * edge(i * 0.11);
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    for (let i = 64; i >= 0; i--) {
      g.lineTo(x0 + (i / 64) * (x1 - x0), mid + R * edge(i * 0.09 + 3));
    }
    g.closePath();
    g.fill();
  } else {
    ring(wobble(rnd, 0.045), R, 1);
    if (kind === 'annulus') {
      g.globalCompositeOperation = 'destination-out';
      ring(wobble(rnd, 0.05), R, CFG.spikes.halo.inner / CFG.spikes.halo.outer);
      g.globalCompositeOperation = 'source-over';
    }
  }
  // A thin ring cannot take as much blur as a solid shape without washing out.
  softly(cv, g, kind === 'annulus' ? 4 : 9);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// A clean band that fades out at its sides and softens off at the ends: a swoop
// wants a precise edge, just not a cut one.
function makeBandTexture() {
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');

  const across = g.createLinearGradient(0, 0, S, 0);
  across.addColorStop(0, 'rgba(255,255,255,0)');
  across.addColorStop(0.16, '#fff');
  across.addColorStop(0.84, '#fff');
  across.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = across;
  g.fillRect(0, 0, S, S);

  const along = g.createLinearGradient(0, 0, 0, S);
  along.addColorStop(0, 'rgba(255,255,255,0)');
  along.addColorStop(0.07, '#fff');
  along.addColorStop(0.93, '#fff');
  along.addColorStop(1, 'rgba(255,255,255,0)');
  g.globalCompositeOperation = 'destination-in';
  g.fillStyle = along;
  g.fillRect(0, 0, S, S);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const BAND_TEX = makeBandTexture();

// A wall of light standing on the floor: bright where it meets the ground and
// blurred away towards the top, softened off at both ends so the path arrives
// and leaves rather than starting at a cut.
function makeTrailTexture() {
  const S = 64;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');

  const up = g.createLinearGradient(0, S, 0, 0);
  up.addColorStop(0.00, '#fff');
  up.addColorStop(0.30, 'rgba(255,255,255,0.7)');
  up.addColorStop(0.65, 'rgba(255,255,255,0.26)');
  up.addColorStop(1.00, 'rgba(255,255,255,0)');
  g.fillStyle = up;
  g.fillRect(0, 0, S, S);

  const ends = g.createLinearGradient(0, 0, S, 0);
  ends.addColorStop(0.00, 'rgba(255,255,255,0)');
  ends.addColorStop(0.10, '#fff');
  ends.addColorStop(0.90, '#fff');
  ends.addColorStop(1.00, 'rgba(255,255,255,0)');
  g.globalCompositeOperation = 'destination-in';
  g.fillStyle = ends;
  g.fillRect(0, 0, S, S);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

export const TRAIL_TEX = makeTrailTexture();

// A bead of acid rather than a plain ball: curdled light and dark so the skin
// has something to catch, and a highlight up one side so it reads as wet. Kept
// colourless — the material tints it, so the acid has one brightness knob.
function makeBubbleTexture(seed) {
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  g.fillStyle = '#c9c9c9';
  g.fillRect(0, 0, S, S);

  for (let i = 0, n = 18 + ((rnd() * 10) | 0); i < n; i++) {
    const x = rnd() * S, y = rnd() * S, r = S * (0.05 + rnd() * 0.16);
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    const light = rnd() < 0.55;
    grd.addColorStop(0, light ? 'rgba(255,255,255,0.85)' : 'rgba(96,96,96,0.7)');
    grd.addColorStop(1, 'rgba(200,200,200,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }

  const hi = g.createRadialGradient(S * 0.34, S * 0.3, 0, S * 0.34, S * 0.3, S * 0.3);
  hi.addColorStop(0, 'rgba(255,255,255,0.95)');
  hi.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = hi;
  g.fillRect(0, 0, S, S);

  if (g.filter !== undefined) {
    g.filter = 'blur(1.4px)';
    g.drawImage(cv, 0, 0);
    g.filter = 'none';
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const BUBBLE_TEX = [0, 1, 2].map((i) => makeBubbleTexture(i + 71));

export const ZONE_TEX = {
  disc: makeZoneTexture('disc', 131),
  annulus: makeZoneTexture('annulus', 137),
  lane: makeZoneTexture('lane', 139),
};

function makeGlowTexture() {
  const S = 128, R = S / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(R, R, 0, R, R, R);

  grad.addColorStop(0.00, 'rgba(255,255,255,1)');
  grad.addColorStop(0.30, 'rgba(255,255,255,0.92)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.42)');
  grad.addColorStop(0.80, 'rgba(255,255,255,0.10)');
  grad.addColorStop(1.00, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;

  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}
export const GLOW_TEX = makeGlowTexture();

function makePuffTexture(seed) {
  const S = 128, R = S / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);
  const lobe = (cx, cy, r, a) => {
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    gr.addColorStop(0, `rgba(255,255,255,${a})`);
    gr.addColorStop(0.55, `rgba(255,255,255,${a * 0.55})`);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(cx - r, cy - r, r * 2, r * 2);
  };
  lobe(R, R, R * 0.62, 0.85);
  for (let i = 0; i < 7; i++) {
    const a = rnd() * Math.PI * 2, d = R * (0.12 + rnd() * 0.3);
    lobe(R + Math.cos(a) * d, R + Math.sin(a) * d, R * (0.24 + rnd() * 0.26), 0.5 + rnd() * 0.3);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}
export const PUFF_TEX = [0, 1, 2].map((i) => makePuffTexture(i + 61));

// One shape swayed by a phase that comes back round, so the frames loop.
// Round enough to hold up from any angle, since a parcel is fully billboarded.
function makeFlamePuff(seed) {
  const S = 128;
  const rnd = rngFrom(seed);
  const field = fieldOf(rnd, [3, 6, 12, 24]);

  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(S, S);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = (x + 0.5) / S, v = (y + 0.5) / S;
      const dx = u * 2 - 1, dy = v * 2 - 1;
      const r = Math.hypot(dx, dy);
      const core = 1 - Math.min(1, Math.max(0, (r - 0.12) / 0.82)) ** 1.5;
      const a = core - field(u, v) * 1.25 * r ** 1.4;

      const i = (y * S + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = Math.max(0, Math.min(1, a)) * 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const FLAME_TEX = [151, 157, 163, 167, 173].map(makeFlamePuff);

function makeWakeTexture() {
  const W = 8, H = 64;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  for (let y = 0; y < H; y++) {
    const a = Math.sin((y / (H - 1)) * Math.PI) ** 2;
    g.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
    g.fillRect(0, y, W, 1);
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
export const WAKE_TEX = makeWakeTexture();

// The impaler's spikes. The canvas runs tip-first — a texture's first row is the
// top of the cone — and the shell is banded rather than blended, like the flame.
const SPIKE_BANDS = [
  { to: 0.13, fill: '#f2ecff' },
  { to: 0.30, fill: '#cbb8e8' },
  { to: 0.52, fill: '#9d84c6' },
  { to: 0.78, fill: '#6d5596' },
  { to: 1.00, fill: '#3f3061' },
];

function makeSpikeTexture(seed) {
  const W = 64, H = 160;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  let from = 0;
  for (const band of SPIKE_BANDS) {
    g.fillStyle = band.fill;
    g.fillRect(0, from * H, W, (band.to - from) * H + 1);
    from = band.to;
  }

  // Ridges down the shaft: the shell is grown, not moulded.
  for (let i = 0; i < 5; i++) {
    const x = (i + 0.35 + rnd() * 0.3) * (W / 5);
    g.fillStyle = i % 2 ? 'rgba(24,16,40,0.22)' : 'rgba(255,246,255,0.16)';
    g.fillRect(x, H * 0.08, 1.6 + rnd() * 1.4, H * 0.92);
  }

  // Pores, thicker down where the shell is older and dirtier.
  for (let i = 0; i < 90; i++) {
    const v = Math.sqrt(rnd());
    g.fillStyle = `rgba(22,14,36,${0.1 + v * 0.22})`;
    g.fillRect(rnd() * W, v * H, 1 + rnd() * 2, 1 + rnd() * 2);
  }

  // Soil clinging to the foot, so a spike reads as having come through ground.
  const dirt = g.createLinearGradient(0, H, 0, H * 0.72);
  dirt.addColorStop(0, 'rgba(42,33,24,0.85)');
  dirt.addColorStop(1, 'rgba(42,33,24,0)');
  g.fillStyle = dirt;
  g.fillRect(0, H * 0.72, W, H * 0.28);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

// Only the point glows, so a field of them reads as points in the dark.
function makeSpikeTipTexture() {
  const W = 8, H = 160;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  const lit = g.createLinearGradient(0, 0, 0, H * 0.3);
  lit.addColorStop(0, '#fff');
  lit.addColorStop(0.45, '#6a6a6a');
  lit.addColorStop(1, '#000');
  g.fillStyle = lit;
  g.fillRect(0, 0, W, H * 0.3);

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

export const SPIKE_TEX = makeSpikeTexture(97);
export const SPIKE_TIP_TEX = makeSpikeTipTexture();

// The ground decals live in decaltex.js — a family of their own, and long
// enough to be read there. Handed back on from here so every module that wants
// a texture still has one place to ask.
export { SPLAT_TEX, ACID_TEX, ACID_SOFT, SCORCH_TEX } from './decaltex.js';
