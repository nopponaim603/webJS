import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene, camera, renderer } from '../engine/view.js';
import { makePool } from '../core/pool.js';
import { GEO, FLAME_TEX, GLOW_TEX } from './textures.js';
import { gibs } from './spatter.js';
import { claimLight, moveLight, releaseLight, smokePuffs } from './blast.js';
import { clip } from '../arena/clip.js';

const MAX_FLAMES = 260;
// Grenades in flight, blast flashes and the laser coil draw on the same lights.
const LIGHTS_KEPT_FREE = 2;

// One parcel of burning gas. The flame is the shape a crowd of them makes.
const flames = makePool(
  () => {
    const mesh = new THREE.Mesh(GEO.splat, clip(new THREE.MeshBasicMaterial({
      map: FLAME_TEX[0], transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide,
    })));
    mesh.renderOrder = 6;
    scene.add(mesh);
    return { mesh, vel: new THREE.Vector3(), size: 1, grow: 1, peak: 1, buoy: 0,
             roll: 0, spin: 0, wander: 0, swirl: 0, phase: 0,
             life: 0, maxLife: 1 };
  },
  (f, x, z, size, strength) => {
    const F = CFG.napalm.fire;
    f.mesh.material.map = FLAME_TEX[(Math.random() * FLAME_TEX.length) | 0];
    f.mesh.position.set(x, size * F.born * (0.5 + Math.random()), z);

    const out = Math.random() * Math.PI * 2;
    f.vel.set(Math.cos(out) * F.spread * size * Math.random(),
              F.rise * size * (0.75 + Math.random() * 0.5),
              Math.sin(out) * F.spread * size * Math.random());
    f.buoy = F.buoyancy * size;

    f.size = size * F.seed * (0.7 + Math.random() * 0.6);
    f.grow = F.grow * (0.8 + Math.random() * 0.4);
    f.peak = F.opacity * strength * (0.7 + Math.random() * 0.6);
    f.roll = Math.random() * Math.PI * 2;
    f.spin = (Math.random() - 0.5) * F.spin;
    f.wander = F.wander * size * (0.4 + Math.random());
    f.swirl = F.swirl * (0.7 + Math.random() * 0.6);
    f.phase = Math.random() * Math.PI * 2;
    f.life = f.maxLife = F.flameLife * (0.7 + Math.random() * 0.6);
  },
);

const _hot = new THREE.Color();
const _mid = new THREE.Color();
const _cool = new THREE.Color();

function updateFlames(dt) {
  const F = CFG.napalm.fire;
  _hot.setHex(F.hot);
  _mid.setHex(F.mid);
  _cool.setHex(F.cool);

  for (let i = flames.live.length - 1; i >= 0; i--) {
    const f = flames.live[i];
    f.life -= dt;
    const t = 1 - Math.max(0, f.life) / f.maxLife;

    // Driven while hot, giving up as it cools: this is what stretches the flame.
    f.vel.y += f.buoy * (1 - t) * dt;
    f.mesh.position.addScaledVector(f.vel, dt);
    const curl = Math.sin(f.phase + t * f.swirl) * f.wander * dt;
    f.mesh.position.x += Math.cos(f.phase) * curl;
    f.mesh.position.z += Math.sin(f.phase) * curl;

    f.mesh.scale.setScalar(f.size * (1 + (f.grow - 1) * (1 - (1 - t) ** 2)));
    // Turned whole, not yawed: a vertical quad is a cut-out from this camera.
    f.roll += f.spin * dt;
    f.mesh.quaternion.copy(camera.quaternion);
    f.mesh.rotateZ(f.roll);

    f.mesh.material.color.copy(_hot)
      .lerp(_mid, Math.min(1, t / F.ramp))
      .lerp(_cool, Math.max(0, (t - F.ramp) / (1 - F.ramp)) ** 0.8);
    f.mesh.material.opacity = f.peak
      * (t < 0.1 ? t / 0.1 : Math.max(0, 1 - (t - 0.1) / 0.9) ** F.fade);

    if (f.life <= 0) flames.release(i);
  }
}

const glows = makePool(
  () => {
    const mesh = new THREE.Mesh(GEO.splat, clip(new THREE.MeshBasicMaterial({
      map: GLOW_TEX, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide,
    })));
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 3;
    scene.add(mesh);
    return { mesh };
  },
  (g, x, z, radius) => {
    const F = CFG.napalm.fire;
    g.mesh.position.set(x, 0.05 + Math.random() * 0.01, z);
    g.mesh.material.color.setHex(F.glow.color);
    g.mesh.material.opacity = 0;
    g.mesh.scale.setScalar(radius * F.glow.size);
  },
);

const fires = [];

export function ignite(x, z, radius, life, heat = 1) {
  fires.push({ x, z, radius, life, heat, glow: glows.spawn(x, z, radius),
               lightIdx: claimLight(LIGHTS_KEPT_FREE),
               age: 0, flame: 0, ember: 0, smoke: 0 });
}

const _at = new THREE.Vector3();
const _drift = new THREE.Vector3();

function spot(a, out, reach) {
  const ang = Math.random() * Math.PI * 2;
  const outward = Math.sqrt(Math.random()) * reach;
  out.set(a.x + Math.cos(ang) * outward * a.radius, 0,
          a.z + Math.sin(ang) * outward * a.radius);
  return outward;
}

// A weak mix burns low: the pool covers the same ground, the flames over it are
// short until the module has been fed.
const heatScale = (a) => CFG.napalm.fire.small
  + (1 - CFG.napalm.fire.small) * (a.heat === undefined ? 1 : a.heat);

function spawnFlame(a, strength) {
  const F = CFG.napalm.fire;
  const outward = spot(a, _at, 0.94);
  const dome = 1 - 0.4 * outward ** 2;
  const size = a.radius * F.tall * dome * (0.6 + Math.random() * 0.7)
    * (0.55 + 0.45 * strength) * heatScale(a);

  // At the cap the oldest flame goes rather than the newest being dropped, the
  // way fx/spatter.js keeps its splats, so a fresh pool never lands dark.
  while (flames.live.length >= MAX_FLAMES) flames.release(0);
  flames.spawn(_at.x, _at.z, size, strength);
}

function emberFrom(a) {
  const F = CFG.napalm.fire;
  spot(a, _at, 0.85);
  _at.y = 0.15;
  const g = gibs.spawn(_at, F.ember, 0.12, GEO.spark);
  g.mesh.scale.setScalar(0.5 + Math.random() * 0.6);
  g.vel.set((Math.random() - 0.5) * 1.8, 6 + Math.random() * 4, (Math.random() - 0.5) * 1.8);
  g.life = 0.5 + Math.random() * 0.6;
}

function smokeFrom(a, strength) {
  const F = CFG.napalm.fire;
  spot(a, _at, 0.7);
  const ang = Math.random() * Math.PI * 2;
  _drift.set(Math.cos(ang), 0, Math.sin(ang));
  const p = smokePuffs.spawn(_at, _drift, F.smoke, a.radius);
  p.peak *= strength;
  p.mesh.material.opacity = p.peak;
}

const flicker = (t, a, b) => 0.76 + 0.24 * Math.sin(t * a) * Math.sin(t * b);

export function update(dt) {
  const F = CFG.napalm.fire;

  for (let i = fires.length - 1; i >= 0; i--) {
    const a = fires[i];
    a.age += dt;
    a.life -= dt;
    const strength = Math.min(1, a.age / F.fadeIn)
                   * Math.min(1, Math.max(0, a.life) / F.fadeOut);

    a.glow.mesh.material.opacity = F.glow.opacity * strength * flicker(a.age, 13.1, 7.7);

    if (a.lightIdx >= 0) {
      const L = F.light;
      _at.set(a.x, 0.7, a.z);
      moveLight(a.lightIdx, _at, L.color,
                L.intensity * strength * heatScale(a) * flicker(a.age, 17.3, 9.1),
                L.distance + a.radius * 2);
    }

    const every = Math.max(0.02, 1 / (F.flameRate * Math.PI * a.radius ** 2));
    a.flame -= dt;
    while (a.flame <= 0) {
      a.flame += every;
      if (strength > 0.05) spawnFlame(a, strength);
    }

    // Budgeted across the pools alight, so a cluster costs what one pool does,
    // and jittered so pools lit in the same frame do not stay in step.
    a.ember -= dt;
    while (a.ember <= 0) {
      a.ember += Math.max(0.02, F.emberEvery * fires.length) * (0.6 + Math.random() * 0.8);
      if (strength > 0.25) emberFrom(a);
    }

    a.smoke -= dt;
    while (a.smoke <= 0) {
      a.smoke += Math.max(0.05, F.smokeEvery * fires.length) * (0.6 + Math.random() * 0.8);
      if (strength > 0.25) smokeFrom(a, strength);
    }

    if (a.life <= 0) {
      releaseLight(a.lightIdx);
      glows.releaseObject(a.glow);
      fires[i] = fires[fires.length - 1];
      fires.pop();
    }
  }

  updateFlames(dt);
}

export function clear() {
  for (const a of fires) releaseLight(a.lightIdx);
  fires.length = 0;
  glows.clear();
  flames.clear();
}

const WARM_Z = -220;

// A flame material compiled on the first pool costs a dropped frame there, so it
// is paid for under the loading screen instead.
export function warmup() {
  ignite(0, WARM_Z, 2.5, 1);
  update(0.25);
  renderer.compile(scene, camera);
  clear();
  smokePuffs.clear();
  gibs.clear();
}
