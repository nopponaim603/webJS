import * as THREE from 'three';
import { scene } from '../engine/view.js';
import { world } from '../core/world.js';
import { audio } from '../engine/audio.js';
import { createWatchtower } from '../deployables/models/watchtower.js';
import { validateDeployable, listSounds } from '../deployables/contract.js';
import { auditProvenance, auditOverlap, auditExposure, auditAttachment } from '../deployables/audit.js';

const GAME_VOICES = { heavy: 'rigHeavy', piece: 'rigPiece', small: 'rigSmall',
                      servo: 'rigFold', lock: 'rigLock', stow: 'rigStow' };

let tower = null;
let speed = 1.5;

function playSound({ id, rate }) {
  const name = GAME_VOICES[id];
  if (name && tower) audio.playAt(name, tower.root.position.x, tower.root.position.z, { rate });
}

function report() {
  const problems = validateDeployable(tower);
  if (problems.length) {
    console.warn('watchtower breaks the deployable contract:', problems);
    return;
  }
  const pops = auditProvenance(tower, THREE);
  const shims = auditOverlap(tower, THREE);
  const buried = auditExposure(tower, THREE);
  const loose = auditAttachment(tower, THREE);
  if (pops.length) console.warn('watchtower breaks physical provenance:', pops);
  if (shims.length) console.warn('watchtower has coplanar resting faces:', shims);
  if (buried.length) console.warn('watchtower has swallowed parts:', buried);
  if (loose.length) console.warn('watchtower has floating parts:', loose);
  console.info(`watchtower honours the deployable contract: ${tower.parts.length} parts · `
    + `clips ${Object.keys(tower.clips).join(', ')} · `
    + `sounds ${listSounds(tower).map((s) => s.id).join(', ')}`
    + (pops.length ? '' : ' · provenance clean')
    + (shims.length ? '' : ' · overlap clean')
    + (buried.length ? '' : ' · exposure clean')
    + (loose.length ? '' : ' · attachment clean'));
}

export function spawn() {
  if (!world.player) return;
  if (!tower) {
    tower = createWatchtower({ THREE, playSound, speed });
    report();
    scene.add(tower.root);
  }
  const p = world.player.pos;
  tower.root.position.set(p.x + 6, 0, p.z);
  tower.play('deploy');
}

export function retract() {
  if (tower) tower.play('retract');
}

export function destroy() {
  if (tower) tower.play('destroyed');
}

export function remove() {
  if (!tower) return;
  tower.dispose();
  tower = null;
}

export function setSpeed(k) {
  speed = k;
  if (tower) tower.setSpeed(k);
}

export function update(dt) {
  if (tower) tower.update(dt);
}
