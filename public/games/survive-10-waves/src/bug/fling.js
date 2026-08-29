import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import { scene } from '../engine/view.js';
import { makePool } from '../core/pool.js';
import { between } from '../core/rng.js';
import { audio } from '../engine/audio.js';
import { wrapPi } from '../core/geom2.js';
import * as modules from '../modules/index.js';
import * as evolve from './evolve.js';
import * as bugmodel from './model.js';
import * as arena from '../arena/size.js';
import * as fx from '../fx/spatter.js';
import * as drone from '../allies/drone.js';
import * as graze from '../character/graze.js';
import * as dodge from '../character/dodge.js';
import { poseThrow } from './gait.js';
import { cooling } from './kit.js';
import { clip } from '../arena/clip.js';
import { ZONE_TEX, ZONE_FILL } from '../fx/textures.js';

const DISC = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

// Where the pile comes down, drawn from the moment the first one leaves. It
// times itself out rather than being held by the thrower: a tank killed
// mid-volley leaves bugs in the air, and they still have to land somewhere.
const marks = makePool(
  () => {
    const mesh = new THREE.Mesh(DISC, clip(new THREE.MeshBasicMaterial({
      map: ZONE_TEX.disc, transparent: true, opacity: 0, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })));
    mesh.renderOrder = 3;
    scene.add(mesh);
    return { mesh, phase: 0, life: 0 };
  },
  (m, x, z, radius, life) => {
    m.mesh.position.set(x, 0.05, z);
    m.mesh.scale.setScalar((radius * 2) / ZONE_FILL);
    m.mesh.material.color.setHex(CFG.fling.mark.color);
    m.mesh.material.opacity = 0;
    m.phase = Math.random() * Math.PI * 2;
    m.life = life;
  },
);

export function clear() { marks.clear(); }

export function updateMarks(dt) {
  const M = CFG.fling.mark;
  for (let i = marks.live.length - 1; i >= 0; i--) {
    const m = marks.live[i];
    m.life -= dt;
    m.phase += dt * M.pulse;
    const want = m.life > 0
      ? M.opacity * (M.dim + (1 - M.dim) * (0.5 + 0.5 * Math.sin(m.phase))) : 0;
    const mat = m.mesh.material;
    mat.opacity += (want - mat.opacity) * Math.min(1, M.ease * dt);
    if (m.life <= 0 && mat.opacity < 0.01) marks.release(i);
  }
}

// Small enough to be picked up, and not already spoken for by something else.
// Flyers are out: nothing that lives in the air walks over to be gathered.
const takeable = (o, host, S) =>
  o !== host && !o.dummy && !o.type.fly && !o.rider && !o.board && !o.haul
  && !o.carried && !o.flight && !o.fling && !o.rush && !o.leap
  && bugmodel.spanOf(o.type) <= S.maxLength;

function around(host, S) {
  let n = 0;
  for (const o of world.bugs) {
    if (!takeable(o, host, S)) continue;
    if (Math.hypot(o.pos.x - host.pos.x, o.pos.z - host.pos.z) <= S.call) n += 1;
  }
  return n;
}

function callIn(host, S) {
  let room = S.max - host.fling.held.length;
  for (const o of world.bugs) if (o.haul === host) room -= 1;
  for (const o of world.bugs) {
    if (room <= 0) break;
    if (!takeable(o, host, S)) continue;
    if (Math.hypot(o.pos.x - host.pos.x, o.pos.z - host.pos.z) > S.call) continue;
    o.haul = host;
    room -= 1;
  }
}

function grabClose(host, S) {
  const held = host.fling.held;
  for (const o of world.bugs) {
    if (held.length >= S.max) return;
    if (o.haul !== host) continue;
    if (Math.hypot(o.pos.x - host.pos.x, o.pos.z - host.pos.z)
        > host.radius + o.radius + S.reach) continue;
    o.haul = null;
    o.carried = host;
    o.repos = null;
    o.way = null;
    o.knock.set(0, 0, 0);
    held.push(o);
  }
}

// Bunched against the tank's flanks in rings, jostling. Whatever the ring holds
// is what it is about to throw, so the pile is the whole telegraph.
function place(host, dt) {
  const H = CFG.fling.hold;
  const F = host.fling;
  F.turn += dt * H.spin;
  for (let i = 0; i < F.held.length; i++) {
    const b = F.held[i];
    const ring = Math.floor(i / H.perRing);
    const seat = i % H.perRing;
    const a = F.turn + (seat / H.perRing) * Math.PI * 2 + ring * H.stagger;
    const r = host.radius + b.radius * H.hug + ring * H.gap;
    b.pos.set(host.pos.x + Math.sin(a) * r, 0, host.pos.z + Math.cos(a) * r);
    b.alt = H.lift + Math.abs(Math.sin(F.turn * H.bobRate + i)) * H.bob;
    b.yaw = Math.atan2(host.pos.x - b.pos.x, host.pos.z - b.pos.z);
    b.model.object.position.set(b.pos.x, b.alt, b.pos.z);
    b.model.object.rotation.set(0, b.yaw, 0);
  }
}

// The tank reflected through the player: as far past them as the tank is short
// of them, on the same line. The volley is aimed once, off that line by up to
// `spreadDeg`, and a mark past the ring is pulled back onto it.
function aimAt(host, out) {
  const S = CFG.fling;
  const p = world.player.pos;
  const dx = p.x - host.pos.x, dz = p.z - host.pos.z;
  const reach = Math.hypot(dx, dz);
  const a = Math.atan2(dx, dz) + (Math.random() * 2 - 1) * S.spreadDeg * Math.PI / 180;
  out.set(p.x + Math.sin(a) * reach, 0, p.z + Math.cos(a) * reach);
  arena.confine(out, S.inset);
  return out;
}

const _drop = new THREE.Vector3();
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

// Every body gets its own ground. Turned by the golden angle and stepped out
// from the middle a body at a time, the load fills the mark evenly instead of
// heaping wherever the rolls happen to agree.
function launch(host, bug, F) {
  const S = CFG.fling;
  const a = F.fan + F.thrown * GOLDEN;
  const d = Math.sqrt((F.thrown + 0.5) / F.count) * S.pile * between(S.pileVary);
  _drop.set(F.aim.x + Math.cos(a) * d, 0, F.aim.z + Math.sin(a) * d);
  arena.confine(_drop, bug.radius);
  F.thrown += 1;

  bug.carried = null;
  bug.repos = null;
  bug.hopWait = 0;
  bug.knock.set(0, 0, 0);
  bug.flight = {
    from: { x: bug.pos.x, y: bug.alt || 0, z: bug.pos.z },
    to: { x: _drop.x, z: _drop.z },
    out: { x: Math.cos(a), z: Math.sin(a) },
    t: 0, dur: between(S.flight), arc: S.arc * between(S.arcVary),
    spin: { x: between(S.spin), y: between(S.spin), z: between(S.spin) },
    volley: F, by: host,
  };
  audio.playAt('spit', host.pos.x, host.pos.z,
               { rate: 0.6 + Math.random() * 0.25, gainScale: 0.8 });
}

// A body coming down out of the sky. Only what is standing under it is hit —
// the pile is dodged by not being where it lands.
function impact(bug, S, volley, by) {
  const I = S.impact;
  const hurt = evolve.share(bug, I.damage);
  const p = world.player;
  const reach = I.radius + bug.radius;

  const dx = p.pos.x - bug.pos.x, dz = p.pos.z - bug.pos.z;
  // Keyed on the volley rather than the body, so a pile coming down around you
  // is one dodge however many of them missed.
  graze.sweep(volley, Math.hypot(dx, dz), reach, { from: by });
  const was = dodge.leaving();
  if (was && Math.hypot(was.x - bug.pos.x, was.z - bug.pos.z) <= reach) dodge.paid(was.x, was.z, by);
  if (dx * dx + dz * dz <= reach * reach) {
    world.hooks.damagePlayer(hurt, { from: bug, by: bug.type.key, ground: true });
  }
  for (const d of drone.list()) {
    if (Math.hypot(d.pos.x - bug.pos.x, d.pos.z - bug.pos.z) <= reach + d.radius) {
      drone.damage(d, hurt);
    }
  }
}

function land(bug) {
  const S = CFG.fling;
  const out = bug.flight.out;
  const volley = bug.flight.volley;
  const by = bug.flight.by;
  bug.flight = null;
  bug.alt = 0;
  bug.model.object.position.set(bug.pos.x, 0, bug.pos.z);
  bug.model.object.rotation.set(0, bug.yaw, 0);
  bug.knock.set(out.x, 0, out.z).multiplyScalar(S.impact.knock);

  fx.dirt(bug.model.object.position, S.impact.grit, 0.55);
  audio.playAt('stomp', bug.pos.x, bug.pos.z,
               { rate: 1.1 + Math.random() * 0.3, gainScale: 0.75 });
  impact(bug, S, volley, by);
}

// Held or in the air: either way its legs are not its own, so it owns its frame
// and everything step() would do with it is skipped.
export function airborne(bug, dt) {
  if (bug.carried) return true;
  const L = bug.flight;
  if (!L) return false;

  L.t += dt / L.dur;
  const k = Math.min(1, L.t);
  bug.pos.x = L.from.x + (L.to.x - L.from.x) * k;
  bug.pos.z = L.from.z + (L.to.z - L.from.z) * k;
  bug.alt = L.from.y * (1 - k) + L.arc * 4 * k * (1 - k);

  const obj = bug.model.object;
  obj.position.set(bug.pos.x, bug.alt, bug.pos.z);
  obj.rotation.x += L.spin.x * dt;
  obj.rotation.y += L.spin.y * dt;
  obj.rotation.z += L.spin.z * dt;

  if (k >= 1) land(bug);
  return true;
}

// Called in to be picked up. Same answer a bug gives when it is called aboard:
// it drops what it was doing and runs at the tank.
export function steer(bug, dir) {
  const host = bug.haul;
  if (!host) return false;
  if (!host.fling || host.fling.phase !== 'call' || host.hp <= 0) {
    bug.haul = null;
    return false;
  }
  const dx = host.pos.x - bug.pos.x, dz = host.pos.z - bug.pos.z;
  const gap = Math.hypot(dx, dz) || 1;
  bug.repos = null;
  dir.set(dx / gap, 0, dz / gap);
  return true;
}

// Everything the tank was holding goes back to walking. A tank killed with a
// full load simply puts it down.
export function drop(host) {
  const F = host.fling;
  if (!F) return;
  for (const b of F.held) {
    b.carried = null;
    b.alt = 0;
    b.repos = null;
    b.hopWait = 0;
  }
  F.held.length = 0;
  for (const o of world.bugs) if (o.haul === host) o.haul = null;
  host.fling = null;
}

// One of the gathered has died: the thrower must not keep a body on its list.
export function forget(bug) {
  const host = bug.carried;
  if (host && host.fling) {
    const at = host.fling.held.indexOf(bug);
    if (at >= 0) host.fling.held.splice(at, 1);
  }
  bug.carried = null;
  bug.haul = null;
  bug.flight = null;
}

function pose(bug, k) {
  poseThrow(bug.model.parts, k, CFG.bugAnim.throw, bug.model.object.quaternion);
}

function face(bug, dt) {
  const p = world.player.pos;
  const want = Math.atan2(p.x - bug.pos.x, p.z - bug.pos.z);
  const most = (bug.type.turnRate || CFG.bugAnim.turnRate) * dt;
  bug.yaw += Math.max(-most, Math.min(most, wrapPi(want - bug.yaw)));
}

function begin(bug, S) {
  bug.fling = { phase: 'call', t: S.gather, held: [], turn: 0, next: 0,
                thrown: 0, count: 0, fan: 0, aim: new THREE.Vector3() };
  bug.repos = null;
  bug.way = null;
  audio.playAt('bugAttack', bug.pos.x, bug.pos.z, { rate: 0.55, gainScale: 1.3 });
}

function finish(bug, S) {
  drop(bug);
  bug.flingCd = between(S.cooldown);
}

export function update(bug, dist, dt, held = false) {
  const S = CFG.fling;

  if (!bug.fling) {
    bug.flingCd -= cooling(bug, dt);
    if (held || bug.flingCd > 0 || (bug.level || 1) < S.learntAt) return false;
    if (dist > S.range || dist < S.minRange) return false;
    if (around(bug, S) < S.least) return false;
    begin(bug, S);
  }

  const F = bug.fling;
  F.t -= dt;
  bug.model.object.position.copy(bug.pos);
  bug.model.object.rotation.set(0, bug.yaw, 0);

  // Planted while it calls: it cannot chase and gather at the same time, and
  // standing still is what the attack costs it. It waits no longer than it has
  // to — a load worth throwing goes the moment it is in its arms.
  if (F.phase === 'call') {
    face(bug, dt);
    callIn(bug, S);
    grabClose(bug, S);
    place(bug, dt);
    pose(bug, -Math.min(1, 1 - Math.max(0, F.t) / S.gather));
    if (F.t > 0 && F.held.length < S.enough) return true;
    if (!F.held.length) { pose(bug, 0); finish(bug, S); return false; }

    F.phase = 'throw';
    F.next = 0;
    F.thrown = 0;
    F.count = F.held.length;
    F.fan = Math.random() * Math.PI * 2;
    aimAt(bug, F.aim);
    if (modules.sees('attacks') || S.alwaysWarn) {
      marks.spawn(F.aim.x, F.aim.z, S.pile + S.impact.radius, S.markLife);
    }
    audio.playAt('launch', bug.pos.x, bug.pos.z, { rate: 0.7, gainScale: 1.1 });
  }

  // One at a time out of one wind-up, each on its own beat, so fifteen bodies
  // leave in a ragged stream rather than as a single block.
  if (F.phase === 'throw') {
    place(bug, dt);
    pose(bug, 1 - 2 * Math.max(0, Math.min(S.gap[1], F.next)) / S.gap[1]);
    F.next -= dt;
    while (F.next <= 0 && F.held.length) {
      launch(bug, F.held.shift(), F);
      F.next += between(S.gap);
    }
    if (F.held.length) return true;
    F.phase = 'recover';
    F.t = S.recover;
  }

  pose(bug, Math.max(0, F.t) / S.recover);
  if (F.t > 0) return true;

  pose(bug, 0);
  finish(bug, S);
  return false;
}
