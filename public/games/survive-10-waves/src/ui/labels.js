import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { camera } from '../engine/view.js';
import { world } from '../core/world.js';

const layer = document.getElementById('floaters');

const B = () => CFG.bugAnim.healthBar;

const tags = [];
const _v = new THREE.Vector3();

let room = 0;
let used = 0;

// Only the ones you are near get a number: a screen of them is noise, and the
// bug in front of you is the one you are deciding about.
export function begin(cap) {
  room = cap;
  used = 0;
}

function tagAt(i) {
  if (!tags[i]) {
    const d = document.createElement('div');
    d.className = 'hptag';
    d.append(document.createElement('i'), document.createElement('b'));
    layer.appendChild(d);
    tags[i] = d;
  }
  return tags[i];
}

const short = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M`
  : n >= 1e4 ? `${Math.round(n / 1e3)}k`
    : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(Math.round(n)));

export function put(bug, high) {
  if (used >= room) return;
  const p = world.player.pos;
  if (Math.hypot(bug.pos.x - p.x, bug.pos.z - p.z) > B().labelRange) return;

  _v.set(bug.pos.x, (bug.alt || 0) + high, bug.pos.z).project(camera);
  if (_v.z > 1) return;

  const el = tagAt(used++);
  const [tier, hp] = el.children;
  // A machine has no level to read. Past the level tables the number stops
  // describing the bug wearing it, so it comes off.
  const ranked = !!bug.level && !(bug.surge > 1);
  tier.textContent = ranked ? `L${bug.level}` : '';
  tier.style.display = ranked ? '' : 'none';
  hp.textContent = short(Math.max(0, bug.hp));
  el.style.display = 'block';
  el.style.fontSize = `${B().labelSize}px`;
  el.style.transform = `translate(-50%, -50%) translate(${
    ((_v.x * 0.5 + 0.5) * innerWidth).toFixed(1)}px, ${
    ((-_v.y * 0.5 + 0.5) * innerHeight).toFixed(1)}px)`;
}

export function end() {
  for (let i = used; i < tags.length; i++) tags[i].style.display = 'none';
}

export function hide() {
  for (const t of tags) t.style.display = 'none';
  used = 0;
}
