import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene } from '../engine/view.js';
import { world } from '../core/world.js';
import { makePool } from '../core/pool.js';
import { audio } from '../engine/audio.js';
import * as fx from '../fx/spatter.js';
import * as combat from '../game/combat.js';
import * as arena from '../arena/size.js';
import * as modules from '../modules/index.js';
import * as gunmods from '../gunmods/index.js';
import * as blast from '../fx/blast.js';

const LANCE = CFG.guns.find((g) => g.charge);
import { makeGlow } from '../fx/glow.js';

const BOXES = CFG.walls.boxes;

const SEG = new THREE.PlaneGeometry(1, 1);
SEG.rotateX(-Math.PI / 2);

function makeBeamPool(colorOf, widthOf, order) {
  return makePool(
    () => {
      const mesh = new THREE.Mesh(SEG, new THREE.MeshBasicMaterial({
        transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, depthTest: false, side: THREE.DoubleSide,
      }));
      mesh.renderOrder = order;
      scene.add(mesh);
      return { mesh, life: 0, maxLife: 1, bright: 1 };
    },
    (b, ax, az, bx, bz, width, power, bright = 1, tint = 0) => {
      const dx = bx - ax, dz = bz - az;
      const len = Math.hypot(dx, dz) || 0.001;
      b.mesh.position.set((ax + bx) / 2, CFG.laser.height, (az + bz) / 2);
      b.mesh.rotation.y = Math.atan2(dx, dz);
      b.mesh.scale.set(widthOf(width), 1, len);
      b.mesh.material.color.setHex(tint || colorOf());
      b.bright = bright;
      b.mesh.material.opacity = bright;
      b.life = b.maxLife = CFG.laser.life * (0.7 + 0.5 * power);
    },
  );
}

const glow = makeBeamPool(() => CFG.laser.color, (w) => w, 5);
const core = makeBeamPool(() => CFG.laser.core, (w) => w * CFG.laser.coreWidth, 6);

let coil = null;
let coilLight = -1;
let coilPhase = 0;

// A knot of light gathering at the muzzle, growing and quickening with the
// wind-up, so the shot is readable to everyone before it goes.
const sight = [];
const _aimPath = [];

// A hairline down the whole ricochet path while you wind up: where it will go,
// drawn with the same walk the shot uses so the two cannot disagree.
function drawSight(at, aim, t, overWalls) {
  const L = CFG.laser;
  walk(at.x, at.z, aim.x, aim.z, modules.laserBounce(), _aimPath, overWalls);

  let leg = 0;
  for (let i = 0; i + 3 < _aimPath.length; i += 2, leg++) {
    if (!sight[leg]) {
      const m = new THREE.Mesh(SEG, new THREE.MeshBasicMaterial({
        color: L.chargeColor, transparent: true, depthWrite: false,
        depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      }));
      m.renderOrder = 4;
      scene.add(m);
      sight[leg] = m;
    }
    const ax = _aimPath[i], az = _aimPath[i + 1];
    const bx = _aimPath[i + 2], bz = _aimPath[i + 3];
    const dx = bx - ax, dz = bz - az;
    const m = sight[leg];
    m.visible = true;
    m.position.set((ax + bx) / 2, L.height, (az + bz) / 2);
    m.rotation.y = Math.atan2(dx, dz);
    m.scale.set(L.sightWidth, 1, Math.hypot(dx, dz) || 0.001);
    m.material.opacity = L.sightOpacity * (0.25 + 0.75 * t) * Math.pow(L.bounceRetain, leg);
  }
  for (let i = leg; i < sight.length; i++) sight[i].visible = false;
}

function hideSight() {
  for (const m of sight) m.visible = false;
}

export function winding(at, aim, t, dt, overWalls = false) {
  const L = CFG.laser;
  drawSight(at, aim, t, overWalls);
  if (!coil) {
    coil = makeGlow(L.chargeColor, 1, 1);
    scene.add(coil);
  }
  if (coilLight < 0) coilLight = blast.claimLight();

  coilPhase += dt * (L.coilRate + L.coilRate * 3 * t);
  const flick = 0.82 + 0.18 * Math.sin(coilPhase);
  const size = L.coilSize * (0.25 + 0.75 * t) * flick;

  coil.visible = true;
  coil.position.copy(at);
  coil.scale.setScalar(size);
  coil.material.opacity = (0.35 + 0.65 * t) * flick;

  blast.moveLight(coilLight, at, L.chargeColor, L.coilLight * t * flick, L.coilReach);
  if (Math.random() < L.coilSparks * t * dt) fx.sparks(at, 1);

  audio.whine(L.whineFrom + (L.whineTo - L.whineFrom) * t * t, L.whineGain * (0.3 + 0.7 * t));
}

export function unwind() {
  hideSight();
  if (coil) coil.visible = false;
  if (coilLight >= 0) { blast.releaseLight(coilLight); coilLight = -1; }
  audio.whineOff();
}

export function clear() { glow.clear(); core.clear(); unwind(); }

export function update(dt) {
  for (const pool of [glow, core]) {
    for (let i = pool.live.length - 1; i >= 0; i--) {
      const b = pool.live[i];
      b.life -= dt;
      b.mesh.material.opacity = b.bright * Math.max(0, b.life / b.maxLife) ** 0.7;
      if (b.life <= 0) pool.release(i);
    }
  }
}

// Slab test that also reports which face was crossed, so the beam can bounce.
const _face = { axis: 0 };

function castWalls(ax, az, dx, dz) {
  let best = -1;
  for (const b of BOXES) {
    if (b.hidden) continue;
    let t0 = 0, t1 = 1, axis = -1, ok = true;

    for (const k of [0, 1]) {
      const p = k === 0 ? ax : az;
      const d = k === 0 ? dx : dz;
      const lo = k === 0 ? b.x - b.hx : b.z - b.hz;
      const hi = k === 0 ? b.x + b.hx : b.z + b.hz;
      if (Math.abs(d) < 1e-9) {
        if (p < lo || p > hi) { ok = false; break; }
        continue;
      }
      let n = (lo - p) / d, f = (hi - p) / d;
      if (n > f) { const s = n; n = f; f = s; }
      if (n > t0) { t0 = n; axis = k; }
      if (f < t1) t1 = f;
      if (t0 > t1) { ok = false; break; }
    }
    if (ok && t0 > 1e-4 && t0 <= 1 && (best < 0 || t0 < best)) { best = t0; _face.axis = axis; }
  }
  return best;
}

function castRim(ax, az, dx, dz) {
  const R = arena.radius();
  const a = dx * dx + dz * dz;
  const b = 2 * (ax * dx + az * dz);
  const c = ax * ax + az * az - R * R;
  const disc = b * b - 4 * a * c;
  if (disc <= 0 || a < 1e-9) return -1;
  const t = (-b + Math.sqrt(disc)) / (2 * a);
  return t > 1e-4 && t <= 1 ? t : -1;
}

const _hits = [];

function burn(ax, az, bx, bz, half, dmg, retain, spent, at, crit) {
  const dx = bx - ax, dz = bz - az;
  const len2 = dx * dx + dz * dz || 1e-6;
  _hits.length = 0;

  for (const bug of world.bugs) {
    const px = bug.pos.x - ax, pz = bug.pos.z - az;
    let t = (px * dx + pz * dz) / len2;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const cx = px - dx * t, cz = pz - dz * t;
    const reach = half + bug.radius;
    if (cx * cx + cz * cz <= reach * reach) _hits.push({ bug, t });
  }
  _hits.sort((p, q) => p.t - q.t);

  let n = spent;
  for (const h of _hits) {
    if (h.bug.hp <= 0) continue;               // a burst already took it
    const amount = Math.round(dmg * Math.pow(retain, n));
    if (amount < CFG.laser.minHit) break;
    at.set(ax + dx * h.t, CFG.laser.height, az + dz * h.t);
    combat.hurt(h.bug, amount, at, 0.9, LANCE.name, crit);
    n += 1;
  }
  return n;
}

const _at = new THREE.Vector3();

// The whole ricochet path as a flat polyline, so the sight drawn while you
// charge and the beam that fires are the same geometry.
const _path = [];

function walk(x, z, dx, dz, bounces, out, overWalls) {
  const L = CFG.laser;
  const len = Math.hypot(dx, dz) || 1;
  dx /= len; dz /= len;

  out.length = 0;
  out.push(x, z);
  for (let leg = 0; leg <= bounces; leg++) {
    const ex = x + dx * L.range, ez = z + dz * L.range;
    const wall = overWalls ? -1 : castWalls(x, z, dx * L.range, dz * L.range);
    const rim = castRim(x, z, dx * L.range, dz * L.range);

    const onWall = wall >= 0 && (rim < 0 || wall < rim);
    const t = onWall ? wall : rim;
    const hx = t >= 0 ? x + (ex - x) * t : ex;
    const hz = t >= 0 ? z + (ez - z) * t : ez;
    out.push(hx, hz);
    if (t < 0) break;

    let nx, nz;
    if (onWall) {
      nx = _face.axis === 0 ? -Math.sign(dx) : 0;
      nz = _face.axis === 1 ? -Math.sign(dz) : 0;
    } else {
      const r = Math.hypot(hx, hz) || 1;
      nx = -hx / r; nz = -hz / r;
    }
    const dot = dx * nx + dz * nz;
    dx -= 2 * dot * nx;
    dz -= 2 * dot * nz;
    x = hx + dx * 0.02;
    z = hz + dz * 0.02;
  }
  return out;
}

// One cut, start to finish: walk the ricochet, burn what each leg crosses and
// draw it at what it still carries. A module that wants a second beam of its
// own calls this rather than reaching into the trigger.
export function cast(from, aim, shot) {
  const L = CFG.laser;
  const { dmg, half, power, retain, bounces, crit, overWalls, tint, core: coreTint } = shot;
  const path = walk(from.x, from.z, aim.x, aim.z, bounces, [], overWalls);

  let spent = 0;
  let legDmg = dmg;
  for (let i = 0; i + 3 < path.length; i += 2) {
    const ax = path[i], az = path[i + 1];
    const bx = path[i + 2], bz = path[i + 3];

    // Each bounce costs the beam some of its bite, and the segment is drawn at
    // what it still carries — a dim leg is a weak leg.
    const bright = legDmg / dmg;
    // A bounced leg is indiscriminate: everything it crosses takes the leg in
    // full, with no falling off body to body.
    spent = i === 0
      ? burn(ax, az, bx, bz, half * bright, legDmg, retain, spent, _at, crit)
      : burn(ax, az, bx, bz, half * bright, legDmg, 1, 0, _at, crit);
    glow.spawn(ax, az, bx, bz, half * 2 * bright, power, bright, tint);
    core.spawn(ax, az, bx, bz, half * 2 * bright, power, bright, coreTint);

    if (i + 4 < path.length) fx.sparks(_at.set(bx, L.height, bz), 4);
    legDmg *= L.bounceRetain;
  }
  return path;
}

export function fire(from, aim, gun, charge, overWalls = false) {
  const L = CFG.laser;
  const power = Math.min(1, charge / L.fullCharge);
  const scale = modules.gunPower(gun);
  // Compounding on the hold, not sliding: the last part of the wind-up is worth
  // far more than the first, and the beam fattens the same way.
  // One roll for the shot: the beam is a single cut, so it crits down its whole
  // length or not at all.
  const crit = combat.rollCrit();
  const shot = {
    charge,
    power,
    crit,
    overWalls,
    dmg: L.maxDamage * Math.pow(L.chargeCurve, power - 1) * scale
         * combat.critMultiplier(crit),
    half: modules.laserWidth(gun) * Math.pow(L.widthGain, power) / 2,
    retain: L.retain,
    bounces: modules.laserBounce(),
    tint: 0,
    core: 0,
    rate: 0.62 + 0.25 * power,
    quiet: false,
  };
  gunmods.plan(world.player, gun, shot);

  const path = cast(from, aim, shot);

  unwind();
  if (!shot.quiet) audio.play('zap', { rate: shot.rate, force: true }) || audio.zap();
  gunmods.beam(world.player, gun, { from, aim, path, shot });
}
