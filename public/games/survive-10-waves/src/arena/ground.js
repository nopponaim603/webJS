import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { renderer, scene } from '../engine/view.js';
import { manager } from '../core/loading.js';
import * as size from './size.js';
import { clip, setCut } from './clip.js';

function makeVignetteTexture() {
  const k = CFG.arena.vignette;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 40, 128, 128, 128);
  g.addColorStop(0.00, 'rgba(0,0,0,0)');
  g.addColorStop(0.72, `rgba(0,0,0,${0.10 * k})`);
  g.addColorStop(1.00, `rgba(2,4,7,${0.62 * k})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let fence = null;
let edge = null;
let floor = null;
let fitted = -1;
let heat = 0;
let pulse = 0;
let beat = -1;
let lit = 0;

const COOL = 0x60c8f0;
const _rim = new THREE.Color();
const _hot = new THREE.Color();

const loader = new THREE.TextureLoader(manager);

function floorMaterial() {
  const repeat = (CFG.arena.max * 2) / CFG.arena.tileWorldSize;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const setup = (t, srgb) => {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.anisotropy = maxAniso;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };

  const surface = CFG.arena.normal
    ? { normalMap: setup(loader.load(CFG.arena.normal), false),
        normalScale: new THREE.Vector2(CFG.arena.bumpScale, CFG.arena.bumpScale) }
    : { bumpMap: setup(loader.load(CFG.arena.terrain), false),
        bumpScale: CFG.arena.bumpScale };

  return clip(new THREE.MeshStandardMaterial({
    map: setup(loader.load(CFG.arena.terrain), true),
    ...surface,
    color: CFG.arena.tint,
    roughness: CFG.arena.roughness,
    metalness: 0.0,
  }));
}

// A fresh material rather than swapped maps: a theme with a normal map and one
// with a bump map compile to different shaders.
export function retexture() {
  if (!floor) return;
  const old = floor.material;
  floor.material = floorMaterial();
  for (const map of [old.map, old.normalMap, old.bumpMap]) map?.dispose();
  old.dispose();
}

export function build() {
  const R = CFG.arena.max;

  floor = new THREE.Mesh(new THREE.CircleGeometry(R, 96), floorMaterial());
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  if (CFG.arena.vignette > 0) {
    const v = new THREE.Mesh(
      new THREE.CircleGeometry(R, 96),
      clip(new THREE.MeshBasicMaterial({ map: makeVignetteTexture(), transparent: true, depthWrite: false })),
    );
    v.rotation.x = -Math.PI / 2;
    v.position.y = 0.03;
    scene.add(v);
  }

  if (CFG.arena.showGrid) {
    const grid = new THREE.GridHelper(R * 2, 46, 0x3d5a72, 0x28313c);
    grid.position.y = 0.02;
    grid.material.transparent = true;
    grid.material.opacity = 0.35;
    scene.add(grid);
  }

  fence = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, CFG.arena.wallHeight, 96, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x2f7fa8, side: THREE.BackSide, transparent: true, opacity: 0.28 }),
  );
  fence.position.y = CFG.arena.wallHeight / 2;
  scene.add(fence);

  edge = new THREE.Mesh(
    new THREE.RingGeometry(1, 1, 96),
    new THREE.MeshBasicMaterial({ color: 0x60c8f0, side: THREE.DoubleSide, transparent: true, opacity: 0.75 }),
  );
  edge.rotation.x = -Math.PI / 2;
  edge.position.y = 0.05;
  scene.add(edge);

  fit();
}

// Nought is the arena's own edge and one is the edge eating it; the collapse
// runs past one for the moment it starts. Recorded rather than applied, so a
// frame that moves the ring and the heat together rebuilds the rim once.
export function setHeat(k) { heat = k; }

// A strike on the rim's colour, and only its colour. Heat is what the ring is
// doing — how far the edge has been eaten into, how wide it burns — so beating
// on it would say the ground was moving when it is only the music.
export function setPulse(k) { pulse = k; }

export function fit() {
  const C = CFG.arena.collapse;
  const r = size.radius();
  // The rim is rebuilt geometry; the pulse is not. A beat every three quarters
  // of a second must not throw a ring away and cut a new one.
  const recut = r !== fitted || heat !== lit;
  fitted = r;
  lit = heat;
  beat = pulse;
  setCut(r);
  fence.scale.set(r, 1, r);
  // Through the hues rather than straight across the channels: cyan mixed into
  // orange on a straight line passes through a washed pink, where going round
  // reads as the rim heating up. Struck past white on the beat, which the tone
  // map carries as brightness rather than as a wash.
  _rim.setHex(COOL).lerpHSL(_hot.setHex(C.heat), Math.min(1, heat * 2.2));
  if (pulse > 0) {
    _rim.lerp(_hot.setHex(C.strike), Math.min(1, pulse));
    _rim.multiplyScalar(1 + pulse * C.punch);
  }
  fence.material.color.copy(_rim);
  fence.material.opacity = 0.24 + 0.46 * Math.min(1, heat);
  edge.material.color.copy(_rim);
  edge.material.opacity = 0.75 + 0.25 * Math.min(1, heat);
  if (!recut) return;
  edge.geometry.dispose();
  edge.geometry = new THREE.RingGeometry(r - 0.35 - C.rimWidth * heat, r, 96);
}

// The wave step and the collapse both move the ring, so what is on screen is
// chased rather than tied to either one of them.
export function update(dt) {
  if (size.moving()) size.advance(dt);
  if (size.radius() !== fitted || heat !== lit || pulse !== beat) fit();
}
