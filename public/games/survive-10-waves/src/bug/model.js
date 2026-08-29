import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { manager } from '../core/loading.js';
import { attachGlow } from '../fx/glow.js';
import { markDots } from '../fx/bugcharge.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import { CFG, BUG_TYPES } from '../config/index.js';
import { bindLegs, bindHip, measureReach } from './gait.js';
import { createFlyerModel } from './vulture.js';
import * as skin from './skin.js';

const SPAN = 2.2;
export const spanOf = (type) => type.length || type.radius * SPAN;

const GEO = {
  body: new THREE.SphereGeometry(0.62, 14, 10),
  head: new THREE.SphereGeometry(0.34, 12, 8),
  leg: new THREE.BoxGeometry(0.1, 0.1, 0.75),
  eye: new THREE.SphereGeometry(0.09, 6, 5),
};
const EYE_MAT = new THREE.MeshBasicMaterial({ color: 0xff3b3b });

const loaded = new Map();

function loadTemplate(url) {
  if (loaded.has(url)) return;
  loaded.set(url, null);
  new GLTFLoader(manager).load(url, (gltf) => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = box.getSize(new THREE.Vector3());
    const fit = 1 / Math.max(size.x, size.z);
    gltf.scene.userData.groundOffset = -box.min.y * fit;

    gltf.scene.userData.height = size.y * fit;

    const reach = measureReach(gltf.scene) * fit;

    loaded.set(url, { scene: gltf.scene, fit, reach, size, midY: box.min.y + size.y / 2,
                      floor: box.min.y, clips: gltf.animations || [] });
  }, undefined, (e) => {
    loaded.delete(url);
    console.warn(`bug model failed to load (${url}) — using primitives`, e);
  });
}

function templateFor(type) {
  return loaded.get(type.model || CFG.bugModel) || null;
}

loadTemplate(CFG.bugModel);
for (const t of BUG_TYPES) if (t.model) loadTemplate(t.model);

// Every clone gets its own materials: the tint is per species and the death fade
// and crit flash are per bug.
function dress(model, type) {
  let material = null;
  const materials = [];
  model.traverse((o) => {
    if (!o.isMesh && !o.isSkinnedMesh) return;
    o.castShadow = true;
    o.material = o.material.clone();
    o.material.color.multiplyScalar(CFG.bugBrightness);

    if (type.tint) {
      o.material.color.setRGB(
        o.material.color.r * type.tint[0],
        o.material.color.g * type.tint[1],
        o.material.color.b * type.tint[2],
      );
    }

    skin.paint(type, o.material);

    // Set now, not at death: flipping it at runtime recompiles the shader.
    o.material.transparent = true;

    // A model arrives lit however it was authored. `surface` is the game having
    // the last word on it: the packed map goes with the value it fed, because a
    // factor can only ever scale a map down, never make it rougher.
    if (type.surface) {
      const s = type.surface;
      if (s.roughness !== undefined) {
        o.material.roughness = s.roughness;
        o.material.roughnessMap = null;
      }
      if (s.metalness !== undefined) {
        o.material.metalness = s.metalness;
        o.material.metalnessMap = null;
      }
      o.material.needsUpdate = true;
    }

    skin.remember(o.material);
    materials.push(o.material);
    material = material || o.material;
  });
  return { material, materials };
}

function createGltfModel(type) {
  const tpl = templateFor(type);
  const g = new THREE.Group();
  // SkeletonUtils, not Object3D.clone: a plain clone shares one skeleton.
  const model = cloneSkinned(tpl.scene);

  const span = spanOf(type);
  model.scale.setScalar(tpl.fit * span);
  model.position.y = tpl.scene.userData.groundOffset * span;

  const { material, materials } = dress(model, type);
  g.add(model);

  model.userData.baseY = model.position.y;

  const legs = bindLegs(model);

  const head = model.getObjectByName(CFG.spit.headBone) || null;
  const height = (tpl.scene.userData.height || 1) * span;

  return { object: g, parts: { body: model, legs, hip: bindHip(g, legs), head,
                               material, materials, rigged: true,
                               reach: tpl.reach * span, span, height,
                               glow: attachGlow(g, type, span, height),
                               dotUv: markDots(model) } };
}

export function setFlash(bug, on) {
  const F = CFG.crit.flash;
  for (const m of bug.model.parts.materials || []) {
    if (!m.emissive) continue;
    if (m.userData.veins) m.emissiveMap = on ? skin.flare() : m.userData.veins;
    if (on) {
      m.emissive.setHex(F.color);
      m.emissiveIntensity = F.intensity;
    } else {
      m.emissive.setHex(m.userData.baseEmissive ?? 0);
      m.emissiveIntensity = m.userData.baseEmissiveIntensity ?? 1;
    }
  }
}

// A flyer with a model of its own is posed by the clips that came with it, one
// per phase flyer.js flies in. Everything the procedural bird exposed for hand
// posing — wings, tail — is the mixer's job now, so it is not handed over.
function createFlyerGltf(type) {
  const tpl = templateFor(type);
  const g = new THREE.Group();
  // Yaw, then pitch, then bank — the order flyStep sets them in. Under the
  // default XYZ the pitch axis swings with the yaw and a circling bird points
  // its nose at the sky on the turns.
  g.rotation.order = 'YXZ';
  const model = cloneSkinned(tpl.scene);

  const span = spanOf(type);
  const scale = (type.wingspan || span) / (tpl.size.x || 1);
  model.scale.setScalar(scale);
  // Modelled standing, so its origin is at the feet. A bird in the air hangs on
  // its middle: the object's position is where the bird is, not where it would
  // stand. Without this it flies a body-height above its own altitude.
  model.position.y = -tpl.midY * scale;
  // Trim for a model whose neutral pose is not level. Positive is nose down.
  model.rotation.x = type.modelTilt || 0;

  const { material, materials } = dress(model, type);
  g.add(model);

  const mixer = new THREE.AnimationMixer(model);
  const named = (want) => tpl.clips.find((c) => c.name.toLowerCase() === want);
  const actions = {};
  for (const [phase, clip] of [['orbit', named('flying')], ['dive', named('dive')]]) {
    if (clip) actions[phase] = mixer.clipAction(clip);
  }

  return {
    object: g,
    parts: {
      body: null, legs: [], hip: bindHip(g, []), material, materials, mixer, actions,
      // The same figure the primitive bird reported: it is where a damage number
      // floats, not how tall the mesh is, and the wings would answer wrong.
      span, height: 0.9 * type.scale,
      glow: attachGlow(g, type, span, 0.5),
      dotUv: markDots(model),
    },
  };
}

// Primitives are scaffolding for a mesh that never arrived, not a look the game
// will show. The parts are still built — everything that poses, tints and buries
// a bug needs something to hold — and only the sight of them goes.
function standIn(model) {
  model.standIn = true;
  model.object.visible = false;
  return model;
}

function createModel(type) {
  if (type.fly) {
    return templateFor(type) ? createFlyerGltf(type) : standIn(createFlyerModel(type, spanOf(type)));
  }
  if (templateFor(type)) return createGltfModel(type);
  return standIn(createPrimitiveModel(type));
}

function createPrimitiveModel(type) {
  const g = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.6, metalness: 0.15 });
  shell.transparent = true;
  skin.remember(shell);

  const body = new THREE.Mesh(GEO.body, shell);
  body.scale.set(1, 0.78, 1.25);
  body.position.y = 0.62;
  body.castShadow = true;
  g.add(body);

  const head = new THREE.Mesh(GEO.head, shell);
  head.position.set(0, 0.62, 0.72);
  g.add(head);

  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(GEO.eye, EYE_MAT);
    eye.position.set(0.15 * sx, 0.72, 0.95);
    g.add(eye);
  }

  const legs = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const leg = new THREE.Mesh(GEO.leg, shell);
      leg.position.set(0.45 * side, 0.34, 0.42 - i * 0.42);
      leg.rotation.y = side * (0.5 - i * 0.35);
      leg.userData.phase = (i * 1.9) + (side > 0 ? Math.PI : 0);
      g.add(leg);
      legs.push(leg);
    }
  }

  const glow = attachGlow(g, type, 1.4, 1.1);
  g.scale.setScalar(type.scale);

  return { object: g, parts: { body, head, legs, hip: bindHip(g, legs),
                               material: shell, materials: [shell],
                               span: spanOf(type), height: 1.1 * type.scale, glow,
                               dotUv: markDots(body) } };
}

function revive(model) {
  const b = model.parts.body;
  if (b) {
    b.rotation.set(0, 0, 0);
    if (b.userData.baseY !== undefined) b.position.y = b.userData.baseY;
  }

  model.object.rotation.set(0, 0, 0);
  model.object.position.y = 0;

  // A recycled bird must not wake up mid-dive on the clip the last one died on.
  if (model.parts.mixer) {
    model.parts.mixer.stopAllAction();
    model.parts.playing = null;
    model.parts.actions?.walk?.reset().setEffectiveWeight(1).play();
  }

  if (model.parts.glow) model.parts.glow.visible = true;
  for (const m of model.parts.materials || []) {
    m.opacity = 1;

    if (m.emissive) {
      m.emissive.setHex(m.userData.baseEmissive ?? 0);
      m.emissiveIntensity = m.userData.baseEmissiveIntensity ?? 1;
    }
  }
}

const recycled = {};

// Level is the last word on how an animal looks, and it is said here rather
// than at the spawn: a model coming back out of the pool must never still be
// wearing what the last one to hold it had earned.
export function take(type, level = 1) {
  const model = (recycled[type.key] ||= []).pop() || createModel(type);
  revive(model);
  skin.wear(model, type, level);
  return model;
}

export function recycle(model, typeKey) {
  (recycled[typeKey] ||= []).push(model);
}
