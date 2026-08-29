import * as THREE from 'three';
import { CFG, BUG_TYPES } from '../config/index.js';
import { scene } from '../engine/view.js';
import { makePool } from '../core/pool.js';
import { between } from '../core/rng.js';
import { audio } from '../engine/audio.js';
import * as modules from '../modules/index.js';
import * as bugmodel from './model.js';
import * as evolve from './evolve.js';
import * as combat from '../game/combat.js';
import { clip } from '../arena/clip.js';
import { ZONE_TEX, ZONE_FILL } from '../fx/textures.js';

const DISC = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

const bomber = () => BUG_TYPES.find((t) => t.key === 'bomber');

// Where it comes down, held from the moment it leaves: the whole flight is the
// warning, so the ring is drawn at the blast it will make rather than at the
// body that makes it.
const marks = makePool(
  () => {
    const mesh = new THREE.Mesh(DISC, clip(new THREE.MeshBasicMaterial({
      map: ZONE_TEX.disc, transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })));
    mesh.renderOrder = 3;
    scene.add(mesh);
    return { mesh, phase: 0 };
  },
  (m, x, z, radius) => {
    const M = CFG.toss.mark;
    m.mesh.position.set(x, 0.05, z);
    m.mesh.scale.setScalar((radius * 2) / ZONE_FILL);
    m.mesh.material.color.setHex(M.color);
    m.mesh.material.opacity = 0;
    m.phase = Math.random() * Math.PI * 2;
  },
);

// A plain list, not a pool: what is worth recycling here is the model, and it
// goes back to the one the bugs themselves come out of.
const live = [];

export function clear() {
  for (const b of live) {
    scene.remove(b.model.object);
    bugmodel.recycle(b.model, 'bomber');
    if (b.mark) marks.releaseObject(b.mark);
  }
  live.length = 0;
  marks.clear();
}

// Thrown, not flown: it leaves the mouth on an arc it cannot change and turns
// over on its way, since nothing about being thrown is under its control.
export function toss(bug, from, to) {
  const S = CFG.toss;
  const type = bomber();
  const model = bugmodel.take(type, bug.level);
  model.object.visible = !model.standIn;
  model.object.scale.setScalar(type.scale * S.size);
  scene.add(model.object);

  const mark = modules.sees('attacks') || S.alwaysWarn
    ? marks.spawn(to.x, to.z, type.burst.radius) : null;

  live.push({ model, mark, by: bug, from: from.clone(), to: to.clone(),
              spin: new THREE.Vector3(between(S.spin), between(S.spin), between(S.spin)),
              t: 0, dur: S.flight, rise: S.arc, hurt: evolve.share(bug, S.share),
              pulse: Math.random() * 10 });
  audio.playAt('spit', from.x, from.z, { rate: 0.8, gainScale: 0.7 });
}

function land(b) {
  const type = bomber();
  const B = type.burst;
  combat.explode({ x: b.to.x, z: b.to.z, radius: B.radius, damage: b.hurt,
                   edge: B.edge, knock: B.knock, selfDamage: b.hurt, blame: 'boss' });
  combat.blastGraze(b.to.x, b.to.z, B.radius, b.by);
  scene.remove(b.model.object);
  bugmodel.recycle(b.model, 'bomber');
  if (b.mark) marks.releaseObject(b.mark);
}

export const count = () => live.length;
export const flying = () => live;

export function update(dt) {
  const S = CFG.toss;
  const M = S.mark;

  for (let i = marks.live.length - 1; i >= 0; i--) {
    const m = marks.live[i];
    m.phase += dt * M.pulse;
    const want = M.opacity * (M.dim + (1 - M.dim) * (0.5 + 0.5 * Math.sin(m.phase)));
    const mat = m.mesh.material;
    mat.opacity += (want - mat.opacity) * Math.min(1, M.ease * dt);
  }

  for (let i = live.length - 1; i >= 0; i--) {
    const b = live[i];
    b.t += dt / b.dur;
    const k = Math.min(1, b.t);
    const obj = b.model.object;

    obj.position.lerpVectors(b.from, b.to, k);
    obj.position.y = b.from.y * (1 - k) + b.rise * 4 * k * (1 - k);
    obj.rotation.x += b.spin.x * dt;
    obj.rotation.y += b.spin.y * dt;
    obj.rotation.z += b.spin.z * dt;

    const glow = b.model.parts.glow;
    if (glow) {
      const G = bomber().glow;
      b.pulse += dt * G.rate;
      const beat = Math.sin(b.pulse) ** 2;
      glow.material.opacity = G.min + (1 - G.min) * beat;
      glow.scale.setScalar(b.model.parts.span * G.size * (0.82 + 0.32 * beat));
    }

    if (b.t < 1) continue;
    land(b);
    live[i] = live[live.length - 1];
    live.pop();
  }
}
