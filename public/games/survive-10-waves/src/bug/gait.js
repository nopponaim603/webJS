import * as THREE from 'three';
import { CFG } from '../config/index.js';

export const bobScale = (type) => type.radius / CFG.bugAnim.bobRadius;

const FOOT_Y = 0.42;
const FOOT_R = 0.42;

function bonesOf(model) {
  const out = [];
  model.traverse((o) => { if (o.isBone) out.push(o); });
  return out;
}

// Three keeps a joint's Euler angles in step with its quaternion, rebuilding and
// decomposing a matrix on every write. A joint posed from here is only ever
// written as a quaternion and its angles are never read, so the mirror goes with
// the same gesture that records the rest pose everything here is measured from.
const NO_MIRROR = () => {};

function claim(bone) {
  bone.userData.rest = bone.quaternion.clone();
  bone.quaternion._onChange(NO_MIRROR);
}

export function bindLegs(model) {
  model.updateWorldMatrix(true, true);
  const bones = bonesOf(model);
  if (!bones.length) return [];

  const box = new THREE.Box3().setFromObject(model);
  const centre = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxR = Math.max(size.x, size.z) / 2;

  const hasBoneChild = new Set();
  for (const b of bones) if (b.parent && b.parent.isBone) hasBoneChild.add(b.parent);

  const _p = new THREE.Vector3();
  const feet = [];
  for (const b of bones) {
    if (hasBoneChild.has(b)) continue;
    b.getWorldPosition(_p);
    const r = Math.hypot(_p.x - centre.x, _p.z - centre.z);
    if (_p.y > box.min.y + size.y * FOOT_Y) continue;
    if (r < maxR * FOOT_R) continue;
    feet.push({ bone: b, x: _p.x - centre.x, z: _p.z - centre.z });
  }
  if (!feet.length) return [];

  const rank = new Map();
  for (const side of [1, -1]) {
    feet.filter((f) => (f.x >= 0 ? 1 : -1) === side)
      .sort((a, b) => b.z - a.z)
      .forEach((f, i) => rank.set(f, i));
  }

  const legs = [];
  feet.forEach((f) => {
    const i = rank.get(f) + (f.x >= 0 ? 0 : 1);
    const tip = f.bone;
    const mid = tip.parent && tip.parent.isBone ? tip.parent : null;
    const top = mid && mid.parent && mid.parent.isBone ? mid.parent : mid;
    for (const b of [top, mid, tip]) if (b) claim(b);
    // `row` counts back from the front pair: what walks as a tripod still has
    // a front, a middle and a back to anything posing it by hand.
    legs.push({ top, mid, tip, side: f.x >= 0 ? 1 : -1, tripod: i % 2,
                row: rank.get(f) });
  });
  return legs;
}

export function measureReach(model) {
  const legs = bindLegs(model);
  if (!legs.length || !legs[0].top || !legs[0].tip) return 0.5;
  const hip = new THREE.Vector3(), foot = new THREE.Vector3();

  let total = 0;
  for (const leg of legs) {
    if (!leg.top || !leg.tip) continue;
    leg.top.getWorldPosition(hip);
    leg.tip.getWorldPosition(foot);
    total += Math.hypot(foot.x - hip.x, foot.z - hip.z);
  }
  return total / legs.length;
}

export function gaitRate(speed, stride) {
  return Math.min(speed / Math.max(stride, 1e-3), CFG.bugAnim.maxCycleRate);
}

export function gaitStride(reach) {
  return 2 * reach * Math.sin(CFG.bugAnim.legSwing) * CFG.bugAnim.strideScale;
}

const _q = new THREE.Quaternion();
const _axis = new THREE.Vector3();
const _par = new THREE.Quaternion();
const _hip = new THREE.Quaternion();
const _inv = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);
const FWD = new THREE.Vector3(0, 0, 1);
const SIDE = new THREE.Vector3(1, 0, 0);

export const AXIS = { up: UP, fwd: FWD, side: SIDE };

// A joint's rotation in the world is the product of the rotations above it, so
// asking the scene graph for it composes and multiplies a 4x4 at every level and
// then decomposes the result — matrices, to answer about rotation. Multiplying the
// rotations out costs one quaternion a level and no matrices at all. Nothing in
// the chain is scaled unevenly, which is what makes the two the same answer.
function worldTurn(o, out) {
  out.identity();
  for (; o; o = o.parent) out.premultiply(o.quaternion);
  return out;
}

function spin(bone, axis, angle, rootQuat) {
  if (!bone || !bone.userData.rest || !bone.parent) return;
  worldTurn(bone.parent, _par);
  _axis.copy(axis).applyQuaternion(rootQuat).applyQuaternion(_par.invert()).normalize();
  _q.setFromAxisAngle(_axis, angle);
  bone.quaternion.copy(_q).multiply(bone.userData.rest);
}

// One leg, held where it is put rather than driven by the walk: for a bug doing
// something with its legs other than standing on them.
export function poseLeg(leg, lift, sweep, rootQuat) {
  const A = CFG.bugAnim;
  spin(leg.top, UP, sweep * leg.side, rootQuat);
  spin(leg.mid, FWD, lift * leg.side, rootQuat);
  spin(leg.tip, FWD, -lift * A.tipCurl * leg.side, rootQuat);
}

// Bones off the legs have no rest pose recorded until something asks to move
// them, so the first pose is what it is measured against ever after.
export function poseBone(bone, axis, angle, rootQuat) {
  if (!bone) return;
  if (!bone.userData.rest) claim(bone);
  spin(bone, axis, angle, rootQuat);
}

// The hip a set of legs hangs from, and the joints between it and the object the
// whole animal is placed by, nearest that object first. Nothing along that path
// is scaled unevenly, so the hip's rotation in the world is the product of their
// rotations — a handful of quaternion multiplies, where asking the hip itself
// walks and decomposes a matrix for every joint above it. `root` must be the
// object whose rotation is later handed to stepLegs.
export function bindHip(root, legs) {
  const bone = legs.length && legs[0].top ? legs[0].top.parent : null;
  const path = [];
  for (let o = bone; o && o !== root; o = o.parent) path.unshift(o);
  return { bone, path };
}

// spin() asks each joint where it is in the world, and a bone answering that
// walks and decomposes every matrix above it. Down a chain the answer is already
// known: a bone's world rotation is its parent's times its own. So the hip is the
// only joint that is worked out from scratch, and the knee and the foot are told
// — which is the whole of why a thousand walking bugs are affordable.
function turn(bone, axis, angle, rootQuat, parentWorld) {
  if (!bone || !bone.userData.rest) return;
  _axis.copy(axis).applyQuaternion(rootQuat)
    .applyQuaternion(_inv.copy(parentWorld).invert()).normalize();
  _q.setFromAxisAngle(_axis, angle);
  bone.quaternion.copy(_q).multiply(bone.userData.rest);
}

export function stepLegs(legs, walk, rootQuat, hip) {
  const A = CFG.bugAnim;
  _hip.copy(rootQuat);
  for (const o of hip.path) _hip.multiply(o.quaternion);

  for (const leg of legs) {
    const phase = walk + (leg.tripod ? Math.PI : 0);

    const sweep = -Math.sin(phase) * A.legSwing;

    const lift = Math.max(0, Math.cos(phase)) * A.legLift;

    if (!leg.top) {
      spin(leg.tip, FWD, -lift * A.tipCurl * leg.side, rootQuat);
      continue;
    }
    if (leg.top.parent === hip.bone) _par.copy(_hip);
    else leg.top.parent.getWorldQuaternion(_par);

    turn(leg.top, UP, sweep * leg.side, rootQuat, _par);
    if (leg.mid && leg.mid !== leg.top) {
      _par.multiply(leg.top.quaternion);
      turn(leg.mid, FWD, lift * leg.side, rootQuat, _par);
      if (leg.tip !== leg.mid) {
        _par.multiply(leg.mid.quaternion);
        turn(leg.tip, FWD, -lift * A.tipCurl * leg.side, rootQuat, _par);
      }
    }
  }
}

function hash(a, b) {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function attackPose(body, windup, lunge) {
  const S = CFG.spit;
  const rear = windup > 0 ? 1 - windup / S.windup : 0;
  const ease = rear * rear * (3 - 2 * rear);
  body.rotation.x = -ease * S.rearPitch + lunge * lunge * S.lungePitch;
}

// A throw, taken as a whole animal rather than a nod: `k` runs -1 fully wound
// back to +1 at the end of the follow-through. The body tips and rises with it,
// the head leads it, and the front pair cocks back and sweeps through — the
// legs behind them keep the ground, since it is still standing on those.
export function poseThrow(parts, k, P, rootQuat) {
  const body = parts.body;
  if (body) {
    const baseY = body.userData.baseY !== undefined ? body.userData.baseY : 0.62;
    body.position.y = baseY + P.rise * Math.max(0, -k);
    body.rotation.x = k * P.pitch;
  }
  if (!parts.rigged) return;

  for (const leg of parts.legs) {
    if (leg.row !== 0) continue;
    poseLeg(leg, P.paw * Math.max(0, -k), k * P.sweep, rootQuat);
  }
  poseBone(parts.head, AXIS.side, k * P.head, rootQuat);
}

export function deathPose(legs, t, rootQuat, curlScale = 1, seed = 0) {
  const D = CFG.bugDeath;
  const ease = t * t * (3 - 2 * t);
  const jitter = (1 - ease) * D.twitch;
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];

    const v = 0.6 + 0.8 * hash(i + 1, seed);
    const curl = ease * D.legCurl * curlScale * v;

    const k = (leg.tripod ? 0.6 : 1.0) + (leg.side > 0 ? 0.15 : 0) + hash(i + 7, seed);
    const shake = Math.sin(t * 34 + k * 5) * jitter;
    spin(leg.top, UP, (curl * 0.35 + shake * 0.5) * leg.side, rootQuat);
    spin(leg.mid, FWD, (curl + shake) * leg.side, rootQuat);
    spin(leg.tip, FWD, (curl * 1.25 + shake * 0.6) * leg.side, rootQuat);
  }
}
