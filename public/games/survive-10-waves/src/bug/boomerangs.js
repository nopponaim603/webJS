import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CFG } from '../config/index.js';
import { manager } from '../core/loading.js';
import { scene } from '../engine/view.js';
import { world } from '../core/world.js';
import { makePool } from '../core/pool.js';
import { between } from '../core/rng.js';
import { audio } from '../engine/audio.js';
import * as fx from '../fx/spatter.js';
import * as walls from '../arena/walls.js';
import { TRAIL_TEX } from '../fx/textures.js';
import { wrapPi } from '../core/geom2.js';
import * as evolve from './evolve.js';
import * as drone from '../allies/drone.js';
import * as graze from '../character/graze.js';
import * as dodge from '../character/dodge.js';
import * as modules from '../modules/index.js';

// One geometry and one material for every bone in the air: they are the same
// throw, and none of them animates a material of its own.
let bone = null;

function fallbackBone() {
  const s = CFG.boomerang.size;
  return {
    geo: new THREE.BoxGeometry(s, s * 0.12, s * 0.34),
    mat: new THREE.MeshStandardMaterial({ color: 0xd8cdb4, roughness: 0.7 }),
  };
}

// Baked flat and centred on itself, so the throw is a spin about its own middle
// and the plate lies in the plane the camera looks down on.
function adopt(gltf) {
  let found = null;
  gltf.scene.updateWorldMatrix(true, true);
  gltf.scene.traverse((o) => { if (!found && o.isMesh) found = o; });
  if (!found) return null;

  const geo = found.geometry.clone().applyMatrix4(found.matrixWorld);
  geo.computeBoundingBox();
  const size = geo.boundingBox.getSize(new THREE.Vector3());
  const mid = geo.boundingBox.getCenter(new THREE.Vector3());
  geo.translate(-mid.x, -mid.y, -mid.z);
  const fit = CFG.boomerang.size / Math.max(size.x, size.y);
  geo.scale(fit, fit, fit);
  geo.rotateX(-Math.PI / 2);
  return { geo, mat: found.material };
}

new GLTFLoader(manager).load(CFG.boomerang.model, (gltf) => {
  bone = adopt(gltf) || fallbackBone();
}, undefined, (e) => {
  console.warn(`boomerang model failed to load (${CFG.boomerang.model}) — using a primitive`, e);
  bone = fallbackBone();
});

// The whole flight is decided the moment it is thrown: a bent line that runs
// through where you stood and carries on past. The thread on the ground is that
// same curve, so what you see is exactly what will be flown.
function bezier(c, t, out) {
  const k = 1 - t;
  return out.set(k * k * c.sx + 2 * k * t * c.cx + t * t * c.ex,
                 CFG.boomerang.height,
                 k * k * c.sz + 2 * k * t * c.cz + t * t * c.ez);
}

// A standing ribbon, not a line: line width is one pixel whatever you ask for,
// and this has to read across the arena.
function makeThread() {
  const T = CFG.boomerang.thread;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(T.points * 6), 3));

  const uv = new Float32Array(T.points * 4);
  for (let i = 0; i < T.points; i++) {
    const u = i / (T.points - 1);
    uv[i * 4] = u;
    uv[i * 4 + 2] = u;
    uv[i * 4 + 3] = 1;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

  const idx = [];
  for (let i = 0; i < T.points - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
  }
  geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    map: TRAIL_TEX, color: T.color, transparent: true, opacity: T.opacity,
    depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }));
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  mesh.visible = false;
  scene.add(mesh);
  return mesh;
}

const _pt = new THREE.Vector3();
const _was = new THREE.Vector3();
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();

// Pooled apart from the bone that drew it: the arc has to hang on past the
// throw to fade out, and the bone itself is gone the moment it lands or is shot.
const threads = makePool(
  () => ({ mesh: makeThread(), want: 0 }),
  (t) => { t.mesh.material.opacity = 0; t.want = 1; },
);

function updateThreads(dt) {
  const T = CFG.boomerang.thread;
  for (let i = threads.live.length - 1; i >= 0; i--) {
    const t = threads.live[i];
    const mat = t.mesh.material;
    mat.opacity += (t.want * T.opacity - mat.opacity) * Math.min(1, T.ease * dt);
    if (!t.want && mat.opacity < 0.01) threads.release(i);
  }
}

// Walked as chords rather than sampled as points: a wall is thin enough to sit
// between two samples of the curve, and the line may not promise ground the
// throw cannot reach.
function stoppedAt(c) {
  const N = CFG.boomerang.thread.points - 1;
  bezier(c, 0, _a);
  for (let i = 1; i <= N; i++) {
    bezier(c, i / N, _b);
    const t = walls.blocks(_a.x, _a.z, _b.x, _b.z);
    if (t >= 0) return (i - 1 + t) / N;
    _a.copy(_b);
  }
  return 1;
}

function drawThread(b) {
  if (!b.thread) return;
  const T = CFG.boomerang.thread;
  const at = b.thread.mesh.geometry.getAttribute('position');
  const cut = stoppedAt(b.curve);
  for (let i = 0; i < T.points; i++) {
    bezier(b.curve, cut * (i / (T.points - 1)), _pt);
    at.setXYZ(i * 2, _pt.x, T.y, _pt.z);
    at.setXYZ(i * 2 + 1, _pt.x, T.y + T.height, _pt.z);
  }
  at.needsUpdate = true;
}

function dropThread(b) {
  if (!b.thread) return;
  b.thread.want = 0;
  b.thread = null;
}

const pool = makePool(
  () => {
    bone ||= fallbackBone();
    const mesh = new THREE.Mesh(bone.geo, bone.mat);
    mesh.castShadow = true;
    scene.add(mesh);
    // `pos` is the mesh's own vector, aliased rather than copied: everything
    // that reads a unit's position off it — the health bar, its label — then
    // reads a bone without either side knowing about the other.
    return { mesh, thread: null, pos: mesh.position,
             curve: { sx: 0, sz: 0, cx: 0, cz: 0, ex: 0, ez: 0 },
             t: 0, dur: 1, hurt: 1, phase: 0, wobble: 0, spin: 0,
             hp: 0, hpMax: 0, grow: 1, chase: null, head: 0 };
  },
  (b, curve, dur, hurt, grow, chase = null, hp = CFG.boomerang.hp) => {
    Object.assign(b.curve, curve);
    b.t = 0;
    b.dur = dur;
    b.hurt = hurt;
    b.grow = grow;
    b.mesh.scale.setScalar(grow);
    b.phase = Math.random() * Math.PI * 2;
    b.wobble = 1 + Math.random() * 0.5;
    b.spin = Math.random() * Math.PI * 2;
    b.hp = hp;
    b.hpMax = hp;
    b.chase = chase;
    bezier(b.curve, 0, b.mesh.position);
    b.head = Math.atan2(world.player.pos.x - b.mesh.position.x,
                        world.player.pos.z - b.mesh.position.z);
    b.mesh.visible = true;
    // A thrown arc promises the ground it will cross. A chaser promises
    // nothing: where it goes is up to where you go.
    b.thread = !chase && modules.sees('attacks') ? threads.spawn() : null;
    drawThread(b);
  },
);

function retire(i) {
  graze.settle(pool.live[i]);
  dropThread(pool.live[i]);
  pool.release(i);
}

export const live = pool.live;

const _ahead = new THREE.Vector3();

// The ground a bone is about to cross, as circles. A thrown arc is read off the
// curve it is already committed to; a chaser has no curve, so what it threatens
// is the line it is pointed down — which is as much as anything dodging it can
// know either.
export function threat(out) {
  const F = CFG.boomerang;
  for (const b of pool.live) {
    const wide = F.radius * b.grow + F.dodge;
    for (let i = 0; i <= F.look; i++) {
      if (b.chase) {
        const run = i * F.lookStep * b.chase.speed;
        _ahead.set(b.mesh.position.x + Math.sin(b.head) * run, 0,
                   b.mesh.position.z + Math.cos(b.head) * run);
      } else {
        bezier(b.curve, Math.min(1, b.t + i * F.lookStep / b.dur), _ahead);
      }
      out.push({ x: _ahead.x, z: _ahead.z, r: wide });
    }
  }
  return out;
}
export function clear() {
  for (const b of pool.live) b.thread = null;
  pool.clear();
  threads.clear();
}

export function damage(i, amount) {
  const b = pool.live[i];
  if (!b) return false;
  b.hp -= amount;
  if (b.hp > 0) {
    fx.sparks(b.mesh.position, 2);
    return false;
  }
  fx.sparks(b.mesh.position, 6);
  audio.playAt('hit', b.mesh.position.x, b.mesh.position.z, { rate: 1.6, gainScale: 0.5 });
  retire(i);
  return true;
}

// It leaves at a fixed angle off the line to you — the curve's own tangent at
// the start is the control point — and is made to cross you late, so what is
// left of the arc past you is a short run out.
function plan(sx, sz, side, mark) {
  const F = CFG.boomerang;
  const p = mark.pos;
  const dx = p.x - sx, dz = p.z - sz;
  const d = Math.hypot(dx, dz) || 1;
  const ux = dx / d, uz = dz / d;

  const V = F.vary;
  const turn = (F.launchDeg + (Math.random() * 2 - 1) * V.deg) * Math.PI / 180 * side;
  const wx = ux * Math.cos(turn) - uz * Math.sin(turn);
  const wz = ux * Math.sin(turn) + uz * Math.cos(turn);
  const k = F.bow * (1 + (Math.random() * 2 - 1) * V.bow) * d;

  const t = F.through + (Math.random() * 2 - 1) * V.through;
  const back = 1 - t * t;
  const mid = 2 * (1 - t) * t;
  return {
    sx, sz,
    cx: sx + wx * k, cz: sz + wz * k,
    ex: (p.x - back * sx - mid * k * wx) / (t * t),
    ez: (p.z - back * sz - mid * k * wz) / (t * t),
  };
}

function lengthOf(c) {
  let len = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  bezier(c, 0, a);
  for (let i = 1; i <= 12; i++) { bezier(c, i / 12, b); len += a.distanceTo(b); a.copy(b); }
  return len;
}

export function release(bug, mark = world.player) {
  const F = CFG.boomerang;
  const pos = bug.pos;
  const rush = evolve.throwSpeedMult(bug);
  const [lo, hi] = F.damage;
  const hurt = evolve.hit(bug, lo + Math.floor(Math.random() * (hi - lo + 1)));

  // They all leave from around the brooder; it is the arc that takes them out to
  // your flanks, half to each side.
  const n = evolve.boomerangCount(bug);
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1;
    const a = Math.random() * Math.PI * 2;
    const r = between(F.spawn);
    const c = plan(pos.x + Math.cos(a) * r, pos.z + Math.sin(a) * r, side, mark);
    pool.spawn(c, lengthOf(c) / (F.speed * rush * between(F.pace)), hurt, bug.grow || 1).by = bug;
  }
  audio.playAt('spit', pos.x, pos.z, { rate: 1.5, gainScale: 0.5 });
}

// One bone that comes after you, thrown from the boss's head. Its hit points
// are a share of the thrower's own, so it stays worth shooting at whatever the
// boss has grown into: a thing to be broken, not a projectile to flinch at.
// `veer` throws it off the line to you, so a handful sent together come round
// from different sides rather than flying as one.
export function chase(bug, C, veer = 0, speed = C.speed) {
  const from = bug.model.parts.head;
  const at = new THREE.Vector3();
  if (from) from.getWorldPosition(at);
  else at.set(bug.pos.x, (bug.model.parts.height || 2) * 0.8, bug.pos.z);

  const curve = { sx: at.x, sz: at.z, cx: at.x, cz: at.z, ex: at.x, ez: at.z };
  const b = pool.spawn(curve, 1, evolve.share(bug, C.share), C.size,
                       { speed, turn: C.turn },
                       Math.max(1, Math.round((bug.hpMax || bug.hp) * C.hp)));
  b.mesh.position.copy(at);
  b.head += veer;
  audio.playAt('spit', at.x, at.z, { rate: 0.7, gainScale: 0.8 });
  return b;
}

export function update(dt) {
  const F = CFG.boomerang;
  const p = world.player.pos;

  updateThreads(dt);

  for (let i = pool.live.length - 1; i >= 0; i--) {
    const b = pool.live[i];
    b.phase += b.wobble * dt;
    const pos = b.mesh.position;
    const was = _was.copy(pos);

    if (b.chase) {
      // It turns at a set rate rather than pointing straight at you, so it can
      // be led: overshoot it, and the arc it needs to come back round is the
      // ground you use to put a wall between you and it.
      const C = b.chase;
      const off = wrapPi(Math.atan2(p.x - pos.x, p.z - pos.z) - b.head);
      b.head += Math.max(-C.turn * dt, Math.min(C.turn * dt, off));
      pos.x += Math.sin(b.head) * C.speed * dt;
      pos.z += Math.cos(b.head) * C.speed * dt;
      pos.y = F.height + Math.sin(b.phase * 2.3 * b.wobble) * F.bob;
    } else {
      b.t += dt / b.dur;
      bezier(b.curve, Math.min(1, b.t), pos);
      pos.y += Math.sin(b.phase * 2.3 * b.wobble) * F.bob;
    }

    b.spin += F.spin * b.wobble * dt;
    b.mesh.rotation.set(F.tilt, b.spin, 0);

    // Swept like a bullet: the throw is fast enough to cross a wall between two
    // frames, and cover has to answer it.
    const wall = walls.blocks(was.x, was.z, pos.x, pos.z);
    if (wall >= 0) {
      pos.set(was.x + (pos.x - was.x) * wall, pos.y, was.z + (pos.z - was.z) * wall);
      fx.sparks(pos, 5);
      retire(i);
      continue;
    }

    const reach = CFG.player.radius + F.radius * b.grow;
    // A chaser draws no thread and so is not something the player was given a
    // chance to read: only a thrown arc pays.
    if (!b.chase) {
      graze.sweep(b, Math.hypot(p.x - pos.x, p.z - pos.z), reach, { from: b.by });
      dodge.sweeping(b, Math.hypot(p.x - pos.x, p.z - pos.z), b.by);
    }
    if (Math.hypot(p.x - pos.x, p.z - pos.z) < reach) {
      world.hooks.damagePlayer(b.hurt, { stacks: true, by: 'brooder' });
      fx.blood(pos, { power: 0.5, count: 5 });
      retire(i);
      continue;
    }

    // A machine in its way stops it just as a body does.
    const near = drone.nearest(pos.x, pos.z);
    if (near && Math.hypot(near.pos.x - pos.x, near.pos.z - pos.z)
        < near.radius + F.radius * b.grow) {
      drone.damage(near, b.hurt);
      fx.sparks(pos, 5);
      retire(i);
      continue;
    }
    // Only a thrown arc runs out. A chaser is ended by a wall, by you, or by
    // being shot out of the air.
    if (!b.chase && b.t >= 1) {
      fx.sparks(pos, 2);
      retire(i);
    }
  }
}
