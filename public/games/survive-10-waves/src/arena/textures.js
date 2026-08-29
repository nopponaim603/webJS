import * as THREE from 'three';
import { rngFrom } from '../core/rng.js';

function patchOutline(g, R, rnd, wobble = 0.22) {
  const H = [1, 2, 3, 5].map((k) => ({ k, amp: wobble * (0.3 + rnd() * 0.7), ph: rnd() * Math.PI * 2 }));
  const radius = (a) => {
    let r = 0.62;
    for (const h of H) r += h.amp * Math.sin(a * h.k + h.ph);
    return R * Math.max(0.15, r);
  };
  g.beginPath();
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    const x = R + Math.cos(a) * radius(a), y = R + Math.sin(a) * radius(a);
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
  return radius;
}

export function makePatchTexture(seed, kind) {
  const SZ = 256, R = SZ / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = SZ;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  const radius = patchOutline(g, R, rnd, 0.30);
  g.fillStyle = kind === 'gravel' ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.16)';
  g.fill();

  if (kind === 'grass' || kind === 'moss') {
    for (let i = 0, n = 420; i < n; i++) {
      const a = rnd() * Math.PI * 2, d = radius(a) * Math.sqrt(rnd()) * 0.95;
      const x = R + Math.cos(a) * d, y = R + Math.sin(a) * d;
      const lean = rnd() * Math.PI * 2, len = SZ * (0.012 + rnd() * 0.03);
      g.strokeStyle = `rgba(255,255,255,${0.45 + rnd() * 0.5})`;
      g.lineWidth = 1.2 + rnd() * 2.0;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(lean) * len, y + Math.sin(lean) * len);
      g.stroke();
    }
  } else {
    for (let i = 0, n = 340; i < n; i++) {
      const a = rnd() * Math.PI * 2, d = radius(a) * Math.sqrt(rnd()) * 0.92;
      const x = R + Math.cos(a) * d, y = R + Math.sin(a) * d;
      const rr = SZ * (0.006 + rnd() * 0.018);
      g.fillStyle = `rgba(255,255,255,${0.4 + rnd() * 0.55})`;
      g.beginPath();
      g.ellipse(x, y, rr, rr * (0.6 + rnd() * 0.6), rnd() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
  }

  if (g.filter !== undefined) {
    g.filter = 'blur(5px)';
    g.drawImage(cv, 0, 0);
    g.filter = 'none';
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makePathShape(seed) {
  const W = 256, H = 128;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);

  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0.00, 'rgba(255,255,255,0)');
  grad.addColorStop(0.22, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.50, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.78, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1.00, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  const ends = g.createLinearGradient(0, 0, W, 0);
  ends.addColorStop(0.00, 'rgba(0,0,0,0.85)');
  ends.addColorStop(0.16, 'rgba(0,0,0,0)');
  ends.addColorStop(0.84, 'rgba(0,0,0,0)');
  ends.addColorStop(1.00, 'rgba(0,0,0,0.85)');
  g.fillStyle = ends;
  g.fillRect(0, 0, W, H);

  for (let i = 0; i < 30; i++) {
    const x = rnd() * W;
    const top = rnd() < 0.5;
    const r = H * (0.12 + rnd() * 0.32);
    const gg = g.createRadialGradient(x, top ? 0 : H, 0, x, top ? 0 : H, r);
    gg.addColorStop(0, 'rgba(0,0,0,0.95)');
    gg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gg;
    g.fillRect(x - r, 0, r * 2, H);
  }

  for (let i = 0, n = 7; i < n; i++) {
    const y = H * (0.25 + rnd() * 0.5);
    const amp = H * (0.01 + rnd() * 0.04);
    const ph = rnd() * Math.PI * 2;
    g.strokeStyle = `rgba(255,255,255,${0.1 + rnd() * 0.22})`;
    g.lineWidth = 2 + rnd() * 6;
    g.beginPath();
    for (let x = 0; x <= W; x += 6) {
      const yy = y + Math.sin((x / W) * Math.PI * 2 + ph) * amp;
      if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy);
    }
    g.stroke();
  }

  if (g.filter !== undefined) {
    g.filter = 'blur(2px)';
    g.drawImage(cv, 0, 0);
    g.filter = 'none';
  }
  const tex = new THREE.CanvasTexture(cv);
  // Data, not colour: three.js reads an alphaMap's green channel.
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

export function makeRegionTexture(seed) {
  const SZ = 256, R = SZ / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = SZ;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);
  patchOutline(g, R, rnd, 0.26);
  const grad = g.createRadialGradient(R, R, 0, R, R, R);
  grad.addColorStop(0.0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.72)');
  grad.addColorStop(1.0, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fill();
  if (g.filter !== undefined) {
    g.filter = 'blur(14px)';
    g.drawImage(cv, 0, 0);
    g.filter = 'none';
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeBladeTexture(seed, blades = 11) {
  const W = 128, H = 128;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);
  for (let i = 0; i < blades; i++) {
    const x = W * (0.08 + rnd() * 0.84);
    const h = H * (0.5 + rnd() * 0.48);
    const lean = (rnd() - 0.5) * W * 0.3;
    const w = W * (0.018 + rnd() * 0.022);
    g.fillStyle = `rgba(255,255,255,${0.72 + rnd() * 0.28})`;
    g.beginPath();
    g.moveTo(x - w, H);

    g.quadraticCurveTo(x - w * 0.6 + lean * 0.4, H - h * 0.55, x + lean, H - h);
    g.quadraticCurveTo(x + w * 0.6 + lean * 0.4, H - h * 0.5, x + w, H);
    g.closePath();
    g.fill();
  }
  const tex = new THREE.CanvasTexture(cv);

  // Data, not colour: three.js reads an alphaMap's green channel.
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

export function makeCloudTexture(seed) {
  const SZ = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = SZ;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);
  g.globalCompositeOperation = 'lighter';

  const octave = (count, radius, alpha) => {
    for (let i = 0; i < count; i++) {
      const x = rnd() * SZ, y = rnd() * SZ;
      const r = radius * (0.6 + rnd() * 0.8);
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const cx = x + ox * SZ, cy = y + oy * SZ;
          if (cx < -r || cx > SZ + r || cy < -r || cy > SZ + r) continue;
          const grad = g.createRadialGradient(cx, cy, 0, cx, cy, r);
          grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
          grad.addColorStop(0.5, `rgba(255,255,255,${alpha * 0.45})`);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = grad;
          g.fillRect(cx - r, cy - r, r * 2, r * 2);
        }
      }
    }
  };
  octave(7, SZ * 0.30, 0.55);
  octave(14, SZ * 0.16, 0.30);
  octave(26, SZ * 0.07, 0.18);

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// Four one-sided faces, not two double-sided: DoubleSide flips the normal and
// lights half of every tuft from below.
export function tuftGeometry() {
  const geo = new THREE.BufferGeometry();
  const h = 1, w = 0.5;
  const UP = 0.82, OUT = 0.57;
  const quadA = [-w, 0, 0, w, 0, 0, w, h, 0, -w, h, 0];
  const quadB = [0, 0, -w, 0, 0, w, 0, h, w, 0, h, -w];
  const pos = [...quadA, ...quadA, ...quadB, ...quadB];
  const nor = [
    ...Array(4).fill([0, UP, OUT]).flat(),
    ...Array(4).fill([0, UP, -OUT]).flat(),
    ...Array(4).fill([OUT, UP, 0]).flat(),
    ...Array(4).fill([-OUT, UP, 0]).flat(),
  ];
  const oneUV = [0, 0, 1, 0, 1, 1, 0, 1];
  const uv = [...oneUV, ...oneUV, ...oneUV, ...oneUV];
  const idx = [];
  for (let q = 0; q < 4; q++) {
    const b = q * 4;

    if (q % 2 === 0) idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    else idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return geo;
}
