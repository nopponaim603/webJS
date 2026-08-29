import { CFG } from '../config/index.js';
import { audio } from '../engine/audio.js';
import * as drone from '../allies/drone.js';
import { voiceOf } from './voice.js';

const J = () => CFG.bugAnim.snap;

// How high off the ground an animal can still take something from: its own size
// is part of the answer, so an evolved one reaches machines a fresh one cannot.
export const reach = (bug) => J().reach * (bug.grow || 1);

export const able = (bug, d) => d.pos.y <= reach(bug);

const tall = (bug) => (bug.model.parts.height || 1) * (bug.grow || 1);

// A machine it can reach standing is bitten from where it stands: an animal with
// the height for it has no cause to leave the ground, and a boss has none at any
// height — it is not a thing that jumps, whatever it is biting.
export const stands = (bug, d) => !!bug.type.finale || d.pos.y <= tall(bug);

// The bite, however this animal takes one.
export function strike(bug, d, hurt) {
  if (stands(bug, d)) bite(bug, { at: d, hurt });
  else start(bug, d, hurt);
}

// The bite is the leap: nothing is taken from the machine on the way up, and a
// machine that has flown out from over it by the top of the arc is missed. What
// is aimed at the machine is the jaws, and the arc under them never falls below
// the animal's own height — a heavy one leaps for a drone it could nearly reach
// standing, rather than rising onto its toes for it.
export function start(bug, d, hurt) {
  const T = J();
  const high = tall(bug);
  bug.jump = { at: d, hurt, t: 0, struck: false,
               high: Math.max(high * T.least,
                              Math.min(reach(bug), d.pos.y - high * T.bite)) };
}

function bite(bug, j) {
  const d = j.at;
  const far = Math.hypot(d.pos.x - bug.pos.x, d.pos.z - bug.pos.z);
  if (d.hp <= 0 || d.pos.y > reach(bug)) return;
  if (far > bug.radius + d.radius + J().slack) return;

  audio.playAt('bugAttack', bug.pos.x, bug.pos.z, voiceOf(bug.type));
  drone.damage(d, j.hurt, true);
}

// Owns the frame it is in the air for: legs off the ground turn over nothing,
// and an animal in the middle of a leap is not walking anywhere.
export function airborne(bug, dt) {
  const j = bug.jump;
  if (!j) return false;

  const T = J();
  j.t += dt;
  const k = Math.min(1, j.t / T.time);
  bug.alt = 4 * j.high * k * (1 - k);

  const obj = bug.model.object;
  obj.position.set(bug.pos.x, bug.alt, bug.pos.z);
  obj.rotation.set(T.pitch * (1 - 2 * k), bug.yaw, 0);

  if (!j.struck && k >= 0.5) {
    j.struck = true;
    bite(bug, j);
  }
  if (k < 1) return true;

  bug.jump = null;
  bug.alt = 0;
  obj.rotation.set(0, bug.yaw, 0);
  return false;
}
