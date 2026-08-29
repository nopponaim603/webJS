import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { state, world } from '../core/world.js';
import { camera } from '../engine/view.js';

// A word to the player about their own kit, under their feet where the move tip
// goes: it answers a key they have just pressed, so it belongs where they are
// looking rather than at the edge of the screen.
const el = document.getElementById('note');
const _at = new THREE.Vector3();

let left = 0;

export function show(text) {
  el.textContent = text;
  left = CFG.note.time;
}

export function clear() {
  left = 0;
  el.classList.add('hidden');
}

export function update(dt) {
  if (left <= 0) return;
  left -= dt;

  const p = world.player;
  const gone = left <= 0 || !p || state.mode !== 'playing';
  el.classList.toggle('hidden', gone);
  if (gone) return;

  _at.set(p.pos.x, 0, p.pos.z).project(camera);
  if (_at.z > 1) { el.classList.add('hidden'); return; }

  const x = (_at.x * 0.5 + 0.5) * innerWidth;
  const y = (-_at.y * 0.5 + 0.5) * innerHeight + CFG.note.drop;
  el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  el.style.opacity = Math.min(1, left / CFG.note.fade).toFixed(2);
}
