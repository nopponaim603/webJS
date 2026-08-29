import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CFG } from '../config/index.js';

// Everything is an eight-sided prism or a slab, so the whole machine reads as
// cut panels rather than a smooth shape: a faceted white canopy over a dark
// chassis, a keel hanging under it, and a pod on each side. The pieces are
// merged by material once and shared by every drone after that — four draw
// calls each rather than forty.
const prism = (r, h, sides = 8) => new THREE.CylinderGeometry(r, r, h, sides);
const cone = (top, bottom, h, sides = 8) => new THREE.CylinderGeometry(top, bottom, h, sides);
const slab = (w, h, d) => new THREE.BoxGeometry(w, h, d);

const _at = new THREE.Vector3();
const _turn = new THREE.Quaternion();
const _spin = new THREE.Euler();
const _scale = new THREE.Vector3();
const _place = new THREE.Matrix4();

function put(into, geo, at, scale = [1, 1, 1], turn = [0, 0, 0]) {
  _spin.set(turn[0], turn[1], turn[2]);
  _place.compose(_at.set(at[0], at[1], at[2]), _turn.setFromEuler(_spin),
                 _scale.set(scale[0], scale[1], scale[2]));
  into.push(geo.applyMatrix4(_place));
}

const WIDE = [1.34, 1, 1.06];

function canopy({ shell, dark, beacon }, s) {
  put(shell, cone(s * 0.66, s * 1.0, s * 0.46), [0, s * 0.36, 0], WIDE);
  put(shell, prism(s * 0.62, s * 0.07), [0, s * 0.6, 0], WIDE);
  put(dark, cone(s * 1.0, s * 0.92, s * 0.16), [0, s * 0.1, 0], WIDE);

  // The crest on the hood, and the same mark again on the back panel.
  put(shell, prism(s * 0.2, s * 0.03, 3), [0, s * 0.64, s * 0.1], [1, 1, 0.7], [0, Math.PI, 0]);

  for (const side of [-1, 1]) {
    put(dark, slab(s * 0.06, s * 0.05, s * 0.34), [side * s * 0.72, s * 0.42, s * 0.16]);
    put(dark, slab(s * 0.06, s * 0.05, s * 0.22), [side * s * 0.86, s * 0.34, -s * 0.3]);
  }

  // The lamp is read from wherever the player happens to be, and the player is
  // nearly always above it: a panel across the top of the hood, sunk into a
  // dark recess so the colour has something to sit against.
  put(dark, slab(s * 0.72, s * 0.06, s * 0.36), [0, s * 0.62, -s * 0.22]);
  put(beacon, slab(s * 0.58, s * 0.07, s * 0.22), [0, s * 0.66, -s * 0.22]);
  for (const side of [-1, 1]) {
    put(beacon, slab(s * 0.12, s * 0.06, s * 0.12), [side * s * 0.36, s * 0.65, s * 0.04]);
  }
}

function chassis({ dark, lens }, s) {
  put(dark, cone(s * 0.92, s * 0.7, s * 0.26), [0, -s * 0.06, 0], WIDE);
  put(dark, cone(s * 0.66, s * 0.44, s * 0.14), [0, -s * 0.24, 0], [1.2, 1, 1.05]);
  put(dark, new THREE.ConeGeometry(s * 0.4, s * 0.66, 4), [0, -s * 0.56, 0],
      [1, 1, 1.2], [0, Math.PI / 4, 0]);
  put(lens, slab(s * 0.14, s * 0.05, s * 0.03), [0, -s * 0.5, s * 0.19]);
}

function face({ shell, dark, lens, beacon }, s) {
  // Stood forward of the shoulder band and above it: at the height that band is
  // widest it reaches further out than the nose does, and an eye behind it is
  // an eye nothing in front of the machine can see.
  const flat = [Math.PI / 2, 0, 0];
  put(dark, prism(s * 0.52, s * 0.16), [0, s * 0.26, s * 0.86], [1.2, 1, 1], flat);
  put(dark, prism(s * 0.3, s * 0.1), [0, s * 0.26, s * 0.99], [1, 1, 1], flat);
  // The eye is part of the lamp, not part of the trim: what it says behind it
  // is the same thing it says to whatever it is looking at.
  put(beacon, prism(s * 0.17, s * 0.07), [0, s * 0.26, s * 1.05], [1, 1, 1], flat);

  for (const side of [-1, 1]) {
    put(dark, prism(s * 0.13, s * 0.09), [side * s * 0.4, s * 0.27, s * 0.94], [1, 1, 1], flat);
    put(lens, prism(s * 0.07, s * 0.05), [side * s * 0.4, s * 0.27, s * 0.99], [1, 1, 1], flat);
    put(shell, slab(s * 0.22, s * 0.05, s * 0.04), [side * s * 0.6, s * 0.4, s * 0.78]);
  }
  put(shell, slab(s * 0.3, s * 0.03, s * 0.03), [0, s * 0.5, s * 0.74]);
}

// Vents across the back, with the strips the machine talks in set into them.
function stern({ shell, dark, beacon }, s) {
  put(dark, slab(s * 1.1, s * 0.4, s * 0.14), [0, s * 0.16, -s * 0.86]);
  put(shell, slab(s * 0.44, s * 0.3, s * 0.06), [0, s * 0.34, -s * 0.92]);
  put(dark, prism(s * 0.14, s * 0.03, 3), [0, s * 0.34, -s * 0.96], [1, 1, 0.7], [Math.PI / 2, 0, 0]);

  for (let i = -1; i <= 1; i++) {
    put(beacon, slab(s * 0.09, s * 0.26, s * 0.05), [i * s * 0.2, s * 0.12, -s * 0.94]);
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      put(dark, slab(s * 0.3, s * 0.03, s * 0.04),
          [side * s * 0.44, s * 0.03 + i * s * 0.09, -s * 0.94]);
    }
  }
}

function pods({ shell, dark, beacon }, s) {
  for (const side of [-1, 1]) {
    put(dark, slab(s * 0.34, s * 0.18, s * 0.34), [side * s * 1.2, s * 0.16, 0]);
    put(shell, prism(s * 0.32, s * 0.36), [side * s * 1.5, s * 0.16, 0],
        [1.18, 1, 0.84], [0, 0, Math.PI / 2]);
    // The pod strips speak with the lamp rather than sitting green: three
    // faces of the machine saying the same thing, so the cue is legible
    // whichever way it is pointed.
    put(beacon, slab(s * 0.06, s * 0.3, s * 0.04), [side * s * 1.5, s * 0.16, s * 0.28]);
    put(beacon, slab(s * 0.04, s * 0.26, s * 0.1), [side * s * 1.71, s * 0.16, 0]);
    put(dark, prism(s * 0.2, s * 0.05), [side * s * 1.71, s * 0.16, 0],
        [1.18, 1, 0.84], [0, 0, Math.PI / 2]);
  }
}

let GEO = null;
let MAT = null;
let BAND = null;

// The bands a machine wears while the flight is paying it. Cut short of a full
// circle so that turning them reads as turning, and built once for all of them:
// only which ones are shown and how high they sit is a drone's own business.
function bands() {
  const R = CFG.drone.rings;
  const s = CFG.drone.size;
  const geo = new THREE.TorusGeometry(s * R.radius, s * R.tube, 8, 40, Math.PI * R.arc)
    .rotateX(Math.PI / 2);
  BAND = {};
  for (const [key, color] of Object.entries(R.colors)) {
    BAND[key] = { geo, mat: new THREE.MeshBasicMaterial({ color, transparent: true,
                                                          opacity: R.opacity,
                                                          depthWrite: false }) };
  }
}

function forge() {
  const D = CFG.drone;
  const s = D.size;
  const parts = { shell: [], dark: [], lens: [], beacon: [] };
  canopy(parts, s);
  chassis(parts, s);
  face(parts, s);
  pods(parts, s);
  stern(parts, s);

  GEO = {};
  for (const key of Object.keys(parts)) GEO[key] = mergeGeometries(parts[key]);

  MAT = {
    shell: new THREE.MeshStandardMaterial({ color: D.color, roughness: 0.44,
                                            metalness: 0.22, flatShading: true }),
    dark: new THREE.MeshStandardMaterial({ color: D.trim, roughness: 0.58,
                                           metalness: 0.42, flatShading: true }),
    lens: new THREE.MeshBasicMaterial({ color: D.eye }),
    beacon: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  };
}

export function build() {
  if (!GEO) forge();
  if (!BAND) bands();
  const g = new THREE.Group();
  // Yaw first, then the tilt in the machine's own frame — so banking is about
  // the nose it is pointing rather than about the world.
  g.rotation.order = 'YXZ';

  for (const key of ['shell', 'dark', 'lens']) {
    const m = new THREE.Mesh(GEO[key], MAT[key]);
    m.castShadow = key !== 'lens';
    g.add(m);
  }
  // Its own copy of the one material it speaks with: every other panel is
  // shared, but no two drones say the same thing at the same moment.
  const led = new THREE.Mesh(GEO.beacon, MAT.beacon.clone());
  g.add(led);

  const rings = {};
  for (const [key, band] of Object.entries(BAND)) {
    const m = new THREE.Mesh(band.geo, band.mat);
    m.visible = false;
    rings[key] = m;
    g.add(m);
  }

  return { object: g, led, rings };
}
