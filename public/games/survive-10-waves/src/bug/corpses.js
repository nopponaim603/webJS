import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { world } from '../core/world.js';
import { deathPose } from './gait.js';
import * as bugmodel from './model.js';
import { between } from '../core/rng.js';

function pickStyle() {
  const styles = CFG.bugDeath.styles;
  let total = 0;
  for (const st of styles) total += st.weight;
  let r = Math.random() * total;
  for (const st of styles) { r -= st.weight; if (r <= 0) return st; }
  return styles[0];
}

export function add(i) {
  const list = world.bugs;
  const bug = list[i];
  list[i] = list[list.length - 1];
  list.pop();

  const D = CFG.bugDeath;
  const st = pickStyle();
  // It may have died out of frame, where its model was not in the scene at all.
  // A body falling is watched: from here it is placed every frame again.
  scene.add(bug.model.object);

  const sizeK = Math.pow(bug.type.scale, D.sizeTime);
  bug.death = 0;
  bug.fall = bug.alt || 0;
  bug.fallVel = 0;
  bug.dr = {
    style: st.key,
    roll: st.roll * between([0.86, 1.14]) * (Math.random() < 0.5 ? -1 : 1),
    pitch: st.pitch * between([0.5, 1.5]) * (Math.random() < 0.5 ? -1 : 1),
    yaw: between([-0.45, 0.45]),
    tumble: st.tumble * (Math.random() < 0.5 ? -1 : 1),
    curl: st.curl * between([0.85, 1.15]),
    hop: (D.hop * st.hop * between([0.75, 1.3])) / sizeK,
    flip: D.flip * sizeK * between([0.82, 1.35]),
    settle: D.settle * sizeK * between([0.65, 1.5]),
    sink: D.sink * sizeK * between([0.85, 1.25]),
    seed: Math.random() * 97,
  };
  world.corpses.push(bug);

  const over = world.corpses.length - D.maxCorpses;
  for (let k = 0; k < over; k++) {
    const old = world.corpses[k];
    old.death = Math.max(old.death, old.dr.flip + old.dr.settle);
  }
}

export function occupancy(bug) {
  const sunk = bug.death - bug.dr.flip - bug.dr.settle;
  if (sunk <= 0) return 1;
  return Math.max(0, 1 - sunk / bug.dr.sink);
}

export function clear() {
  for (const c of world.corpses) {
    scene.remove(c.model.object);
    bugmodel.recycle(c.model, c.type.key);
  }
  world.corpses.length = 0;
}

const _up = new THREE.Vector3();

export function update(dt) {
  const D = CFG.bugDeath;

  for (let i = world.corpses.length - 1; i >= 0; i--) {
    const bug = world.corpses[i];
    const R = bug.dr;
    const total = R.flip + R.settle + R.sink;
    bug.death += dt;
    const obj = bug.model.object;
    const body = bug.model.parts.body;
    const span = bug.model.parts.span || 1;
    const baseY = body && body.userData.baseY !== undefined ? body.userData.baseY : 0.62;

    bug.pos.addScaledVector(bug.knock, dt);
    bug.knock.multiplyScalar(Math.exp(-CFG.bugDeath.knockDecay * dt));
    obj.position.copy(bug.pos);

    if (bug.fall > 0) {
      bug.fallVel += D.gravity * dt;
      bug.fall = Math.max(0, bug.fall - bug.fallVel * dt);
    }

    const flip = bug.model.parts.rigged ? body : obj;
    const rest = (bug.model.parts.rigged ? baseY : 0) + bug.fall;

    const t = Math.min(1, bug.death / R.flip);
    const ease = t * t * (3 - 2 * t);

    flip.rotation.set(
      R.pitch * ease + R.tumble * Math.PI * 2 * ease * (1 - ease) * 4,
      (bug.model.parts.rigged ? R.yaw : 0) * ease,
      R.roll * ease,
      'ZYX',
    );

    const h = (bug.model.parts.height || 0) / 2;
    _up.set(0, 1, 0).applyEuler(flip.rotation);
    const lift = h * (1 - _up.y);

    flip.position.y = rest + lift + Math.sin(ease * Math.PI) * R.hop * span;

    if (bug.model.parts.rigged) {
      deathPose(bug.model.parts.legs, t, obj.quaternion, R.curl, R.seed);
    }

    const sunk = bug.death - R.flip - R.settle;
    if (sunk > 0) {
      const k = Math.min(1, sunk / R.sink);

      flip.position.y = rest + lift - k * (2 * h + D.sinkDepth * span);
      for (const m of bug.model.parts.materials || []) m.opacity = 1 - k;
    }

    if (bug.death >= total) {
      scene.remove(obj);
      bugmodel.recycle(bug.model, bug.type.key);
      world.corpses[i] = world.corpses[world.corpses.length - 1];
      world.corpses.pop();
    }
  }
}
