import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { makePool } from '../core/pool.js';
import { BAND_TEX } from './textures.js';
import * as modules from '../modules/index.js';

const L = () => CFG.dive.lane;

function band() {
  return new THREE.MeshBasicMaterial({
    map: BAND_TEX, color: L().color, transparent: true, opacity: 0,
    depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
}

// Held alive by whoever is flying it: the mark fades on its own the moment it
// stops being refreshed, so a bird shot out of its stoop takes its lane with it.
const marks = makePool(
  () => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), band());
    mesh.renderOrder = 2;
    scene.add(mesh);
    return { mesh, held: 0 };
  },
  (m, sx, sz, ex, ez, width) => {
    const dx = ex - sx, dz = ez - sz;
    const len = Math.hypot(dx, dz) || 1;
    m.mesh.position.set((sx + ex) / 2, L().y, (sz + ez) / 2);
    m.mesh.rotation.y = Math.atan2(dx, dz);
    m.mesh.scale.set(width, 1, len);
    m.mesh.material.opacity = 0;
    m.held = L().hold;
  },
);

// The same band bent round a middle. Its own strip of ground rather than a
// scaled plane, so the texture runs along the arc exactly as it runs along a
// lane: across the width, then along the way flown.
const SEGS = 28;

function ribbon() {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((SEGS + 1) * 6), 3));

  const uv = new Float32Array((SEGS + 1) * 4);
  for (let i = 0; i <= SEGS; i++) {
    const v = i / SEGS;
    uv[i * 4 + 1] = v;
    uv[i * 4 + 2] = 1;
    uv[i * 4 + 3] = v;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

  const idx = [];
  for (let i = 0; i < SEGS; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
  }
  geo.setIndex(idx);
  return geo;
}

const rings = makePool(
  () => {
    const mesh = new THREE.Mesh(ribbon(), band());
    mesh.frustumCulled = false;
    mesh.renderOrder = 2;
    scene.add(mesh);
    return { mesh, held: 0 };
  },
  (m, cx, cz, radius, from, span, width) => {
    const at = m.mesh.geometry.getAttribute('position');
    const inner = radius - width / 2, outer = radius + width / 2;
    for (let i = 0; i <= SEGS; i++) {
      const a = from + span * (i / SEGS);
      const cos = Math.cos(a), sin = Math.sin(a);
      at.setXYZ(i * 2, cx + cos * inner, L().y, cz + sin * inner);
      at.setXYZ(i * 2 + 1, cx + cos * outer, L().y, cz + sin * outer);
    }
    at.needsUpdate = true;
    m.mesh.material.opacity = 0;
    m.held = L().hold;
  },
);

export function take(sx, sz, ex, ez, width) {
  return modules.sees('attacks') ? marks.spawn(sx, sz, ex, ez, width) : null;
}

export function takeArc(cx, cz, radius, from, span, width) {
  return modules.sees('attacks') ? rings.spawn(cx, cz, radius, from, span, width) : null;
}

export function hold(mark) {
  if (mark) mark.held = L().hold;
}

export function clear() {
  marks.clear();
  rings.clear();
}

function fade(pool, dt) {
  const C = L();
  for (let i = pool.live.length - 1; i >= 0; i--) {
    const m = pool.live[i];
    m.held -= dt;
    const want = m.held > 0 ? C.opacity * (0.75 + 0.25 * Math.sin(m.held * C.pulse)) : 0;
    const mat = m.mesh.material;
    mat.opacity += (want - mat.opacity) * Math.min(1, C.ease * dt);
    if (m.held <= 0 && mat.opacity < 0.01) pool.release(i);
  }
}

export function update(dt) {
  fade(marks, dt);
  fade(rings, dt);
}
