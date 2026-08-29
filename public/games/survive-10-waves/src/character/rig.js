import * as THREE from 'three';
import { CFG, BONE_NAMES } from '../config/index.js';
import { createGun, attachGunToBody } from '../weapons/gun.js';

export function fit(model) {
  const box = new THREE.Box3().setFromObject(model);
  model.scale.setScalar(CFG.player.height / box.getSize(new THREE.Vector3()).y);
  box.setFromObject(model);
  model.position.x -= (box.min.x + box.max.x) / 2;
  model.position.z -= (box.min.z + box.max.z) / 2;
  model.position.y -= box.min.y;
  return model;
}

export function harvest(model, holder, bind = null) {
  const bones = {};
  for (const name of BONE_NAMES) {
    const b = model.getObjectByName(name);
    if (!b) continue;
    if (bind) {
      if (!bind.has(name)) bind.set(name, { q: b.quaternion.clone(), p: b.position.clone() });
      const rest = bind.get(name);
      b.quaternion.copy(rest.q);
      b.position.copy(rest.p);
    }
    b.userData.rest = b.quaternion.clone();
    b.userData.restPos = b.position.clone();
    bones[name] = b;
  }

  let boneUnit = 1;
  if (bones.Hips) {
    const ws = new THREE.Vector3();
    bones.Hips.getWorldScale(ws);
    boneUnit = 1 / ws.x;
  }

  let legLength = 1;
  if (bones.LeftUpLeg && bones.LeftFoot) {
    const a = new THREE.Vector3(), b = new THREE.Vector3();
    bones.LeftUpLeg.getWorldPosition(a);
    bones.LeftFoot.getWorldPosition(b);
    legLength = a.distanceTo(b);
  }

  let gun = null;
  const chest = bones.Spine02 || bones.Spine01 || bones.Spine;
  if (chest && holder) {
    gun = createGun().gun;
    attachGunToBody(holder, chest, gun);
  }

  return { bones, boneUnit, legLength, gun, chest, root: holder, model };
}

export function missingBones(bones) {
  return BONE_NAMES.filter((n) => !bones[n]);
}

// The Meshy export bakes colour into the emissive slot, which ignores every light.
export function dimEmissive(model, scale = CFG.player.emissiveScale) {
  if (scale >= 1) return;
  const done = new Set();
  model.traverse((o) => {
    if (!o.isMesh && !o.isSkinnedMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!m || done.has(m)) continue;
      done.add(m);
      m.emissiveIntensity *= scale;
      m.needsUpdate = true;
    }
  });
}
