import * as THREE from 'three';
import { CFG } from '../config/index.js';
import * as evolve from './evolve.js';
import * as modules from '../modules/index.js';
import { scene } from '../engine/view.js';
import { makePool } from '../core/pool.js';
import { between } from '../core/rng.js';
import { world } from '../core/world.js';
import { audio } from '../engine/audio.js';
import { voiceOf } from './voice.js';
import { wrapPi } from '../core/geom2.js';
import * as fx from '../fx/spatter.js';
import { ZONE_TEX, ZONE_FILL } from '../fx/textures.js';
import * as walls from '../arena/walls.js';
import * as arena from '../arena/size.js';
import * as drone from '../allies/drone.js';
import * as graze from '../character/graze.js';
import * as dodge from '../character/dodge.js';
import { lift } from '../character/jetpack.js';
import { clip } from '../arena/clip.js';


// A filled patch of ground, not an outline: the whole circle is where it lands.
const DISC = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

const marks = makePool(
  () => {
    const mesh = new THREE.Mesh(DISC, clip(new THREE.MeshBasicMaterial({
      map: ZONE_TEX.disc, color: CFG.pounce.markColor, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    })));
    mesh.renderOrder = 3;
    scene.add(mesh);
    return { mesh, held: 0, aim: 0, reach: 1 };
  },
  (m) => { m.held = 0; m.aim = 0; m.reach = 1; m.mesh.material.opacity = 0; },
);

// The mark lives as long as it keeps being held. Nothing has to release it, so
// a runner shot out of the air leaves no ring behind.
function hold(bug, L, aim) {
  if (!modules.sees('attacks')) return;
  if (!L.mark) L.mark = marks.spawn();
  L.mark.mesh.position.set(L.to.x, 0.05, L.to.z);
  L.mark.held = CFG.pounce.markHold;
  L.mark.aim = aim;
  // Drawn at the reach it will actually land with, so the ring is the truth.
  L.mark.reach = L.reach;
}

export function clear() { marks.clear(); }

export function updateMarks(dt) {
  const P = CFG.pounce;
  for (let i = marks.live.length - 1; i >= 0; i--) {
    const m = marks.live[i];
    m.held -= dt;
    const want = m.held > 0 ? P.markOpacity * (0.35 + 0.65 * m.aim) : 0;
    const mat = m.mesh.material;
    mat.opacity += (want - mat.opacity) * Math.min(1, P.markEase * dt);
    // The art sits inside its canvas, so the quad opens out to put the
    // painted edge on the landing reach.
    m.mesh.scale.setScalar((m.reach * 2 / ZONE_FILL) * (1.3 - 0.3 * m.aim));
    if (m.held <= 0 && mat.opacity < 0.01) marks.release(i);
  }
}

function target(bug, p, P, out) {
  out.x = p.pos.x + p.vel.x * P.lead;
  out.z = p.pos.z + p.vel.z * P.lead;

  const lim = arena.radius() - bug.radius;
  const r = Math.hypot(out.x, out.z);
  if (r > lim) { out.x *= lim / r; out.z *= lim / r; }

  // The lead can push the mark into cover the player is hugging; land short
  // rather than inside a wall.
  if (walls.inside(out.x, out.z, bug.radius)) { out.x = p.pos.x; out.z = p.pos.z; }
}

function begin(bug, p, P) {
  const to = { x: 0, z: 0 };
  target(bug, p, P, to);
  bug.leap = { air: false, t: P.windup, from: { x: bug.pos.x, z: bug.pos.z }, to,
               hit: false, mark: null, reach: hitReach(bug, p, P), high: heightOf(p) };
  bug.yaw = Math.atan2(to.x - bug.pos.x, to.z - bug.pos.z);
  audio.playAt('bugAttack', bug.pos.x, bug.pos.z, voiceOf(bug.type));
}

function land(bug, P) {
  graze.settle(bug.leap);
  bug.leap = null;
  bug.leapY = 0;
  bug.leapCd = between(P.cooldown);
  bug.model.object.position.y = 0;
  fx.dirt(bug.model.object.position, 3, 0.5);
}

// However high the mark is being carried — the player on the jetpack, a drone on
// its own rotors, the floor for anything standing on it. A leap that ignored it
// would pass under the thing it was aimed at.
const heightOf = (t) => (t.pos.y || 0) + (t.fly ? lift(t) : 0);

// The mark's own width, since a bug may be leaping at a machine rather than at
// the player.
const hitReach = (bug, p, P) => bug.radius + (p.radius ?? CFG.player.radius) + P.hitPad;

function pose(bug, dip, pitch) {
  const body = bug.model.parts.body;
  if (!body) return;
  const baseY = body.userData.baseY !== undefined ? body.userData.baseY : 0.62;
  body.position.y = baseY - dip;
  body.rotation.x = pitch;
}

function contact(bug, p, P) {
  const reach = hitReach(bug, p, P);
  const dx = p.pos.x - bug.pos.x, dz = p.pos.z - bug.pos.z;
  if (!p.drone) {
    graze.sweep(bug.leap, Math.hypot(dx, dz), reach, { from: bug });
    dodge.sweeping(bug.leap, Math.hypot(dx, dz), bug);
  }
  if (dx * dx + dz * dz > reach * reach) return;

  bug.leap.hit = true;
  if (p.drone) drone.damage(p, evolve.hit(bug, P.damage), true);
  else world.hooks.damagePlayer(evolve.hit(bug, P.damage),
                              { from: bug, by: bug.type.key });
  audio.playAt('bugAttack', bug.pos.x, bug.pos.z, voiceOf(bug.type));
  bug.knock.set(-dx, 0, -dz);
  if (bug.knock.lengthSq() > 1e-6) bug.knock.normalize().multiplyScalar(P.knock);
}

// Owns the frame while it is crouched or airborne, so the walk cycle and the
// bite in step() stay out of the way until it comes down.
export function update(bug, p, dist, dt) {
  const P = CFG[bug.type.leap];
  const obj = bug.model.object;

  if (!bug.leap) {
    bug.leapCd -= dt;
    if (bug.leapCd > 0 || dist > P.range * evolve.rangeMult(bug) || dist < P.minRange) return false;
    if (Math.abs(wrapPi(Math.atan2(p.pos.x - bug.pos.x,
                                   p.pos.z - bug.pos.z) - bug.yaw)) > P.arcOfFire) return false;
    if (!walls.pathClear(bug.pos.x, bug.pos.z, p.pos.x, p.pos.z, bug.radius)) return false;
    begin(bug, p, P);
  }

  const L = bug.leap;
  L.t -= dt;

  if (!L.air) {
    const k = 1 - Math.max(0, L.t) / P.windup;
    pose(bug, P.crouch * k, -P.crouchPitch * k);

    if (L.t > 0) {
      // The spot was chosen when the crouch began and does not move, so the
      // whole wind-up is yours to walk out of the ring.
      hold(bug, L, k);
      obj.position.copy(bug.pos);
      obj.rotation.y = bug.yaw;
      return true;
    }
    L.air = true;
    L.t = P.time;
    L.from = { x: bug.pos.x, z: bug.pos.z };
  }
  hold(bug, L, 1);

  const k = Math.min(1, 1 - Math.max(0, L.t) / P.time);
  bug.pos.x = L.from.x + (L.to.x - L.from.x) * k;
  bug.pos.z = L.from.z + (L.to.z - L.from.z) * k;
  // Thrown over the mark's own height rather than over the floor: the same hop
  // it always was, with the whole of it lifted to where the mark is.
  bug.leapY = (P.arc + L.high) * 4 * k * (1 - k);

  obj.position.set(bug.pos.x, bug.leapY, bug.pos.z);
  obj.rotation.y = bug.yaw;
  pose(bug, 0, P.pitch * Math.sin(k * Math.PI));

  // Only while it is level with you: over the top of the arc it is passing
  // overhead, which is what makes the ring the honest danger. Read against where
  // the mark is now, not where it was when the crouch began — climbing out of
  // the way is a way out of it.
  if (!L.hit && Math.abs(bug.leapY - heightOf(p)) < P.hitHeight) contact(bug, p, P);
  if (L.t <= 0) { pose(bug, 0, 0); land(bug, P); }
  return true;
}
