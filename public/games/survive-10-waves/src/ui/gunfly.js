import { CFG } from '../config/index.js';
import { cue } from './buttons.js';
import { audio } from '../engine/audio.js';
import { benchCell } from './gunrack.js';
import * as rackcoach from './rackcoach.js';

// A gun arriving in the rack: it leaves the node that paid for it, crosses the
// bench and drops into the slot it will be carried in. The slot holds its own
// icon back until the flight lands, so what appears there is the gun that flew
// rather than a copy of one already sitting in it.
const layer = document.getElementById('mod-flight');

const flights = [];

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// A node, or the point one was standing at. A screen that hands a gun over and
// then closes has to be able to name where it was before it goes.
const centreOf = (from) => {
  if (!from.getBoundingClientRect) return from;
  const r = from.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

function sprite(gun) {
  const d = document.createElement('div');
  d.className = 'gunfly';
  d.innerHTML = `<svg class="gico" viewBox="0 0 24 24">${CFG.guns[gun].icon}</svg>`;
  layer.appendChild(d);
  return d;
}

const once = (node, cls) => {
  node.classList.add(cls);
  node.addEventListener('animationend', (e) => {
    if (!e.pseudoElement) node.classList.remove(cls);
  }, { once: true });
};

export function fly(arrivals, from) {
  if (!layer || !from) return;
  for (const { gun, slot } of arrivals) {
    const cell = benchCell(slot);
    if (!cell) continue;
    const at = centreOf(from);
    const to = centreOf(cell);
    cell.classList.add('landing');
    flights.push({
      sprite: sprite(gun), cell, t: 0, at, to,
      bend: { x: (at.x + to.x) / 2, y: Math.min(at.y, to.y) - CFG.gunFly.arc },
    });
  }
}

function land(f) {
  f.sprite.remove();
  f.cell.classList.remove('landing');
  once(f.cell, 'landed');
  const rack = f.cell.closest('.mod-rack');
  if (rack) once(rack, 'lit');
  audio.play('gunRack') || cue('gunArrive', CFG.ui.synth.gunArrive);
  rackcoach.arrived();
}

export function update(dt) {
  const F = CFG.gunFly;
  for (let i = flights.length - 1; i >= 0; i--) {
    const f = flights[i];
    f.t = Math.min(1, f.t + dt / F.flight);
    const t = easeOut(f.t);
    const u = 1 - t;
    const x = u * u * f.at.x + 2 * u * t * f.bend.x + t * t * f.to.x;
    const y = u * u * f.at.y + 2 * u * t * f.bend.y + t * t * f.to.y;
    const scale = 1 + Math.sin(t * Math.PI) * F.swell;
    const spin = (1 - t) * F.spin;
    f.sprite.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) `
      + `translate(-50%, -50%) rotate(${spin.toFixed(3)}rad) scale(${scale.toFixed(2)})`;
    if (f.t < 1) continue;
    land(f);
    flights.splice(i, 1);
  }
}

export function clear() {
  for (const f of flights) {
    f.sprite.remove();
    f.cell.classList.remove('landing');
  }
  flights.length = 0;
}
