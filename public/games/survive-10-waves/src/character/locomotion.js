import * as THREE from 'three';
import { CFG, ANIM } from '../config/index.js';
import { pose, strideFor, reachFor } from './anim.js';
import { wrapPi } from '../core/geom2.js';
import { alignGunToFacing } from '../weapons/gun.js';

export function newLocoState() {
  return {
    phase: 0,
    blend: 0,
    legYaw: 0,
    dir: 1,
    aimYaw: 0,
    ready: false,
    rate: 0, turnRate: 0, pivot: 0,
  };
}

export function resetLocoState(st) {
  st.phase = st.blend = st.legYaw = st.aimYaw = 0;
  st.rate = st.turnRate = st.pivot = 0;
  st.dir = 1;
  st.ready = false;
}

export function stepLocomotion(st, o) {
  const { spd, moveYaw, aimYaw, legLength, dt } = o;
  const advance = o.advance !== false;

  if (!st.ready) { st.aimYaw = aimYaw; st.ready = true; }
  const dAim = wrapPi(aimYaw - st.aimYaw);
  st.aimYaw = aimYaw;

  let pivot = 0;

  if (spd > 0.15) {
    let rel = wrapPi(moveYaw - aimYaw);
    let dirSign = 1;
    if (Math.abs(rel) > Math.PI / 2) { rel = wrapPi(rel - Math.PI); dirSign = -1; }
    const yawTarget = Math.max(-ANIM.legYawMax, Math.min(ANIM.legYawMax, rel));
    st.legYaw += (yawTarget - st.legYaw) * (1 - Math.exp(-ANIM.turnEase * dt));
    st.dir = dirSign;
  } else {
    st.legYaw = wrapPi(st.legYaw - dAim);

    const was = Math.abs(st.legYaw);
    const sign = Math.sign(st.legYaw) || 1;
    let want = was;
    if (was > ANIM.aimTwistMax) want = ANIM.aimTwistMax;
    else if (was > ANIM.aimDeadzone) want = Math.max(0, was - ANIM.turnRelax * dt);
    else want = was * Math.exp(-ANIM.turnEase * dt);

    want = Math.max(want, was - ANIM.turnRateMax * dt);
    want = Math.min(want, ANIM.aimTwistHard);

    pivot = Math.min((was - want) / Math.max(dt, 1e-4), ANIM.turnRateMax);
    st.legYaw = sign * want;

    st.dir = -1;
  }

  st.rate = Math.min(spd / strideFor(legLength || 1), ANIM.maxCycleRate);

  st.turnRate = Math.abs(st.legYaw) > ANIM.aimDeadzone
    ? Math.min(pivot / ANIM.turnStride, ANIM.maxCycleRate) : 0;
  st.pivot = pivot;

  if (advance) st.phase += (st.rate + st.turnRate) * st.dir * dt;

  const want = Math.max(
    Math.min(1, spd / ANIM.blendSpeed),
    Math.min(ANIM.turnBlendMax, pivot / ANIM.turnBlendRate),
  );
  st.blend += (want - st.blend) * (1 - Math.exp(-ANIM.blendEase * dt));

  return st;
}

const _grip = new THREE.Vector3();

export function poseRig(rig, st, time, hover = null) {
  const B = rig.bones;
  if (!B || !B.Hips) return;

  pose(B, {
    phase: st.phase, blend: st.blend, legYaw: st.legYaw,
    boneUnit: rig.boneUnit, time, rootQuat: rig.root.quaternion, hover,
  });

  if (!rig.gun || !rig.chest) return;
  alignGunToFacing(rig.root, rig.gun, rig.root.quaternion);
  if (!CFG.player.armIK) return;

  rig.gun.userData.trigger.getWorldPosition(_grip);
  reachFor({ clavicle: B.RightShoulder, shoulder: B.RightArm,
             elbow: B.RightForeArm, hand: B.RightHand }, _grip, {
    bendSign: ANIM.elbowSignR, pole: ANIM.elbowPoleR,
    push: ANIM.shoulderPushR, roll: ANIM.foreRollR, handEuler: ANIM.handRotR,
  });
  rig.gun.userData.grip.getWorldPosition(_grip);
  reachFor({ clavicle: B.LeftShoulder, shoulder: B.LeftArm,
             elbow: B.LeftForeArm, hand: B.LeftHand }, _grip, {
    bendSign: ANIM.elbowSignL, pole: ANIM.elbowPoleL,
    push: -ANIM.shoulderPushL, roll: ANIM.foreRollL, handEuler: ANIM.handRotL,
  });
}
