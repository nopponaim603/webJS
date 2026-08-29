import * as THREE from 'three';
import { scene, camera } from '../engine/view.js';
import { world, state } from '../core/world.js';
import { audio } from '../engine/audio.js';
import { createWatchtower } from '../deployables/models/watchtower.js';
import * as arena from '../arena/size.js';
import * as walls from '../arena/walls.js';

const VOICES = { heavy: 'rigHeavy', piece: 'rigPiece', small: 'rigSmall',
                 servo: 'rigFold', lock: 'rigLock', stow: 'rigStow' };

const STAND = 7;
const FOOT = 2.6;
const SIGN_HIGH = 4.6;
const QUARTER = Math.PI / 2;

const layer = document.getElementById('floaters');

const _spot = new THREE.Vector3();
const _v = new THREE.Vector3();

let tower = null;
let sign = null;
let raised = false;

function playSound({ id, rate }) {
  const name = VOICES[id];
  if (name && tower) audio.playAt(name, tower.root.position.x, tower.root.position.z, { rate });
}

const legal = (x, z) => Math.hypot(x, z) < arena.radius() - FOOT && !walls.inside(x, z, FOOT);

function pickSpot(out) {
  const p = world.player.pos;
  const back = Math.atan2(-world.player.aim.x, -world.player.aim.z);
  for (let i = 0; i < 8; i++) {
    const a = back + Math.ceil(i / 2) * QUARTER * (i % 2 ? -1 : 1);
    const x = p.x + Math.sin(a) * STAND;
    const z = p.z + Math.cos(a) * STAND;
    if (legal(x, z)) return out.set(x, 0, z);
  }
  out.set(p.x, 0, p.z);
  arena.confine(out, FOOT);
  return out;
}

function signEl() {
  if (!sign) {
    sign = document.createElement('div');
    sign.className = 'towertag';
    sign.append(document.createElement('b'), document.createElement('i'));
    layer.appendChild(sign);
  }
  return sign;
}

function hideSign() {
  if (sign) sign.style.display = 'none';
}

function paintSign() {
  const el = signEl();
  const [phase, left] = el.children;
  phase.textContent = `PHASE ${state.phase}/${state.phases}`;
  left.textContent = `${Math.max(0, state.quota - state.waveKills)} BUGS LEFT`;

  _v.set(tower.root.position.x, SIGN_HIGH, tower.root.position.z).project(camera);
  if (_v.z > 1) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.style.transform = `translate(-50%, -100%) translate(${
    ((_v.x * 0.5 + 0.5) * innerWidth).toFixed(1)}px, ${
    ((-_v.y * 0.5 + 0.5) * innerHeight).toFixed(1)}px)`;
}

function raise() {
  tower = createWatchtower({ THREE, playSound });
  tower.root.position.copy(pickSpot(_spot));
  scene.add(tower.root);
  tower.play('deploy', { onDone: () => { raised = true; } });
}

function stow() {
  raised = false;
  hideSign();
  tower.play('retract', { onDone: clear });
}

export function toggle() {
  if (state.mode !== 'playing' || !world.player) return;
  if (tower) stow(); else raise();
}

export function update(dt) {
  if (!tower) return;
  if (state.mode !== 'playing') { hideSign(); return; }
  tower.update(dt);
  if (raised) paintSign();
}

export function clear() {
  raised = false;
  hideSign();
  if (tower) { tower.dispose(); tower = null; }
}
