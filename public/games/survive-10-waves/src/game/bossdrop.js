import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { world } from '../core/world.js';
import { audio } from '../engine/audio.js';
import { clip } from '../arena/clip.js';
import { ZONE_TEX, ZONE_FILL } from '../fx/textures.js';
import { makeGlow } from '../fx/glow.js';
import * as dronemodel from '../allies/dronemodel.js';

const K = CFG.bossDrop;

const BRASS = new THREE.MeshStandardMaterial({
  color: K.color, emissive: K.emissive, emissiveIntensity: 1.1,
  metalness: 0.6, roughness: 0.3,
});

const DISC = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

// Bright on the floor and gone by the top, with soft streaks down it so the slow
// turn of the shaft reads as light moving rather than a still tube.
function beamTexture() {
  const w = 64, h = 128;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');

  const up = g.createLinearGradient(0, h, 0, 0);
  up.addColorStop(0.00, 'rgba(255,255,255,0.9)');
  up.addColorStop(0.30, 'rgba(255,255,255,0.42)');
  up.addColorStop(1.00, 'rgba(255,255,255,0)');
  g.fillStyle = up;
  g.fillRect(0, 0, w, h);

  g.globalCompositeOperation = 'destination-out';
  for (const x of [7, 25, 43, 58]) {
    const dim = g.createLinearGradient(x - 6, 0, x + 6, 0);
    dim.addColorStop(0.0, 'rgba(0,0,0,0)');
    dim.addColorStop(0.5, 'rgba(0,0,0,0.5)');
    dim.addColorStop(1.0, 'rgba(0,0,0,0)');
    g.fillStyle = dim;
    g.fillRect(x - 6, 0, 12, h);
  }
  g.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function keyProp() {
  const group = new THREE.Group();

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.085, 8, 20), BRASS);
  ring.position.y = 0.44;

  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.66, 8), BRASS);
  shaft.position.y = -0.02;

  group.add(ring, shaft);
  for (const [y, w] of [[-0.14, 0.3], [-0.3, 0.2]]) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, 0.11), BRASS);
    tooth.position.set(w * 0.5 + 0.06, y, 0);
    group.add(tooth);
  }
  for (const part of group.children) part.castShadow = true;
  return group;
}

// The machine itself, standing in the beam at the size it will fly at, so what
// is being handed over is what shows up on the next wave.
function droneProp() {
  const group = new THREE.Group();
  const body = dronemodel.build().object;
  body.scale.setScalar(K.droneScale);
  group.add(body);
  return group;
}

const props = {};

function propOf(kind) {
  if (!props[kind]) {
    const group = kind === 'drone' ? droneProp() : keyProp();
    group.add(makeGlow(K.halo.color, K.halo.size, K.halo.opacity));
    group.visible = false;
    scene.add(group);
    props[kind] = group;
  }
  return props[kind];
}

// Both halves stand on the ground rather than riding with the drop: the circle
// says where it is, and the shaft of light over it is what carries across the
// arena.
function buildMark() {
  const group = new THREE.Group();

  const pool = new THREE.Mesh(DISC, clip(new THREE.MeshBasicMaterial({
    map: ZONE_TEX.disc, color: K.pool.color, transparent: true,
    opacity: K.pool.opacity, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  })));
  pool.position.y = 0.05;
  pool.renderOrder = 3;

  const B = K.beam;
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(B.radius * B.flare, B.radius, B.height, 24, 1, true)
      .translate(0, B.height * 0.5, 0),
    new THREE.MeshBasicMaterial({
      map: beamTexture(), color: B.color, transparent: true, opacity: B.opacity,
      depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    }),
  );
  beam.renderOrder = 3;

  group.add(pool, beam);
  group.visible = false;
  scene.add(group);
  return group;
}

// The same arrow the extraction pad puts up, for the same reason: what you have
// to walk to is off screen more often than not.
function buildArrow() {
  const A = K.arrow;
  const mesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.42 * A.size, 1.15 * A.size, 4),
    new THREE.MeshBasicMaterial({ color: A.color, transparent: true, opacity: 0.85 }),
  );
  mesh.rotation.order = 'YXZ';
  mesh.renderOrder = 2;
  mesh.visible = false;
  scene.add(mesh);
  return mesh;
}

const mark = buildMark();
const [pool, beam] = mark.children;
const arrow = buildArrow();

const _to = new THREE.Vector3();

let out = null;
let prop = null;

export const pending = () => !!out;

export function clear() {
  out = null;
  if (prop) prop.visible = false;
  prop = null;
  mark.visible = false;
  arrow.visible = false;
}

export function drop(at, kind = 'key') {
  out = { t: 0, kind };
  prop = propOf(kind);
  prop.position.set(at.x, K.rest, at.z);
  prop.rotation.y = Math.random() * Math.PI * 2;
  prop.visible = true;
  mark.position.set(at.x, 0, at.z);
  mark.visible = true;
}

const gap = () => {
  const p = world.player.pos;
  return Math.hypot(p.x - prop.position.x, p.z - prop.position.z);
};

// Nothing is picked up out of hands the player does not have: dead, or held
// while the camera is off watching the boss pay out. Walking into it is what
// takes it, the same as any other thing left on the floor.
export const inReach = () => {
  const p = world.player;
  return !!out && !p.dead && p.held <= 0 && gap() < K.reach;
};

const beat = (cfg, t) => 1 + cfg.pulse * Math.sin(t * cfg.pulseRate);

function aimArrow(t) {
  const p = world.player.pos;
  const d = gap();
  if (d < K.reach) { arrow.visible = false; return; }

  _to.set(prop.position.x - p.x, 0, prop.position.z - p.z).divideScalar(d);
  arrow.visible = true;
  arrow.position.set(p.x + _to.x * K.arrow.dist,
                     K.arrow.y + Math.sin(t * 4) * 0.08,
                     p.z + _to.z * K.arrow.dist);
  arrow.rotation.set(Math.PI / 2, Math.atan2(_to.x, _to.z), 0);
  arrow.material.opacity = 0.55 + Math.sin(t * 4) * 0.2;
}

// What was taken on the frame it is taken, and null on every other: the caller
// decides what a wave does once the boss's drop is in hand.
export function update(dt) {
  if (!out) return null;

  out.t += dt;
  const rise = 1 - Math.exp(-K.riseEase * out.t);
  const bob = Math.sin(out.t * K.bobRate) * K.bob;
  prop.position.y = K.rest + (K.hover - K.rest + bob) * rise;
  prop.rotation.y += K.spin * dt;

  const halo = prop.children[prop.children.length - 1];
  halo.scale.setScalar(K.halo.size * beat(K.halo, out.t));
  pool.scale.setScalar((K.pool.size / ZONE_FILL) * beat(K.pool, out.t));
  beam.rotation.y += K.beam.spin * dt;
  beam.material.opacity = K.beam.opacity * beat(K.beam, out.t) * rise;
  aimArrow(out.t);

  if (!inReach()) return null;
  audio.playAt('rigLock', prop.position.x, prop.position.z);
  const { kind } = out;
  clear();
  return kind;
}
