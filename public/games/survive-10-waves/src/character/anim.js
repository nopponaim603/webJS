import * as THREE from 'three';
import { ANIM, ARM_POSE } from '../config/index.js';

const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _q3 = new THREE.Quaternion();
const _e = new THREE.Euler();
const _axis = new THREE.Vector3();
const _pq = new THREE.Quaternion();
const UP = new THREE.Vector3(0, 1, 0);
const RIGHT = new THREE.Vector3(1, 0, 0);
const FORWARD = new THREE.Vector3(0, 0, 1);
const IDENTITY = new THREE.Quaternion();
const _legQ = new THREE.Quaternion();
const _yq = new THREE.Quaternion();

const ARM_Q = Object.entries(ARM_POSE).map(([name, q]) => [name, new THREE.Quaternion(...q)]);

const TAU = Math.PI * 2;

export function strideFor(legLength) {
  return 4 * legLength * Math.sin(ANIM.hipSwing) * ANIM.strideScale;
}

function hipAngle(p) {
  const sA = Math.sin(ANIM.hipSwing);
  const f = ANIM.stanceFraction;
  const u = p - Math.floor(p);

  const r = u < f
    ? -1 + 2 * (u / f)
    : Math.cos(Math.PI * (u - f) / (1 - f));
  return Math.asin(Math.max(-1, Math.min(1, sA * r)));
}

// In the PARENT's frame: this rig's bone axes point sideways, so a local yaw tips
// the character onto its face.
function yaw(bone, angle) {
  if (!bone || !bone.parent) return;
  bone.parent.getWorldQuaternion(_pq);
  _axis.copy(UP).applyQuaternion(_pq.invert()).normalize();
  _q.setFromAxisAngle(_axis, angle);
  bone.quaternion.copy(_q).multiply(bone.userData.rest);
}

// The world axis a bone has to turn about, written in its parent's frame.
function boneAxis(bone, dir, rootQuat) {
  bone.parent.getWorldQuaternion(_pq);
  return _axis.copy(dir).applyQuaternion(rootQuat).applyQuaternion(_pq.invert()).normalize();
}

function pitchBone(bone, pitch, rootQuat, lx, ly, lz) {
  if (!bone || !bone.parent) return;
  _q.setFromAxisAngle(boneAxis(bone, RIGHT, rootQuat), pitch);
  _q2.setFromEuler(_e.set(lx || 0, ly || 0, lz || 0));
  bone.quaternion.copy(_q).multiply(bone.userData.rest).multiply(_q2);
}

// A hanging leg swings across as well as along. The two turns are composed
// before either is applied: written one after the other, the second would simply
// replace the first.
function swingBone(bone, pitch, roll, rootQuat, tuck) {
  if (!bone || !bone.parent) return;
  _q.setFromAxisAngle(boneAxis(bone, RIGHT, rootQuat), pitch);
  if (roll) _q.premultiply(_q3.setFromAxisAngle(boneAxis(bone, FORWARD, rootQuat), roll));
  _q2.setFromEuler(_e.set(0, 0, tuck));
  bone.quaternion.copy(_q).multiply(bone.userData.rest).multiply(_q2);
}

export function pose(B, o) {
  if (!B || !B.Hips) return;

  const m = o.blend;
  const t = o.phase * TAU;

  const twist = Math.sin(t * ANIM.twistRate + ANIM.twistPhase) * ANIM.spineTwist * m;

  const ty = ANIM.torsoYaw;
  yaw(B.Hips, o.legYaw);
  yaw(B.Spine, -o.legYaw * 0.5 + twist + ty * 0.5);
  yaw(B.Spine01, -o.legYaw * 0.3 + ty * 0.3);
  yaw(B.Spine02, -o.legYaw * 0.2 + ty * 0.2);

  if (B.Hips.userData.restPos) {
    const drop = -Math.abs(Math.cos(t)) * ANIM.bob * m;
    const breathe = Math.sin(o.time * ANIM.idleRate) * ANIM.idleBreath * (1 - m);
    B.Hips.position.copy(B.Hips.userData.restPos);
    B.Hips.position.y += (drop + breathe) * o.boneUnit;
  }

  const crouch = ANIM.idleCrouch * (1 - m);
  const rq0 = o.rootQuat || IDENTITY;

  _legQ.copy(rq0).multiply(_yq.setFromAxisAngle(UP, o.legYaw));

  const H = ANIM.hover;
  const hang = o.hover;
  const h = hang ? hang.k : 0;
  // Where the legs have swung to, and what the joints below make of it: a shin
  // lags behind the thigh it hangs off, and the foot behind the shin. The knee
  // has a floor because a knee does not bend the other way.
  const fore = hang ? hang.fore : 0;
  const side = hang ? hang.side : 0;
  const knee = Math.max(0, H.knee * h - H.kneeLag * fore);
  const foot = H.foot * h - H.footLag * fore;

  swingBone(B.LeftUpLeg, (ANIM.hipMid + hipAngle(o.phase)) * m + H.leg * h + fore,
            side, _legQ, -ANIM.legTuck);
  swingBone(B.RightUpLeg, (ANIM.hipMid + hipAngle(o.phase + 0.5)) * m + H.leg * h + fore,
            side, _legQ, ANIM.legTuck);
  pitchBone(B.LeftLeg,
            Math.max(0, Math.sin(t + ANIM.kneePhase)) * ANIM.kneeMax * m + crouch + knee,
            _legQ);
  pitchBone(B.RightLeg,
            Math.max(0, Math.sin(t + Math.PI + ANIM.kneePhase)) * ANIM.kneeMax * m + crouch
            + knee, _legQ);
  pitchBone(B.LeftFoot,
            (ANIM.footMid + Math.sin(t + ANIM.footPhase) * ANIM.footSwing) * m + foot,
            _legQ);
  pitchBone(B.RightFoot,
            (ANIM.footMid + Math.sin(t + Math.PI + ANIM.footPhase) * ANIM.footSwing) * m
            + foot, _legQ);

  for (const [name, q] of ARM_Q) {
    const bone = B[name];
    if (bone) bone.quaternion.copy(bone.userData.rest).multiply(q);
  }
}

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _qw = new THREE.Quaternion();
const _qp = new THREE.Quaternion();
const _qs = new THREE.Quaternion();
const HINGE = new THREE.Vector3(0, 0, 1);

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

export function reachFor(chain, target, o = {}) {
  const { clavicle = null, shoulder, elbow, hand } = chain;
  const { bendSign = 1, pole = 0, push = 0, roll = 0, handEuler = null } = o;
  if (!shoulder || !elbow || !hand || !target) return;

  if (clavicle && (ANIM.claviclePull > 0 || push)) {
    clavicle.quaternion.copy(clavicle.userData.rest);
    if (ANIM.claviclePull > 0) {
      clavicle.getWorldPosition(_v1);
      hand.getWorldPosition(_v3);
      _a.subVectors(_v3, _v1);
      _b.subVectors(target, _v1);
      if (_a.lengthSq() > 1e-8 && _b.lengthSq() > 1e-8) {
        _qw.setFromUnitVectors(_a.normalize(), _b.normalize());
        _qs.identity().slerp(_qw, ANIM.claviclePull);
        clavicle.parent.getWorldQuaternion(_qp);
        _q2.copy(_qp).invert().multiply(_qs).multiply(_qp);
        clavicle.quaternion.premultiply(_q2);
      }
    }

    if (push) {
      clavicle.parent.getWorldQuaternion(_qp);
      _axis.copy(UP).applyQuaternion(_qp.invert()).normalize();
      _q.setFromAxisAngle(_axis, push);
      clavicle.quaternion.premultiply(_q);
    }
  }

  shoulder.getWorldPosition(_v1);
  elbow.getWorldPosition(_v2);
  hand.getWorldPosition(_v3);

  const L1 = _v1.distanceTo(_v2);
  const L2 = _v2.distanceTo(_v3);
  if (L1 < 1e-6 || L2 < 1e-6) return;

  const d = clamp(_v1.distanceTo(target), Math.abs(L1 - L2) + 1e-4, L1 + L2 - 1e-4);

  const cosE = clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1);
  _q.setFromAxisAngle(HINGE, (Math.PI - Math.acos(cosE)) * bendSign);
  elbow.quaternion.copy(elbow.userData.rest).multiply(_q);

  hand.getWorldPosition(_v3);
  shoulder.getWorldPosition(_v1);
  _a.subVectors(_v3, _v1);
  _b.subVectors(target, _v1);
  if (_a.lengthSq() < 1e-8 || _b.lengthSq() < 1e-8) return;
  _qw.setFromUnitVectors(_a.normalize(), _b.normalize());
  shoulder.parent.getWorldQuaternion(_qp);
  _q2.copy(_qp).invert().multiply(_qw).multiply(_qp);
  shoulder.quaternion.premultiply(_q2);

  if (pole) {
    shoulder.getWorldPosition(_v1);
    _b.subVectors(target, _v1);
    if (_b.lengthSq() > 1e-8) {
      _qw.setFromAxisAngle(_b.normalize(), pole);
      shoulder.parent.getWorldQuaternion(_qp);
      _q2.copy(_qp).invert().multiply(_qw).multiply(_qp);
      shoulder.quaternion.premultiply(_q2);
    }
  }

  if (roll) {
    elbow.getWorldPosition(_v2);
    hand.getWorldPosition(_v3);
    _b.subVectors(_v3, _v2);
    if (_b.lengthSq() > 1e-8) {
      _qw.setFromAxisAngle(_b.normalize(), roll);
      elbow.parent.getWorldQuaternion(_qp);
      _q2.copy(_qp).invert().multiply(_qw).multiply(_qp);
      elbow.quaternion.premultiply(_q2);
    }
  }

  if (handEuler && hand.userData.rest) {
    _q.setFromEuler(_e.set(handEuler[0], handEuler[1], handEuler[2]));
    hand.quaternion.copy(hand.userData.rest).multiply(_q);
  }
}
