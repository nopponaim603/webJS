import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { makePool } from '../core/pool.js';
import { audio } from '../engine/audio.js';
import * as modules from '../modules/index.js';
import * as energy from '../character/energy.js';
import * as combat from '../game/combat.js';
import { ZONE_TEX, ZONE_FILL } from '../fx/textures.js';
import { makeGlow } from '../fx/glow.js';
import { claimLight, moveLight, releaseLight } from '../fx/blast.js';
import { clip } from '../arena/clip.js';

const B = () => CFG.jetBomb;

const DISC = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const SHELL = new THREE.SphereGeometry(0.34, 12, 8);
const LAMP_Y = 0.62;

const _at = new THREE.Vector3();

// What it will take, drawn where it will take it. The ring is the honest reach
// of the blast, and the lamp on top of the casing is the fuse: it beeps, throws
// a light on the floor around it, and quickens all the way down, so the last
// half second is unmistakable.
const bombs = makePool(
  () => {
    const mesh = new THREE.Group();

    const shell = new THREE.Mesh(SHELL, new THREE.MeshStandardMaterial({
      color: B().color, metalness: 0.65, roughness: 0.35,
    }));
    shell.position.y = 0.34;
    shell.castShadow = true;

    const ring = new THREE.Mesh(DISC, clip(new THREE.MeshBasicMaterial({
      map: ZONE_TEX.annulus, color: B().mark, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })));
    ring.position.y = 0.05;
    ring.renderOrder = 3;

    const lamp = makeGlow(B().mark, 1, 0.9);
    lamp.position.y = LAMP_Y;

    mesh.add(shell, ring, lamp);
    scene.add(mesh);
    return { mesh, shell, ring, lamp, x: 0, z: 0, t: 0, radius: 1, damage: 0,
             beep: 0, flash: 0, light: -1 };
  },
  (b, x, z, radius, damage) => {
    b.x = x;
    b.z = z;
    b.t = B().fuse;
    b.radius = radius;
    b.damage = damage;
    b.beep = 0;
    b.flash = 0;
    b.light = claimLight(B().light.keepFree);
    b.mesh.position.set(x, 0, z);
    b.ring.scale.setScalar((radius * 2) / ZONE_FILL);
  },
);

// Nothing is refused for want of energy but the charge itself: the lift-off is
// how you get out of trouble, and a pack that would not fly because the bomb
// under it is unaffordable is a pack that gets you killed.
export function drop(p) {
  if (!modules.hasBomb()) return;
  if (!energy.take(p, modules.bombCost())) return;
  bombs.spawn(p.pos.x, p.pos.z, modules.bombRadius(), modules.bombDamage());
  audio.playAt('jetMine', p.pos.x, p.pos.z);
}

export function clear() {
  for (const b of bombs.live) douse(b);
  bombs.clear();
}

function douse(b) {
  releaseLight(b.light);
  b.light = -1;
}

// Every beep waits less than the last and sits higher than the last, so the
// fuse can be read with the casing off screen.
function tick(b, P, left, dt) {
  b.beep -= dt;
  if (b.beep > 0) return;
  b.beep = P.fast + (P.slow - P.fast) * left;
  b.flash = P.flash;
  audio.blip({ freq: P.freq + P.rise * (1 - left), dur: P.dur, gain: P.gain });
}

export function update(dt) {
  const C = B();
  for (let i = bombs.live.length - 1; i >= 0; i--) {
    const b = bombs.live[i];
    b.t -= dt;

    if (b.t <= 0) {
      combat.explode({ x: b.x, z: b.z, radius: b.radius, damage: b.damage,
                       edge: C.edge, knock: C.knock,
                       selfDamage: b.damage * C.selfShare, blame: 'drop charge' });
      douse(b);
      bombs.release(i);
      continue;
    }

    const left = b.t / C.fuse;
    tick(b, C.beep, left, dt);

    b.flash = Math.max(0, b.flash - dt);
    const lit = b.flash / C.beep.flash;
    b.lamp.material.opacity = 0.35 + 0.65 * lit;
    b.lamp.scale.setScalar(C.lamp * (1 + 0.35 * lit));
    _at.set(b.x, LAMP_Y, b.z);
    moveLight(b.light, _at, C.light.color, C.light.intensity * lit, C.light.distance);
    b.shell.rotation.y += C.spin * dt;
    b.ring.material.opacity = C.markOpacity * (0.45 + 0.55 * (1 - left));
  }
}
