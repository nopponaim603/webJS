import * as THREE from 'three';
import { attachGlow } from '../fx/glow.js';
import { bindHip } from './gait.js';
import { plumage } from './plumage.js';
import * as skin from './skin.js';

const GEO = {
  blob: new THREE.SphereGeometry(0.5, 16, 12),
  head: new THREE.SphereGeometry(0.5, 14, 10),
  eye: new THREE.SphereGeometry(0.075, 8, 6),
  cone: new THREE.ConeGeometry(0.5, 1, 10).rotateX(Math.PI / 2),
  ruff: new THREE.ConeGeometry(0.5, 1, 20, 1, true).rotateX(-Math.PI / 2),
  leg: new THREE.CylinderGeometry(0.085, 0.06, 1, 6).translate(0, -0.5, 0),
  arm: new THREE.CylinderGeometry(0.08, 0.045, 1, 6).rotateZ(-Math.PI / 2).translate(0.5, 0, 0),
  pinion: new THREE.PlaneGeometry(1.5, 1.15).translate(0.75, 0.1, 0).rotateX(-Math.PI / 2),
  rectrix: new THREE.PlaneGeometry(0.95, 1).translate(0, 0.5, 0),
};

function materialsOf(kit) {
  const solid = (map, extra) => new THREE.MeshStandardMaterial({
    map, bumpMap: map, bumpScale: 0.14, roughness: 0.92, ...extra,
  });
  // Cut out rather than blended: overlapping feathers have to sort against each
  // other, and a slot has to stay a slot at any distance.
  const feather = (part) => new THREE.MeshStandardMaterial({
    map: part.map, alphaMap: part.mask, bumpMap: part.map, bumpScale: 0.1,
    alphaTest: 0.42, side: THREE.DoubleSide, roughness: 0.95,
  });

  const M = {
    plume: solid(kit.plume),
    hide: solid(kit.hide, { roughness: 0.68 }),
    horn: solid(kit.horn, { roughness: 0.42, metalness: 0.1 }),
    ruff: feather(kit.ruff),
    inner: feather(kit.inner),
    outer: feather(kit.outer),
    tail: feather(kit.tail),
    eye: new THREE.MeshBasicMaterial({ color: 0xff3b3b }),
  };

  for (const m of Object.values(M)) {
    m.transparent = true;
    skin.remember(m);
  }
  return M;
}

function mesh(parent, geo, mat, pos, scale, rot) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(...pos);
  if (scale) m.scale.set(...scale);
  if (rot) m.rotation.set(...rot);
  m.castShadow = true;
  parent.add(m);
  return m;
}

function body(g, M) {
  mesh(g, GEO.blob, M.plume, [0, 0.30, -0.15], [0.84, 0.77, 1.42]);
  mesh(g, GEO.blob, M.plume, [0, 0.50, -0.34], [0.74, 0.60, 0.95]);
  mesh(g, GEO.blob, M.plume, [0, 0.36, 0.35], [0.97, 0.89, 0.62]);
  mesh(g, GEO.ruff, M.ruff, [0, 0.44, 0.44], [0.78, 0.78, 0.72]);
}

function crown(g, M) {
  mesh(g, GEO.blob, M.hide, [0, 0.52, 0.80], [0.40, 0.42, 0.46]);
  const head = mesh(g, GEO.head, M.hide, [0, 0.57, 1.10], [0.42, 0.42, 0.50]);

  mesh(g, GEO.cone, M.horn, [0, 0.52, 1.42], [0.30, 0.34, 0.62]);
  mesh(g, GEO.cone, M.horn, [0, 0.50, 1.62], [0.17, 0.20, 0.28], [1.15, 0, 0]);

  for (const s of [-1, 1]) mesh(g, GEO.eye, M.eye, [s * 0.155, 0.62, 1.20], [1.3, 1.3, 1.3]);
  return head;
}

function feet(g, M) {
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = mesh(g, GEO.leg, M.hide, [s * 0.20, 0.24, -0.10], [1, 0.44, 1], [0.95, 0, 0]);
    mesh(g, GEO.cone, M.horn, [s * 0.20, 0.02, -0.42], [0.22, 0.22, 0.30], [1.3, 0, 0]);
    legs.push(leg);
  }
  return legs;
}

function addWing(g, M, s) {
  const shoulder = new THREE.Group();
  shoulder.position.set(s * 0.22, 0.42, 0.08);
  shoulder.userData.side = s;

  mesh(shoulder, GEO.pinion, M.inner, [0, 0, 0], [s, 1, 1]);
  mesh(shoulder, GEO.arm, M.plume, [0, 0.01, 0.32], [s * 1.5, 1, 1]);

  const elbow = new THREE.Group();
  elbow.position.x = s * 1.45;
  mesh(elbow, GEO.pinion, M.outer, [0, 0, 0], [s * 0.98, 1, 0.86]);
  shoulder.add(elbow);

  shoulder.userData.elbow = elbow;
  g.add(shoulder);
  return shoulder;
}

export function createFlyerModel(type, span) {
  const M = materialsOf(plumage(type.color));
  const g = new THREE.Group();
  g.rotation.order = 'YXZ';

  body(g, M);
  const head = crown(g, M);
  const legs = feet(g, M);
  const tail = mesh(g, GEO.rectrix, M.tail, [0, 0.30, -0.92], [1, 0.9, 1], [-Math.PI / 2, 0, 0]);
  const wings = [-1, 1].map((s) => addWing(g, M, s));

  g.scale.setScalar(type.scale);

  return {
    object: g,
    parts: {
      body: null, legs, hip: bindHip(g, legs), wings, head, tail,
      material: M.plume, materials: Object.values(M),
      span, height: 0.9 * type.scale,
      glow: attachGlow(g, type, span, 0.5),
    },
  };
}
