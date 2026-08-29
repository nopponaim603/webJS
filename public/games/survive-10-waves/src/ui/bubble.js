import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { state } from '../core/world.js';
import { camera } from '../engine/view.js';

// A line spoken by something in the world rather than by the mission: it hangs
// off the thing that said it and goes wherever that thing goes.
const el = document.getElementById('bubble');
const _at = new THREE.Vector3();

let anchor = null;
let left = 0;

export function say(at, text) {
  anchor = at;
  el.textContent = text;
  left = CFG.bubble.time;
}

export function clear() {
  anchor = null;
  left = 0;
  el.classList.add('hidden');
}

// Gone with whatever was speaking: both ways a drone leaves take its object out
// of the scene, so a lost parent is the one test that covers them.
const spoken = () => anchor && anchor.object && anchor.object.parent;

export function update(dt) {
  if (left <= 0) return;
  // The transmission that opens on the pickup would otherwise eat the whole
  // hold behind its own screen.
  if (state.mode !== 'playing') return;

  left -= dt;
  if (left <= 0 || !spoken()) { clear(); return; }

  _at.set(anchor.pos.x, anchor.pos.y + CFG.bubble.lift, anchor.pos.z).project(camera);
  if (_at.z > 1) { el.classList.add('hidden'); return; }

  el.classList.remove('hidden');
  el.style.transform = `translate(-50%, -100%) translate(${
    ((_at.x * 0.5 + 0.5) * innerWidth).toFixed(1)}px, ${
    ((-_at.y * 0.5 + 0.5) * innerHeight).toFixed(1)}px)`;
  el.style.opacity = Math.min(1, left / CFG.bubble.fade).toFixed(2);
}
