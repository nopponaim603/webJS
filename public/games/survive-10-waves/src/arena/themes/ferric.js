import * as THREE from 'three';
import { rngFrom } from '../../core/rng.js';

export const THEME = {
  name: 'Ferric Plain',
  sky: {
    background: 0xc09173,
    hemiSky: 0xe8b78f,
    hemiGround: 0x4a3428,
    hemiIntensity: 0.45,
    sunColor: 0xffe6c8,
    sunIntensity: 3.2,
    exposure: 1.0,
  },
  sun: { elevation: 36, azimuth: 56, distance: 44 },
  ground: {
    texture: 'assets/themes/ferric/ground.jpg',
    normal: 'assets/themes/ferric/ground_normal.jpg',
    tileWorldSize: 32.4,
    bumpScale: 1.2,
    roughness: 0.97,
    tint: 0xffffff,
  },
  walls: {
    texture: 'assets/themes/ferric/wall.jpg',
    normalMap: 'assets/themes/ferric/wall_normal.jpg',
    roughnessMap: 'assets/themes/ferric/wall_rough.jpg',
    tileWorldSize: 4.0,
    normalStrength: 1.1,
    color: 0xe8d0bc,
  },
  scatter: {
    rockTexture: 'assets/themes/ferric/rock.jpg',
    rockNormal: 'assets/themes/ferric/rock_normal.jpg',
    tint: { grass: 0x8a6a52, moss: 0x6b5344, gravel: 0xa8836a, path: 0xffffff },
    opacity: { grass: 0.3, moss: 0.3, gravel: 0.7, path: 0.75 },
    regions: {
      count: 10, min: 22, max: 40, opacity: 0.24,
      tints: [0xb98a68, 0x6b5344, 0x9c6a4e],
    },
    tufts: { count: 0, min: 0.2, max: 0.4, color: 0x8a6a52 },
    rocks: { color: 0x8a6b58 },
    boulders: { color: 0x7d6050 },
    clouds: {
      enabled: true, tileWorldSize: 150, strength: 0.14,
      color: 0x6b4636, wind: [4.0, 2.2], y: 0.09,
    },
  },
};

const WIND = Math.atan2(2.2, 4.0);

export function patchTexture(seed, kind) {
  const SZ = 256, R = SZ / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = SZ;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  const harmonics = [1, 2, 3, 5].map((k) => ({
    k, amp: 0.32 * (0.3 + rnd() * 0.7), ph: rnd() * Math.PI * 2,
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

  const grains = kind === 'gravel' ? 340 : 220;
  for (let i = 0; i < grains; i++) {
    const a = rnd() * Math.PI * 2, d = radius(a) * Math.sqrt(rnd()) * 0.92;
    const x = R + Math.cos(a) * d, y = R + Math.sin(a) * d;
    const rr = SZ * (kind === 'gravel' ? 0.004 + rnd() * 0.014 : 0.003 + rnd() * 0.008);
    g.fillStyle = `rgba(255,255,255,${0.35 + rnd() * 0.5})`;
    g.beginPath();
    g.ellipse(x, y, rr * 1.6, rr, WIND, 0, Math.PI * 2);
    g.fill();
  }

  if (g.filter !== undefined) {
    g.filter = 'blur(5px)';
    g.drawImage(cv, 0, 0);
    g.filter = 'none';
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Nothing grows here, but the tuft layer is still asked for its alpha map.
export function bladeTexture(seed) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 8;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

// A soft lens, darker along its spine: a dust tail sitting in the lee of a stone.
function streakTexture(seed) {
  const W = 256, H = 64;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  const across = g.createLinearGradient(0, 0, 0, H);
  across.addColorStop(0.0, 'rgba(255,255,255,0)');
  across.addColorStop(0.5, 'rgba(255,255,255,1)');
  across.addColorStop(1.0, 'rgba(255,255,255,0)');
  g.fillStyle = across;
  g.fillRect(0, 0, W, H);

  const along = g.createLinearGradient(0, 0, W, 0);
  along.addColorStop(0.0, 'rgba(0,0,0,0)');
  along.addColorStop(0.12, 'rgba(0,0,0,0.85)');
  along.addColorStop(1.0, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-in';
  g.fillStyle = along;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';

  for (let i = 0; i < 7; i++) {
    const y = H * (0.3 + rnd() * 0.4);
    g.strokeStyle = `rgba(255,255,255,${0.1 + rnd() * 0.2})`;
    g.lineWidth = 1 + rnd() * 2.5;
    g.beginPath();
    g.moveTo(W * rnd() * 0.3, y);
    g.lineTo(W, y + (rnd() - 0.5) * H * 0.2);
    g.stroke();
  }

  if (g.filter !== undefined) {
    g.filter = 'blur(3px)';
    g.drawImage(cv, 0, 0);
    g.filter = 'none';
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

function plateTexture(seed) {
  const SZ = 256, R = SZ / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = SZ;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  const n = 6 + ((rnd() * 4) | 0);
  g.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = R * (0.55 + rnd() * 0.35);
    const x = R + Math.cos(a) * rr, y = R + Math.sin(a) * rr;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
  g.fillStyle = 'rgba(255,255,255,0.95)';
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.4)';
  g.lineWidth = 10;
  g.stroke();

  if (g.filter !== undefined) {
    g.filter = 'blur(3px)';
    g.drawImage(cv, 0, 0);
    g.filter = 'none';
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

function ringTexture(seed) {
  const SZ = 256, R = SZ / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = SZ;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  const grad = g.createRadialGradient(R, R, R * 0.1, R, R, R);
  grad.addColorStop(0.00, 'rgba(255,255,255,0.30)');
  grad.addColorStop(0.62, 'rgba(255,255,255,0.10)');
  grad.addColorStop(0.80, 'rgba(255,255,255,0.95)');
  grad.addColorStop(1.00, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.beginPath();
  g.arc(R, R, R, 0, Math.PI * 2);
  g.fill();

  g.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 40; i++) {
    const a = rnd() * Math.PI * 2, d = R * (0.7 + rnd() * 0.3);
    g.beginPath();
    g.arc(R + Math.cos(a) * d, R + Math.sin(a) * d, R * (0.03 + rnd() * 0.07), 0, Math.PI * 2);
    g.fill();
  }
  g.globalCompositeOperation = 'source-over';

  if (g.filter !== undefined) {
    g.filter = 'blur(3px)';
    g.drawImage(cv, 0, 0);
    g.filter = 'none';
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

function decals({ scene, rnd, free, clip, arenaMax }, spec) {
  const mat = clip(new THREE.MeshLambertMaterial({
    alphaMap: spec.alphaMap, color: spec.color,
    transparent: true, opacity: spec.opacity,
    depthWrite: false, side: THREE.DoubleSide,
  }));
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 2), mat, spec.count);
  mesh.receiveShadow = true;
  mesh.renderOrder = spec.renderOrder;

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
  let placed = 0;
  for (let guard = 0; placed < spec.count && guard < spec.count * 20; guard++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * arenaMax;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const r = spec.min + rnd() * (spec.max - spec.min);
    const aspect = spec.aspect ? spec.aspect[0] + rnd() * spec.aspect[1] : 1;
    if (!free(x, z, r * aspect * 0.6)) continue;
    e.set(-Math.PI / 2, 0, spec.aligned ? -WIND + (rnd() - 0.5) * 0.14 : rnd() * Math.PI * 2);
    q.setFromEuler(e);
    p.set(x, spec.y, z);
    s.set(r * aspect, r, 1);
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

const DEVILS = 3;
const DEVIL_SPEED = 3.4;

let devils = null;

function columnTexture(seed) {
  const W = 64, H = 256;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  for (let y = 0; y < H; y += 2) {
    const t = y / H;
    const wob = Math.sin(t * 7 + rnd() * 0.2) * W * 0.06;
    const half = W * (0.42 - t * 0.26) + wob;
    const alpha = (1 - t) * (1 - t) * 0.75 * (t < 0.06 ? t / 0.06 : 1);
    g.fillStyle = `rgba(255,255,255,${alpha})`;
    g.fillRect(W / 2 - half, H - y - 2, half * 2, 2);
  }

  if (g.filter !== undefined) {
    g.filter = 'blur(5px)';
    g.drawImage(cv, 0, 0);
    g.filter = 'none';
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

// Unlit on purpose: a translucent column has no surface to shade, and a basic
// material is also immune to the normal skew a stretched instance would cause.
function dustDevils({ scene, rnd, clip, arenaMax, seed }) {
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.translate(0, 0.5, 0);
  const mat = clip(new THREE.MeshBasicMaterial({
    alphaMap: columnTexture(seed + 53), color: 0xc9a184,
    transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide,
  }));
  const mesh = new THREE.InstancedMesh(geo, mat, DEVILS * 2);
  mesh.renderOrder = -1;
  mesh.frustumCulled = false;

  const at = new Float32Array(DEVILS * 3);
  for (let i = 0; i < DEVILS; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * arenaMax;
    at[i * 3] = Math.cos(a) * d;
    at[i * 3 + 1] = Math.sin(a) * d;
    at[i * 3 + 2] = 5 + rnd() * 4;
  }
  scene.add(mesh);
  devils = { mesh, at, span: arenaMax, spin: 0 };
  return mesh;
}

export function features(ctx) {
  devils = null;
  const streaks = decals(ctx, {
    alphaMap: streakTexture(ctx.seed + 11), count: 180, min: 1.4, max: 3.2,
    aspect: [6, 2], color: 0x6b4a36, opacity: 0.4, y: 0.012,
    renderOrder: -4, aligned: true,
  });
  const plates = decals(ctx, {
    alphaMap: plateTexture(ctx.seed + 23), count: 110, min: 1.8, max: 4.6,
    color: 0x574a44, opacity: 0.55, y: 0.018, renderOrder: -1,
  });
  const craters = decals(ctx, {
    alphaMap: ringTexture(ctx.seed + 37), count: 40, min: 2.2, max: 6.5,
    color: 0xd0a686, opacity: 0.34, y: 0.015, renderOrder: -4,
  });
  return [streaks, plates, craters, dustDevils(ctx)];
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

// Two crossed sheets per devil so it holds up as the camera turns, and each one
// is folded back in at the far side rather than respawned.
export function update(dt) {
  if (!devils) return;
  const { mesh, at, span } = devils;
  devils.spin += dt * 1.1;
  const dx = Math.cos(WIND) * DEVIL_SPEED * dt, dz = Math.sin(WIND) * DEVIL_SPEED * dt;
  for (let i = 0; i < DEVILS; i++) {
    let x = at[i * 3] + dx, z = at[i * 3 + 1] + dz;
    if (Math.hypot(x, z) > span) { x = -x; z = -z; }
    at[i * 3] = x;
    at[i * 3 + 1] = z;
    const h = at[i * 3 + 2];
    for (let k = 0; k < 2; k++) {
      _e.set(0, devils.spin + i * 2.1 + k * Math.PI / 2, 0);
      _q.setFromEuler(_e);
      _p.set(x, 0, z);
      _s.set(h * 0.42, h, 1);
      mesh.setMatrixAt(i * 2 + k, _m.compose(_p, _q, _s));
    }
  }
  mesh.instanceMatrix.needsUpdate = true;
}
