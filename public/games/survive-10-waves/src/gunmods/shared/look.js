import * as THREE from 'three';
import { scene, camera } from '../../engine/view.js';
import { makePool } from '../../core/pool.js';
import { GEO, GLOW_TEX, PUFF_TEX, ZONE_TEX, BAND_TEX } from '../../fx/textures.js';

// The shared visual vocabulary every gun module draws with, so a rail slug, a
// mortar circle and a rift all read as parts of one armoury rather than as
// three separate art passes. Nothing here knows what a module does: it is
// shapes, and the module says where and in what colour.

const RENDER = { mark: 3, band: 4, beam: 6, glow: 7 };

const additive = (map) => new THREE.MeshBasicMaterial({
  map, transparent: true, blending: THREE.AdditiveBlending,
  depthWrite: false, depthTest: false, side: THREE.DoubleSide,
});

const flat = (mesh, order, y) => {
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = order;
  mesh.position.y = y;
  return mesh;
};

const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t,
  pulse: (t) => Math.sin(Math.PI * Math.min(1, t)),
  snap: (t) => 1 - Math.pow(1 - t, 6),
};


// A shape lying on the floor: a warning circle, a scorch, a pool, a lane. It
// fades in over `rise` and out across the rest of its life, and can breathe so
// a hazard that is still live never reads as a spent decal.
const marks = makePool(
  () => {
    const mesh = flat(new THREE.Mesh(GEO.splat, additive(ZONE_TEX.disc)), RENDER.mark, 0.035);
    scene.add(mesh);
    return { mesh, life: 0, maxLife: 1, rise: 0, from: 1, to: 1, peak: 1,
             spin: 0, roll: 0, pulse: 0, hold: false };
  },
  (m, x, z, radius, o) => {
    m.mesh.material.map = o.tex || ZONE_TEX.disc;
    m.mesh.material.color.setHex(o.color !== undefined ? o.color : 0xffffff);
    m.mesh.material.blending = o.blend === 'normal'
      ? THREE.NormalBlending : THREE.AdditiveBlending;
    m.mesh.position.set(x, o.y !== undefined ? o.y : 0.035, z);
    m.mesh.rotation.z = o.angle || 0;
    m.mesh.scale.set(radius * (o.from || 1), radius * (o.from || 1), 1);
    if (o.long) m.mesh.scale.set(o.long, radius * (o.from || 1), 1);
    m.from = o.from !== undefined ? o.from : 1;
    m.to = o.to !== undefined ? o.to : m.from;
    m.radius = radius;
    m.long = o.long || 0;
    m.peak = o.opacity !== undefined ? o.opacity : 0.8;
    m.rise = o.rise || 0;
    m.spin = o.spin || 0;
    m.roll = o.angle || 0;
    m.pulse = o.pulse || 0;
    m.hold = !!o.hold;
    m.life = m.maxLife = o.life || 0.6;
  },
);

export function mark(x, z, radius, o = {}) { return marks.spawn(x, z, radius, o); }

export function holdMark(m, x, z, radius) {
  if (!m || m.life <= 0) return;
  m.mesh.position.x = x;
  m.mesh.position.z = z;
  m.radius = radius;
  m.life = m.maxLife;
}

export function dropMark(m, fade = 0.25) {
  if (!m) return;
  m.hold = false;
  m.rise = 0;
  m.life = Math.min(m.life, fade);
  m.maxLife = Math.max(m.life, 1e-3);
}

function stepMarks(dt) {
  for (let i = marks.live.length - 1; i >= 0; i--) {
    const m = marks.live[i];
    if (!m.hold) m.life -= dt;
    const t = 1 - Math.max(0, m.life) / m.maxLife;
    const grow = m.from + (m.to - m.from) * ease.out(t);
    if (m.long) m.mesh.scale.set(m.long, m.radius * grow, 1);
    else m.mesh.scale.set(m.radius * grow, m.radius * grow, 1);
    m.roll += m.spin * dt;
    m.mesh.rotation.z = m.roll;

    const inT = m.rise > 0 ? Math.min(1, (m.maxLife - m.life) / m.rise) : 1;
    const beat = m.pulse ? 1 - m.pulse * 0.5 * (1 + Math.sin(t * Math.PI * 2 * 6)) : 1;
    m.mesh.material.opacity = m.peak * inT * Math.pow(Math.max(0, 1 - t), 1.4) * beat;
    if (m.life <= 0 && !m.hold) marks.release(i);
  }
}

// A line of light between two points, drawn as a flat quad that always faces
// the camera enough to read from the game's angle. Beams, tracers, tethers.
const beams = makePool(
  () => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), additive(BAND_TEX));
    mesh.renderOrder = RENDER.beam;
    mesh.frustumCulled = false;
    scene.add(mesh);
    return { mesh, life: 0, maxLife: 1, peak: 1, width: 1, taper: 0 };
  },
  (b, from, to, o) => {
    b.mesh.material.map = o.tex || BAND_TEX;
    b.mesh.material.color.setHex(o.color !== undefined ? o.color : 0xffffff);
    place(b.mesh, from, to, o.width || 0.2, o.lift || 0);
    b.width = o.width || 0.2;
    b.taper = o.taper || 0;
    b.peak = o.opacity !== undefined ? o.opacity : 1;
    b.mesh.material.opacity = b.peak;
    b.life = b.maxLife = o.life || 0.16;
  },
);

const _dir = new THREE.Vector3();

// Laid flat and turned in its own plane rather than aimed in three dimensions:
// everything the guns draw runs across the ground, and a quad that tilts with
// the muzzle reads as a fold from the game's camera.
export const layAngle = (dx, dz) => Math.atan2(-dz, dx);

function place(mesh, from, to, width, lift) {
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  mesh.position.set((from.x + to.x) / 2, (from.y + to.y) / 2 + lift, (from.z + to.z) / 2);
  mesh.scale.set(Math.hypot(dx, dz) || 1e-3, width, 1);
  mesh.rotation.set(-Math.PI / 2, 0, layAngle(dx, dz));
}

export function beam(from, to, o = {}) { return beams.spawn(from, to, o); }

// Two passes, wide and dim under narrow and white: one quad reads as a strip of
// colour, two read as light.
export function bolt(from, to, o = {}) {
  const width = o.width || 0.3;
  beams.spawn(from, to, { ...o, width, opacity: (o.opacity || 1) * 0.65 });
  beams.spawn(from, to, {
    ...o, width: width * (o.coreWidth || 0.34),
    color: o.core !== undefined ? o.core : 0xffffff,
    life: (o.life || 0.16) * 0.8,
  });
}

function stepBeams(dt) {
  for (let i = beams.live.length - 1; i >= 0; i--) {
    const b = beams.live[i];
    b.life -= dt;
    const t = Math.max(0, b.life / b.maxLife);
    b.mesh.material.opacity = b.peak * Math.pow(t, 0.7);
    if (b.taper) b.mesh.scale.y = b.width * (1 - b.taper * (1 - t));
    if (b.life <= 0) beams.release(i);
  }
}

// A blob of light in the air: a charge on a barrel, a core about to go off, a
// dart's head. Billboards, so it holds its shape from the game's camera.
const orbs = makePool(
  () => {
    const mesh = new THREE.Mesh(GEO.splat, additive(GLOW_TEX));
    mesh.renderOrder = RENDER.glow;
    scene.add(mesh);
    return { mesh, life: 0, maxLife: 1, peak: 1, from: 1, to: 1,
             vel: new THREE.Vector3(), drag: 0, hold: false };
  },
  (o, pos, size, opt) => {
    o.mesh.material.map = opt.tex || GLOW_TEX;
    o.mesh.material.color.setHex(opt.color !== undefined ? opt.color : 0xffffff);
    o.mesh.position.copy(pos);
    o.from = size * (opt.from !== undefined ? opt.from : 1);
    o.to = size * (opt.to !== undefined ? opt.to : 1);
    o.mesh.scale.setScalar(o.from);
    o.peak = opt.opacity !== undefined ? opt.opacity : 1;
    o.mesh.material.opacity = o.peak;
    if (opt.vel) o.vel.copy(opt.vel); else o.vel.set(0, 0, 0);
    o.drag = opt.drag || 0;
    o.hold = !!opt.hold;
    o.life = o.maxLife = opt.life || 0.3;
  },
);

export function orb(pos, size, o = {}) { return orbs.spawn(pos, size, o); }

function stepOrbs(dt) {
  for (let i = orbs.live.length - 1; i >= 0; i--) {
    const o = orbs.live[i];
    if (!o.hold) o.life -= dt;
    const t = 1 - Math.max(0, o.life) / o.maxLife;
    if (o.drag) o.vel.multiplyScalar(Math.exp(-o.drag * dt));
    o.mesh.position.addScaledVector(o.vel, dt);
    o.mesh.quaternion.copy(camera.quaternion);
    o.mesh.scale.setScalar(o.from + (o.to - o.from) * ease.out(t));
    o.mesh.material.opacity = o.peak * Math.pow(Math.max(0, 1 - t), 1.3);
    if (o.life <= 0 && !o.hold) orbs.release(i);
  }
}

// Solid debris, lit rather than additive: shell fragments, casings, glass off a
// scorched floor. What tells the eye something physical happened.
const shards = makePool(
  () => {
    const mesh = new THREE.Mesh(GEO.spark, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    mesh.renderOrder = RENDER.band;
    scene.add(mesh);
    return { mesh, vel: new THREE.Vector3(), spin: new THREE.Vector3(),
             life: 0, maxLife: 1, gravity: 26, size: 1 };
  },
  (s, pos, o) => {
    s.mesh.material.color.setHex(o.color !== undefined ? o.color : 0xffd6a0);
    s.mesh.position.copy(pos);
    s.vel.copy(o.vel);
    s.spin.set((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 22,
               (Math.random() - 0.5) * 22);
    s.size = o.size || 1;
    s.mesh.scale.setScalar(s.size);
    s.gravity = o.gravity !== undefined ? o.gravity : 26;
    s.life = s.maxLife = o.life || 0.5;
  },
);

export function shard(pos, o) { return shards.spawn(pos, o); }

export function burst(pos, n, o = {}) {
  const speed = o.speed || 8;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const up = (o.rise !== undefined ? o.rise : 0.6) * (0.3 + Math.random());
    _dir.set(Math.cos(a), up, Math.sin(a)).multiplyScalar(speed * (0.5 + Math.random()));
    shards.spawn(pos, { ...o, vel: _dir, life: (o.life || 0.5) * (0.6 + Math.random() * 0.8) });
  }
}

function stepShards(dt) {
  for (let i = shards.live.length - 1; i >= 0; i--) {
    const s = shards.live[i];
    s.life -= dt;
    s.vel.y -= s.gravity * dt;
    s.mesh.position.addScaledVector(s.vel, dt);
    if (s.mesh.position.y < 0.05) { s.mesh.position.y = 0.05; s.vel.set(0, 0, 0); }
    s.mesh.rotation.x += s.spin.x * dt;
    s.mesh.rotation.y += s.spin.y * dt;
    s.mesh.rotation.z += s.spin.z * dt;
    s.mesh.scale.setScalar(s.size * Math.max(0.15, s.life / s.maxLife));
    if (s.life <= 0) shards.release(i);
  }
}

// Smoke and vapour, borrowed from the blast's own puffs so a module's exhaust
// belongs to the same weather as a grenade's.
const puffs = makePool(
  () => {
    const mesh = new THREE.Mesh(GEO.splat, new THREE.MeshBasicMaterial({
      map: PUFF_TEX[0], transparent: true, depthWrite: false, depthTest: false,
      side: THREE.DoubleSide,
    }));
    mesh.renderOrder = RENDER.band;
    scene.add(mesh);
    return { mesh, vel: new THREE.Vector3(), life: 0, maxLife: 1,
             from: 1, to: 2, peak: 1, roll: 0, spin: 0 };
  },
  (p, pos, size, o) => {
    p.mesh.material.map = PUFF_TEX[(Math.random() * PUFF_TEX.length) | 0];
    p.mesh.material.blending = o.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
    p.mesh.material.color.setHex(o.color !== undefined ? o.color : 0x8b8f94);
    p.mesh.position.copy(pos);
    if (o.vel) p.vel.copy(o.vel); else p.vel.set(0, 0, 0);
    p.from = size;
    p.to = size * (o.grow !== undefined ? o.grow : 2.2);
    p.peak = o.opacity !== undefined ? o.opacity : 0.5;
    p.roll = Math.random() * Math.PI * 2;
    p.spin = (Math.random() - 0.5) * 2.2;
    p.life = p.maxLife = (o.life || 0.7) * (0.75 + Math.random() * 0.5);
    p.mesh.scale.setScalar(p.from);
    p.mesh.material.opacity = p.peak;
  },
);

export function puff(pos, size, o = {}) { return puffs.spawn(pos, size, o); }

function stepPuffs(dt) {
  for (let i = puffs.live.length - 1; i >= 0; i--) {
    const p = puffs.live[i];
    p.life -= dt;
    const t = 1 - Math.max(0, p.life) / p.maxLife;
    p.vel.multiplyScalar(Math.exp(-3.2 * dt));
    p.mesh.position.addScaledVector(p.vel, dt);
    p.roll += p.spin * dt;
    p.mesh.quaternion.copy(camera.quaternion);
    p.mesh.rotateZ(p.roll);
    p.mesh.scale.setScalar(p.from + (p.to - p.from) * ease.out(t));
    p.mesh.material.opacity = p.peak * Math.pow(Math.max(0, 1 - t), 1.5);
    if (p.life <= 0) puffs.release(i);
  }
}

export const TEX = { ZONE_TEX, GLOW_TEX, BAND_TEX, PUFF_TEX };

export function update(dt) {
  stepMarks(dt);
  stepBeams(dt);
  stepOrbs(dt);
  stepShards(dt);
  stepPuffs(dt);
}

export function clear() {
  marks.clear();
  beams.clear();
  orbs.clear();
  shards.clear();
  puffs.clear();
}
