import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { manager } from '../core/loading.js';
import { CFG } from '../config/index.js';

const FALLBACK_MAT = new THREE.MeshStandardMaterial({ color: 0x2b3138, roughness: 0.35, metalness: 0.7 });

const loads = new Map();
function loadOnce(url) {
  if (!loads.has(url)) {
    loads.set(url, new Promise((resolve) => {
      new GLTFLoader(manager).load(
        url,
        (gltf) => resolve(gltf.scene),
        undefined,
        (e) => { console.warn(`gun model failed to load (${url}) — keeping placeholder`, e); resolve(null); },
      );
    }));
  }
  return loads.get(url);
}

function fitModel(src, length, muzzleZ) {
  const model = src.clone(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const centre = box.getCenter(new THREE.Vector3());

  model.scale.setScalar(length / size.x);
  model.position.copy(centre).multiplyScalar(-length / size.x);
  model.traverse((o) => { if (o.isMesh) o.castShadow = true; });

  const holder = new THREE.Group();
  holder.rotation.y = Math.PI / 2;
  holder.add(model);
  holder.position.z = muzzleZ - length / 2;
  return holder;
}

export function createGun(rack = false) {
  const k = CFG.player.height / 1.9;
  const gun = new THREE.Group();

  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0, 0.88 * k);
  gun.add(muzzle);

  const foreGrip = new THREE.Object3D();
  foreGrip.position.copy(CFG.player.gripOffset).multiplyScalar(k);
  gun.add(foreGrip);

  const trigger = new THREE.Object3D();
  trigger.position.copy(CFG.player.triggerOffset).multiplyScalar(k);
  gun.add(trigger);

  gun.userData.grip = foreGrip;
  gun.userData.trigger = trigger;

  const stub = new THREE.Mesh(new THREE.BoxGeometry(0.11 * k, 0.11 * k, 0.92 * k), FALLBACK_MAT);
  stub.position.z = 0.40 * k;
  gun.add(stub);

  const models = [];
  gun.userData.models = models;
  gun.userData.stub = stub;
  gun.userData.shown = 0;

  const rackSpecs = rack ? CFG.guns : [CFG.guns[0] || {}];
  // The box stands in for a mesh the same way the capsule does, so it is shown
  // only where no mesh was named — never as the answer to one that failed.
  gun.userData.expects = rackSpecs.some((spec) => spec.model);
  stub.visible = !gun.userData.expects;
  rackSpecs.forEach((spec, i) => {
    if (!spec.model) return;
    loadOnce(spec.model).then((src) => {
      if (!src) return;
      const holder = fitModel(src, (spec.modelLength || CFG.player.gunLength) * k,
                              muzzle.position.z);
      holder.visible = i === gun.userData.shown;
      gun.add(holder);
      models[i] = holder;

      if (holder.visible) stub.visible = false;
    });
  });

  return { gun, muzzle, foreGrip, trigger };
}

export function showGunModel(gun, i) {
  const u = gun.userData;
  if (!u || !u.models) return;
  u.shown = i;
  for (let j = 0; j < u.models.length; j++) {
    if (u.models[j]) u.models[j].visible = j === i;
  }
  if (u.stub) u.stub.visible = !u.models[i] && !u.expects;
}

const _s = new THREE.Vector3();
const _hq = new THREE.Quaternion();
const _extra = new THREE.Quaternion();
const _e = new THREE.Euler();

const _wp = new THREE.Vector3();

export function attachGunToBody(root, chest, gun) {
  const k = CFG.player.height / 1.9;

  chest.add(gun);
  chest.getWorldScale(_s);
  const inv = 1 / _s.x;
  gun.scale.setScalar(inv);
  gun.position.copy(CFG.player.holdOffset).multiplyScalar(inv * k);
  gun.updateWorldMatrix(true, false);
  gun.getWorldPosition(_wp);

  chest.remove(gun);
  root.add(gun);
  gun.scale.setScalar(1);
  root.worldToLocal(_wp);
  gun.position.copy(_wp);
  alignGunToFacing(root, gun);
  return gun.position.clone();
}

export function alignGunToFacing(carrier, gun, rootQuat) {
  carrier.getWorldQuaternion(_hq);
  gun.quaternion.copy(_hq.invert());
  if (rootQuat) gun.quaternion.multiply(rootQuat);
  gun.quaternion.multiply(_extra.setFromEuler(_e.set(...CFG.player.gunOffset.rot)));

  if (gun.userData.dip) {
    gun.quaternion.multiply(_extra.setFromEuler(_e.set(gun.userData.dip, 0, 0)));
  }
}
