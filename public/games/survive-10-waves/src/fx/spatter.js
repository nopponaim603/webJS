import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene, muzzleLight } from '../engine/view.js';
import { makePool } from '../core/pool.js';
import { GEO, SPLAT_TEX, SCORCH_TEX } from './textures.js';
import * as stains from './stains.js';
import { clip } from '../arena/clip.js';

const _hsl = { h: 0, s: 0, l: 0 };
const _blood = new THREE.Color();

function bloodColor(fresh = false) {
  _blood.setHex(CFG.bugBlood);
  _blood.getHSL(_hsl, THREE.SRGBColorSpace);
  return fresh
    ? _blood.setHSL(_hsl.h, 0.62, 0.30 + Math.random() * 0.06, THREE.SRGBColorSpace)
    : _blood.setHSL(_hsl.h, 0.46, 0.17 + Math.random() * 0.04, THREE.SRGBColorSpace);
}

export const gibs = makePool(
  () => {
    const mesh = new THREE.Mesh(GEO.gib, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    scene.add(mesh);
    return { mesh, vel: new THREE.Vector3(), spin: new THREE.Vector3(), life: 0,
             drop: false, wet: 0, size: 1, marks: false };
  },
  (p, pos, color, power = 1, geo = GEO.gib) => {
    p.mesh.geometry = geo;
    p.mesh.material.color.setHex(color);
    p.mesh.position.copy(pos);
    p.drop = false;
    p.wet = 0;
    p.marks = false;
    p.size = 0.7 + Math.random() * 0.9;
    p.mesh.rotation.set(0, 0, 0);
    p.mesh.scale.setScalar(p.size);
    p.vel.set(
      (Math.random() - 0.5) * 9 * power,
      (2 + Math.random() * 7) * power,
      (Math.random() - 0.5) * 9 * power,
    );
    p.spin.set(Math.random() * 12, Math.random() * 12, Math.random() * 12);
    p.life = 0.55 + Math.random() * 0.5;
  },
);

let stamp = 0;

// How small a splat starts before it blooms to full. Blood lands and spreads.
// Ground that burns barely moves: what is painted is what the hit test reads,
// so a pool may only ever be a touch smaller than its own hitbox, never bigger.
const FROM = { splat: 0.35, hazard: 0.9 };

const splats = makePool(
  () => {
    const mesh = new THREE.Mesh(GEO.splat, clip(new THREE.MeshLambertMaterial({
      map: SPLAT_TEX[0], color: 0xffffff,
      transparent: true, opacity: 1, depthWrite: false,
    })));
    mesh.rotation.x = -Math.PI / 2;
    mesh.renderOrder = 1;

    mesh.receiveShadow = true;
    scene.add(mesh);

    return { mesh, life: 0, maxLife: 1, peak: 1, grow: 1, stretch: 1, fadeIn: 0,
             hazard: false, burn: false, stamp: 0, sunk: 0 };
  },
  (s, pos, size, tint = null, life = 0, fadeIn = 0, set = SPLAT_TEX, shape = null,
   hazard = false) => {
    s.hazard = hazard;
    s.burn = set === SCORCH_TEX;
    s.sunk = 0;
    s.stamp = ++stamp;
    s.mesh.position.set(pos.x, 0.035 + Math.random() * 0.012, pos.z);
    s.mesh.rotation.z = shape ? shape.rot : Math.random() * Math.PI * 2;

    s.mesh.material.map = set[shape ? shape.tex : (Math.random() * set.length) | 0];

    if (tint) s.mesh.material.color.setHex(tint);
    else s.mesh.material.color.copy(bloodColor(false));

    s.grow = shape ? shape.grow : size * (0.8 + Math.random() * 0.45);
    s.stretch = shape ? shape.stretch : 1 + Math.random() * 0.35;
    const from = s.grow * (hazard ? FROM.hazard : FROM.splat);
    s.mesh.scale.set(from * s.stretch, from, 1);
    s.peak = shape ? shape.peak : 0.72 + Math.random() * 0.18;

    s.fadeIn = fadeIn;
    s.mesh.material.opacity = fadeIn > 0 ? 0 : s.peak;

    s.life = s.maxLife = life || (4 + size * 2.4 + Math.random() * 1.5);
  },
);

const _off = new THREE.Vector3();

// The last share of a stain's life is spent fading out.
export const FADE = 0.34;

// How much of its painted alpha a stain is still showing: 1 while it holds, then
// falling to 0 across the last `FADE` of its life. Ground that damages reads it
// too, so what has all but gone stops burning at a stated point rather than
// hurting just as much at a tenth of the alpha.
export const showing = (life, maxLife) =>
  Math.min(1, Math.max(0, (life / maxLife) / FADE));

const MAX_SPLATS = 90;
// Ground a hazard burns from is not decoration. It keeps its own budget so blood
// churn can never rub it out: what you can stand in is always drawn.
// A boss volley alone lays two dozen pools, and a second one arrives while the
// first is still burning: at 80 the floor would drop pools that were still
// hurting the player.
const MAX_HAZARD = 140;

// The share of a splat that stays once it has soaked in.
const kept = (s, inK) => s.peak * inK * CFG.arena.stain.settle;

// Held to the settle alpha, so a splat the cap cut short leaves the same mark.
function handOver(i) {
  const s = splats.live[i];
  if (!s.sunk) stains.take(s.mesh, Math.min(s.mesh.material.opacity, kept(s, 1)), s.burn);
  splats.release(i);
}

// The pool swap-pops, so live order says nothing about age — the stamp does.
function makeRoom(hazard, cap) {
  for (;;) {
    let n = 0, at = -1, oldest = 0;
    for (let i = 0; i < splats.live.length; i++) {
      const s = splats.live[i];
      if (s.hazard !== hazard) continue;
      n += 1;
      if (at < 0 || s.stamp < oldest) { oldest = s.stamp; at = i; }
    }
    if (n < cap) return;
    if (hazard) splats.release(at); else handOver(at);
  }
}

export function addSplat(pos, size, tint = null, life = 0, fadeIn = 0, set = undefined, shape = null) {
  makeRoom(false, MAX_SPLATS);
  splats.spawn(pos, size, tint, life, fadeIn, set, shape, false);
}

// For ground that damages: laid by whatever owns the damage, and fading on the
// same life, so the burn and the stain always end together.
export function addHazard(pos, size, tint = null, life = 0, fadeIn = 0, set = undefined, shape = null) {
  makeRoom(true, MAX_HAZARD);
  splats.spawn(pos, size, tint, life, fadeIn, set, shape, true);
}

// Rolled once, up front, so a mark drawn now and the splat laid later are the
// same blob rather than two guesses at one.
export function planSplat(size, set = SPLAT_TEX) {
  return {
    tex: (Math.random() * set.length) | 0,
    rot: Math.random() * Math.PI * 2,
    grow: size * (0.8 + Math.random() * 0.45),
    stretch: 1 + Math.random() * 0.35,
    peak: 0.72 + Math.random() * 0.18,
  };
}

export function splatter(pos, size, dir) {
  addSplat(pos, size);

  let dx = 0, dz = 0;
  if (dir) {
    const len = Math.hypot(dir.x, dir.z);
    if (len > 1e-4) { dx = dir.x / len; dz = dir.z / len; }
  }
  const n = 2 + ((Math.random() * 3) | 0) + Math.min(6, (size * 0.7) | 0);
  for (let i = 0; i < n; i++) {
    const spread = size * (0.5 + Math.random() * 1.4);
    _off.set(
      pos.x + dx * spread * 0.5 + (Math.random() - 0.5) * spread * 1.6,
      0,
      pos.z + dz * spread * 0.5 + (Math.random() - 0.5) * spread * 1.6,
    );
    addSplat(_off, size * (0.2 + Math.random() * 0.35));
  }
}

const _sd = new THREE.Vector3();
const _vn = new THREE.Vector3();
const UP_AXIS = new THREE.Vector3(0, 1, 0);

const SPECKS_FULL = 1200;
const SPECKS_THIN = 1500;
const SPECKS_LEAST = 0.12;

// Gore is priced per animal: nine specks a hit is right for one bug, and is ten
// thousand specks in the air when two thousand are being mown down — a red fog
// nobody can read, costing more to pose and draw than the horde it came off. So a
// spray thins as the field fills, from full below SPECKS_FULL to a token above.
// It never stops: a death with no blood at all reads as a bug vanishing.
function few(asked) {
  const over = gibs.live.length - SPECKS_FULL;
  if (over <= 0) return asked;
  return Math.max(1, Math.round(asked * Math.max(SPECKS_LEAST, 1 - over / SPECKS_THIN)));
}

export function blood(pos, o = {}) {
  const { power = 1, count = 8, dir = null, mark = false, size = 1 } = o;
  for (let i = 0, n = few(count); i < n; i++) {
    const g = gibs.spawn(pos, 0xffffff, power, GEO.drop);
    g.mesh.material.color.copy(bloodColor(true));
    g.drop = true;
    g.marks = mark;
    g.size = (0.5 + Math.random() * 0.8) * size;
    g.mesh.scale.setScalar(g.size);

    g.vel.set(
      (Math.random() - 0.5) * 11 * power,
      (1.5 + Math.random() * 6) * power,
      (Math.random() - 0.5) * 11 * power,
    );
    if (dir) g.vel.addScaledVector(dir, (2 + Math.random() * 7) * power);
    g.life = 0.45 + Math.random() * 0.55;
  }

  for (let i = 0, n = few(1 + ((Math.random() * 2) | 0)); i < n; i++) {
    const g = gibs.spawn(pos, 0xffffff, power * 0.7, GEO.gib);
    g.mesh.material.color.copy(bloodColor(true));
    g.mesh.scale.setScalar((0.28 + Math.random() * 0.3) * size);
    g.life = 0.45 + Math.random() * 0.4;
  }
}

export function muzzleFlash(pos, dir) {
  muzzleLight.position.copy(pos);
  muzzleLight.intensity = 22;
  for (let i = 0; i < 3; i++) {
    const g = gibs.spawn(pos, 0xffd479, 0.4, GEO.spark);
    g.vel.addScaledVector(dir, 8);
    g.life = 0.18;
  }
}

export function sparks(pos, n = 3) {
  for (let i = 0, k = few(n); i < k; i++) gibs.spawn(pos, 0xffd479, 0.4, GEO.spark);
}

const SOIL = [0xc8a86e, 0xe3cb92, 0xa08350];

export function dirt(pos, n, power = 0.7) {
  for (let i = 0, k = few(n); i < k; i++) {
    const g = gibs.spawn(pos, SOIL[(Math.random() * SOIL.length) | 0], power, GEO.gib);
    g.mesh.scale.setScalar(0.45 + Math.random() * 0.7);
    g.life = 0.35 + Math.random() * 0.45;
  }
}

export function update(dt) {
  const settle = CFG.arena.stain.settle;

  for (let i = gibs.live.length - 1; i >= 0; i--) {
    const p = gibs.live[i];
    p.life -= dt;
    p.vel.y -= 26 * dt;
    p.mesh.position.addScaledVector(p.vel, dt);

    if (p.drop) {
      const sp = p.vel.length();
      if (sp > 0.001) {
        _vn.copy(p.vel).divideScalar(sp);
        p.mesh.quaternion.setFromUnitVectors(UP_AXIS, _vn);
        const st = 1 + Math.min(2.6, sp * 0.11);
        p.mesh.scale.set(p.size / Math.sqrt(st), p.size * st, p.size / Math.sqrt(st));
      }
    } else {
      p.mesh.rotation.x += p.spin.x * dt;
      p.mesh.rotation.y += p.spin.y * dt;
    }

    if (p.mesh.position.y < 0.06) {
      p.mesh.position.y = 0.06;

      if (p.drop) {
        if (p.marks && p.wet === 0 && Math.random() < 0.4) {
          _sd.set(p.mesh.position.x, 0, p.mesh.position.z);
          addSplat(_sd, 0.1 + Math.random() * 0.22);
        }
        p.wet = 1;
        p.vel.set(0, 0, 0);
        p.life = Math.min(p.life, 0.12);
      } else {
        p.vel.y *= -0.35; p.vel.x *= 0.7; p.vel.z *= 0.7;
      }
    }
    if (p.life <= 0) gibs.release(i);
  }

  for (let i = splats.live.length - 1; i >= 0; i--) {
    const s = splats.live[i];
    s.life -= dt;
    const age = 1 - s.life / s.maxLife;

    const from = s.hazard ? FROM.hazard : FROM.splat;
    const k = age >= 0.06 ? 1 : 1 - (1 - age / 0.06) ** 3;
    const sc = s.grow * (from + (1 - from) * k);
    s.mesh.scale.set(sc * s.stretch, sc, 1);

    const inK = s.fadeIn > 0 ? Math.min(1, (s.maxLife - s.life) / s.fadeIn) : 1;
    const show = showing(s.life, s.maxLife);

    if (s.hazard) {
      s.mesh.material.opacity = s.peak * inK * show;
    } else {
      // Ground that damages ends; a splat only ever eases off to what soaks in.
      const want = s.peak * inK * (settle + (1 - settle) * show);
      // Painted the moment the fade begins, not at the end of it: the mesh then
      // dissolves over the whole fade with the soaked mark already under it, so
      // the sharp copy goes without the hand-over ever being a frame you can see.
      if (!s.sunk && show < 1) {
        s.sunk = kept(s, inK);
        stains.take(s.mesh, s.sunk, s.burn);
      }
      // What the mesh has to add on top of what has soaked in for the two of them
      // together to come to `want`.
      s.mesh.material.opacity = s.sunk
        ? Math.max(0, (want - s.sunk) / (1 - s.sunk))
        : want;
    }
    if (s.life <= 0) splats.release(i);
  }

  muzzleLight.intensity *= Math.exp(-22 * dt);
}

export function clear() {
  gibs.clear();
  splats.clear();
  stains.wipe();
}

// Only the ground that was burning. Blood is a record of the fight and outlives
// it; acid and scorch are the fight itself and must not.
export function clearHazards() {
  for (let i = splats.live.length - 1; i >= 0; i--) {
    if (splats.live[i].hazard) splats.release(i);
  }
}

