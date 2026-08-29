import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene, camera, renderer } from '../engine/view.js';
import { makePool } from '../core/pool.js';
import { GEO, GLOW_TEX, PUFF_TEX, SCORCH_TEX } from './textures.js';
import { gibs, addSplat } from './spatter.js';

// Fixed, and never hidden: three.js bakes the light count into every material's
// shader, so a light going invisible recompiles the whole scene. Idle ones sit
// at zero intensity instead.
const LIGHT_POOL = 4;
const lights = [];
for (let i = 0; i < LIGHT_POOL; i++) {
  const l = new THREE.PointLight(0xffffff, 0, 20, 2);
  scene.add(l);
  lights.push({ light: l, held: false, life: 0, maxLife: 0, peak: 0 });
}

const idle = (e) => !e.held && e.life <= 0;

// keepFree is how many lights the caller leaves for everyone else: a holder that
// keeps one for seconds at a time must not take the last of four.
export function claimLight(keepFree = 0) {
  if (lights.filter(idle).length <= keepFree) return -1;
  for (let i = 0; i < lights.length; i++) {
    if (idle(lights[i])) { lights[i].held = true; return i; }
  }
  return -1;
}

export function moveLight(i, pos, color, intensity, distance) {
  if (i < 0 || !lights[i] || !lights[i].held) return;
  const l = lights[i].light;
  l.position.copy(pos);
  l.color.setHex(color);
  l.intensity = intensity;
  l.distance = distance;
}

export function releaseLight(i) {
  if (i < 0 || !lights[i]) return;
  lights[i].held = false;
  lights[i].light.intensity = 0;
}

// A held light is off limits: writing a decay into one leaves the holder to
// overwrite the flash, then fire it late when the light is handed back.
function flashLight(pos, color, intensity, life, distance) {
  let idx = -1, worst = Infinity;
  for (let i = 0; i < lights.length; i++) {
    if (lights[i].held) continue;
    const score = lights[i].life;
    if (score < worst) { worst = score; idx = i; }
  }
  if (idx < 0) return;
  const e = lights[idx];
  e.light.position.copy(pos);
  e.light.color.setHex(color);
  e.light.distance = distance;
  e.light.intensity = intensity;
  e.peak = intensity;
  e.life = e.maxLife = life;
}

function updateLights(dt) {
  for (const e of lights) {
    if (e.held || e.life <= 0) continue;
    e.life -= dt;
    const t = Math.max(0, e.life / e.maxLife);

    e.light.intensity = e.peak * t * t;
    if (e.life <= 0) e.light.intensity = 0;
  }
}

const flashes = makePool(
  () => {
    const mk = (order) => {
      const m = new THREE.Mesh(GEO.splat, new THREE.MeshBasicMaterial({
        map: GLOW_TEX, transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, depthTest: false, side: THREE.DoubleSide,
      }));
      m.rotation.x = -Math.PI / 2;
      m.renderOrder = order;
      return m;
    };
    const mesh = new THREE.Group();
    const halo = mk(4), core = mk(5);
    mesh.add(halo, core);
    scene.add(mesh);
    return { mesh, halo, core, at: new THREE.Vector3(), scorched: false,
             life: 0, maxLife: 1, radius: 1 };
  },
  (f, pos, radius) => {
    const F = CFG.grenade.flash;
    f.mesh.position.set(pos.x, 0.1, pos.z);
    f.at.copy(pos);
    f.scorched = false;
    f.halo.material.color.setHex(F.color);
    f.core.material.color.setHex(F.core.color);
    f.halo.material.opacity = f.core.material.opacity = 1;

    f.halo.scale.setScalar(radius * F.from);
    f.core.scale.setScalar(radius * F.core.from);
    f.radius = radius;
    f.life = f.maxLife = F.life;
  },
);

// A blast is meant to be seen through whatever is in front of it, so its puffs
// ignore depth and light both. Dust kicked up by something walking belongs to
// the ground it came off: it is lit, it takes shadow, and the body that threw it
// stands in front of it.
function makePuffPool(additive, grounded = false) {
  return makePool(
    () => {
      const shared = { map: PUFF_TEX[0], transparent: true, depthWrite: false,
                       side: THREE.DoubleSide };
      const mesh = new THREE.Mesh(GEO.splat, grounded
        ? new THREE.MeshLambertMaterial(shared)
        : new THREE.MeshBasicMaterial({ ...shared, depthTest: false,
            blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
      // A blast puff lies flat on the floor like a decal. Dust stands up and
      // turns with the camera, so it reads as a cloud the boss walks out of
      // rather than a mark under its belly the body then hides. It draws over
      // the stains as well: dust is off the floor, and a scorch is on it.
      if (!grounded) mesh.rotation.x = -Math.PI / 2;
      mesh.receiveShadow = grounded;
      mesh.renderOrder = grounded ? 2 : (additive ? 6 : 5);
      scene.add(mesh);
      return { mesh, vel: new THREE.Vector3(), life: 0, maxLife: 1,
               size: 1, grow: 1, spin: 0, peak: 1, rise: 0,
               roll: 0, billboard: grounded };
    },
    (p, pos, dir, C, radius) => {
      p.mesh.material.map = PUFF_TEX[(Math.random() * PUFF_TEX.length) | 0];
      p.mesh.position.set(pos.x + dir.x * radius * 0.25, C.y,
                          pos.z + dir.z * radius * 0.25);
      p.vel.set(dir.x * C.speed * (0.7 + Math.random() * 0.6), C.rise || 0,
                dir.z * C.speed * (0.7 + Math.random() * 0.6));
      p.size = radius * C.size * (0.7 + Math.random() * 0.6);
      p.grow = C.grow;
      p.spin = (Math.random() - 0.5) * 2.4;
      p.peak = C.opacity !== undefined ? C.opacity * (0.7 + Math.random() * 0.5) : 1;
      p.life = p.maxLife = C.life * (0.75 + Math.random() * 0.5);
      p.mesh.material.color.setHex(C.hot !== undefined ? C.hot : C.color);
      p.mesh.material.opacity = p.peak;
      p.mesh.scale.setScalar(p.size);
      p.roll = Math.random() * Math.PI * 2;
      if (!p.billboard) p.mesh.rotation.z = p.roll;
    },
  );
}

const firePuffs = makePuffPool(true);
export const smokePuffs = makePuffPool(false);
export const dustPuffs = makePuffPool(false, true);

const _hot = new THREE.Color();
const _cool = new THREE.Color();

function updatePuffs(pool, dt, C, cools) {
  for (let i = pool.live.length - 1; i >= 0; i--) {
    const p = pool.live[i];
    p.life -= dt;
    const t = 1 - Math.max(0, p.life) / p.maxLife;

    p.vel.multiplyScalar(Math.exp(-4.5 * dt));
    p.mesh.position.addScaledVector(p.vel, dt);
    p.roll += p.spin * dt;
    if (p.billboard) {
      p.mesh.quaternion.copy(camera.quaternion);
      p.mesh.rotateZ(p.roll);
    } else {
      p.mesh.rotation.z = p.roll;
    }
    p.mesh.scale.setScalar(p.size * (1 + (p.grow - 1) * (1 - Math.pow(1 - t, 2))));
    p.mesh.material.opacity = p.peak * Math.pow(Math.max(0, 1 - t), cools ? 1.6 : 1.1);
    if (cools) {
      _hot.setHex(C.hot); _cool.setHex(C.cool);
      p.mesh.material.color.copy(_hot).lerp(_cool, Math.min(1, t * 1.5));
    }
    if (p.life <= 0) pool.release(i);
  }
}

export function ember(pos) {
  const T = CFG.grenade.trail;
  const g = gibs.spawn(pos, T.color, 0.08, GEO.spark);

  g.vel.set((Math.random() - 0.5) * T.drift, Math.random() * T.drift * 0.6,
            (Math.random() - 0.5) * T.drift);
  g.life = T.life * (0.7 + Math.random() * 0.6);
  g.mesh.scale.setScalar(0.55 + Math.random() * 0.5);
  return g;
}

const _pdir = new THREE.Vector3();

export function explosion(pos, radius) {
  flashes.spawn(pos, radius);

  const P = CFG.grenade.puffs;
  for (const [C, pool, n] of [[P.fire, firePuffs, P.fire.count],
                              [P.smoke, smokePuffs, P.smoke.count]]) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (Math.random() - 0.5) * (Math.PI / n);
      _pdir.set(Math.cos(a), 0, Math.sin(a));
      pool.spawn(pos, _pdir, C, radius);
    }
  }
  const L = CFG.grenade.blastLight;
  flashLight(pos, L.color, L.intensity, L.life, L.distance);

  for (let i = 0; i < 22; i++) {
    const g = gibs.spawn(pos, i % 3 === 2 ? 0x3a3a3a : 0xffd6a0, 1.7, GEO.spark);
    g.life = 0.3 + Math.random() * 0.4;
  }
}

const bolts = makePool(
  () => {
    const n = CFG.chain.segments;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((n + 1) * 2 * 3), 3));

    const idx = [];
    for (let i = 0; i < n; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    geo.setIndex(idx);
    const mat = new THREE.MeshBasicMaterial({
      color: CFG.chain.color, transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 4;
    scene.add(mesh);
    return { mesh, life: 0, maxLife: 0 };
  },
  (b, from, to, scale = 1, look = null) => {
    const C = CFG.chain;
    const B = look || C;
    const pos = b.mesh.geometry.attributes.position;
    const n = C.segments;

    const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
    const len = Math.hypot(dx, dz) || 1;
    const px = -dz / len, pz = dx / len;

    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const end = i === 0 || i === n;

      const off = end ? 0 : (Math.random() * 2 - 1) * B.jitter;
      const cx = from.x + dx * t + px * off;
      const cy = from.y + dy * t + (end ? 0 : (Math.random() - 0.5) * B.jitter);
      const cz = from.z + dz * t + pz * off;

      const w = B.width * scale * Math.sin(Math.PI * t) ** 0.45 / 2;
      pos.setXYZ(i * 2, cx + px * w, cy, cz + pz * w);
      pos.setXYZ(i * 2 + 1, cx - px * w, cy, cz - pz * w);
    }
    pos.needsUpdate = true;
    b.mesh.material.color.setHex(B.color);
    b.mesh.material.opacity = 1;
    b.life = b.maxLife = B.life;
  },
);

export function lightning(from, to) {
  bolts.spawn(from, to);
  bolts.spawn(from, to, 0.55);
}

// The drone's arc is a beam, not a bolt: no jitter, and a white core inside the
// wider glow, so it lands as a line of light drawn between two bugs.
export function zap(from, to) {
  const Z = CFG.chain.beam;
  bolts.spawn(from, to, 1, Z);
  bolts.spawn(from, to, Z.coreWidth, { ...Z, color: Z.core });
}

export function update(dt) {
  updateLights(dt);

  for (let i = flashes.live.length - 1; i >= 0; i--) {
    const f = flashes.live[i];
    f.life -= dt;
    const t = 1 - Math.max(0, f.life) / f.maxLife;
    const F = CFG.grenade.flash;

    const e = 1 - Math.pow(1 - t, 3);
    f.halo.scale.setScalar(f.radius * (F.from + (F.scale - F.from) * e));
    f.core.scale.setScalar(f.radius * (F.core.from + (F.core.scale - F.core.from) * e));

    f.halo.material.opacity = t < 0.2 ? 1 : Math.max(0, 1 - (t - 0.2) / 0.8) ** 1.6;

    const ct = Math.min(1, (t * F.life) / F.core.life);
    f.core.material.opacity = ct < 0.35 ? 1 : Math.max(0, 1 - (ct - 0.35) / 0.65) ** 1.4;

    if (!f.scorched && t > 0.45) {
      f.scorched = true;

      addSplat(f.at, f.radius * 1.5, 0x241c16, 9, 0.5, SCORCH_TEX);
    }
    if (f.life <= 0) flashes.release(i);
  }

  updatePuffs(firePuffs, dt, CFG.grenade.puffs.fire, true);
  updatePuffs(smokePuffs, dt, CFG.grenade.puffs.smoke, false);
  updatePuffs(dustPuffs, dt, null, false);

  for (let i = bolts.live.length - 1; i >= 0; i--) {
    const b = bolts.live[i];
    b.life -= dt;

    b.mesh.material.opacity = Math.max(0, b.life / b.maxLife) ** 0.6;
    if (b.life <= 0) bolts.release(i);
  }
}

export function clear() {
  bolts.clear();
  firePuffs.clear();
  smokePuffs.clear();
  dustPuffs.clear();
  flashes.clear();
}

const _warm = new THREE.Vector3(0, -80, 0);

// Compiling a blast material costs a dropped frame, so pay for it under the
// loading screen rather than on the first bomber.
export function warmup() {
  explosion(_warm, 1);
  lightning(_warm, _warm);
  dustPuffs.spawn(_warm, _warm, CFG.stomp.smoke, 1);
  addSplat(_warm, 1, 0x241c16, 0.01, 0, SCORCH_TEX);
  renderer.compile(scene, camera);
  clear();
  gibs.clear();
}
