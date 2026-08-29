import * as THREE from 'three';

function canvasTex(fn, w = 256, h = 256) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  fn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function rustPatch(g, x, y, r, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(122,62,28,${a})`);
  gr.addColorStop(0.55, `rgba(96,48,22,${a * 0.7})`);
  gr.addColorStop(1, 'rgba(80,40,20,0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(x, y, r, 0, 7);
  g.fill();
  // Streaks under the bloom: rust runs down whatever it eats through.
  for (let i = 0; i < 6; i++) {
    g.fillStyle = `rgba(140,70,30,${a * 0.5 * Math.random()})`;
    g.fillRect(x + (Math.random() - 0.5) * r, y + Math.random() * r * 1.4,
               1.5 + Math.random() * 2, 4 + Math.random() * 14);
  }
}

function brushed(g, w, h, base) {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 500; i++) {
    g.strokeStyle = `rgba(255,255,255,${Math.random() * 0.045})`;
    const y = Math.random() * h;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(w, y + (Math.random() - 0.5) * 3);
    g.stroke();
  }
  for (let i = 0; i < 700; i++) {
    g.fillStyle = `rgba(0,0,0,${Math.random() * 0.09})`;
    g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  }
}

export const METAL = canvasTex((g, w, h) => {
  brushed(g, w, h, '#7d858d');
  for (let i = 0; i < 5; i++) rustPatch(g, Math.random() * w, Math.random() * h, 14 + Math.random() * 26, 0.55);
  g.strokeStyle = 'rgba(0,0,0,.35)';
  g.lineWidth = 2;
  g.strokeRect(3, 3, w - 6, h - 6);
  for (let i = 0; i < 8; i++) {
    g.strokeStyle = `rgba(255,255,255,${0.05 + Math.random() * 0.06})`;
    const x = Math.random() * w, y = Math.random() * h;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (Math.random() - 0.5) * 50, y + (Math.random() - 0.5) * 50);
    g.stroke();
  }
});

export const METAL_DARK = canvasTex((g, w, h) => {
  brushed(g, w, h, '#565d64');
  for (let i = 0; i < 7; i++) rustPatch(g, Math.random() * w, Math.random() * h, 12 + Math.random() * 30, 0.65);
});

export const PLATE = canvasTex((g, w, h) => {
  brushed(g, w, h, '#8b939b');
  g.strokeStyle = 'rgba(20,24,28,.5)';
  g.lineWidth = 3;
  g.strokeRect(6, 6, w - 12, h - 12);
  g.beginPath();
  g.moveTo(w / 2, 6);
  g.lineTo(w / 2, h - 6);
  g.stroke();
  for (let i = 0; i < 4; i++) rustPatch(g, Math.random() * w, Math.random() * h, 10 + Math.random() * 18, 0.5);
  for (const [x, y] of [[16, 16], [w - 16, 16], [16, h - 16], [w - 16, h - 16], [w / 2, 16], [w / 2, h - 16]]) {
    g.fillStyle = 'rgba(30,34,38,.8)';
    g.beginPath();
    g.arc(x, y, 5, 0, 7);
    g.fill();
    g.fillStyle = 'rgba(200,210,220,.35)';
    g.beginPath();
    g.arc(x - 1.5, y - 1.5, 2, 0, 7);
    g.fill();
  }
});

export const STRIPE = canvasTex((g, w, h) => {
  g.fillStyle = '#c9a227';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#15161a';
  for (let x = -h; x < w + h; x += 40) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + 20, 0);
    g.lineTo(x + 20 - h, h);
    g.lineTo(x - h, h);
    g.closePath();
    g.fill();
  }
  for (let i = 0; i < 200; i++) {
    g.fillStyle = `rgba(0,0,0,${Math.random() * 0.25})`;
    g.fillRect(Math.random() * w, Math.random() * h, 3, 3);
  }
  for (let i = 0; i < 3; i++) rustPatch(g, Math.random() * w, Math.random() * h, 10 + Math.random() * 14, 0.6);
}, 512, 64);

export const GRATE = canvasTex((g, w, h) => {
  brushed(g, w, h, '#4a5157');
  g.strokeStyle = 'rgba(10,12,14,.9)';
  g.lineWidth = 5;
  for (let i = 0; i <= 8; i++) {
    g.beginPath();
    g.moveTo(i * w / 8, 0);
    g.lineTo(i * w / 8, h);
    g.stroke();
    g.beginPath();
    g.moveTo(0, i * h / 8);
    g.lineTo(w, i * h / 8);
    g.stroke();
  }
  for (let i = 0; i < 4; i++) rustPatch(g, Math.random() * w, Math.random() * h, 12 + Math.random() * 20, 0.5);
});

// The blanket: bright in the middle, gone by the rim, so the disc never ends on
// a hard edge against the floor.
export const GLOW = canvasTex((g, w, h) => {
  const c = w / 2;
  const grad = g.createRadialGradient(c, c, 0, c, c, c);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.28, 'rgba(190,246,255,.92)');
  grad.addColorStop(0.62, 'rgba(90,210,245,.45)');
  grad.addColorStop(1, 'rgba(40,150,210,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
}, 256, 256);

// Slow streaks laid over it, turned by the pad rather than by a shader.
export const WISPS = canvasTex((g, w, h) => {
  const c = w / 2;
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 90; i++) {
    const a = Math.random() * Math.PI * 2;
    const r0 = c * (0.1 + Math.random() * 0.4);
    const r1 = r0 + c * (0.15 + Math.random() * 0.4);
    const bend = 0.5 + Math.random() * 1.4;
    g.strokeStyle = `rgba(${180 + Math.random() * 75 | 0},250,255,${0.05 + Math.random() * 0.12})`;
    g.lineWidth = 1 + Math.random() * 4;
    g.beginPath();
    for (let t = 0; t <= 1; t += 0.1) {
      const r = r0 + (r1 - r0) * t;
      const at = a + t * bend;
      const x = c + Math.cos(at) * r, y = c + Math.sin(at) * r;
      t ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  g.globalCompositeOperation = 'destination-in';
  const mask = g.createRadialGradient(c, c, 0, c, c, c);
  mask.addColorStop(0, 'rgba(0,0,0,1)');
  mask.addColorStop(0.7, 'rgba(0,0,0,.9)');
  mask.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = mask;
  g.fillRect(0, 0, w, h);
}, 256, 256);

export const tiled = (tex, x, y) => {
  const t = tex.clone();
  t.needsUpdate = true;
  t.repeat.set(x, y);
  return t;
};
