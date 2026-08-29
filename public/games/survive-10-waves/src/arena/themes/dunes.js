import * as THREE from 'three';
import { rngFrom } from '../../core/rng.js';

export const THEME = {
  name: 'Dune Sea',
  sky: {
    background: 0xd9c9a6,
    hemiSky: 0xffe6bd,
    hemiGround: 0x6b5638,
    hemiIntensity: 0.6,
    sunColor: 0xfff0cf,
    sunIntensity: 3.4,
    exposure: 1.0,
  },
  sun: { elevation: 42, azimuth: 56, distance: 44 },
  ground: {
    texture: 'assets/themes/dunes/ground.jpg',
    normal: 'assets/themes/dunes/ground_normal.jpg',
    tileWorldSize: 32.4,
    bumpScale: 1.6,
    roughness: 0.94,
    tint: 0xffffff,
  },
  walls: {
    texture: 'assets/themes/dunes/wall.jpg',
    normalMap: 'assets/themes/dunes/wall_normal.jpg',
    roughnessMap: 'assets/themes/dunes/wall_rough.jpg',
    tileWorldSize: 4.0,
    normalStrength: 1.0,
    color: 0xf0e2c6,
  },
  scatter: {
    rockTexture: 'assets/themes/dunes/rock.jpg',
    rockNormal: 'assets/themes/dunes/rock_normal.jpg',
    tint: { grass: 0xa9975f, moss: 0x8a7a4e, gravel: 0xbaa887, path: 0xffffff },
    opacity: { grass: 0.5, moss: 0.4, gravel: 0.7, path: 0.8 },
    regions: {
      count: 10, min: 22, max: 40, opacity: 0.20,
      tints: [0xd6bd90, 0xb99a6b, 0xc7ae86],
    },
    tufts: { count: 900, min: 0.3, max: 0.55, color: 0xa9975f },
    rocks: { color: 0xbcae95 },
    boulders: { color: 0xb5a58a },
    clouds: {
      enabled: true, tileWorldSize: 150, strength: 0.10,
      color: 0x7a6a4e, wind: [3.0, 1.6], y: 0.09,
    },
  },
};

const WIND = Math.atan2(1.6, 3.0);

export function patchTexture(seed, kind) {
  const SZ = 256, R = SZ / 2;
  const cv = document.createElement('canvas');
  cv.width = cv.height = SZ;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  const harmonics = [1, 2, 3, 5].map((k) => ({
    k, amp: 0.3 * (0.3 + rnd() * 0.7), ph: rnd() * Math.PI * 2,
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
  g.fillStyle = kind === 'gravel' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.13)';
  g.fill();

  if (kind === 'gravel') {
    for (let i = 0; i < 320; i++) {
      const a = rnd() * Math.PI * 2, d = radius(a) * Math.sqrt(rnd()) * 0.92;
      const x = R + Math.cos(a) * d, y = R + Math.sin(a) * d;
      const rr = SZ * (0.004 + rnd() * 0.013);
      g.fillStyle = `rgba(255,255,255,${0.4 + rnd() * 0.5})`;
      g.beginPath();
      g.ellipse(x, y, rr, rr * (0.6 + rnd() * 0.6), rnd() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
  } else {
    for (let i = 0; i < 200; i++) {
      const a = rnd() * Math.PI * 2, d = radius(a) * Math.sqrt(rnd()) * 0.95;
      const x = R + Math.cos(a) * d, y = R + Math.sin(a) * d;
      const len = SZ * (0.03 + rnd() * 0.06);
      const lean = WIND + (rnd() - 0.5) * 0.3;
      g.strokeStyle = `rgba(255,255,255,${0.25 + rnd() * 0.35})`;
      g.lineWidth = 1 + rnd() * 2;
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

// Stiff dry stalks rather than blades: fewer, straighter, forked at the tip.
export function bladeTexture(seed, blades = 7) {
  const W = 128, H = 128;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);
  for (let i = 0; i < blades; i++) {
    const x = W * (0.12 + rnd() * 0.76);
    const h = H * (0.55 + rnd() * 0.42);
    const lean = (rnd() - 0.5) * W * 0.22;
    const w = W * (0.008 + rnd() * 0.012);
    g.fillStyle = `rgba(255,255,255,${0.75 + rnd() * 0.25})`;
    g.beginPath();
    g.moveTo(x - w, H);
    g.lineTo(x + lean - w * 0.4, H - h);
    g.lineTo(x + lean + w * 0.4, H - h);
    g.lineTo(x + w, H);
    g.closePath();
    g.fill();

    if (rnd() < 0.5) {
      const fork = (rnd() - 0.5) * W * 0.09;
      g.beginPath();
      g.moveTo(x + lean - w * 0.4, H - h * 0.82);
      g.lineTo(x + lean + fork, H - h * 1.12);
      g.lineTo(x + lean + fork + w * 0.7, H - h * 1.08);
      g.closePath();
      g.fill();
    }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

function bandTexture(seed) {
  const W = 256, H = 128;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const rnd = rngFrom(seed);

  const fade = g.createLinearGradient(0, 0, 0, H);
  fade.addColorStop(0.0, 'rgba(0,0,0,0)');
  fade.addColorStop(0.5, 'rgba(255,255,255,0.85)');
  fade.addColorStop(1.0, 'rgba(0,0,0,0)');
  g.fillStyle = fade;
  g.fillRect(0, 0, W, H);

  const ends = g.createLinearGradient(0, 0, W, 0);
  ends.addColorStop(0.0, 'rgba(0,0,0,1)');
  ends.addColorStop(0.2, 'rgba(0,0,0,0)');
  ends.addColorStop(0.8, 'rgba(0,0,0,0)');
  ends.addColorStop(1.0, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = ends;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'source-over';

  for (let i = 0; i < 9; i++) {
    const y = H * (0.18 + rnd() * 0.64);
    const amp = H * (0.02 + rnd() * 0.05);
    const ph = rnd() * Math.PI * 2;
    g.strokeStyle = `rgba(255,255,255,${0.18 + rnd() * 0.3})`;
    g.lineWidth = 1.5 + rnd() * 4;
    g.beginPath();
    for (let x = 0; x <= W; x += 5) {
      const yy = y + Math.sin((x / W) * Math.PI * 2 + ph) * amp;
      if (x === 0) g.moveTo(x, yy); else g.lineTo(x, yy);
    }
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

function ripples({ scene, rnd, free, clip, arenaMax, seed }) {
  const mat = clip(new THREE.MeshLambertMaterial({
    alphaMap: bandTexture(seed + 31), color: 0xe8d5ac,
    transparent: true, opacity: 0.34, depthWrite: false, side: THREE.DoubleSide,
  }));
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 2), mat, 140);
  mesh.receiveShadow = true;
  mesh.renderOrder = -4;

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
  let placed = 0;
  for (let guard = 0; placed < 140 && guard < 3000; guard++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * arenaMax;
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const r = 3.5 + rnd() * 5.5;
    const aspect = 3.5 + rnd() * 1.5;
    if (!free(x, z, r * aspect * 0.5)) continue;
    e.set(-Math.PI / 2, 0, -WIND + (rnd() - 0.5) * 0.18);
    q.setFromEuler(e);
    p.set(x, 0.012, z);
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

// A rib arc and a couple of long bones, so one clump reads as a carcass the
// sand has most of.
function boneGeometry() {
  const parts = [];
  const shaft = new THREE.CylinderGeometry(0.055, 0.055, 1, 6);
  for (let i = 0; i < 5; i++) {
    const rib = new THREE.TorusGeometry(0.34, 0.045, 5, 10, Math.PI * 0.85);
    rib.rotateY(Math.PI / 2);
    rib.translate((i - 2) * 0.26, 0, 0);
    parts.push(rib);
  }
  const spine = shaft.clone();
  spine.rotateZ(Math.PI / 2);
  spine.scale(1.5, 1, 1);
  spine.translate(0, 0.3, 0);
  parts.push(spine);

  const geo = new THREE.BufferGeometry();
  const pos = [], nor = [];
  for (const g of parts) {
    const p = g.attributes.position, n = g.attributes.normal;
    const idx = g.index;
    for (let i = 0; i < idx.count; i++) {
      const k = idx.getX(i);
      pos.push(p.getX(k), p.getY(k), p.getZ(k));
      nor.push(n.getX(k), n.getY(k), n.getZ(k));
    }
    g.dispose();
  }
  shaft.dispose();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return geo;
}

function bones({ scene, rnd, free, onPath, clip, clipShadow, arenaMax }) {
  const mat = clip(new THREE.MeshStandardMaterial({
    color: 0xe6dcc2, roughness: 0.85, metalness: 0,
  }));
  const mesh = new THREE.InstancedMesh(boneGeometry(), mat, 60);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  clipShadow(mesh);

  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color();
  let placed = 0;
  for (let guard = 0; placed < 60 && guard < 2000; guard++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (arenaMax - 6);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (!free(x, z, 1.2) || onPath(x, z)) continue;
    const k = 0.7 + rnd() * 0.5;
    e.set((rnd() - 0.5) * 0.2, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.2);
    q.setFromEuler(e);
    // Sunk to the shoulder: what shows is the top of the arc, not a whole rib.
    p.set(x, -0.12 * k, z);
    s.set(k, k, k);
    mesh.setMatrixAt(placed, m.compose(p, q, s));
    const v = 0.88 + rnd() * 0.22;
    mesh.setColorAt(placed, col.setRGB(v, v, v));
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  scene.add(mesh);
  return mesh;
}

function tumbleGeometry() {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const pos = geo.attributes.position;
  const hash = (x, y, z) => {
    let h = Math.imul(Math.round(x * 1024) ^ 0x5bd1e995, 0x85ebca6b);
    h = Math.imul(h ^ Math.round(y * 1024), 0xc2b2ae35);
    h = Math.imul(h ^ Math.round(z * 1024), 0x27d4eb2f);
    h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  };
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const k = 0.62 + hash(x, y, z) * 0.7;
    pos.setXYZ(i, x * k, y * k, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

const TUMBLE = 40;
const DRIFT = 1.6;

let weeds = null;

function tumbleweed({ scene, rnd, free, clip, clipShadow, arenaMax }) {
  const mat = clip(new THREE.MeshLambertMaterial({
    color: 0x8a7440, wireframe: true, transparent: true, opacity: 0.85,
  }));
  const mesh = new THREE.InstancedMesh(tumbleGeometry(), mat, TUMBLE);
  mesh.castShadow = true;
  clipShadow(mesh);

  const at = new Float32Array(TUMBLE * 3);
  let placed = 0;
  for (let guard = 0; placed < TUMBLE && guard < 1200; guard++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (arenaMax - 4);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (!free(x, z, 0.6)) continue;
    at[placed * 3] = x;
    at[placed * 3 + 1] = z;
    at[placed * 3 + 2] = 0.28 + rnd() * 0.22;
    placed++;
  }
  mesh.count = placed;
  scene.add(mesh);
  weeds = { mesh, at, count: placed, span: arenaMax - 4, roll: 0 };
  return mesh;
}

export function features(ctx) {
  weeds = null;
  return [ripples(ctx), bones(ctx), tumbleweed(ctx)];
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();

// Blown downwind and folded back in at the far side, turning as they go.
export function update(dt) {
  if (!weeds) return;
  const { mesh, at, count, span } = weeds;
  weeds.roll += dt * 2.2;
  const dx = Math.cos(WIND) * DRIFT * dt, dz = Math.sin(WIND) * DRIFT * dt;
  for (let i = 0; i < count; i++) {
    let x = at[i * 3] + dx, z = at[i * 3 + 1] + dz;
    if (Math.hypot(x, z) > span) { x = -x; z = -z; }
    at[i * 3] = x;
    at[i * 3 + 1] = z;
    const r = at[i * 3 + 2];
    _e.set(weeds.roll + i, i * 1.7, 0);
    _q.setFromEuler(_e);
    _p.set(x, r * 0.9, z);
    _s.set(r, r, r);
    mesh.setMatrixAt(i, _m.compose(_p, _q, _s));
  }
  mesh.instanceMatrix.needsUpdate = true;
}
