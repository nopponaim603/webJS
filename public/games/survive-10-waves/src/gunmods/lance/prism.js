import * as THREE from 'three';
import { CFG } from '../../config/index.js';
import { audio } from '../../engine/audio.js';
import * as fx from '../../fx/spatter.js';
import { cast } from '../../weapons/laser.js';
import * as look from '../shared/look.js';
import { prism } from '../values/lance.js';

// Prism Array. A lens across the aperture, so one cut leaves as a fan. The
// charge is divided rather than copied — every beam is weaker than the shot
// would have been — and what it buys is a wall of light instead of a line,
// which is the answer to a crowd that has spread out.

const UP = new THREE.Vector3(0, 1, 0);

const _aim = new THREE.Vector3();
const _at = new THREE.Vector3();
const _tip = new THREE.Vector3();
const _tint = new THREE.Color();
const _edge = new THREE.Color();

const _shot = {
  dmg: 0, half: 0, power: 0, retain: 1, bounces: 0, crit: false,
  overWalls: false, tint: 0, core: 0,
};

export function plan(p, gun, shot) {
  if (!prism.on()) return;
  shot.dmg *= prism.share();
  shot.prism = true;
}

// The gun has already fired the middle of the fan by the time this runs, so what
// is left is the siblings — placed in pairs off the centre, which is what keeps
// the fan symmetrical however many of them there are.
export function beam(p, gun, info) {
  if (!prism.on() || !info || !info.shot || !info.shot.prism) return;
  const shot = info.shot;
  const siblings = prism.beams() - 1;
  if (siblings < 1) return;

  const pairs = Math.floor(siblings / 2);
  const half = (prism.spread() * Math.PI / 180) / 2;
  const taper = prism.taper();

  for (let r = 1; r <= pairs; r++) {
    const turn = half * (r / pairs);
    split(info, shot, turn, r, pairs, taper);
    split(info, shot, -turn, r, pairs, taper);
  }
  if (siblings % 2) split(info, shot, 0, 0, pairs, taper);

  flare(info.from, info.aim, half);
  audio.play(CFG.gunmods.lance.prism.sfx, {
    rate: 0.95 + Math.random() * 0.1 + prism.grade() * 0.12, force: true,
  });
}

function split(info, shot, turn, rank, pairs, taper) {
  const L = prism.look();
  _aim.set(info.aim.x, 0, info.aim.z);
  if (_aim.lengthSq() < 1e-6) _aim.set(0, 0, 1);
  _aim.normalize().applyAxisAngle(UP, turn);

  _shot.dmg = shot.dmg;
  _shot.half = shot.half * Math.pow(taper, rank);
  _shot.power = shot.power;
  _shot.retain = shot.retain;
  _shot.bounces = shot.bounces;
  _shot.crit = shot.crit;
  _shot.overWalls = shot.overWalls;
  _shot.tint = rank ? edgeward(rank, pairs) : L.color;
  // The core is bent with the body, or every blade in the fan wears the same
  // white down its middle and the colour separation the prism is for is lost.
  _shot.core = rank ? paleward(rank, pairs) : L.core;
  cast(info.from, _aim, _shot);

  _tip.set(info.from.x + _aim.x * 2.4, CFG.laser.height, info.from.z + _aim.z * 2.4);
  look.beam(info.from, _tip, {
    color: _shot.tint, width: _shot.half * 1.4, life: L.splitLife, opacity: 0.75, taper: 1,
  });
  look.beam(info.from, _tip, {
    color: _shot.core, width: _shot.half * 0.4, life: L.splitLife * 0.6, opacity: 0.9, taper: 1,
  });
}

// The further off the middle a beam sits, the further its colour is bent: the
// centre stays the lance's own red and the edges of the fan go violet.
function edgeward(rank, pairs) {
  const L = prism.look();
  _tint.setHex(L.color);
  _edge.setHex(L.edge);
  return _tint.lerp(_edge, pairs ? rank / pairs : 1).getHex();
}

function paleward(rank, pairs) {
  const L = prism.look();
  _tint.setHex(L.core);
  _edge.setHex(L.edge);
  return _tint.lerp(_edge, (pairs ? rank / pairs : 1) * 0.82).getHex();
}

// Where the fan is made: a knot of light on the muzzle with the split drawn
// across it, so the beams read as one shot divided rather than several fired.
function flare(from, aim, half) {
  const L = prism.look();
  const grade = prism.grade();
  const size = L.lensSize * (1 + grade);

  look.orb(from, size * 0.75, {
    color: L.edge, from: 0.4, to: 1.3, life: L.lensLife * 0.8, opacity: 0.45,
  });
  look.orb(from, size * 0.34, {
    color: L.color, from: 0.3, to: 1.1, life: L.lensLife * 0.7, opacity: 1,
  });
  look.orb(from, size * 0.14, {
    color: 0xffffff, from: 1.1, to: 0.3, life: L.lensLife * 0.5, opacity: 1,
  });
  look.mark(from.x, from.z, size * 0.42, {
    tex: look.TEX.ZONE_TEX.annulus, color: L.lensColor, life: L.lensLife * 0.6,
    from: 0.3, to: 1.5, opacity: 0.85, y: 0.24,
  });

  _aim.set(aim.x, 0, aim.z).normalize();
  const nx = -_aim.z, nz = _aim.x;
  const across = size * (0.7 + grade * 0.5);
  _at.set(from.x - nx * across, from.y, from.z - nz * across);
  _tip.set(from.x + nx * across, from.y, from.z + nz * across);
  look.beam(_at, _tip, {
    color: L.edge, width: size * 0.3, life: L.lensLife * 0.6, opacity: 0.7, taper: 1,
  });
  look.beam(_at, _tip, {
    color: 0xffffff, width: size * 0.09, life: L.lensLife * 0.4, opacity: 1, taper: 1,
  });

  look.burst(from, 6 + Math.round(grade * 8), {
    color: L.grit, speed: 10, rise: 0.8, size: 1.5 + grade * 0.4, life: 0.32, gravity: 24,
  });
  fx.sparks(from, 3 + Math.round(grade * 4));

  const wedge = Math.max(0.05, half);
  const n = 2 + Math.round(grade * 3);
  for (let i = 0; i < n; i++) {
    const a = -wedge + (i / Math.max(1, n - 1)) * wedge * 2;
    _aim.set(aim.x, 0, aim.z).normalize().applyAxisAngle(UP, a);
    _at.set(from.x + _aim.x * size * 1.5, 0.4, from.z + _aim.z * size * 1.5);
    look.orb(_at, size * 0.4, {
      color: L.lensColor, from: 1, to: 0.1, life: L.splitLife, opacity: 0.95,
    });
  }
}

export function update() {}

export function clear() {}
