import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { world } from '../core/world.js';
import { makePool } from '../core/pool.js';
import * as fx from '../fx/spatter.js';
import * as blast from '../fx/blast.js';
import * as combat from '../game/combat.js';
import * as napalm from './napalm.js';
import * as modules from '../modules/index.js';
import * as gunmods from '../gunmods/index.js';
import { aimPoint } from '../engine/input.js';

const GEO = new THREE.SphereGeometry(CFG.grenade.radius, 10, 8);
const MAT = new THREE.MeshStandardMaterial({ color: 0x2b2f33, roughness: 0.6, metalness: 0.4 });

const pool = makePool(
  () => {
    const mesh = new THREE.Mesh(GEO, MAT);
    mesh.castShadow = true;
    scene.add(mesh);
    return { mesh, vel: new THREE.Vector3(), spin: new THREE.Vector3(),
             prev: new THREE.Vector3(), life: 0, dmg: 0, from: new THREE.Vector3(),
             lightIdx: -1, emit: 0, age: 0, mod: null };
  },
  (g, pos, vel, dmg, from) => {
    g.mesh.position.copy(pos);
    g.prev.copy(pos);
    g.vel.copy(vel);

    g.spin.set(Math.random() * 14 - 7, Math.random() * 14 - 7, Math.random() * 14 - 7);
    g.life = CFG.grenade.life;
    g.dmg = dmg;
    g.from.copy(from);
    g.emit = 0;
    g.age = 0;
    g.mod = null;

    g.lightIdx = blast.claimLight();
  },
);

export const live = pool.live;

export function clear() {
  for (const g of pool.live) { blast.releaseLight(g.lightIdx); g.lightIdx = -1; }
  pool.clear();
}

const _to = new THREE.Vector3();
const _vel = new THREE.Vector3();

function landing(from, aim, out) {
  const G = CFG.grenade;
  out.set(from.x + aim.x * modules.grenadeRange(), 0, from.z + aim.z * modules.grenadeRange());
  const px = world.player.pos;

  const cx = aimPoint.x - px.x, cz = aimPoint.z - px.z;
  const d = Math.hypot(cx, cz);
  if (d <= 0.001) return out;
  const reach = modules.grenadeRange();
  if (d <= reach) out.set(aimPoint.x, 0, aimPoint.z);
  else out.set(px.x + (cx / d) * reach, 0, px.z + (cz / d) * reach);
  return out;
}

export function fire(from, aim, dmg, turn = 0, depth = 0) {
  const G = CFG.grenade;
  landing(from, aim, _to);

  const px = world.player.pos;
  let dx = _to.x - px.x, dz = _to.z - px.z;
  const dist = Math.hypot(dx, dz);

  // The fan is an angle, but capped as a width: without the cap a long lob
  // would throw the cluster so wide it stops being a cluster.
  const swing = turn + (Math.random() * 2 - 1) * G.turnJitter;
  const lateral = Math.max(-G.maxFan, Math.min(G.maxFan, dist * Math.tan(swing)));
  const nx = dist > 0.001 ? -dz / dist : 0;
  const nz = dist > 0.001 ? dx / dist : 0;

  // Short and long of the mark as well as across it: a fan on its own lands the
  // whole cluster on one line, which covers a wall and not a crowd.
  const push = depth + (Math.random() * 2 - 1) * G.depthJitter;
  const along = Math.max(-G.maxDepth, Math.min(G.maxDepth, dist * G.depthSpread * push));
  const ux = dist > 0.001 ? dx / dist : 0;
  const uz = dist > 0.001 ? dz / dist : 0;

  // Scatter opens up with the throw, so a lob across the arena lands loose
  // while a shot at your feet stays honest.
  const spread = Math.min(G.maxScatter, G.scatter * (0.35 + dist / G.range));
  _to.set(px.x + dx + nx * lateral + ux * along + (Math.random() * 2 - 1) * spread, 0,
          px.z + dz + nz * lateral + uz * along + (Math.random() * 2 - 1) * spread);

  // Held to a ground speed rather than a fixed time: the further the mark, the
  // longer it is in the air, and the higher it arcs to get there.
  const flight = Math.min(G.maxFlight, Math.max(G.minFlight, dist / G.speed));
  _vel.subVectors(_to, from).divideScalar(flight);
  _vel.y += 0.5 * G.gravity * flight;

  gunmods.grenadeFired(pool.spawn(from, _vel, dmg, world.player.pos));
}

const RING_GEO = new THREE.RingGeometry(0.93, 1, 44);
const ring = new THREE.Mesh(RING_GEO, new THREE.MeshBasicMaterial({
  color: 0xffb24a, transparent: true, opacity: 0.22,
  blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
}));
ring.rotation.x = -Math.PI / 2;
ring.renderOrder = 3;
ring.visible = false;
scene.add(ring);

const _ringAt = new THREE.Vector3();

function beyondRange() {
  const px = world.player.pos;
  return Math.hypot(aimPoint.x - px.x, aimPoint.z - px.z) > modules.grenadeRange();
}

export function aimRing(held, from, aim) {
  const show = held && beyondRange();
  ring.visible = show;
  if (!show) return;
  landing(from, aim, _ringAt);
  ring.position.set(_ringAt.x, 0.05, _ringAt.z);
  ring.scale.setScalar(modules.splashRadius());
}

const LAUNCHER = CFG.guns.find((g) => g.projectile === 'grenade');
const _blastAt = new THREE.Vector3();

function detonate(g) {
  const G = CFG.grenade;
  const at = _blastAt.copy(g.mesh.position);
  at.y = 0;
  if (gunmods.grenadeBlast(g, at)) return;

  const radius = modules.splashRadius();

  combat.explode({
    x: at.x, z: at.z, radius, damage: g.dmg, edge: G.edge, knock: G.knock,
    selfDamage: LAUNCHER.damage * G.selfDamage, blame: LAUNCHER.name,
    crit: combat.rollCrit(),
  });

  if (modules.napalmLevel() > 0) {
    napalm.pour(at.x, at.z, radius * CFG.napalm.spread,
                modules.napalmDamage(g.dmg), modules.napalmHeat());
  }
}

export function update(dt) {
  const G = CFG.grenade;
  for (let i = pool.live.length - 1; i >= 0; i--) {
    const g = pool.live[i];
    g.life -= dt;
    g.prev.copy(g.mesh.position);
    g.vel.y -= G.gravity * dt;
    g.mesh.position.addScaledVector(g.vel, dt);
    g.mesh.rotation.x += g.spin.x * dt;
    g.mesh.rotation.y += g.spin.y * dt;
    g.mesh.rotation.z += g.spin.z * dt;

    const pos = g.mesh.position;
    g.age += dt;

    const T = CFG.grenade.trail;
    g.emit -= dt;
    while (g.emit <= 0) { blast.ember(pos); g.emit += T.every; }

    if (g.lightIdx >= 0) {
      const L = CFG.grenade.light;

      const flick = 0.78 + 0.22 * Math.sin(g.age * 47) * Math.sin(g.age * 23);
      blast.moveLight(g.lightIdx, pos, L.color, L.intensity * flick, L.distance);
    }

    const armed = Math.hypot(pos.x - g.from.x, pos.z - g.from.z) > G.armDistance;

    let hitBug = false;
    if (armed) {
      for (const b of world.bugs) {
        if (Math.hypot(b.pos.x - pos.x, b.pos.z - pos.z) < b.radius + G.radius
            && pos.y < (b.model.parts.height || 1.2)) { hitBug = true; break; }
      }
    }

    if (pos.y <= 0 || hitBug || g.life <= 0) {
      pos.y = Math.max(0, pos.y);

      blast.releaseLight(g.lightIdx);
      g.lightIdx = -1;
      if (armed) detonate(g);
      else fx.sparks(pos, 2);
      pool.release(i);
    }
  }
}
