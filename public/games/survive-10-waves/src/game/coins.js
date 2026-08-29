import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import * as arena from '../arena/size.js';
import { world, state } from '../core/world.js';
import { makePool } from '../core/pool.js';
import { audio } from '../engine/audio.js';
import { GLOW_TEX } from '../fx/textures.js';
import * as floaters from '../ui/floaters.js';
import { overWaves } from './waveplan.js';

const GEO = new THREE.CylinderGeometry(CFG.coins.radius, CFG.coins.radius, CFG.coins.thickness, 14);

const G = CFG.coins.glow;

const MAT = {
  plain: new THREE.MeshStandardMaterial({
    color: 0xffc63d, emissive: 0xc98a1c, emissiveIntensity: 0.3,
    metalness: 0.8, roughness: 0.3,
  }),
  glow: new THREE.MeshStandardMaterial({
    color: G.color, emissive: G.emissive, emissiveIntensity: G.intensity,
    metalness: 0.75, roughness: 0.25,
  }),
};

// A sprite, not a plane: the coin spins and wobbles, and any flat quad parented
// to it turns edge-on with it. A sprite is always square to the camera, so the
// glow is a glow from every angle.
const HALO_MAT = new THREE.SpriteMaterial({
  map: GLOW_TEX, color: G.color, transparent: true, opacity: G.opacity,
  blending: THREE.AdditiveBlending, depthWrite: false,
});

const PLAIN = CFG.coins.kinds[CFG.coins.kinds.length - 1];

const pool = makePool(
  () => {
    const mesh = new THREE.Mesh(GEO, MAT.plain);

    mesh.castShadow = true;

    const halo = new THREE.Sprite(HALO_MAT);
    halo.visible = false;
    mesh.add(halo);

    // YXZ: under XYZ the spin is about the coin's own axis and shows nothing.
    mesh.rotation.order = 'YXZ';
    scene.add(mesh);
    return { mesh, halo, kind: PLAIN, vel: new THREE.Vector3(), spin: 0, taken: 0,
             settled: false, phase: 0, glowPhase: 0, arm: 0, chasing: false, chaseV: 0 };
  },
  (c, pos, kind = PLAIN, spread = 1) => {
    const C = CFG.coins;
    c.kind = kind;
    c.mesh.material = kind.glow ? MAT.glow : MAT.plain;
    c.halo.visible = kind.glow;
    c.halo.scale.setScalar(C.glow.halo / kind.size);
    c.glowPhase = Math.random() * Math.PI * 2;
    c.mesh.position.set(pos.x, pos.y + 0.3, pos.z);
    c.mesh.rotation.set(C.tilt, Math.random() * Math.PI * 2, 0);
    c.mesh.scale.setScalar(kind.size);
    c.vel.set((Math.random() - 0.5) * C.pop * spread, C.popUp * (0.8 + Math.random() * 0.45),
              (Math.random() - 0.5) * C.pop * spread);
    c.spin = (Math.random() < 0.5 ? -1 : 1) * (C.spin * (0.7 + Math.random() * 0.6));
    c.taken = 0;
    c.settled = false;
    c.arm = C.armTime;
    c.chasing = false;
    c.chaseV = C.chaseSpeed;

    c.phase = Math.random() * Math.PI * 2;
    c.mesh.visible = true;
  },
);

function release(i) { pool.release(i); }

// Value the floor cap pushed off the ground. It rides with the floor coins: paid
// out if the wave is cleared, lost with them if it is not.
let held = 0;

export function clear() { held = 0; pool.clear(); }

export function forfeit() { clear(); }

export const magnetRange = (wave) => overWaves(CFG.coins.magnet, wave);

export const sweeping = () => pool.live.length > 0;

function award(value) {
  state.coins += value;
  state.earned += value;
  state.waveEarned += value;
}

// The wave is over and every coin on the floor is yours: they come in on the
// magnet path so it reads as a sweep rather than a number changing.
export function collectAll() {
  for (const c of pool.live) { c.arm = 0; c.chasing = true; }
}

// Whatever is still on its way in when the wave closes is banked outright, so a
// coin that ran out of runway is never quietly dropped.
export function bank() {
  for (const c of pool.live) if (c.taken <= 0) award(c.kind.value);
  award(held);
  clear();
}

const _pos = new THREE.Vector3();

const sizeOf = (c) => CFG.coins.radius * c.kind.size;

// A coin thrown at the edge is a coin the player cannot reach. Off the ring or
// into a rock it comes back the way it came, the same bounce the floor gives it.
function bounceIn(c) {
  const m = c.mesh;
  const x = m.position.x, z = m.position.z;
  arena.confine(m.position, sizeOf(c));
  if (m.position.x === x && m.position.z === z) return;
  c.vel.x *= -0.35;
  c.vel.z *= -0.35;
}

const reach = (c, p) => {
  const dx = c.mesh.position.x - p.pos.x, dz = c.mesh.position.z - p.pos.z;
  return dx * dx + dz * dz;
};

// release() swap-pops, so there is no oldest to give up — furthest is the coin
// the player was least likely to reach. The cap is on how many coins are on the
// floor, not on what a wave pays, so the ones that go are held rather than lost.
// A batch each time the floor fills, since the scan that finds them costs the
// whole floor and a wave that buries it drops thousands of coins a second.
function holdFurthest() {
  const p = world.player;
  const going = new Set([...pool.live]
    .sort((a, b) => reach(b, p) - reach(a, p))
    .slice(0, Math.max(1, Math.round(pool.live.length * CFG.coins.evict))));

  // Backwards: a swap-pop moves the last coin into the hole, and the last coin
  // is one this walk has already had its answer about.
  for (let i = pool.live.length - 1; i >= 0; i--) {
    const c = pool.live[i];
    if (!going.has(c)) continue;
    if (c.taken <= 0) held += c.kind.value;
    release(i);
  }
}

function put(pos, kind, spread = 1) {
  if (pool.live.length >= CFG.coins.max) holdFurthest();
  pool.spawn(pos, kind, spread);
}

// One coin of a named value. For a payout that is a spectacle rather than a
// sum, and so wants its denominations counted out one at a time.
export function payOne(pos, value) {
  put(pos, CFG.coins.kinds.find((k) => k.value === value) || PLAIN);
}

const _pile = [];

// What a value comes to in coins: the first `plainFirst` of it in ones, the rest
// in the biggest denominations that fit.
function pile(n, out) {
  const C = CFG.coins;
  out.length = 0;
  let left = Math.max(0, Math.round(n));

  const ones = Math.min(left, C.plainFirst);
  for (let i = 0; i < ones; i++) out.push(PLAIN);
  left -= ones;

  for (const kind of C.kinds) {
    while (left >= kind.value) { out.push(kind); left -= kind.value; }
  }
  return out;
}

// Thrown wider the more there is to throw: one pop for every pile lands a fat
// one in a heap nobody can read or walk into. Coins cover ground by area, so the
// throw grows with the root of the count — and stops at `spreadMax`, past which
// a kill is scattering coins further than the player will ever chase them.
const spreadFor = (count) => Math.min(CFG.coins.spreadMax,
                                      Math.sqrt(count / CFG.coins.spreadAt));

// What a kill currently pays, as a fraction of what the bug is worth. A wave
// that floods the floor turns its own kills down without touching what it lays
// out by hand.
let rate = 1;
export const setPayRate = (k) => { rate = Math.max(0, k); };

// Rounded by chance rather than down: a quarter rate on a one-coin bug has to
// pay a quarter of the time, not never.
export function fromKill(pos, n) {
  const v = n * rate;
  const whole = Math.floor(v);
  drop(pos, whole + (Math.random() < v - whole ? 1 : 0));
}

export function drop(pos, n = 1) {
  pile(n, _pile);
  const spread = spreadFor(_pile.length);
  for (const kind of _pile) put(pos, kind, spread);
}

let clock = 0;


export function update(dt) {
  const C = CFG.coins;
  const p = world.player;
  clock += dt;

  for (let i = pool.live.length - 1; i >= 0; i--) {
    const c = pool.live[i];
    const m = c.mesh;

    if (c.taken > 0) {
      c.taken -= dt / C.takeTime;
      m.position.lerp(_pos.set(p.pos.x, CFG.player.height * 0.5, p.pos.z),
                      1 - Math.exp(-18 * dt));
      m.scale.setScalar(Math.max(0.01, c.taken) * c.kind.size);
      m.rotation.y += c.spin * 3 * dt;
      if (c.taken <= 0) release(i);
      continue;
    }

    m.rotation.y += c.spin * dt;

    m.rotation.x = C.tilt + Math.sin(clock * 1.3 + c.phase) * C.tiltWobble;

    if (c.kind.glow) {
      const G2 = C.glow;
      const beat = 1 + G2.pulse * Math.sin(clock * G2.pulseRate + c.glowPhase);
      c.halo.scale.setScalar((G2.halo / c.kind.size) * beat);
    }

    const dx = p.pos.x - m.position.x, dz = p.pos.z - m.position.z;
    const d = Math.hypot(dx, dz);

    if (c.arm > 0) c.arm -= dt;

    else if (d < magnetRange()) c.chasing = true;

    if (c.chasing) {
      c.chaseV = Math.min(C.chaseMax, c.chaseV + C.chaseAccel * dt);
      m.position.x += (dx / (d || 1)) * c.chaseV * dt;
      m.position.z += (dz / (d || 1)) * c.chaseV * dt;
      m.position.y += (C.hover - m.position.y) * (1 - Math.exp(-6 * dt));
      c.vel.set(0, 0, 0);
    } else if (!c.settled) {
      c.vel.y -= C.gravity * dt;
      m.position.addScaledVector(c.vel, dt);
      bounceIn(c);
      if (m.position.y < C.rest) {
        m.position.y = C.rest;
        c.vel.y *= -0.35;
        c.vel.x *= 0.6; c.vel.z *= 0.6;
        if (Math.abs(c.vel.y) < 1.2) { c.vel.set(0, 0, 0); c.settled = true; }
      }
    } else {
      const target = C.hover + Math.sin(clock * C.bobRate + c.phase) * C.bob;
      m.position.y += (target - m.position.y) * (1 - Math.exp(-C.riseEase * dt));
    }

    // The ring closes during a wave, and a coin lying where the floor used to be
    // goes with it rather than being left outside.
    if (c.settled) arena.ring(m.position, sizeOf(c));

    if (d < C.pickup) {
      c.taken = 1;
      award(c.kind.value);

      const H = C.chime;
      const chime = audio.cascade('coin', H.stagger, H.lead);
      if (chime !== null) {
        audio.playAt('coin', m.position.x, m.position.z, {
          rate: c.kind.rate * (1 + (Math.random() * 2 - 1) * H.detune),
          delay: chime,
        });
      }

      _pos.set(m.position.x, m.position.y + 0.5, m.position.z);
      floaters.coin(_pos, c.kind.value);
      continue;
    }
  }
}
