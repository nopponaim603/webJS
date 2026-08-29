import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { makePool } from '../core/pool.js';
import { between } from '../core/rng.js';
import { GEO, BUBBLE_TEX, PUFF_TEX } from './textures.js';
import { gibs } from './spatter.js';

export const ACID = 0x5f9421;
const WET = 0x9fe84a;

const BEAD = new THREE.SphereGeometry(0.5, 9, 7);

const B = () => CFG.spit.boil;

export function drip(pos) {
  const g = gibs.spawn(pos, WET, 0.2, GEO.drop);
  g.drop = true;
  g.size = 0.35 + Math.random() * 0.3;
  g.mesh.scale.setScalar(g.size);
  g.vel.set((Math.random() - 0.5) * 1.2, -Math.random() * 1.5, (Math.random() - 0.5) * 1.2);
  g.life = 0.35 + Math.random() * 0.25;
}

export function burst(pos) {
  for (let i = 0; i < 12; i++) {
    const g = gibs.spawn(pos, WET, 0.75, GEO.drop);
    g.drop = true;
    g.size = 0.4 + Math.random() * 0.7;
    g.mesh.scale.setScalar(g.size);
    g.vel.set((Math.random() - 0.5) * 9, 1 + Math.random() * 5, (Math.random() - 0.5) * 9);
    g.life = 0.3 + Math.random() * 0.4;
  }
}

const bubbles = makePool(
  () => {
    const mesh = new THREE.Mesh(BEAD, new THREE.MeshStandardMaterial({
      map: BUBBLE_TEX[0], color: WET, emissive: WET, emissiveIntensity: 0.35,
      roughness: 0.24, metalness: 0, transparent: true, depthWrite: false,
    }));
    mesh.renderOrder = 2;
    scene.add(mesh);
    return { mesh, size: 1, swell: 1, age: 0, popped: false };
  },
  (b, x, z, size) => {
    b.mesh.material.map = BUBBLE_TEX[(Math.random() * BUBBLE_TEX.length) | 0];
    b.mesh.position.set(x, 0.02, z);
    b.mesh.rotation.set(0, Math.random() * Math.PI * 2, 0);
    b.mesh.material.opacity = 1;
    b.size = size;
    b.swell = between(B().swell);
    b.age = 0;
    b.popped = false;
  },
);

// Domed, not spherical: half of it is under the acid, so what shows is a blister
// on the surface rather than a ball resting on it.
function shape(b, spread, flat) {
  const wide = b.size * spread;
  b.mesh.scale.set(wide, b.size * B().squash * flat, wide);
  b.mesh.position.y = b.size * B().squash * flat * 0.35;
}

export function bubble(x, z, radius) {
  const a = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * radius;
  const b = bubbles.spawn(x + Math.cos(a) * r, z + Math.sin(a) * r, between(B().size));
  shape(b, 0.001, 0.001);
  return b;
}

const fumes = makePool(
  () => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: PUFF_TEX[0], color: 0xffffff, transparent: true, opacity: 0,
      depthWrite: false,
    }));
    sprite.renderOrder = 4;
    scene.add(sprite);
    return { mesh: sprite, drift: new THREE.Vector3(), size: 1, grow: 1,
             life: 0, maxLife: 1, peak: 1 };
  },
  (s, x, z, size) => {
    const C = B();
    s.mesh.material.map = PUFF_TEX[(Math.random() * PUFF_TEX.length) | 0];
    s.mesh.material.color.setHex(C.smokeColor);
    s.mesh.material.rotation = Math.random() * Math.PI * 2;
    s.mesh.position.set(x, 0.08, z);
    s.drift.set((Math.random() - 0.5) * C.smokeDrift, between(C.smokeRise),
                (Math.random() - 0.5) * C.smokeDrift);
    s.size = size;
    s.grow = C.smokeGrow;
    s.peak = C.smokeOpacity * (0.7 + Math.random() * 0.5);
    s.life = s.maxLife = between(C.smokeLife);
    s.mesh.scale.setScalar(size);
    s.mesh.material.opacity = 0;
  },
);

export function fume(x, z, radius) {
  const a = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * radius;
  fumes.spawn(x + Math.cos(a) * r, z + Math.sin(a) * r, between(B().smokeSize));
}

// The burst throws a couple of beads and lets go of a wisp: a bubble that only
// vanished would read as a fade, not a pop.
function spatterOf(b) {
  const p = b.mesh.position;
  for (let i = 0, n = 1 + ((Math.random() * 3) | 0); i < n; i++) {
    const g = gibs.spawn(p, WET, 0.2, GEO.drop);
    g.drop = true;
    g.size = b.size * (0.3 + Math.random() * 0.3);
    g.mesh.scale.setScalar(g.size);
    g.vel.set((Math.random() - 0.5) * 2.2, 1.4 + Math.random() * 1.8,
              (Math.random() - 0.5) * 2.2);
    g.life = 0.2 + Math.random() * 0.25;
  }
  if (Math.random() < B().popSmoke) fume(p.x, p.z, b.size * 2.4);
}

function updateBubbles(dt) {
  const C = B();
  for (let i = bubbles.live.length - 1; i >= 0; i--) {
    const b = bubbles.live[i];
    b.age += dt;

    if (b.age < b.swell) {
      const k = b.age / b.swell;
      shape(b, 1 - (1 - k) ** 3, 1 - (1 - k) ** 3);
      continue;
    }
    if (!b.popped) { b.popped = true; spatterOf(b); }

    const k = Math.min(1, (b.age - b.swell) / C.burst);
    shape(b, 1 + k * C.spread, 1 - k);
    b.mesh.material.opacity = 1 - k;
    if (k >= 1) bubbles.release(i);
  }
}

function updateFumes(dt) {
  for (let i = fumes.live.length - 1; i >= 0; i--) {
    const s = fumes.live[i];
    s.life -= dt;
    const t = 1 - Math.max(0, s.life) / s.maxLife;

    s.mesh.position.addScaledVector(s.drift, dt);
    s.mesh.scale.setScalar(s.size * (1 + t * s.grow));
    s.mesh.material.rotation += dt * 0.5;
    s.mesh.material.opacity = s.peak * Math.min(1, t / 0.22) * (1 - t) ** 1.4;
    if (s.life <= 0) fumes.release(i);
  }
}

export function update(dt) {
  updateBubbles(dt);
  updateFumes(dt);
}

export function clear() {
  bubbles.clear();
  fumes.clear();
}
