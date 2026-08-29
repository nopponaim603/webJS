import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import { between } from '../core/rng.js';
import { audio } from '../engine/audio.js';
import { voiceOf } from './voice.js';
import * as evolve from './evolve.js';
import { cooling } from './kit.js';
import * as arena from '../arena/size.js';
import { lob } from './spit.js';
import { poseLeg, poseBone, AXIS } from './gait.js';

const _from = new THREE.Vector3();
const _to = new THREE.Vector3();

// Up on the back pair with the front ones off the ground and working, head
// thrown back. `k` runs 0 to 1 as it comes up, so the same call does the rise,
// the hold and the drop back down.
function rear(bug, S, k, t) {
  const parts = bug.model.parts;
  const body = parts.body;
  if (!body) return;

  const baseY = body.userData.baseY !== undefined ? body.userData.baseY : 0.62;
  body.position.y = baseY + S.lift * k;
  // Negative is nose up: a positive pitch about X takes the model's forward
  // axis toward the floor, which stands it on its face.
  body.rotation.x = -S.rear * k;

  if (!parts.rigged) return;
  const root = bug.model.object.quaternion;

  for (const leg of parts.legs) {
    if (leg.row >= S.stands) { poseLeg(leg, 0, 0, root); continue; }
    const beat = t * S.flailRate + leg.row * 2.1 + (leg.side > 0 ? 0 : 1.7);
    poseLeg(leg, (S.raise[leg.row] + Math.sin(beat) * S.flail) * k,
            Math.cos(beat) * S.flailSweep * k, root);
  }

  // Negative pitches the head up: the bone tips the opposite way to a leg
  // being lifted by the same angle.
  poseBone(parts.head, AXIS.side,
           -(S.headUp + Math.sin(t * S.headRate) * S.headWag) * k, root);
}

const poolR = (S) => CFG.spit.pool.radius * S.grow;

const ROW = Math.sqrt(3) / 2;

// How far apart pool centres sit. The share of ground to be covered sets it —
// hexagonal packing of circles of radius r at spacing d covers pi*r^2/(ROW*d^2)
// — and `gap` is the floor under that, so a coverage asked for that would leave
// no way between the pools is refused.
const apartOf = (S) => {
  const r = poolR(S);
  return Math.max(r * 2 + S.gap, r * Math.sqrt(Math.PI / (ROW * S.cover)));
};

// One volley's spots: a hexagonal lattice over the circle round wherever the
// player is standing NOW. A lattice rather than scattered points because the
// two things asked of this attack fight each other — cover a set share of the
// ground, and always leave a way through. Scattering leaves both on the table
// (it wastes room and still has to be checked for overlaps); a lattice puts
// every lane between pools at the same known width.
//
// The lattice is turned and shifted per volley so it never lands as the same
// figure twice, and jittered by well under the gap so it reads as thrown rather
// than laid out. Cells within `apart` of ground this spill has already covered
// are dropped: a second volley fills where the player ran to, not what is
// already burning. Sorted by how close each spot is, so the ground under the
// player's feet is taken first and the field grows outward from them.
function volley(S, laid) {
  const p = world.player;
  const lim = arena.radius() - S.inset;
  const apart = apartOf(S);
  const jitter = S.gap * 0.25;

  const turn = Math.random() * Math.PI * 2;
  const sin = Math.sin(turn), cos = Math.cos(turn);
  const offU = (Math.random() - 0.5) * apart;
  const offV = (Math.random() - 0.5) * apart * ROW;
  const rows = Math.ceil(S.radius / (apart * ROW));
  const taken = [];

  for (let iv = -rows; iv <= rows; iv++) {
    const v = iv * apart * ROW + offV;
    const wide = Math.ceil(S.radius / apart) + 1;

    for (let iu = -wide; iu <= wide; iu++) {
      const u = (iu + (iv & 1 ? 0.5 : 0)) * apart + offU;
      if (Math.hypot(u, v) > S.radius) continue;

      const x = p.pos.x + u * cos - v * sin + (Math.random() * 2 - 1) * jitter;
      const z = p.pos.z + u * sin + v * cos + (Math.random() * 2 - 1) * jitter;
      if (Math.hypot(x, z) > lim) continue;
      if (laid.some((t) => Math.hypot(t.x - x, t.z - z) < apart)) continue;

      taken.push({ x, z, near: Math.hypot(x - p.pos.x, z - p.pos.z) });
    }
  }
  return taken.sort((a, b) => a.near - b.near);
}

// One gob, out of the mouth, on the volley's own clock so every throw hangs the
// same time and the field arrives in the order it was thrown.
function throwOne(bug, S, to, pour) {
  const head = bug.model.parts.head;
  if (head) _from.setFromMatrixPosition(head.matrixWorld);
  else _from.set(bug.pos.x, (bug.model.parts.height || 2) * 0.8, bug.pos.z);

  _to.set(to.x, 0, to.z);
  lob(_from, _to, { grow: S.grow, blobs: S.blobs, tick: S.tick, flight: S.flight,
                    beads: S.beads, burn: evolve.share(bug, S.burn),
                    life: between(S.pool), warn: true, by: bug, volley: pour,
                    rate: S.sfxRate * (0.9 + Math.random() * 0.2) });
}

// The two spills are the same move at two sizes, so they run the same code off
// their own config block and their own slot on the bug: one is the arena
// emptied over, the other a ring round the player's feet.
export const FULL = { cfg: 'spill', slot: 'spill', cd: 'spillCd' };
export const SMALL = { cfg: 'smallSpill', slot: 'douse', cd: 'douseCd' };

// Thrown all round it rather than aimed, so like the slam it starts from
// whatever heading the boss already had: turning to face you first would swing
// thirteen units of animal in a single frame.
export function begin(bug, V = FULL) {
  const S = CFG[V.cfg];
  bug[V.slot] = { phase: 'heave', t: S.windup, left: between(S.time),
                  next: 0, sway: 0, laid: [], queue: [] };
  audio.playAt('bugAttack', bug.pos.x, bug.pos.z, voiceOf(bug.type));
}

// Owns the frame for the whole spill: it plants itself, heaves, and cannot chase
// while it is emptying itself over the arena — the ground it leaves does that.
export function update(bug, dist, dt, held = false, V = FULL) {
  const S = CFG[V.cfg];

  if (!bug[V.slot]) {
    bug[V.cd] -= cooling(bug, dt);
    if (held || bug[V.cd] > 0 || dist > S.range) return false;
    begin(bug, V);
  }

  const L = bug[V.slot];
  L.t -= dt;
  bug.model.object.position.copy(bug.pos);
  bug.model.object.rotation.set(0, bug.yaw, 0);

  L.sway += dt;

  if (L.phase === 'heave') {
    rear(bug, S, 1 - Math.max(0, L.t) / S.windup, L.sway);
    if (L.t > 0) return true;
    L.phase = 'pour';
    L.t = L.left;
  }

  if (L.phase === 'pour') {
    rear(bug, S, 1, L.sway);
    bug.yaw += Math.cos(L.sway * S.swayRate) * S.swing * dt;

    L.next -= dt;
    while (L.next <= 0) {
      // A fresh volley when the queue runs dry, picked round where the player
      // is by then rather than where they were when the spill began.
      if (!L.queue.length) {
        L.queue = volley(S, L.laid);
        L.laid.push(...L.queue);
      }
      if (!L.queue.length) break;

      throwOne(bug, S, L.queue.shift(), L);
      L.next += between(S.every);
    }

    if (L.t > 0) return true;
    L.phase = 'recover';
    L.t = S.recover;
  }

  rear(bug, S, Math.max(0, L.t) / S.recover, L.sway);
  if (L.t > 0) return true;

  bug[V.slot] = null;
  bug[V.cd] = between(S.cooldown);
  return false;
}
