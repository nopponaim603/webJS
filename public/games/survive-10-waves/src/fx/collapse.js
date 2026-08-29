import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene, camera, rumble } from '../engine/view.js';
import { audio } from '../engine/audio.js';
import { makePool } from '../core/pool.js';
import { GEO, PUFF_TEX } from './textures.js';
import { state } from '../core/world.js';
import * as size from '../arena/size.js';
import * as ground from '../arena/ground.js';
import * as hud from '../ui/hud.js';

const C = () => CFG.arena.collapse;

// Lumps of the floor that is no longer there. They fall past y=0 on purpose:
// the ground they were standing on has just been taken away.
const shards = makePool(
  () => {
    const mesh = new THREE.Mesh(GEO.gib, new THREE.MeshLambertMaterial({ color: 0xffffff }));
    mesh.castShadow = false;
    scene.add(mesh);
    return { mesh, vel: new THREE.Vector3(), spin: new THREE.Vector3(), life: 0 };
  },
  (p, x, z, out) => {
    const S = C().shards;
    p.mesh.material.color.setHex(CFG.walls.color);
    p.mesh.position.set(x, -0.1 + Math.random() * 0.5, z);
    p.mesh.rotation.set(Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3);
    p.mesh.scale.setScalar(S.size * (0.5 + Math.random() * 1.3));
    p.vel.set(out.x * S.out * (0.3 + Math.random()), Math.random() * 2.5,
              out.z * S.out * (0.3 + Math.random()));
    p.spin.set((Math.random() - 0.5) * S.spin, (Math.random() - 0.5) * S.spin,
               (Math.random() - 0.5) * S.spin);
    p.life = S.life * (0.7 + Math.random() * 0.6);
  },
);

const dust = makePool(
  () => {
    const mesh = new THREE.Mesh(GEO.splat, new THREE.MeshBasicMaterial({
      map: PUFF_TEX[0], transparent: true, depthWrite: false, side: THREE.DoubleSide,
    }));
    mesh.renderOrder = 5;
    scene.add(mesh);
    return { mesh, vel: new THREE.Vector3(), roll: 0, spin: 0, life: 0, maxLife: 1, size: 1 };
  },
  (p, x, z, out) => {
    const D = C().dust;
    p.mesh.material.map = PUFF_TEX[(Math.random() * PUFF_TEX.length) | 0];
    p.mesh.material.color.setHex(D.color);
    p.mesh.position.set(x, 0.2 + Math.random() * 1.4, z);
    p.vel.set(out.x * D.out * Math.random(), -D.fall * (0.6 + Math.random() * 0.8),
              out.z * D.out * Math.random());
    p.size = D.size * (0.6 + Math.random() * 0.8);
    p.roll = Math.random() * Math.PI * 2;
    p.spin = (Math.random() - 0.5) * 1.6;
    p.life = p.maxLife = D.life * (0.7 + Math.random() * 0.6);
  },
);

let on = false;
let flash = 0;
let beat = 0;
let owed = { shards: 0, dust: 0 };
let voice = null;

const _out = new THREE.Vector3();

function spill(pool, n, r) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    _out.set(Math.cos(a), 0, Math.sin(a));
    pool.spawn(_out.x * r, _out.z * r, _out);
  }
}

// Both streams are rationed by circumference: the same rate on a 25-unit ring
// and an 80-unit one is a curtain at one size and a trickle at the other.
function feed(dt, r) {
  const wide = r / CFG.arena.max;
  owed.shards += C().shards.rate * wide * dt;
  owed.dust += C().dust.rate * wide * dt;
  const s = Math.floor(owed.shards);
  const d = Math.floor(owed.dust);
  owed.shards -= s;
  owed.dust -= d;
  spill(shards, s, r);
  spill(dust, d, r);
}

function begin() {
  on = true;
  flash = C().flashTime;
  beat = 0;
  owed = { shards: 0, dust: 0 };
  audio.play('collapseAlarm');
  hud.collapseAlert(true);
}

function end() {
  on = false;
  flash = 0;
  hud.collapseAlert(false);
  ground.setHeat(0);
  rumble(0);
  voice?.stop(0.8);
  voice = null;
}

// A pause is not the ground stopping, it is the game stopping. The bed is taken
// away rather than turned down: a voice held at nothing behind the pause screen
// is still a voice, and update() puts a fresh one up on the way back in.
export function hush() {
  rumble(0);
  voice?.stop(0.15);
  voice = null;
}

export function clear() {
  if (on) end();
  shards.clear();
  dust.clear();
}

function drift(dt) {
  for (let i = shards.live.length - 1; i >= 0; i--) {
    const p = shards.live[i];
    p.life -= dt;
    p.vel.y -= C().shards.gravity * dt;
    p.mesh.position.addScaledVector(p.vel, dt);
    p.mesh.rotation.x += p.spin.x * dt;
    p.mesh.rotation.y += p.spin.y * dt;
    p.mesh.rotation.z += p.spin.z * dt;
    if (p.life <= 0) shards.release(i);
  }

  for (let i = dust.live.length - 1; i >= 0; i--) {
    const p = dust.live[i];
    p.life -= dt;
    const t = 1 - Math.max(0, p.life) / p.maxLife;
    p.mesh.position.addScaledVector(p.vel, dt);
    p.roll += p.spin * dt;
    p.mesh.quaternion.copy(camera.quaternion);
    p.mesh.rotateZ(p.roll);
    p.mesh.scale.setScalar(p.size * (1 + t * 0.8));
    p.mesh.material.opacity = C().dust.opacity * Math.pow(Math.max(0, 1 - t), 1.4);
    if (p.life <= 0) dust.release(i);
  }
}

// How far through the closing the ring is, so the ground goes loudest where
// there is least of it left rather than evenly all the way down.
function pressure(r) {
  const full = size.waveRadius();
  const span = Math.max(1, full - C().floor);
  return Math.min(1, (full - r) / span);
}

// Only ever begun from inside a fight: a menu that still has a closed ring
// behind it must not sound the alarm over its own music, and a pause must not
// sound it again on the way back in.
export function update(dt) {
  if (on && !size.sinking()) end();
  else if (!on && size.sinking() && state.mode === 'playing') begin();
  drift(dt);
  if (!on) return;
  if (state.mode !== 'playing') { hush(); return; }
  if (!voice || !voice.alive) {
    voice = audio.sustain('collapseRumble');
    voice?.set(0, 1, 0.01);
  }

  const r = size.radius();
  flash = Math.max(0, flash - dt);
  const k = flash / C().flashTime;
  const deep = 0.45 + 0.55 * pressure(r);

  // Struck on the fall of the beat rather than counted down to it, so the swell
  // the player sees and the ping they hear are the same moment.
  beat -= dt;
  if (beat <= 0) { beat += C().beat; audio.play('collapseSonar'); }
  const swell = Math.pow(beat / C().beat, 3);

  ground.setHeat(+(deep * (1 + C().pulse * swell) + (C().flash - 1) * k * k).toFixed(3));
  rumble(C().shake * deep * (1 + 0.5 * swell));
  voice?.set(0.6 + 0.4 * pressure(r), 0.9 + 0.25 * deep, 0.5);
  feed(dt, r);
}
