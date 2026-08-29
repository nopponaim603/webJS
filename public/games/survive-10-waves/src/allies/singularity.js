import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import { scene } from '../engine/view.js';
import { audio } from '../engine/audio.js';
import { makeGlow } from '../fx/glow.js';
import { GEO, ZONE_TEX } from '../fx/textures.js';
import * as blast from '../fx/blast.js';
import * as napalm from '../weapons/napalm.js';
import { pushGive } from '../bug/mass.js';
import * as modules from '../modules/index.js';
import * as booked from './booked.js';

const V = () => CFG.drone.void;

const wells = [];
// One set of pieces a well, kept between wells rather than rebuilt: two drones
// can be pulling at once, and sharing a single orb would leave one invisible.
const spare = [];

const _at = new THREE.Vector3();
const _out = new THREE.Vector3();

// Anything with legs or wings that nothing else already owns the frame of. A
// boss is left where it stands: it fights from ground it has claimed, and a
// machine that could drag it off that would be fighting the fight for you.
const takeable = (b) => b.hp > 0 && !b.dummy && !b.type.finale
  && !b.carried && !b.flight && !b.rider && !b.haul && !b.board;

// Everything standing within `reach` of a spot, nearest first once there are
// more of them than one well may hold.
function gather(x, z, reach) {
  const near = (b) => Math.hypot(b.pos.x - x, b.pos.z - z);
  const caught = [];
  for (const b of world.bugs) {
    if (takeable(b) && near(b) <= reach) caught.push(b);
  }
  if (caught.length > V().most) {
    caught.sort((a, b) => near(a) - near(b));
    caught.length = V().most;
  }
  return caught;
}

// The drone's own clock for it: the moment it is off cooldown with anything in
// reach, it is used. A sweep of the field is not free, so a well that finds
// nothing to take waits `retry` rather than looking again next frame.
export function tick(d, dt) {
  d.voidCd -= dt;
  if (d.voidCd > 0 || !modules.droneVoids()) return;
  if (!open(d)) d.voidCd = V().retry;
}

// The spot is chosen and the drone holds a line on it; nothing is taken hold of
// until the wind-up is over, so what the well catches is what is standing there
// when it opens rather than what was standing there when it was aimed.
export function open(d) {
  const reach = modules.droneVoidRange();
  const seen = gather(d.pos.x, d.pos.z, reach);
  if (seen.length < V().least) return false;

  let x = 0, z = 0;
  for (const b of seen) { x += b.pos.x; z += b.pos.z; }
  x /= seen.length;
  z /= seen.length;

  // Ground another machine's attack already owns is left to it.
  const mark = booked.disc(x, z, reach);
  if (!booked.open(mark)) return false;

  // The mark on the floor is the ground the well has claimed, which is the whole
  // of its reach from the moment it is aimed: it closes from there rather than
  // snapping in to whatever the crowd happened to be standing on.
  wells.push({ x, z, t: 0, phase: 'cast', by: d, reach, mark: booked.take(mark),
               span: reach, rim: reach, dust: 0,
               light: -1, orb: null, fill: null, ring: null, aim: null, sky: null,
               damage: modules.droneVoidDamage() });
  d.voidCd = modules.droneVoidCooldown();
  audio.playAt('spawn', x, z, { rate: 0.72 });
  return true;
}

// The wind-up is over: from here the spot pulls at whatever is standing on it.
function draw(w) {
  w.phase = 'pull';
  w.t = 0;
}

// A hand on the back rather than a hand round the throat: the spot drags what is
// on it toward the middle and nothing more. A dragged animal still walks, still
// turns, and still bites whatever it came for — the ground under it is simply
// moving. `draw` is the speed the pull settles at once the drag and the animal's
// own weight have balanced, so a heavy one is shifted less than a light one.
function haul(w, dt) {
  const D = V().draw * CFG.bugAnim.knockDecay * dt;

  for (const b of world.bugs) {
    if (!takeable(b)) continue;
    const dx = w.x - b.pos.x, dz = w.z - b.pos.z;
    const far = Math.hypot(dx, dz);
    if (far > w.reach || far < 1e-3) continue;
    b.knock.x += (dx / far) * D * pushGive(b);
    b.knock.z += (dz / far) * D * pushGive(b);
  }
}

// What is being taken, drawn with the same soft marks every telegraph on this
// ground wears: the whole floor washed, and the rim that bounds it. Both close
// as the pull does, so the mark is always the ground the well still owns.
function makeMark(tex, order) {
  const mesh = new THREE.Mesh(GEO.splat, new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = order;
  return mesh;
}

// A beam is one open tube a unit long, stood on end and stretched: the line the
// drone holds on the spot is the same piece as the column standing out of it.
const TUBE = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);

function makeBeam(order) {
  const mesh = new THREE.Mesh(TUBE, new THREE.MeshBasicMaterial({
    transparent: true, depthWrite: false, depthTest: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }));
  mesh.renderOrder = order;
  return mesh;
}

const _from = new THREE.Vector3();
const _to = new THREE.Vector3();
const _mid = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

function aimBeam(mesh, from, to, width) {
  _to.subVectors(to, from);
  const len = _to.length() || 0.001;
  _mid.copy(from).addScaledVector(_to, 0.5);
  mesh.position.copy(_mid);
  mesh.scale.set(width, len, width);
  mesh.quaternion.setFromUnitVectors(UP, _to.divideScalar(len));
}

function riseFor(w) {
  if (w.orb) return;
  const kit = spare.pop() || { orb: makeGlow(V().glow, 1),
                               fill: makeMark(ZONE_TEX.disc, 2),
                               ring: makeMark(ZONE_TEX.annulus, 3),
                               aim: makeBeam(6), sky: makeBeam(6) };
  w.orb = kit.orb;
  w.fill = kit.fill;
  w.ring = kit.ring;
  w.aim = kit.aim;
  w.sky = kit.sky;
  w.orb.visible = w.fill.visible = w.ring.visible = true;
  w.aim.visible = w.sky.visible = false;
  w.fill.material.color.setHex(V().fill.color);
  w.ring.material.color.setHex(V().ring.color);
  w.aim.material.color.setHex(V().aim.color);
  w.sky.material.color.setHex(V().sky.color);
  for (const m of [w.orb, w.fill, w.ring, w.aim, w.sky]) scene.add(m);
  w.light = blast.claimLight(1);
}

// Dust does not fall into a hole from nowhere: it is picked up at the rim and
// dragged inward, so every mote is a line pointing at the middle.
function drag(w, rim, dt) {
  const D = V().dust;
  w.dust -= dt;
  while (w.dust <= 0) {
    w.dust += D.every;
    const a = Math.random() * Math.PI * 2;
    const d = rim * (0.55 + Math.random() * 0.45);
    _at.set(w.x + Math.cos(a) * d, 0, w.z + Math.sin(a) * d);
    _out.set(-Math.cos(a), 0, -Math.sin(a));
    blast.dustPuffs.spawn(_at, _out, D, 1);
  }
}

// How far the wind-up carries the look before the pull takes over. One measure
// runs across both phases, so nothing brightens, grows or fades twice: the spot
// lights up while the drone holds its line, and goes on from there.
const WIND = 0.3;

// The orb brightens and the ring closes on the same measure the bodies are
// travelling: `k` is how far along the collapse is.
function show(w, k, dt) {
  riseFor(w);
  w.orb.position.set(w.x, V().lift, w.z);
  w.orb.scale.setScalar(V().halo * (0.25 + 0.75 * k));
  w.orb.material.opacity = 0.35 + 0.65 * k;

  const R = V().ring;
  const wide = Math.max(w.rim, w.span * R.shut);
  w.ring.position.set(w.x, R.y, w.z);
  w.ring.scale.setScalar(wide);
  // Faster the tighter it gets, the way anything drawn inward turns: the rate is
  // taken off the radius rather than off the clock, so the mark is at its
  // quickest exactly when there is least of it left. `shut` bounds the radius,
  // so it bounds this with it — there is no separate ceiling to keep in step.
  w.ring.rotation.z += V().spin * 0.2 * (w.span / wide) * dt;
  w.ring.material.opacity = R.opacity * (0.35 + 0.65 * k);

  // The wash holds its own against the rim as the well closes: the ground it is
  // covering shrinks, so the colour on it deepens rather than fading with it.
  const F = V().fill;
  w.fill.position.set(w.x, F.y, w.z);
  w.fill.scale.setScalar(wide);
  w.fill.material.opacity = F.opacity * (0.4 + 0.6 * k);

  const L = V().light;
  _at.set(w.x, V().lift, w.z);
  blast.moveLight(w.light, _at, L.color, L.intensity * k, L.distance);

  // The line the drone holds while it winds up, and the column it stands up out
  // of the spot once it has hold of what it caught.
  const A = V().aim;
  const casting = w.phase === 'cast' && w.by.hp > 0;
  w.aim.visible = casting;
  if (casting) {
    _from.set(w.by.pos.x, w.by.pos.y, w.by.pos.z);
    _to.set(w.x, V().lift, w.z);
    aimBeam(w.aim, _from, _to, A.width * (0.6 + 0.4 * k));
    w.aim.material.opacity = A.opacity * (0.3 + 0.7 * k);
  }

  const S = V().sky;
  w.sky.visible = w.phase === 'pull';
  if (w.sky.visible) {
    w.sky.position.set(w.x, S.height / 2, w.z);
    w.sky.scale.set(S.width * (0.7 + 0.5 * k), S.height, S.width * (0.7 + 0.5 * k));
    w.sky.quaternion.identity();
    w.sky.material.opacity = S.opacity * (0.45 + 0.55 * k);
  }
}

function douse(w) {
  booked.free(w.mark);
  if (!w.orb) return;
  for (const m of [w.orb, w.fill, w.ring, w.aim, w.sky]) {
    m.visible = false;
    scene.remove(m);
  }
  spare.push({ orb: w.orb, fill: w.fill, ring: w.ring, aim: w.aim, sky: w.sky });
  blast.releaseLight(w.light);
  w.orb = w.fill = w.ring = w.aim = w.sky = null;
  w.light = -1;
}

function fall(w) {
  douse(w);

  const pool = w.reach * V().pool;
  _at.set(w.x, 0, w.z);
  blast.explosion(_at, pool);
  audio.explode();
  napalm.pour(w.x, w.z, pool, w.damage / (CFG.napalm.life / CFG.napalm.tick), 1,
              { by: 'drone singularity', selfShare: 0 });
}

export function update(dt) {
  for (let i = wells.length - 1; i >= 0; i--) {
    const w = wells[i];
    w.t += dt;

    if (w.phase === 'cast') {
      // The machine holding the line is what the wind-up is: shoot it down and
      // the spot is left alone.
      if (w.by.hp <= 0) { douse(w); wells.splice(i, 1); continue; }
      show(w, WIND * Math.min(1, w.t / V().cast), dt);
      if (w.t >= V().cast) draw(w);
      continue;
    }

    // It pulls for the same few seconds however wide it is, and on whatever is
    // standing on it that frame: what walks in late is pulled from where it
    // walked in, and what breaks out of the rim is simply let go.
    const k = Math.min(1, w.t / V().pull);
    // The rim closes on the pile as the pile closes: it is the ground still
    // being taken, not the ground that was claimed. What the well has hold of
    // is not cut back with it — a body still crossing the old edge is one it is
    // already dragging, and letting go of it would be letting the slow ones out.
    w.rim = w.span * (1 - (1 - V().ring.shut) * k);
    haul(w, dt);
    drag(w, w.rim, dt);
    show(w, WIND + (1 - WIND) * k, dt);

    if (k >= 1) {
      fall(w);
      wells.splice(i, 1);
    }
  }
}

export function clear() {
  for (const w of wells) douse(w);
  wells.length = 0;
}
