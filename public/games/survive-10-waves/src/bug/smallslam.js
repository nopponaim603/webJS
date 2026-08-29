import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import { between } from '../core/rng.js';
import { audio } from '../engine/audio.js';
import { voiceOf } from './voice.js';
import { burst } from './stomp.js';
import { poseLeg, poseBone, AXIS } from './gait.js';
import { cap, rolls, cooling } from './kit.js';
import * as arena from '../arena/size.js';
import * as waves from '../game/waves.js';

const _hole = new THREE.Vector3();

// Only the head and the front pair move: the body keeps its footing, so this is
// the jab between the slams rather than the boss committing its whole weight.
// `lift` is positive going up and negative driving into the ground.
function pose(bug, S, lift) {
  const parts = bug.model.parts;
  if (!parts.rigged) return;
  const root = bug.model.object.quaternion;

  for (const leg of parts.legs) {
    if (leg.row !== 0) continue;
    poseLeg(leg, lift, 0, root);
  }
  poseBone(parts.head, AXIS.side, -lift * S.headShare, root);
}

// Where the front pair comes down, in world terms: that is the hole it drives
// open. Anything not standing on legs punches the ground in front of itself.
function frontLeg(bug, out) {
  const legs = (bug.model.parts.legs || []).filter((l) => l.row === 0 && l.tip);
  if (!legs.length) {
    return out.set(bug.pos.x + Math.sin(bug.yaw) * bug.radius, 0,
                   bug.pos.z + Math.cos(bug.yaw) * bug.radius);
  }
  out.set(0, 0, 0);
  const at = new THREE.Vector3();
  for (const l of legs) { l.tip.getWorldPosition(at); out.add(at); }
  return out.divideScalar(legs.length).setY(0);
}

// The holes that are not under the boss open a set distance off the player —
// never on them, never so far they are somebody else's problem. Each is handed
// its own arc of the circle so two never tear open the same ground, and the
// bearing is rolled inside that arc until one lands on ground that exists.
function besidePlayer(S, out, from, span) {
  const p = world.player;
  const lim = arena.radius() - CFG.spawn.inset;
  for (let tries = 0; tries < 12; tries++) {
    const a = from + Math.random() * span;
    out.set(p.pos.x + Math.cos(a) * S.breach.at, 0, p.pos.z + Math.sin(a) * S.breach.at);
    if (Math.hypot(out.x, out.z) <= lim) return out;
  }
  const back = Math.atan2(-p.pos.x, -p.pos.z);
  return out.set(p.pos.x + Math.sin(back) * S.breach.at, 0,
                 p.pos.z + Math.cos(back) * S.breach.at);
}

function land(bug, S) {
  // One hole under its own foot, and the rest out around the player once it is
  // grown enough to open them. What climbs out is whatever the wave would have
  // sent anyway, at the boss's own level, and worth what it would have been
  // worth walking out of a hole the wave opened.
  // The offspring belong to whatever released the parent: a scripted part
  // counting what it is owed must not lose track of a swarm it caused.
  const brood = { brood: true, level: bug.level || 1, tag: bug.tag };
  const size = () => rolls(bug, 'broodSize', S.breach.count);
  waves.breach(size(), frontLeg(bug, _hole), S.breach.scale, brood);

  const spare = cap(bug, 'holes', S.breach.holes) - 1;
  const span = (Math.PI * 2) / Math.max(1, spare);
  const turn = Math.random() * Math.PI * 2;
  for (let i = 0; i < spare; i++) {
    waves.breach(size(), besidePlayer(S, _hole, turn + i * span, span),
                 S.breach.scale, brood);
  }

  burst(bug.pos.x, bug.pos.z, bug.radius * S.burst.reach, S.burst);
  audio.playAt('bugAttack', bug.pos.x, bug.pos.z, voiceOf(bug.type));
}

export function begin(bug) {
  bug.jab = { phase: 'raise', t: CFG.smallSlam.windup };
}

// Owns the frame, the same as the full slam: what it does not own is the boss's
// footing, which never leaves the ground.
export function update(bug, dist, dt, held = false) {
  const S = CFG.smallSlam;

  if (!bug.jab) {
    bug.jabCd -= cooling(bug, dt);
    if (held || bug.jabCd > 0 || dist > S.range) return false;
    begin(bug);
  }

  const L = bug.jab;
  L.t -= dt;
  bug.model.object.position.copy(bug.pos);
  bug.model.object.rotation.set(0, bug.yaw, 0);

  if (L.phase === 'raise') {
    pose(bug, S, S.raise * (1 - Math.max(0, L.t) / S.windup));
    if (L.t > 0) return true;
    L.phase = 'strike';
    L.t = S.strike;
  }

  if (L.phase === 'strike') {
    const k = Math.max(0, L.t) / S.strike;
    pose(bug, S, S.raise * k - S.drive * (1 - k));
    if (L.t > 0) return true;
    land(bug, S);
    L.phase = 'recover';
    L.t = S.recover;
  }

  pose(bug, S, -S.drive * Math.max(0, L.t) / S.recover);
  if (L.t > 0) return true;

  bug.jab = null;
  bug.jabCd = between(S.cooldown);
  return false;
}
