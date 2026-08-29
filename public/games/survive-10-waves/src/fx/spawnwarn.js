import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { between } from '../core/rng.js';
import { audio } from '../engine/audio.js';
import { shakeAt } from '../engine/view.js';
import { SCORCH_TEX } from './textures.js';
import { addHazard, dirt } from './spatter.js';
import { smokePuffs } from './blast.js';

const marks = [];
const quakes = [];

const _at = new THREE.Vector3();
const _dir = new THREE.Vector3();

const SOIL = 0x2a2118;

function smoke(x, z, spread, scale) {
  const W = CFG.spawn.warn;
  const a = Math.random() * Math.PI * 2;
  const d = Math.sqrt(Math.random()) * spread;
  _at.set(x + Math.cos(a) * d, 0, z + Math.sin(a) * d);
  _dir.set(Math.cos(a), 0, Math.sin(a));
  smokePuffs.spawn(_at, _dir, W.smoke, scale);
}

export function warn(x, z, life, radius) {
  marks.push({ x, z, radius, life, t: life, puff: 0 });

  _at.set(x, 0, z);
  addHazard(_at, radius * 2.2, SOIL, life + CFG.spawn.warn.stain, life * 0.5, SCORCH_TEX);
}

// The hole keeps working long after the warning mark has burnt out: a few
// bursts punch up through it while the bugs are still climbing, spread across
// the whole breach rather than landing on the mark.
export function quake(x, z, radius, span, bursts = 1) {
  const Q = CFG.spawn.quake;
  const rolled = Q.count[0] + ((Math.random() * (Q.count[1] - Q.count[0] + 1)) | 0);
  const n = Math.max(1, Math.round(rolled * bursts));
  const at = [];
  for (let i = 0; i < n; i++) at.push(between(Q.window) * span);
  at.sort((a, b) => a - b);
  quakes.push({ x, z, radius, at, t: 0 });
}

function burst(q) {
  const Q = CFG.spawn.quake;
  const a0 = Math.random() * Math.PI * 2;
  const d0 = Math.sqrt(Math.random()) * q.radius * Q.spot;
  const bx = q.x + Math.cos(a0) * d0, bz = q.z + Math.sin(a0) * d0;
  const cloud = q.radius * Q.cloud;

  _at.set(bx, 0.05, bz);
  dirt(_at, Q.dirt, 1.4);
  for (let i = 0; i < Q.puffs; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.sqrt(Math.random()) * cloud;
    _at.set(bx + Math.cos(a) * d, 0, bz + Math.sin(a) * d);
    _dir.set(Math.cos(a), 0, Math.sin(a));
    smokePuffs.spawn(_at, _dir, Q.smoke, q.radius * 1.4);
  }
  audio.playAt('spawnBlast', bx, bz, { rate: 0.9 + Math.random() * 0.22 });
  shakeAt(bx, bz, Q.shake.power, Q.shake.range);
}

export function clear() { marks.length = 0; quakes.length = 0; }

export function update(dt) {
  const W = CFG.spawn.warn;

  for (let i = quakes.length - 1; i >= 0; i--) {
    const q = quakes[i];
    q.t += dt;
    while (q.at.length && q.t >= q.at[0]) { q.at.shift(); burst(q); }
    if (q.at.length) continue;
    quakes[i] = quakes[quakes.length - 1];
    quakes.pop();
  }

  for (let i = marks.length - 1; i >= 0; i--) {
    const m = marks[i];
    m.t -= dt;
    const k = 1 - Math.max(0, m.t) / m.life;

    m.puff -= dt;
    if (m.puff <= 0) {
      m.puff = W.puffEvery / (0.5 + k);
      smoke(m.x, m.z, m.radius * W.spread, m.radius * (0.6 + 0.7 * k));
    }

    if (Math.random() < W.grit * k * dt) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random()) * m.radius;
      _at.set(m.x + Math.cos(a) * d, 0.05, m.z + Math.sin(a) * d);
      dirt(_at, 1, 0.5);
    }

    if (m.t > 0) continue;

    _at.set(m.x, 0.05, m.z);
    dirt(_at, W.burst, 1.1);
    for (let s = 0; s < W.burstPuffs; s++) smoke(m.x, m.z, m.radius, m.radius * 1.5);
    marks[i] = marks[marks.length - 1];
    marks.pop();
  }
}
