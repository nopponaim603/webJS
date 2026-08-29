import * as THREE from 'three';
import { CFG } from '../../config/index.js';
import { METAL, METAL_DARK, PLATE, STRIPE, GLOW, WISPS } from './texture.js';

const TAU = Math.PI * 2;
export const DECK_Y = 0.44;
export const DOOR_OPEN = 1.85;

const mat = {
  base: new THREE.MeshStandardMaterial({ map: METAL, metalness: 0.75, roughness: 0.5 }),
  dark: new THREE.MeshStandardMaterial({ map: METAL_DARK, metalness: 0.8, roughness: 0.55 }),
  plate: new THREE.MeshStandardMaterial({ map: PLATE, metalness: 0.7, roughness: 0.45 }),
  stripe: new THREE.MeshStandardMaterial({ map: STRIPE, metalness: 0.4, roughness: 0.65 }),
  cyan: new THREE.MeshStandardMaterial({ color: 0x073a44, emissive: 0x00e5ff,
                                         emissiveIntensity: 1.6, metalness: 0.2, roughness: 0.4 }),
  red: new THREE.MeshStandardMaterial({ color: 0x330a0a, emissive: 0xff2222,
                                        emissiveIntensity: 1.4, metalness: 0.2, roughness: 0.4 }),
};

function ringSegGeo(rIn, rOut, a0, a1, depth) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, a0, a1, false);
  s.absarc(0, 0, rIn, a1, a0, true);
  const g = new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02,
    bevelSegments: 1, curveSegments: 14,
  });
  g.rotateX(-Math.PI / 2);
  return g;
}

// A blanket of light laid on the floor rather than a hole cut through it: the
// player sinks into it and the ground takes them, which needs no stencil, no
// depth tricks and no shader.
function blanketOf() {
  const g = new THREE.Group();
  g.position.y = 0.04;

  // Black underneath, so what the doors open onto is a hole to look at rather
  // than a lit patch of the same dirt as everywhere else.
  const dark = new THREE.Mesh(
    new THREE.CircleGeometry(2.66, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0, depthWrite: false,
    }));
  dark.renderOrder = 1;

  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(2.66, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      map: GLOW, transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }));

  const wisps = new THREE.Mesh(
    new THREE.CircleGeometry(2.5, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      map: WISPS, transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }));
  wisps.position.y = 0.02;

  glow.renderOrder = 2;
  wisps.renderOrder = 3;
  g.add(dark, glow, wisps);
  return { group: g, dark, glow, wisps };
}

// The timer, as one instanced ring of lamps with a colour each. A shader would
// draw it in one pass too, and this is one draw call without one.
function loadRingOf(count) {
  const seg = (TAU / count) * 0.74;
  const geo = new THREE.RingGeometry(3.0, 3.34, 2, 1, -Math.PI / 2, seg)
    .rotateX(-Math.PI / 2);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  }), count);
  // Parked at nothing: each lamp is driven into place by the deploy, the same
  // way every other piece is.
  const m = new THREE.Matrix4();
  const zero = new THREE.Vector3();
  // The colours are seeded here, not on first use: the attribute is what tells
  // three to build the instanced-colour shader, and adding it later would mean
  // compiling that shader in the middle of a wave.
  const off = new THREE.Color(0x11333d);
  for (let i = 0; i < count; i++) {
    mesh.setMatrixAt(i, m.scale(zero));
    mesh.setColorAt(i, off);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
  mesh.position.y = 0.5;
  mesh.visible = false;
  return mesh;
}

export function buildPad() {
  const group = new THREE.Group();
  group.visible = false;

  const parts = [];
  const doors = [];
  const counts = {};

  const add = (obj, grp, off) => {
    obj.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
    });
    group.add(obj);
    parts.push({ obj, grp, off, gi: (counts[grp] = (counts[grp] || 0) + 1) - 1,
                 y: obj.position.y });
    return obj;
  };

  const SEG = 12;
  for (let i = 0; i < SEG; i++) {
    const a0 = i / SEG * TAU, a1 = (i + 1) / SEG * TAU - 0.012;
    add(new THREE.Mesh(ringSegGeo(2.55, 4.0, a0, a1, 0.34), i % 3 === 0 ? mat.dark : mat.base),
        'base', 0.45);
  }
  for (let i = 0; i < SEG; i++) {
    const a0 = i / SEG * TAU + 0.04, a1 = (i + 1) / SEG * TAU - 0.05;
    const m = new THREE.Mesh(ringSegGeo(2.95, 3.85, a0, a1, 0.07), mat.plate);
    m.position.y = 0.36;
    add(m, 'plate', 0.32);
  }
  for (let i = 0; i < 4; i++) {
    const a0 = i / 4 * TAU + 0.06, a1 = (i + 1) / 4 * TAU - 0.06;
    const m = new THREE.Mesh(ringSegGeo(2.6, 2.92, a0, a1, 0.05), mat.stripe);
    m.position.y = 0.365;
    add(m, 'stripe', 0.3);
  }
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU + Math.PI / 8;
    const g = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.5), mat.dark);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.36), mat.cyan);
    lamp.position.y = 0.1;
    g.add(box, lamp);
    g.position.set(Math.cos(a) * 3.45, 0.47, -Math.sin(a) * 3.45);
    g.rotation.y = a + Math.PI / 2;
    add(g, 'pod', 0.45);
  }
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + Math.PI / 4;
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.55, 8), mat.dark);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mat.red);
    tip.position.y = 0.32;
    g.add(post, tip);
    g.position.set(Math.cos(a) * 3.88, 0.55, -Math.sin(a) * 3.88);
    add(g, 'pylon', 0.5);
  }
  {
    const m = new THREE.Mesh(new THREE.TorusGeometry(2.72, 0.055, 8, 72), mat.cyan);
    m.rotation.x = Math.PI / 2;
    m.position.y = 0.36;
    add(m, 'trim', 0.3);
  }

  const DOOR_R = 2.72, DSEG = 8;
  for (let i = 0; i < DSEG; i++) {
    const da = TAU / DSEG;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, DOOR_R, -da / 2 + 0.01, da / 2 - 0.01, false);
    shape.absarc(0, 0, 0.22, da / 2 - 0.01, -da / 2 + 0.01, true);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.09, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015,
      bevelSegments: 1, curveSegments: 12,
    });
    geo.rotateX(-Math.PI / 2);
    geo.translate(-DOOR_R, 0, 0);

    const leaf = new THREE.Mesh(geo, i % 2 ? mat.plate : mat.base);
    const knob = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.16), mat.dark);
    knob.position.set(-DOOR_R + 0.9, 0.12, 0);
    const g = new THREE.Group();
    g.add(leaf, knob);
    const mid = i / DSEG * TAU + Math.PI / DSEG;
    g.position.set(Math.cos(mid) * DOOR_R, 0.3, -Math.sin(mid) * DOOR_R);
    g.rotation.y = mid;
    doors.push(g);
    add(g, 'door', 0.32);
  }

  const blanket = blanketOf();
  const loadRing = loadRingOf(CFG.extraction.lights);

  group.add(blanket.group, loadRing);

  // Every cyan lamp pulses together.
  const cyans = [mat.cyan];

  const textures = [];
  group.traverse((o) => {
    if (o.isMesh && o.material.map && !textures.includes(o.material.map)) {
      textures.push(o.material.map);
    }
  });

  return { group, parts, doors, blanket, loadRing, mat, cyans, textures };
}
