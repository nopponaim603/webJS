import * as THREE from 'three';
import { CFG } from '../config/index.js';
import * as drone from '../allies/dronemodel.js';

const K = () => CFG.items.model;

// The catalog draws each item once, as the same paths the card wears. Drawn
// white so the badge's own colour is what tints it, and kept by id: a wave can
// print the same item a dozen times off one texture.
const ICONS = {};

export function iconOf(item) {
  if (ICONS[item.id]) return ICONS[item.id];
  const S = 256;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);

  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"`
    + ` width="${S}" height="${S}" fill="none" stroke="#fff" stroke-width="1.7"`
    + ` stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg>`;
  const img = new Image();
  img.onload = () => { g.drawImage(img, 0, 0, S, S); tex.needsUpdate = true; };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;

  ICONS[item.id] = tex;
  return tex;
}

// A rectangle with its corners taken off, which is what an extruded box needs to
// come out with soft edges: the profile rounds the four corners you see face on,
// and the bevel rounds the two faces against it.
function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// `w`, `h` and `d` are what comes out, not what goes in: a bevel grows the
// outline it is put on, so the profile is inset by it first and the piece ends
// up the size it was asked for with its corners taken off by `r`.
function roundedBox(w, h, d, r) {
  const bevel = Math.min(r, d * 0.4, w * 0.4, h * 0.4);
  const inner = (v) => Math.max(0.001, v - bevel * 2);
  const geo = new THREE.ExtrudeGeometry(
    roundedRect(inner(w), inner(h), Math.max(0.001, r - bevel)), {
      depth: inner(d), curveSegments: 3,
      bevelEnabled: true, bevelSegments: 2, bevelSize: bevel, bevelThickness: bevel,
    });
  geo.center();
  return geo;
}

// A field medkit: a white case with a grab handle, and a red cross stood proud
// of the two faces it can be read from. The cross is built rather than printed —
// two slabs are what everything else in this game is made of, and a decal would
// go flat the moment the case turned edge on.
function medkitParts(size, group, m) {
  const w = size * 1.24, h = size, d = size * 0.76;
  const slab = (x, y, z) => roundedBox(x, y, z, Math.min(x, y, z) * 0.28);

  const parts = [new THREE.Mesh(roundedBox(w, h, d, h * 0.15), m.case)];

  const seam = new THREE.Mesh(slab(w * 1.02, h * 0.11, d * 1.02), m.shell);
  seam.position.y = h * 0.14;
  parts.push(seam);

  const grip = new THREE.Mesh(slab(w * 0.34, h * 0.09, d * 0.18), m.trim);
  grip.position.y = h * 0.62;
  parts.push(grip);
  for (const side of [-1, 1]) {
    const post = new THREE.Mesh(slab(w * 0.06, h * 0.14, d * 0.18), m.trim);
    post.position.set(side * w * 0.14, h * 0.55, 0);
    parts.push(post);
  }

  for (const face of [1, -1]) {
    for (const [x, y] of [[w * 0.42, h * 0.16], [w * 0.15, h * 0.44]]) {
      const arm = new THREE.Mesh(slab(x, y, d * 0.06), m.cross);
      arm.position.set(0, -h * 0.12, face * (d * 0.5 + d * 0.02));
      parts.push(arm);
    }
  }
  return { parts, badges: [] };
}

// The fallback body for an item that names no shape of its own: a canister, and
// the item's icon stamped on two opposite faces so a turn always brings one
// round to you.
function canisterParts(size, group, m) {
  const prism = (r, h) => new THREE.CylinderGeometry(r, r, h, 8);
  const radius = size * 0.33;

  const parts = [new THREE.Mesh(prism(radius, size * 0.62), m.shell),
                 new THREE.Mesh(prism(radius * 1.06, size * 0.1), m.trim)];
  for (const side of [-1, 1]) {
    const cap = new THREE.Mesh(prism(radius * 0.86, size * 0.13), m.trim);
    cap.position.y = side * size * 0.37;
    parts.push(cap);
  }

  const badges = [];
  for (const turn of [0, Math.PI]) {
    const badge = new THREE.Mesh(
      new THREE.PlaneGeometry(size * 0.47, size * 0.47),
      new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }),
    );
    badge.position.set(Math.sin(turn) * radius * 1.02, 0, Math.cos(turn) * radius * 1.02);
    badge.rotation.y = turn;
    badge.renderOrder = 2;
    badges.push(badge);
    group.add(badge);
  }
  return { parts, badges };
}

// A shell round stood on its base: a cased body under a tapered nose, which is a
// silhouette nothing else on the floor has. Turned on its axis rather than given
// a face, because a drop spins where it hovers and a face that has to be facing
// you is one you miss half the time.
function roundParts(size, group, m) {
  const r = size * 0.3;
  const tube = (rt, rb, h, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg);

  const body = new THREE.Mesh(tube(r, r, size * 0.5), m.shell);
  body.position.y = -size * 0.16;

  const nose = new THREE.Mesh(new THREE.ConeGeometry(r, size * 0.44, 10), m.shell);
  nose.position.y = size * 0.31;

  const band = new THREE.Mesh(tube(r * 1.12, r * 1.12, size * 0.1), m.trim);
  band.position.y = -size * 0.05;

  const base = new THREE.Mesh(tube(r * 1.08, r * 0.92, size * 0.12), m.trim);
  base.position.y = -size * 0.38;

  return { parts: [body, nose, band, base], badges: [] };
}

// A heater shield and nothing else: the face is the item's own colour with a
// raised rim round it and a boss in the middle, hanging in the air the way every
// other body does and leant back so it is read as a face rather than an edge.
function shieldOutline(w, h) {
  const s = new THREE.Shape();
  const x = w / 2;
  s.moveTo(-x, h * 0.5);
  s.quadraticCurveTo(0, h * 0.62, x, h * 0.5);
  s.lineTo(x, h * 0.06);
  s.quadraticCurveTo(x * 0.94, -h * 0.34, 0, -h * 0.5);
  s.quadraticCurveTo(-x * 0.94, -h * 0.34, -x, h * 0.06);
  s.closePath();
  return s;
}

function shieldParts(size, group, m) {
  const w = size * 0.9, h = size;

  const face = (scale, depth, mat) => {
    const geo = new THREE.ExtrudeGeometry(shieldOutline(w * scale, h * scale), {
      depth, curveSegments: 4,
      bevelEnabled: true, bevelSegments: 1,
      bevelSize: size * 0.02, bevelThickness: size * 0.02,
    });
    geo.center();
    return new THREE.Mesh(geo, mat);
  };

  const plate = face(1, size * 0.12, m.trim);
  const front = face(0.86, size * 0.1, m.shell);
  front.position.z = size * 0.05;

  const boss = new THREE.Mesh(
    new THREE.SphereGeometry(size * 0.15, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), m.trim);
  boss.rotation.x = Math.PI / 2;
  boss.position.set(0, size * 0.06, size * 0.11);

  const held = new THREE.Group();
  held.add(plate, front, boss);
  // Leant back, so the face catches the light from over the player rather than
  // presenting the player its edge.
  held.rotation.x = -0.22;

  return { parts: [held], badges: [] };
}

// A battery: a coloured wrap between two metal ends, with the terminal stood
// proud of the top one. Squatter and fatter than the shell round it shares a
// turned body with, so the pair do not read as one thing at a glance.
function batteryParts(size, group, m) {
  const r = size * 0.36;
  const tube = (rad, h) => new THREE.CylinderGeometry(rad, rad, h, 12);

  const wrap = new THREE.Mesh(tube(r, size * 0.62), m.shell);
  wrap.position.y = -size * 0.04;

  const top = new THREE.Mesh(tube(r * 0.97, size * 0.12), m.trim);
  top.position.y = size * 0.33;

  const nub = new THREE.Mesh(tube(r * 0.3, size * 0.12), m.trim);
  nub.position.y = size * 0.45;

  const foot = new THREE.Mesh(tube(r * 0.97, size * 0.1), m.trim);
  foot.position.y = -size * 0.4;

  return { parts: [wrap, top, nub, foot], badges: [] };
}

// A booster: a flared nozzle under a finned body. The shell round tapers up to a
// point and this flares down to a mouth, so the two never read as each other
// however the drop happens to be turned.
function boosterParts(size, group, m) {
  const r = size * 0.28;
  const tube = (rt, rb, h) => new THREE.CylinderGeometry(rt, rb, h, 10);

  const body = new THREE.Mesh(tube(r, r * 0.92, size * 0.5), m.shell);
  body.position.y = size * 0.12;

  const bell = new THREE.Mesh(tube(r * 0.92, r * 1.5, size * 0.3), m.shell);
  bell.position.y = -size * 0.28;

  const collar = new THREE.Mesh(tube(r * 1.12, r * 1.12, size * 0.09), m.trim);
  collar.position.y = -size * 0.11;

  const cap = new THREE.Mesh(tube(r * 0.55, r * 0.95, size * 0.14), m.trim);
  cap.position.y = size * 0.43;

  const parts = [body, bell, collar, cap];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const fin = new THREE.Mesh(
      roundedBox(size * 0.06, size * 0.34, size * 0.3, size * 0.03), m.trim);
    fin.position.set(Math.cos(a) * r * 0.95, size * 0.05, Math.sin(a) * r * 0.95);
    fin.rotation.y = Math.PI / 2 - a;
    parts.push(fin);
  }
  return { parts, badges: [] };
}

// A drum magazine: a wide flat pan under a raised hub, ringed with feed lugs.
// Turned about its own axis like the rest of them, and the only one in the set
// that is wider than it is tall, so it is a puck beside a row of cans.
function drumParts(size, group, m) {
  const r = size * 0.46;
  const disc = (rad, h, seg = 14) => new THREE.CylinderGeometry(rad, rad, h, seg);

  const pan = new THREE.Mesh(disc(r, size * 0.26), m.shell);
  const rim = new THREE.Mesh(disc(r * 1.07, size * 0.09), m.trim);
  rim.position.y = size * 0.04;

  const hub = new THREE.Mesh(disc(r * 0.32, size * 0.3, 10), m.shell);
  hub.position.y = size * 0.2;

  const spindle = new THREE.Mesh(disc(r * 0.12, size * 0.44, 8), m.trim);
  spindle.position.y = size * 0.24;

  const parts = [pan, rim, hub, spindle];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const lug = new THREE.Mesh(
      roundedBox(size * 0.11, size * 0.3, size * 0.11, size * 0.03), m.trim);
    lug.position.set(Math.cos(a) * r * 0.99, 0, Math.sin(a) * r * 0.99);
    lug.rotation.y = -a;
    parts.push(lug);
  }
  return { parts, badges: [] };
}

// A feed spool: two flanges pinched around a narrow waist. The only profile in
// the set that goes in at the middle, so it is not another can however it turns.
function spoolParts(size, group, m) {
  const r = size * 0.42;
  const tube = (rad, h, seg = 12) => new THREE.CylinderGeometry(rad, rad, h, seg);

  const parts = [new THREE.Mesh(tube(r * 0.44, size * 0.42), m.shell),
                 new THREE.Mesh(tube(r * 0.16, size * 0.8, 8), m.trim)];
  for (const side of [-1, 1]) {
    const flange = new THREE.Mesh(tube(r, size * 0.11), m.shell);
    flange.position.y = side * size * 0.24;
    parts.push(flange);

    const lip = new THREE.Mesh(tube(r * 1.05, size * 0.06), m.trim);
    lip.position.y = side * size * 0.31;
    parts.push(lip);
  }
  return { parts, badges: [] };
}

// One coin, stood on its edge so the body's own turn spins it the way a coin
// spins on a table. Turned smooth where every other body is faceted — money is
// the one thing here that is not machinery — and milled round the rim, which is
// the detail that says coin rather than disc at a glance.
function coinParts(size, group, m) {
  const r = size * 0.5;
  const thick = size * 0.14;
  const disc = (rad, h, seg = 30) => new THREE.CylinderGeometry(rad, rad, h, seg);

  const parts = [];

  const core = new THREE.Mesh(disc(r, thick), m.shell);
  parts.push(core);

  // Proud of the face on both sides, so the coin reads as struck rather than
  // cut: a rim inside the edge and a boss in the middle of it.
  for (const side of [-1, 1]) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r * 0.74, size * 0.028, 8, 28), m.shell);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = side * thick * 0.5;
    parts.push(ring);

    const boss = new THREE.Mesh(disc(r * 0.3, size * 0.03, 16), m.shell);
    boss.position.y = side * thick * 0.56;
    parts.push(boss);
  }

  // The milling: one band round the edge with too few sides to be round, so it
  // reads as a knurl. Cut as geometry rather than struck a tooth at a time —
  // twenty little boxes is twenty draw calls for a thing the size of a hand.
  const mill = new THREE.Mesh(
    new THREE.TorusGeometry(r, thick * 0.5, 4, 26), m.trim);
  mill.rotation.x = Math.PI / 2;
  parts.push(mill);

  // Stood on edge. Everything above is built lying flat, which is the easy way
  // to place it; the whole coin is tipped up once at the end.
  const coin = new THREE.Group();
  coin.add(...parts);
  coin.rotation.x = Math.PI / 2;
  return { parts: [coin], badges: [] };
}

function bayParts(size, group, m) {
  const r = size * 0.44;
  const hoop = (rad, tube) => new THREE.TorusGeometry(rad, tube, 6, 16)
    .rotateX(-Math.PI / 2);

  const parts = [];
  for (const [rad, y] of [[r, -size * 0.3], [r * 0.78, size * 0.34]]) {
    const ring = new THREE.Mesh(hoop(rad, size * 0.055), m.shell);
    ring.position.y = y;
    parts.push(ring);
  }

  const spindle = new THREE.Mesh(
    new THREE.CylinderGeometry(size * 0.07, size * 0.07, size * 0.64, 8), m.trim);
  parts.push(spindle);

  // The body it is holding: a stub of a machine, cradled between the hoops.
  const held = new THREE.Mesh(
    new THREE.OctahedronGeometry(size * 0.2, 0), m.shell);
  held.position.y = size * 0.02;
  parts.push(held);

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(size * 0.05, size * 0.05, r * 0.92), m.trim);
    arm.position.set(Math.cos(a) * r * 0.46, -size * 0.3, Math.sin(a) * r * 0.46);
    arm.rotation.y = -a;
    parts.push(arm);
  }
  return { parts, badges: [] };
}

// The machine itself, stood on the floor as the thing you walk over to. It is
// built by the flight rather than here, wearing its own panels rather than the
// item's colour: what is lying there is one of them, and the halo round it is
// what says which item it is.
function droneParts(size) {
  const made = drone.build();
  made.object.scale.setScalar(size * 0.3 / CFG.drone.size);
  made.object.position.y = size * 0.1;
  return { parts: [made.object], badges: [] };
}

// Armour plate: three slabs stacked narrowing upward. Six sided rather than
// turned, which makes it the one body on the floor that is angular in plan.
function plateParts(size, group, m) {
  const r = size * 0.5;
  const hex = (rad, h) => new THREE.CylinderGeometry(rad, rad, h, 6);

  const parts = [];
  for (const [rad, y] of [[r, -0.2], [r * 0.82, -0.03], [r * 0.62, 0.14]]) {
    const slab = new THREE.Mesh(hex(rad, size * 0.17), m.shell);
    slab.position.y = size * y;
    parts.push(slab);

    const edge = new THREE.Mesh(hex(rad * 1.05, size * 0.05), m.trim);
    edge.position.y = size * y + size * 0.08;
    parts.push(edge);
  }

  const boss = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.2, r * 0.2, size * 0.1, 8), m.trim);
  boss.position.y = size * 0.26;
  parts.push(boss);
  return { parts, badges: [] };
}

const SHAPES = { medkit: medkitParts, round: roundParts, shield: shieldParts, bay: bayParts,
                 drone: droneParts,
                 battery: batteryParts, booster: boosterParts, drum: drumParts,
                 spool: spoolParts, coin: coinParts, plate: plateParts,
                 canister: canisterParts };

// One body, in one shape, wearing nothing yet: what item it is belongs to
// dress(), so a drop handed back to the pool can come out as another.
// `shell` is the one material an item's own colour lands on; the rest are what
// the shape is made of and stay the colour the shape needs them to be.
export function build(kind = 'canister') {
  const M = K();
  const group = new THREE.Group();

  const mats = {
    shell: new THREE.MeshStandardMaterial({
      roughness: 0.35, metalness: 0.3, flatShading: true,
    }),
    trim: new THREE.MeshStandardMaterial({
      color: 0x2b3035, roughness: 0.5, metalness: 0.45, flatShading: true,
    }),
    // Smooth, unlike the trim: a corner taken off and then flat shaded reads as
    // another facet rather than as a rounded edge.
    case: new THREE.MeshStandardMaterial({
      color: 0xeef3f6, roughness: 0.55, metalness: 0.08,
    }),
    cross: new THREE.MeshStandardMaterial({
      color: 0xd8342c, roughness: 0.45, metalness: 0.05,
      emissive: 0x4a0d09, emissiveIntensity: 0.6,
    }),
  };

  const { parts, badges } = (SHAPES[kind] || SHAPES.canister)(M.size, group, mats);
  for (const part of parts) {
    part.castShadow = true;
    group.add(part);
  }

  return { object: group, shell: mats.shell, badges };
}

export function dress(parts, item) {
  parts.shell.color.setHex(item.color);
  parts.shell.emissive.setHex(item.color);
  parts.shell.emissiveIntensity = K().emissive;
  for (const badge of parts.badges) badge.material.map = iconOf(item);
}
