import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { camera } from '../engine/view.js';
import * as fmt from './format.js';

const layer = document.getElementById('floaters');
const pool = [];
const live = [];

const _v = new THREE.Vector3();

function compact(amount) {
  const n = Math.round(amount);
  if (n <= 1000) return String(n);
  const k = n / 1000;
  return `${k < 10 ? k.toFixed(1).replace(/\.0$/, '') : Math.round(k)}K`;
}

function acquire() {
  const el = pool.pop() || (() => {
    const d = document.createElement('div');
    d.className = 'dmg';
    layer.appendChild(d);
    return d;
  })();
  el.className = 'dmg';
  el.style.display = 'block';
  return el;
}

export function damage(pos, amount, killing = false, strength = 0.5, crit = false) {
  const D = CFG.damageNumbers;
  if (!D.enabled || live.length >= D.max) return;

  const el = acquire();
  el.textContent = compact(amount);
  el.classList.toggle('kill', killing);

  const scale = 0.82 + 0.36 * strength;
  el.style.fontSize = `${((killing ? D.killSize : D.size) * scale).toFixed(1)}px`;
  el.style.color = '';

  el.classList.toggle('hot', strength > 0.8);

  el.classList.toggle('crit', crit);

  live.push({
    el,
    x: pos.x + (Math.random() - 0.5) * D.spread,
    y: pos.y,
    z: pos.z + (Math.random() - 0.5) * D.spread,
    drift: (Math.random() - 0.5) * D.drift,
    life: killing ? D.life * 1.35 : D.life,
    maxLife: killing ? D.life * 1.35 : D.life,
  });
}

export function update(dt) {
  const D = CFG.damageNumbers;
  for (let i = live.length - 1; i >= 0; i--) {
    const f = live[i];
    f.life -= dt;
    if (f.life <= 0) {
      f.el.style.display = 'none';
      pool.push(f.el);
      live[i] = live[live.length - 1];
      live.pop();
      continue;
    }

    const age = 1 - f.life / f.maxLife;
    f.y += D.rise * dt;
    f.x += f.drift * dt;

    _v.set(f.x, f.y, f.z).project(camera);
    if (_v.z > 1) { f.el.style.opacity = '0'; continue; }

    const sx = (_v.x * 0.5 + 0.5) * innerWidth;
    const sy = (-_v.y * 0.5 + 0.5) * innerHeight;

    const pop = age < 0.1 ? 0.6 + 4 * age : 1;
    f.el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) `
      + `translate(-50%, -50%) scale(${pop.toFixed(2)})`;
    f.el.style.opacity = String(age < 0.5 ? 1 : (1 - age) * 2);
  }
}

export function clear() {
  for (const f of live) { f.el.style.display = 'none'; pool.push(f.el); }
  live.length = 0;
}

export function playerDamage(pos, amount) {
  const D = CFG.damageNumbers;
  if (!D.enabled || live.length >= D.max) return;

  const el = acquire();
  el.textContent = `-${compact(amount)}`;
  el.className = 'dmg hurt';
  el.style.fontSize = `${D.size * 1.35}px`;

  live.push({
    el,
    x: pos.x + (Math.random() - 0.5) * D.spread,
    y: pos.y,
    z: pos.z + (Math.random() - 0.5) * D.spread,
    drift: (Math.random() - 0.5) * D.drift,
    life: D.life * 1.2,
    maxLife: D.life * 1.2,
  });
}

export function heal(pos, amount) {
  const D = CFG.damageNumbers;
  if (!D.enabled || live.length >= D.max) return;
  const el = acquire();
  el.textContent = `+${amount}`;
  el.className = 'dmg heal';
  el.style.fontSize = `${D.size * 1.45}px`;
  live.push({
    el,
    x: pos.x + (Math.random() - 0.5) * 0.3,
    y: pos.y,
    z: pos.z + (Math.random() - 0.5) * 0.3,
    drift: (Math.random() - 0.5) * 0.6,
    life: D.life,
    maxLife: D.life,
  });
}

// The guns answering a run of near misses. Said above the heal rather than on
// it, so the two do not stack on the same line when they land together.
export function charged(pos, pct) {
  const D = CFG.damageNumbers;
  if (!D.enabled || live.length >= D.max) return;
  const el = acquire();
  el.textContent = `+${pct}% CHARGE`;
  el.className = 'dmg charged';
  el.style.fontSize = `${D.size * 0.7}px`;
  live.push({
    el,
    x: pos.x,
    y: pos.y,
    z: pos.z,
    drift: (Math.random() - 0.5) * 0.25,
    life: D.life * 1.15,
    maxLife: D.life * 1.15,
  });
}

// A machine put back together, said over the machine: the same rise as a heal
// over the player, in the repair field's own colour so the two do not read as
// the same thing happening to the same body.
export function mend(pos, amount) {
  const D = CFG.damageNumbers;
  if (!D.enabled || live.length >= D.max) return;
  const el = acquire();
  el.textContent = `+${amount} HP`;
  el.className = 'dmg mend';
  el.style.fontSize = `${D.size * 0.85}px`;
  live.push({
    el,
    x: pos.x + (Math.random() - 0.5) * 0.4,
    y: pos.y,
    z: pos.z + (Math.random() - 0.5) * 0.4,
    drift: (Math.random() - 0.5) * 0.5,
    life: D.life,
    maxLife: D.life,
  });
}

export function coin(pos, amount) {
  const D = CFG.damageNumbers;
  if (!D.enabled || live.length >= D.max) return;
  const el = acquire();
  el.textContent = `+${fmt.coins(amount)}`;
  el.className = 'dmg coin';
  el.style.fontSize = `${D.size * 0.95}px`;
  live.push({
    el,
    x: pos.x + (Math.random() - 0.5) * 0.3,
    y: pos.y,
    z: pos.z + (Math.random() - 0.5) * 0.3,
    drift: (Math.random() - 0.5) * 0.6,
    life: D.life * 0.8,
    maxLife: D.life * 0.8,
  });
}
