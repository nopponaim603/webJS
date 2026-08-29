import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { world } from '../core/world.js';
import { makePool } from '../core/pool.js';
import * as combat from '../game/combat.js';

const B = () => CFG.drone.beam;

const TUBE = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
TUBE.translate(0, 0.5, 0);

const UP = new THREE.Vector3(0, 1, 0);

function makeBeamPool(order) {
  return makePool(
    () => {
      const mesh = new THREE.Mesh(TUBE, new THREE.MeshBasicMaterial({
        transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, depthTest: false, side: THREE.DoubleSide,
      }));
      mesh.renderOrder = order;
      scene.add(mesh);
      return { mesh, life: 0, maxLife: 1 };
    },
    (b, from, dir, len, width, color) => {
      b.mesh.position.copy(from);
      b.mesh.quaternion.setFromUnitVectors(UP, dir);
      b.mesh.scale.set(width / 2, len, width / 2);
      b.mesh.material.color.setHex(color);
      b.mesh.material.opacity = 1;
      b.life = b.maxLife = B().life;
    },
  );
}

const glow = makeBeamPool(5);
const core = makeBeamPool(6);

export function clear() { glow.clear(); core.clear(); }

export function update(dt) {
  for (const pool of [glow, core]) {
    for (let i = pool.live.length - 1; i >= 0; i--) {
      const b = pool.live[i];
      b.life -= dt;
      b.mesh.material.opacity = Math.max(0, b.life / b.maxLife) ** 0.6;
      if (b.life <= 0) pool.release(i);
    }
  }
}

// Everything the line crosses, nearest first. Flat, like every other shot in
// the game: what a round passes over it passes through, whatever height the
// body it belongs to is standing at.
const _hits = [];

function cross(ax, az, dx, dz) {
  _hits.length = 0;
  const len2 = dx * dx + dz * dz || 1e-6;

  for (const bug of world.bugs) {
    const px = bug.pos.x - ax, pz = bug.pos.z - az;
    let t = (px * dx + pz * dz) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const cx = px - dx * t, cz = pz - dz * t;
    const reach = bug.radius + CFG.bullet.radius;
    if (cx * cx + cz * cz <= reach * reach) _hits.push({ bug, t });
  }
  _hits.sort((p, q) => p.t - q.t);
  return _hits;
}

const _at = new THREE.Vector3();

// Where the beam ends: on the last body it could not get through, and failing
// that on the floor it runs into. Walls are not in its way — a drone shoots over
// them. A line that reaches nothing is still cut off short of the ground, so it
// never draws into the dirt.
function stopAt(from, dir, range, cut) {
  if (cut < 1) return range * cut;
  if (dir.y >= 0) return range;
  return Math.min(range, (from.y - B().floor) / -dir.y);
}

// `dry` is a beam that is only ever looked at: it lights and stops on the world
// like any other, but nothing along it is touched.
export function fire(from, dir, shot) {
  const { base, range, retain = 0, arcs = false, dry = false } = shot;
  const dx = dir.x * range, dz = dir.z * range;

  let spent = 0;
  let cut = 1;
  for (const h of dry ? [] : cross(from.x, from.z, dx, dz)) {
    if (h.bug.hp <= 0) continue;
    const roll = combat.rollDamage(base, range * h.t, 'drone');
    const amount = roll.amount * Math.pow(retain, spent);

    _at.set(from.x + dx * h.t, from.y + dir.y * range * h.t, from.z + dz * h.t);
    combat.hurt(h.bug, amount, _at, roll.strength, 'drone', roll.crit);
    if (arcs) combat.arc(h.bug, amount, 'drone');

    spent += 1;
    if (retain <= 0 || amount * retain < CFG.bullet.minDamage) { cut = h.t; break; }
  }

  const len = stopAt(from, dir, range, cut);
  glow.spawn(from, dir, len, B().width, B().color);
  core.spawn(from, dir, len, B().width * B().coreWidth, B().core);
}
