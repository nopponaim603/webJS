import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import { between } from '../core/rng.js';
import { audio } from '../engine/audio.js';
import { voiceOf } from './voice.js';
import * as arena from '../arena/size.js';
import * as bombs from './bombs.js';
import { poseThrow } from './gait.js';
import { rolls, cooling } from './kit.js';

const _from = new THREE.Vector3();
const _to = new THREE.Vector3();

// The same throw the bone gets: wound back, then through.
function pose(bug, k) {
  poseThrow(bug.model.parts, k, CFG.bugAnim.throw, bug.model.object.quaternion);
}

// Somewhere round the player rather than on them: a bomb that lands on your
// head is not thrown, it is dropped, and there would be nothing to read.
function spot(S, out) {
  const p = world.player.pos;
  const a = Math.random() * Math.PI * 2;
  const d = Math.sqrt(Math.random()) * S.spread;
  out.set(p.x + Math.cos(a) * d, 0, p.z + Math.sin(a) * d);

  const lim = arena.radius() - S.inset;
  const r = Math.hypot(out.x, out.z);
  if (r > lim) { out.x *= lim / r; out.z *= lim / r; }
  return out;
}

function mouth(bug, out) {
  const head = bug.model.parts.head;
  if (head) return out.setFromMatrixPosition(head.matrixWorld);
  return out.set(bug.pos.x, (bug.model.parts.height || 2) * 0.8, bug.pos.z);
}

export function begin(bug) {
  const S = CFG.toss;
  const left = rolls(bug, 'bombers', S.count);
  bug.toss = { phase: 'wind', t: S.windup, left, thrown: 0, next: 0 };
  audio.playAt('bugAttack', bug.pos.x, bug.pos.z, voiceOf(bug.type));
}

export function update(bug, dist, dt, held = false) {
  const S = CFG.toss;

  if (!bug.toss) {
    bug.tossCd -= cooling(bug, dt);
    if (held || bug.tossCd > 0 || dist > S.range) return false;
    begin(bug);
  }

  const L = bug.toss;
  L.t -= dt;
  bug.model.object.position.copy(bug.pos);
  bug.model.object.rotation.set(0, bug.yaw, 0);

  if (L.phase === 'wind') {
    pose(bug, -(1 - Math.max(0, L.t) / S.windup));
    if (L.t > 0) return true;
    L.phase = 'throw';
    L.next = 0;
  }

  if (L.phase === 'throw') {
    // Cocked back and snapped through for each one in turn, so a handful thrown
    // in a row is a handful of throws rather than one long reach.
    pose(bug, 1 - 2 * Math.max(0, Math.min(S.gap, L.next)) / S.gap);
    L.next -= dt;
    while (L.next <= 0 && L.thrown < L.left) {
      bombs.toss(bug, mouth(bug, _from), spot(S, _to));
      L.thrown += 1;
      L.next += S.gap;
    }
    if (L.thrown < L.left) return true;
    L.phase = 'recover';
    L.t = S.recover;
  }

  pose(bug, Math.max(0, L.t) / S.recover);
  if (L.t > 0) return true;

  pose(bug, 0);
  bug.toss = null;
  bug.tossCd = between(S.cooldown);
  return false;
}
