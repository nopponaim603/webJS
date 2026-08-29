import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world, state } from '../core/world.js';
import { scene } from '../engine/view.js';
import { audio } from '../engine/audio.js';
import { makeGlow } from '../fx/glow.js';
import * as model from './models.js';
import * as walls from '../arena/walls.js';
import * as arena from '../arena/size.js';
import { makePool } from '../core/pool.js';
import { between } from '../core/rng.js';
import { ITEMS } from './catalog.js';

const K = CFG.items;

// What a plain drop wears where a marked one wears K.mark, so nothing that
// draws a drop has to ask which kind it is holding.
const PLAIN = { halo: 1, beam: 1, swell: 0, rate: 0 };
const marking = (item) => (item.mark ? K.mark : PLAIN);

// A band of light that fades out both ways, tiled up the tube: scrolling it is
// what makes the rungs climb, and a profile that never reaches the ends means
// there is no seam where the tile repeats.
function beamTexture() {
  const w = 8, h = 128;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');

  const band = g.createLinearGradient(0, h, 0, 0);
  band.addColorStop(0.00, 'rgba(255,255,255,0)');
  band.addColorStop(0.30, 'rgba(255,255,255,0.85)');
  band.addColorStop(0.42, 'rgba(255,255,255,0.30)');
  band.addColorStop(0.70, 'rgba(255,255,255,0)');
  g.fillStyle = band;
  g.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, K.beam.bands);
  return tex;
}

// One unit tall with its foot on the floor, so scaling it is setting its height.
const TUBE = new THREE.CylinderGeometry(1, 1, 1, 24, 1, true).translate(0, 0.5, 0);

let BEAM_TEX = null;

function build() {
  const group = new THREE.Group();


  // Beside the canister rather than under it, so `halo.size` is a size in the
  // world rather than a multiple of whatever it happens to be hung on.
  const halo = makeGlow(0xffffff, K.halo.size, K.halo.opacity);

  if (!BEAM_TEX) BEAM_TEX = beamTexture();
  const beam = new THREE.Mesh(TUBE, new THREE.MeshBasicMaterial({
    map: BEAM_TEX, transparent: true, opacity: K.beam.opacity, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }));
  beam.scale.set(K.beam.radius, K.beam.height, K.beam.radius);
  beam.renderOrder = 3;

  group.add(halo, beam);
  group.visible = false;
  scene.add(group);
  // Bodies are built the first time a shape is actually asked for and kept
  // after: one item in the catalog builds one shape, and the pool can still
  // hand the same drop back out as something else later.
  return { mesh: group, bodies: {}, body: null, halo, beam, item: null, t: 0 };
}

function wear(o, item) {
  const kind = item.shape || 'canister';
  if (!o.bodies[kind]) {
    o.bodies[kind] = model.build(kind);
    o.mesh.add(o.bodies[kind].object);
  }
  for (const [name, made] of Object.entries(o.bodies)) made.object.visible = name === kind;
  o.body = o.bodies[kind];
  model.dress(o.body, item);
}

const pool = makePool(build, (o, at, item) => {
  o.item = item;
  o.t = 0;
  o.taken = 0;
  o.mesh.position.set(at.x, 0, at.z);
  wear(o, item);
  o.body.object.position.y = K.rest;
  o.body.object.rotation.y = Math.random() * Math.PI * 2;
  o.body.object.scale.setScalar(0);
  o.halo.position.y = K.rest;
  // A drop handed back after being taken is still wearing the end of its own
  // vanish, so everything the animation moved is put back where it started.
  o.halo.material.opacity = K.halo.opacity;
  o.beam.scale.set(K.beam.radius * marking(item).beam, K.beam.height,
                   K.beam.radius * marking(item).beam);
  for (const part of [o.halo.material, o.beam.material]) part.color.setHex(item.color);
});

// What a wave has left to give, and which wave it was rolled for. The roll waits
// for the first kill rather than being made on the clear: a round is torn down
// before the wave that follows it is known. clear() forgets the wave as well as
// the purse, so a retry is as generous as a first attempt and nothing has to be
// carried in the save.
let budget = 0;
let rolledFor = 0;

function payingRange(wave) {
  if (K.byWave[wave]) return K.byWave[wave];
  const L = K.late;
  if (wave < L.from) return K.perWave;
  const up = Math.floor((wave - L.from) / L.every) * L.step;
  return [L.count[0] + up, L.count[1] + up];
}

function purse() {
  if (rolledFor !== state.wave) {
    rolledFor = state.wave;
    budget = Math.round(between(payingRange(state.wave)));
  }
  return budget;
}

export function clear() {
  pool.clear();
  arrow.visible = false;
  rolledFor = 0;
}

// An item nothing on the player can use is not on the table, and its weight
// goes back to the ones that are rather than being rolled and thrown away.
const offered = () => ITEMS.filter((item) => !item.offer || item.offer());

function pick() {
  const pool = offered();
  let total = 0;
  for (const item of pool) total += item.weight;
  let r = Math.random() * total;
  for (const item of pool) { r -= item.weight; if (r <= 0) return item; }
  return pool[pool.length - 1];
}

const _at = new THREE.Vector3();

// Ground worth leaving a thing on: not tucked against a wall where it cannot be
// seen or reached, not out past the rim, and not on top of what is already
// lying there.
function open(x, z) {
  if (walls.inside(x, z, K.clear)) return false;
  if (Math.hypot(x, z) > arena.radius() - K.rim) return false;
  for (const o of pool.live) {
    if (Math.hypot(x - o.mesh.position.x, z - o.mesh.position.z) < K.apart) return false;
  }
  return true;
}

// Walked outward from where it fell, a ring at a time, so a drop stays with the
// kill that earned it whenever the kill happened on open ground. Null is a
// legitimate answer: some corners have nowhere to put anything.
function place(at) {
  if (open(at.x, at.z)) return _at.copy(at);

  for (let ring = 1; ring <= K.tries; ring++) {
    const step = K.apart * ring;
    const turn = Math.random() * Math.PI * 2;
    for (let i = 0; i < 8; i++) {
      const a = turn + (i / 8) * Math.PI * 2;
      const x = at.x + Math.cos(a) * step;
      const z = at.z + Math.sin(a) * step;
      if (open(x, z)) return _at.set(x, 0, z);
    }
  }
  return null;
}

// Put one on the floor, asking nothing about budgets or luck: what the wave
// decides is rollOn's business, and the debug menu has already decided. A spot
// with nothing better going for it still gets the item — a button that produces
// nothing is a button that looks broken.
export function drop(at, item) {
  pool.spawn(place(at) || _at.copy(at), item);
}

// What is still lying about, by id or in total — a scripted wave asks so it can
// hold a part open until its own drops are in hand. One being collected is
// already spoken for and does not count.
export const lying = (id) =>
  pool.live.reduce((n, o) => n + (!o.taken && (!id || o.item.id === id) ? 1 : 0), 0);

// Offered every kill the run makes. A bug worth no coins is worth no loot
// either: whatever it is, it was not earned.
export function rollOn(bug, at) {
  if (purse() <= 0 || pool.live.length >= K.maxOut) return;
  if (!bug || bug.coins <= 0) return;
  if (Math.random() >= K.chance) return;

  // The budget is spent on an item that is actually lying somewhere, not on one
  // the arena had no room for.
  const spot = place(at);
  if (!spot) return;
  budget -= 1;
  pool.spawn(spot, pick());
}

// The same pointer the boss's drop puts up, for the same reason: what you have
// to walk to is off screen more often than not. One arrow for the whole floor —
// it finds the nearest, and the rest wait their turn.
function buildArrow() {
  const A = K.arrow;
  const mesh = new THREE.Mesh(
    new THREE.ConeGeometry(0.42 * A.size, 1.15 * A.size, 4),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85 }),
  );
  mesh.rotation.order = 'YXZ';
  mesh.renderOrder = 2;
  mesh.visible = false;
  scene.add(mesh);
  return mesh;
}

const arrow = buildArrow();
const _to = new THREE.Vector3();

function nearest(p, marked) {
  let near = null, best = Infinity;
  for (const o of pool.live) {
    if (o.taken || (marked && !o.item.mark)) continue;
    const gap = Math.hypot(o.mesh.position.x - p.x, o.mesh.position.z - p.z);
    if (gap < best) { best = gap; near = o; }
  }
  return near && { o: near, gap: best };
}

// A marked drop takes the arrow off whatever is nearer: it is the thing the
// wave wants walked to, and the rest can wait their turn behind it.
function aimArrow(t) {
  const p = world.player.pos;
  const found = nearest(p, true) || nearest(p, false);

  if (!found || found.gap < K.arrow.near) { arrow.visible = false; return; }

  const { o, gap } = found;
  const M = marking(o.item);
  const swing = Math.sin(t * (M.rate || 4));
  _to.set(o.mesh.position.x - p.x, 0, o.mesh.position.z - p.z).divideScalar(gap);
  arrow.visible = true;
  arrow.material.color.setHex(o.item.color);
  arrow.position.set(p.x + _to.x * K.arrow.dist,
                     K.arrow.y + swing * 0.08,
                     p.z + _to.z * K.arrow.dist);
  arrow.rotation.set(Math.PI / 2, Math.atan2(_to.x, _to.z), 0);
  arrow.scale.setScalar(1 + M.swell * 2 * swing);
  arrow.material.opacity = o.item.mark ? 0.75 + swing * 0.25 : 0.55 + swing * 0.2;
}

const beat = (cfg, t) => 1 + cfg.pulse * Math.sin(t * cfg.pulseRate);

// Overshoots one and comes back, which is what makes a thing appearing read as
// landing rather than as being switched on.
const pop = (k) => {
  const back = 1.9;
  const u = k - 1;
  return 1 + (back + 1) * u * u * u + back * u * u;
};

// Lying on the floor: rising into its hover, breathing, and turning. The turn
// starts fast and winds down into its idle rate over the same beat the pop
// takes, so the thing lands rather than arrives already settled.
function settle(o, dt) {
  const D = K.drop;
  const born = Math.min(1, o.t / D.time);
  const rise = 1 - Math.exp(-K.riseEase * o.t);
  const bob = Math.sin(o.t * K.bobRate) * K.bob;

  o.body.object.position.y = K.rest + (K.hover - K.rest + bob) * rise;
  o.body.object.rotation.y += K.spin * (1 + D.spin * (1 - born)) * dt;
  o.body.object.scale.setScalar(pop(born));
  const M = marking(o.item);
  const swell = 1 + M.swell * Math.sin(o.t * M.rate);

  o.halo.position.y = o.body.object.position.y;
  o.halo.scale.setScalar(K.halo.size * M.halo * swell * beat(K.halo, o.t) * born);
  o.beam.rotation.y += K.beam.spin * dt;
  o.beam.material.opacity = K.beam.opacity * swell * beat(K.beam, o.t) * rise;
}

// Taken: up at the player, winding up and shrinking out of the world. The item
// itself is already in hand — this is only what is left of it on the floor.
function vanish(o, dt) {
  const T = K.take;
  const k = Math.min(1, o.taken / T.time);
  const gone = k * k;

  o.body.object.position.y = K.hover + T.rise * k;
  o.body.object.rotation.y += K.spin * T.spin * dt;
  o.body.object.scale.setScalar(Math.max(0.001, 1 - gone));
  o.halo.position.y = o.body.object.position.y;
  // The halo goes the other way: it swells as it fades, so the last of an item
  // is a flare rather than a thing getting quietly smaller.
  o.halo.scale.setScalar(K.halo.size * marking(o.item).halo * (1 + k));
  o.halo.material.opacity = K.halo.opacity * (1 - k);
  o.beam.material.opacity = K.beam.opacity * (1 - k);
  o.beam.scale.y = K.beam.height * (1 - gone);
}

let clock = 0;

// What was taken on the frame it is taken, and null on every other — the same
// contract the boss's drop keeps, so the caller reads both the same way.
export function update(dt) {
  const p = world.player;
  const able = !p.dead && p.held <= 0;
  let taken = null;

  // Once for every tube rather than once for each: the rungs are one texture,
  // and advancing it a drop at a time would run it faster the more are out.
  if (BEAM_TEX) BEAM_TEX.offset.y -= K.beam.scroll * dt;

  for (let i = pool.live.length - 1; i >= 0; i--) {
    const o = pool.live[i];
    o.t += dt;

    if (o.taken) {
      o.taken += dt;
      vanish(o, dt);
      if (o.taken >= K.take.time) pool.release(i);
      continue;
    }
    settle(o, dt);

    if (taken || !able) continue;
    const gap = Math.hypot(p.pos.x - o.mesh.position.x, p.pos.z - o.mesh.position.z);
    if (gap >= K.touch) continue;

    // Handed over on the frame it is touched; what is left on the floor spends
    // the next few frames leaving, and cannot be picked up twice.
    audio.playAt('itemTake', o.mesh.position.x, o.mesh.position.z);
    taken = o.item;
    o.taken = 1e-6;
  }

  clock += dt;
  aimArrow(clock);
  return taken;
}
