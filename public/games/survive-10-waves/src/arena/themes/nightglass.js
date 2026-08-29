import * as THREE from 'three';
import { rngFrom } from '../../core/rng.js';

export const THEME = {
  name: 'Nightglass',
  sky: {
    background: 0x141a22,
    hemiSky: 0x5a6e94,
    hemiGround: 0x0e1218,
    hemiIntensity: 0.55,
    sunColor: 0xc8d8ff,
    sunIntensity: 1.8,
    exposure: 1.25,
  },
  sun: { elevation: 52, azimuth: 56, distance: 44 },
  ground: {
    texture: 'assets/themes/nightglass/ground.jpg',
    normal: 'assets/themes/nightglass/ground_normal.jpg',
    tileWorldSize: 32.4,
    bumpScale: 1.3,
    roughness: 0.72,
    tint: 0xffffff,
  },
  walls: {
    texture: 'assets/themes/nightglass/wall.jpg',
    normalMap: 'assets/themes/nightglass/wall_normal.jpg',
    roughnessMap: 'assets/themes/nightglass/wall_rough.jpg',
    tileWorldSize: 4.0,
    normalStrength: 1.1,
    color: 0xbcc8d8,
  },
  scatter: {
    rockTexture: 'assets/themes/nightglass/rock.jpg',
    rockNormal: 'assets/themes/nightglass/rock_normal.jpg',
    tint: { grass: 0x5e6a5e, moss: 0x46524a, gravel: 0x8a9086, path: 0xffffff },
    opacity: { grass: 0.5, moss: 0.55, gravel: 0.6, path: 0.7 },
    regions: {
      count: 10, min: 22, max: 40, opacity: 0.26,
      tints: [0x8a9086, 0x22262c, 0x4a5058],
    },
    tufts: { count: 1000, min: 0.2, max: 0.4, color: 0x5e6a5e },
    rocks: { color: 0x5a6068 },
    boulders: { color: 0x4e545c },
    clouds: {
      enabled: true, tileWorldSize: 150, strength: 0.3,
      color: 0x080c12, wind: [1.8, 1.0], y: 0.09,
    },
  },
};

// Ragged at the margin and blotchy inside: crustose lichen creeps outward from
// a hold rather than spreading evenly.
function crustTexture(seed, blots = 26) {
  const SZ = 256, R = SZ / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = SZ;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  for (let i = 0; i < blots; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * R * 0.62;
    const x = R + Math.cos(a) * d, y = R + Math.sin(a) * d;
    const rr = R * (0.09 + rnd() * 0.2);
    const grad = g.createRadialGradient(x, y, 0, x, y, rr);
    const k = 0.5 + rnd() * 0.5;
    grad.addColorStop(0, `rgba(255,255,255,${k})`);
    grad.addColorStop(0.6, `rgba(255,255,255,${k * 0.55})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.arc(x, y, rr, 0, Math.PI * 2);
    g.fill();
  }

  for (let i = 0; i < 180; i++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * R * 0.8;
    const x = R + Math.cos(a) * d, y = R + Math.sin(a) * d;
    const rr = SZ * (0.004 + rnd() * 0.012);
    g.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.45})`;
    g.beginPath();
    g.arc(x, y, rr, 0, Math.PI * 2);
    g.fill();
  }

  if (g.filter !== undefined) {
    g.filter = 'blur(4px)';
    g.drawImage(cv, 0, 0);
    g.filter = 'none';
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

export function patchTexture(seed, kind) {
  const SZ = 256, R = SZ / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = SZ;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  const harmonics = [1, 2, 3, 5].map((k) => ({
    k, amp: 0.28 * (0.3 + rnd() * 0.7), ph: rnd() * Math.PI * 2,
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
  g.fillStyle = kind === 'gravel' ? 'rgba(255,255,255,0.26)' : 'rgba(255,255,255,0.18)';
  g.fill();

  if (kind === 'gravel') {
    for (let i = 0; i < 300; i++) {
      const a = rnd() * Math.PI * 2, d = radius(a) * Math.sqrt(rnd()) * 0.9;
      const x = R + Math.cos(a) * d, y = R + Math.sin(a) * d;
      const rr = SZ * (0.005 + rnd() * 0.016);
      g.fillStyle = `rgba(255,255,255,${0.45 + rnd() * 0.5})`;
      g.beginPath();
      g.ellipse(x, y, rr, rr * (0.55 + rnd() * 0.6), rnd() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
  } else {
    for (let i = 0; i < 240; i++) {
      const a = rnd() * Math.PI * 2, d = radius(a) * Math.sqrt(rnd()) * 0.92;
      const x = R + Math.cos(a) * d, y = R + Math.sin(a) * d;
      const rr = SZ * (0.008 + rnd() * 0.026);
      g.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.4})`;
      g.beginPath();
      g.arc(x, y, rr, 0, Math.PI * 2);
      g.fill();
    }
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

export function bladeTexture(seed, blades = 9) {
  const W = 128, H = 128;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);
  for (let i = 0; i < blades; i++) {
    const x = W * (0.1 + rnd() * 0.8);
    const h = H * (0.35 + rnd() * 0.4);
    const lean = (rnd() - 0.5) * W * 0.4;
    const w = W * (0.014 + rnd() * 0.018);
    g.fillStyle = `rgba(255,255,255,${0.7 + rnd() * 0.3})`;
    g.beginPath();
    g.moveTo(x - w, H);
    g.quadraticCurveTo(x - w + lean * 0.2, H - h * 0.55, x + lean, H - h);
    g.quadraticCurveTo(x + w + lean * 0.2, H - h * 0.5, x + w, H);
    g.closePath();
    g.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

function decals({ scene, rnd, free, clip, arenaMax, seed }, spec) {
  const mat = clip(new THREE.MeshLambertMaterial({
    alphaMap: crustTexture(seed + spec.salt, spec.blots),
    color: spec.color, transparent: true, opacity: spec.opacity,
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
    if (!free(x, z, r * 0.6)) continue;
    e.set(-Math.PI / 2, 0, rnd() * Math.PI * 2);
    q.setFromEuler(e);
    p.set(x, spec.y, z);
    const wide = 0.8 + rnd() * 0.5;
    s.set(r * wide, r / wide, 1);
    mesh.setMatrixAt(placed, m.compose(p, q, s));
    const v = 0.82 + rnd() * 0.36;
    mesh.setColorAt(placed, col.setRGB(v, v, v));
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
  return mesh;
}

// Flat flakes, tilted just off level: what reads from above is the hard line of
// moonlight along one edge, not the flake itself.
function shards({ scene, rnd, free, clip, clipShadow, arenaMax }) {
  const geo = new THREE.CircleGeometry(1, 5);
  geo.rotateX(-Math.PI / 2);
  const mat = clip(new THREE.MeshStandardMaterial({
    color: 0x8fa2b8, roughness: 0.18, metalness: 0.1, flatShading: true,
    side: THREE.DoubleSide,
  }));
  const mesh = new THREE.InstancedMesh(geo, mat, 300);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  clipShadow(mesh);

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
  let placed = 0;
  for (let guard = 0; placed < 300 && guard < 6000; guard++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * arenaMax;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const r = 0.12 + rnd() * 0.3;
    if (!free(x, z, r + 0.2)) continue;
    e.set((rnd() - 0.5) * 0.5, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.5);
    q.setFromEuler(e);
    p.set(x, 0.02 + rnd() * 0.05, z);
    s.set(r, 1, r * (0.6 + rnd() * 0.6));
    mesh.setMatrixAt(placed, m.compose(p, q, s));
    const v = 0.7 + rnd() * 0.6;
    mesh.setColorAt(placed, col.setRGB(v, v, v));
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
  return mesh;
}

export function features(ctx) {
  const crust = decals(ctx, {
    salt: 61, blots: 26, count: 180, min: 2.6, max: 7.5,
    color: 0x93a08f, opacity: 0.42, y: 0.014, renderOrder: -4,
  });
  // Warm-shifted off the lichen's green, never toward the arena fence's cyan.
  const glow = decals(ctx, {
    salt: 97, blots: 8, count: 60, min: 1.8, max: 4.2,
    color: 0x7d9c74, opacity: 0.1, y: 0.022, renderOrder: -1,
  });
  return [crust, glow, shards(ctx)];
}
