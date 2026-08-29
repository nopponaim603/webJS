import * as THREE from 'three';
import { rngFrom } from '../core/rng.js';
import { softly } from './canvasfx.js';

// What the fight leaves on the floor: blood, acid and scorch. One family, drawn
// from the same idea — a shape torn out of nothing and then bitten into — and
// the only textures in the game a player looks at for the rest of a wave.

function makeSplatTexture(seed) {
  const S = 512, R = S / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  // Many frequencies, not four: four smooth lobes draw a compass curve.
  const H = [];
  for (let k = 1; k <= 26; k++) {
    H.push({ k, amp: (0.24 / Math.pow(k, 1.25)) * (0.35 + rnd() * 1.3),
             ph: rnd() * Math.PI * 2 });
  }
  const radius = (a) => {
    let r = 0.58;
    for (const h of H) r += h.amp * Math.sin(a * h.k + h.ph);
    return R * Math.min(0.99, Math.max(0.1, r));
  };

  g.fillStyle = '#fff';
  const N = 512;
  g.beginPath();
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r = radius(a);
    const x = R + Math.cos(a) * r, y = R + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
  g.fill();

  g.globalCompositeOperation = 'destination-out';
  for (let i = 0, n = 90 + ((rnd() * 70) | 0); i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * R * 0.9;
    const x = R + Math.cos(a) * d, y = R + Math.sin(a) * d;
    const rad = R * (0.014 + rnd() * 0.07);
    const hg = g.createRadialGradient(x, y, 0, x, y, rad);
    hg.addColorStop(0, `rgba(0,0,0,${0.10 + rnd() * 0.45})`);
    hg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = hg;
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
  }

  g.fillStyle = '#000';
  for (let i = 0, n = 130 + ((rnd() * 90) | 0); i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = radius(a) * (0.94 + rnd() * 0.16);
    g.globalAlpha = 0.3 + rnd() * 0.7;
    g.beginPath();
    g.arc(R + Math.cos(a) * d, R + Math.sin(a) * d, R * (0.006 + rnd() * 0.038),
          0, Math.PI * 2);
    g.fill();
  }

  g.globalCompositeOperation = 'source-over';
  g.fillStyle = '#fff';
  for (let i = 0, n = 110 + ((rnd() * 70) | 0); i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = radius(a) * (0.9 + rnd() * 0.22);
    g.globalAlpha = 0.35 + rnd() * 0.65;
    g.beginPath();
    g.arc(R + Math.cos(a) * d, R + Math.sin(a) * d, R * (0.005 + rnd() * 0.03),
          0, Math.PI * 2);
    g.fill();
  }

  const drops = 14 + Math.floor(rnd() * 10);
  for (let i = 0; i < drops; i++) {
    const a = rnd() * Math.PI * 2;
    const t = rnd();
    const d = radius(a) * (1.02 + t * 1.05);
    const rad = R * (0.055 - 0.036 * t) * (0.5 + rnd());
    if (d + rad > R) continue;
    g.globalAlpha = 0.55 + rnd() * 0.45;
    g.beginPath();
    g.ellipse(R + Math.cos(a) * d, R + Math.sin(a) * d,
              rad, rad * (0.55 + rnd() * 0.8), a, 0, Math.PI * 2);
    g.fill();
  }

  for (let i = 0, n = 150 + ((rnd() * 90) | 0); i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = radius(a) * (1.0 + rnd() * 1.25);
    const rad = R * (0.003 + rnd() * 0.012);
    if (d + rad > R) continue;
    g.globalAlpha = 0.25 + rnd() * 0.55;
    g.beginPath();
    g.arc(R + Math.cos(a) * d, R + Math.sin(a) * d, rad, 0, Math.PI * 2);
    g.fill();
  }

  for (let i = 0, n = 5 + Math.floor(rnd() * 5); i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = radius(a) * (0.95 + rnd() * 0.55);
    if (d > R * 0.9) continue;
    g.globalAlpha = 0.4 + rnd() * 0.5;
    g.beginPath();
    g.ellipse(R + Math.cos(a) * d, R + Math.sin(a) * d,
              R * (0.05 + rnd() * 0.1), R * (0.008 + rnd() * 0.014), a, 0, Math.PI * 2);
    g.fill();
  }

  g.globalAlpha = 1;
  // Only enough to take the stairs off the speckle; more rounds off the grain.
  if (g.filter !== undefined) {
    g.filter = 'blur(0.6px)';
    g.drawImage(cv, 0, 0);
    g.filter = 'none';
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const SPLAT_TEX = [0, 1, 2, 3].map((i) => makeSplatTexture(i + 1));

// The same blob, then eaten into: pits and a bitten rim are what tell a pool of
// acid apart from a splash of blood.
function makeAcidTexture(seed) {
  const S = 256, R = S / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  g.drawImage(makeSplatTexture(seed).image, 0, 0, S, S);

  g.globalCompositeOperation = 'destination-out';
  for (let i = 0, n = 22 + ((rnd() * 14) | 0); i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * R * 0.62;
    const rad = R * (0.02 + rnd() * 0.055);
    g.globalAlpha = 0.35 + rnd() * 0.5;
    g.beginPath();
    g.ellipse(R + Math.cos(a) * d, R + Math.sin(a) * d, rad, rad * (0.7 + rnd() * 0.6),
              a, 0, Math.PI * 2);
    g.fill();
  }

  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  if (g.filter !== undefined) {
    g.filter = 'blur(0.8px)';
    g.drawImage(cv, 0, 0);
    g.filter = 'none';
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const ACID_TEX = [0, 1, 2, 3].map((i) => makeAcidTexture(i + 91));

// The same shapes with their edge taken off, for marking ground that is about
// to be covered: a telegraph reads as a warning by being soft, and reads as
// honest by being the shape that actually lands.
export const ACID_SOFT = ACID_TEX.map((tex) => {
  const cv = document.createElement('canvas');
  cv.width = tex.image.width;
  cv.height = tex.image.height;
  const g = cv.getContext('2d');
  g.drawImage(tex.image, 0, 0);
  softly(cv, g, cv.width * 0.045);

  const out = new THREE.CanvasTexture(cv);
  out.colorSpace = THREE.SRGBColorSpace;
  return out;
});

function makeScorchTexture(seed) {
  const S = 256, R = S / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  const grad = g.createRadialGradient(R, R, 0, R, R, R * 0.94);
  grad.addColorStop(0.00, 'rgba(255,255,255,1)');
  grad.addColorStop(0.34, 'rgba(255,255,255,0.94)');
  grad.addColorStop(0.62, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.85, 'rgba(255,255,255,0.15)');
  grad.addColorStop(1.00, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);

  const spokes = 16 + Math.floor(rnd() * 10);
  for (let i = 0; i < spokes; i++) {
    const a = rnd() * Math.PI * 2;
    const reach = R * (0.7 + rnd() * 0.32);
    const w = 0.05 + rnd() * 0.16;
    const sg = g.createRadialGradient(R, R, R * 0.2, R, R, reach);
    sg.addColorStop(0, `rgba(255,255,255,${0.30 + rnd() * 0.3})`);
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sg;
    g.beginPath();
    g.moveTo(R, R);
    g.arc(R, R, reach, a - w, a + w);
    g.closePath();
    g.fill();
  }

  g.globalCompositeOperation = 'destination-out';
  for (let i = 0, n = 5 + Math.floor(rnd() * 5); i < n; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * R * 0.5;
    const rad = R * (0.05 + rnd() * 0.11);
    const hg = g.createRadialGradient(R + Math.cos(a) * d, R + Math.sin(a) * d, 0,
                                      R + Math.cos(a) * d, R + Math.sin(a) * d, rad);
    hg.addColorStop(0, `rgba(0,0,0,${0.15 + rnd() * 0.25})`);
    hg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = hg;
    g.fillRect(0, 0, S, S);
  }
  g.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export const SCORCH_TEX = [0, 1, 2].map((i) => makeScorchTexture(i + 41));
