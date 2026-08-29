import * as THREE from 'three';
import { rngFrom } from '../../core/rng.js';

export const THEME = {
  name: 'Hardpack Snow',
  sky: {
    background: 0xc8d6e2,
    hemiSky: 0xbcd6ff,
    hemiGround: 0x40566b,
    hemiIntensity: 0.7,
    sunColor: 0xdfeaff,
    sunIntensity: 2.6,
    exposure: 0.95,
  },
  sun: { elevation: 18, azimuth: 56, distance: 44 },
  ground: {
    texture: 'assets/themes/snowfield/ground.jpg',
    normal: 'assets/themes/snowfield/ground_normal.jpg',
    tileWorldSize: 32.4,
    bumpScale: 1.5,
    roughness: 0.88,
    tint: 0xffffff,
  },
  walls: {
    texture: 'assets/themes/snowfield/wall.jpg',
    normalMap: 'assets/themes/snowfield/wall_normal.jpg',
    roughnessMap: 'assets/themes/snowfield/wall_rough.jpg',
    tileWorldSize: 4.0,
    normalStrength: 1.0,
    color: 0xe8eef4,
  },
  scatter: {
    rockTexture: 'assets/themes/snowfield/rock.jpg',
    rockNormal: 'assets/themes/snowfield/rock_normal.jpg',
    tint: { grass: 0x8d8a6f, moss: 0x6e7566, gravel: 0xb9c1c7, path: 0xffffff },
    opacity: { grass: 0.45, moss: 0.35, gravel: 0.5, path: 0.65 },
    regions: {
      count: 10, min: 22, max: 40, opacity: 0.24,
      tints: [0xdfe7ee, 0xc3d2dd, 0xaebfcd],
    },
    tufts: { count: 1100, min: 0.22, max: 0.4, color: 0x8d8a6f },
    rocks: { color: 0xb8bfc4 },
    boulders: { color: 0xc4cad0 },
    clouds: {
      enabled: true, tileWorldSize: 150, strength: 0.35,
      color: 0x3b4d61, wind: [2.6, 1.4], y: 0.09,
    },
  },
};

const WIND = Math.atan2(1.4, 2.6);

export function patchTexture(seed, kind) {
  const SZ = 256, R = SZ / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = SZ;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  const harmonics = [1, 2, 3, 5].map((k) => ({
    k, amp: 0.26 * (0.3 + rnd() * 0.7), ph: rnd() * Math.PI * 2,
  }));
  const radius = (a) => {
    let r = 0.62;
    for (const h of harmonics) r += h.amp * Math.sin(a * h.k + h.ph);
    return R * Math.max(0.15, r);
  };

  g.beginPath();
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    g[i === 0 ? 'moveTo' : 'lineTo'](R + Math.cos(a) * radius(a), R + Math.sin(a) * radius(a));
  }
  g.closePath();
  g.fillStyle = kind === 'gravel' ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.14)';
  g.fill();

  if (kind === 'gravel') {
    for (let i = 0; i < 300; i++) {
      const a = rnd() * Math.PI * 2, d = radius(a) * Math.sqrt(rnd()) * 0.9;
      const x = R + Math.cos(a) * d, y = R + Math.sin(a) * d;
      const rr = SZ * (0.005 + rnd() * 0.014);
      g.fillStyle = `rgba(255,255,255,${0.45 + rnd() * 0.5})`;
      g.beginPath();
      g.ellipse(x, y, rr, rr * (0.6 + rnd() * 0.6), rnd() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
  } else {
    for (let i = 0; i < 260; i++) {
      const a = rnd() * Math.PI * 2, d = radius(a) * Math.sqrt(rnd()) * 0.95;
      const x = R + Math.cos(a) * d, y = R + Math.sin(a) * d;
      const len = SZ * (0.02 + rnd() * 0.05);
      const lean = WIND + (rnd() - 0.5) * 0.5;
      g.strokeStyle = `rgba(255,255,255,${0.3 + rnd() * 0.4})`;
      g.lineWidth = 1 + rnd() * 2.4;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(lean) * len, y + Math.sin(lean) * len);
      g.stroke();
    }
  }

  if (g.filter !== undefined) {
    g.filter = 'blur(6px)';
    g.drawImage(cv, 0, 0);
    g.filter = 'none';
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function bladeTexture(seed, blades = 8) {
  const W = 128, H = 128;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);
  for (let i = 0; i < blades; i++) {
    const x = W * (0.1 + rnd() * 0.8);
    const h = H * (0.35 + rnd() * 0.45);
    const bend = (rnd() - 0.5) * W * 0.75;
    const w = W * (0.014 + rnd() * 0.016);
    const broken = rnd() < 0.35;
    g.fillStyle = `rgba(255,255,255,${0.7 + rnd() * 0.3})`;
    g.beginPath();
    g.moveTo(x - w, H);
    g.quadraticCurveTo(x - w + bend * 0.15, H - h * 0.5, x + bend, H - h * (broken ? 0.7 : 1));
    g.quadraticCurveTo(x + w + bend * 0.15, H - h * 0.45, x + w, H);
    g.closePath();
    g.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

function softDisc(seed, stretch, rim) {
  const SZ = 128, R = SZ / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = SZ;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  const wob = [1, 2, 3].map((k) => ({ k, amp: 0.2 * rnd(), ph: rnd() * Math.PI * 2 }));
  const edge = (a) => {
    let r = 0.72;
    for (const h of wob) r += h.amp * Math.sin(a * h.k + h.ph);
    return R * Math.max(0.2, r);
  };
  g.beginPath();
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    g[i === 0 ? 'moveTo' : 'lineTo'](R + Math.cos(a) * edge(a) * stretch, R + Math.sin(a) * edge(a));
  }
  g.closePath();

  const grad = g.createRadialGradient(R, R, 0, R, R, R);
  grad.addColorStop(0, `rgba(255,255,255,${rim ? 0.45 : 0.9})`);
  grad.addColorStop(rim ? 0.72 : 0.6, `rgba(255,255,255,${rim ? 0.75 : 0.4})`);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fill();

  if (g.filter !== undefined) {
    g.filter = 'blur(4px)';
    g.drawImage(cv, 0, 0);
    g.filter = 'none';
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

function decals({ scene, rnd, free, clip, arenaMax, seed }, spec) {
  const geo = new THREE.PlaneGeometry(2, 2);
  const mat = clip(new THREE.MeshLambertMaterial({
    alphaMap: softDisc(seed + spec.salt, spec.stretch, spec.rim),
    color: spec.color, transparent: true, opacity: spec.opacity,
    depthWrite: false, side: THREE.DoubleSide,
  }));
  const mesh = new THREE.InstancedMesh(geo, mat, spec.count);
  mesh.receiveShadow = true;
  mesh.renderOrder = spec.renderOrder;

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
  let placed = 0;
  for (let guard = 0; placed < spec.count && guard < spec.count * 20; guard++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (arenaMax - 6);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const r = spec.min + rnd() * (spec.max - spec.min);
    if (!free(x, z, r * 0.5)) continue;
    e.set(-Math.PI / 2, 0, spec.aligned ? -WIND + (rnd() - 0.5) * 0.3 : rnd() * Math.PI * 2);
    q.setFromEuler(e);
    p.set(x, spec.y, z);
    s.set(r * spec.stretch, r, 1);
    mesh.setMatrixAt(placed, m.compose(p, q, s));
    const v = 0.85 + rnd() * 0.3;
    mesh.setColorAt(placed, col.setRGB(v, v, v));
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
  return mesh;
}

function reeds({ scene, rnd, free, onPath, clip, clipShadow, arenaMax, seed }) {
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.translate(0, 0.5, 0);
  const mat = clip(new THREE.MeshLambertMaterial({
    alphaMap: bladeTexture(seed + 91, 5), color: 0x6b6754,
    alphaTest: 0.4, side: THREE.DoubleSide, transparent: false,
  }));
  const mesh = new THREE.InstancedMesh(geo, mat, 220);
  mesh.castShadow = true;
  clipShadow(mesh);

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
  let placed = 0;
  for (let guard = 0; placed < 220 && guard < 6000; guard++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (arenaMax - 6);
    const cx = Math.cos(a) * d, cz = Math.sin(a) * d;
    if (!free(cx, cz, 1.5) || onPath(cx, cz)) continue;
    const clump = 3 + ((rnd() * 4) | 0);
    for (let k = 0; k < clump && placed < 220; k++) {
      const x = cx + (rnd() - 0.5) * 1.6, z = cz + (rnd() - 0.5) * 1.6;
      const h = 0.5 + rnd() * 0.55;
      e.set((rnd() - 0.5) * 0.25, rnd() * Math.PI, 0);
      q.setFromEuler(e);
      p.set(x, 0, z);
      s.set(h * 0.55, h, h * 0.55);
      mesh.setMatrixAt(placed, m.compose(p, q, s));
      const v = 0.8 + rnd() * 0.4;
      mesh.setColorAt(placed, col.setRGB(v, v, v));
      placed++;
    }
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
  return mesh;
}

const COUNT = 140;
const SPEED = 5.5;

let drift = null;

function spindrift({ scene, rnd, clip, arenaMax, seed }) {
  const mat = clip(new THREE.MeshBasicMaterial({
    map: softDisc(seed + 73, 5.5, false), color: 0xf4f9ff,
    transparent: true, opacity: 0.26, depthWrite: false, side: THREE.DoubleSide,
  }));
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 2), mat, COUNT);
  mesh.renderOrder = -1;
  mesh.frustumCulled = false;

  const at = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * arenaMax;
    at[i * 3] = Math.cos(a) * d;
    at[i * 3 + 1] = Math.sin(a) * d;
    at[i * 3 + 2] = 2.5 + rnd() * 5.5;
  }
  scene.add(mesh);
  drift = { mesh, at, span: arenaMax };
  return mesh;
}

export function features(ctx) {
  drift = null;
  const glare = decals(ctx, {
    salt: 41, count: 90, min: 2.4, max: 6.5, stretch: 1.25, rim: true,
    color: 0xf2f8ff, opacity: 0.4, y: 0.014, renderOrder: -4, aligned: false,
  });
  const streamers = decals(ctx, {
    salt: 57, count: 150, min: 3.0, max: 8.0, stretch: 4.2, rim: false,
    color: 0xeef4fa, opacity: 0.32, y: 0.02, renderOrder: -1, aligned: true,
  });
  return [glare, streamers, reeds(ctx), spindrift(ctx)];
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, -WIND));
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

// Blown across the arena and folded back in at the far side, so the field never
// empties and never needs respawning.
export function update(dt) {
  if (!drift) return;
  const { mesh, at, span } = drift;
  const dx = Math.cos(WIND) * SPEED * dt, dz = Math.sin(WIND) * SPEED * dt;
  for (let i = 0; i < COUNT; i++) {
    let x = at[i * 3] + dx, z = at[i * 3 + 1] + dz;
    if (Math.hypot(x, z) > span) { x = -x; z = -z; }
    at[i * 3] = x;
    at[i * 3 + 1] = z;
    _p.set(x, 0.05, z);
    _s.set(at[i * 3 + 2], at[i * 3 + 2] * 0.22, 1);
    mesh.setMatrixAt(i, _m.compose(_p, _q, _s));
  }
  mesh.instanceMatrix.needsUpdate = true;
}
