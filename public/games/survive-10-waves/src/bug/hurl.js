import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import { between } from '../core/rng.js';
import { audio } from '../engine/audio.js';
import { voiceOf } from './voice.js';
import * as boomerangs from './boomerangs.js';
import { poseThrow } from './gait.js';
import { cap, rolls, cooling } from './kit.js';

// Wound back, then through: negative going back, positive coming through.
function pose(bug, k) {
  poseThrow(bug.model.parts, k, CFG.bugAnim.throw, bug.model.object.quaternion);
}

export function begin(bug) {
  const S = CFG.hurl;
  const left = rolls(bug, 'bones', S.count);
  bug.hurl = { phase: 'wind', t: S.windup, left, thrown: 0, next: 0 };
  audio.playAt('bugAttack', bug.pos.x, bug.pos.z, voiceOf(bug.type));
}

// Owns the frame only while the head is back: the throw itself is a snap, and
// the boss is walking again the moment the bone leaves it.
export function update(bug, dist, dt, held = false) {
  const S = CFG.hurl;

  if (!bug.hurl) {
    bug.hurlCd -= cooling(bug, dt);
    if (held || bug.hurlCd > 0 || dist > S.range) return false;
    begin(bug);
  }

  const L = bug.hurl;
  L.t -= dt;
  bug.model.object.position.copy(bug.pos);
  bug.model.object.rotation.set(0, bug.yaw, 0);

  if (L.phase === 'wind') {
    pose(bug, -(1 - Math.max(0, L.t) / S.windup));
    if (L.t > 0) return true;
    L.phase = 'throw';
    L.next = 0;
  }

  // One after another out of the same wind-up, each thrown a little off the
  // line to you so they arrive round different sides.
  if (L.phase === 'throw') {
    // Cocked back and snapped through for each one in turn, so a handful thrown
    // in a row is a handful of throws rather than one long reach.
    pose(bug, 1 - 2 * Math.max(0, Math.min(S.gap, L.next)) / S.gap);
    L.next -= dt;
    while (L.next <= 0 && L.thrown < L.left) {
      const spread = L.left > 1 ? (L.thrown / (L.left - 1) - 0.5) * S.fan : 0;
      boomerangs.chase(bug, S, spread, cap(bug, 'boneSpeed', S.speed));
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
  bug.hurl = null;
  bug.hurlCd = between(S.cooldown);
  return false;
}
