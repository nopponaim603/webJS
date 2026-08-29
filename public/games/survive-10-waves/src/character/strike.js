import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import { scene, shake } from '../engine/view.js';
import { aimPoint, takeUse, triggerDown, onEscape } from '../engine/input.js';
import { audio } from '../engine/audio.js';
import * as modules from '../modules/index.js';
import * as effects from '../items/effects.js';
import * as energy from './energy.js';
import * as combat from '../game/combat.js';
import * as arena from '../arena/size.js';
import * as walls from '../arena/walls.js';
import * as shockwave from '../fx/shockwave.js';
import * as note from '../ui/note.js';
import { ZONE_TEX, ZONE_FILL } from '../fx/textures.js';
import { clip } from '../arena/clip.js';

const S = () => CFG.jetStrike;

const DISC = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

function makeMark(tex, order) {
  const m = new THREE.Mesh(DISC, clip(new THREE.MeshBasicMaterial({
    map: tex, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  })));
  m.renderOrder = order;
  m.visible = false;
  scene.add(m);
  return m;
}

// What the field will cover, and the rim of how far it can be thrown. Both are
// drawn while the mark is up, so the choice is between two known things rather
// than a guess.
const zone = makeMark(ZONE_TEX.disc, 3);
const rim = makeMark(ZONE_TEX.annulus, 3);

const mark = { on: false, x: 0, z: 0, ok: false, beat: 0 };
const dive = { on: false, t: 0, dur: 0, fromY: 0, x: 0, z: 0, toX: 0, toZ: 0 };
const wave = { on: false, x: 0, z: 0, max: 0, damage: 0, hit: new Set() };

let held = false;

onEscape(() => (mark.on ? (drop(), true) : false));

function drop() {
  mark.on = false;
  zone.visible = rim.visible = false;
}

export function clear() {
  drop();
  dive.on = false;
  wave.on = false;
  wave.hit.clear();
  shockwave.clear();
}

// Owning it and being up there is what makes the key yours to take; whether the
// tank can pay for it is a separate question, and one the player has to be told
// the answer to rather than left pressing a dead key.
const armable = (p) => modules.hasStrike() && p.fly.on && !p.dead;
const afford = (p) => energy.has(p, modules.strikeCost());

function deny() {
  note.show(CFG.jetStrike.shortNote);
  audio.play('jetDeny');
}

// Where the mark can actually go: inside the throw, inside the ring, and not
// inside a wall — a drop through cover would put the player inside it.
function place(p) {
  const cast = modules.strikeCast();
  let dx = aimPoint.x - p.pos.x;
  let dz = aimPoint.z - p.pos.z;
  const d = Math.hypot(dx, dz);
  if (d > cast) { dx *= cast / d; dz *= cast / d; }

  mark.x = p.pos.x + dx;
  mark.z = p.pos.z + dz;
  mark.ok = !walls.inside(mark.x, mark.z, CFG.player.radius)
    && Math.hypot(mark.x, mark.z) < arena.radius() - CFG.player.radius;
}

function paint(p, dt) {
  const C = S();
  mark.beat += dt * C.markBeat;
  const pulse = 0.75 + 0.25 * Math.sin(mark.beat);
  const reach = modules.strikeReach();

  zone.position.set(mark.x, 0.05, mark.z);
  zone.scale.setScalar((reach * 2) / ZONE_FILL);
  zone.material.color.setHex(mark.ok ? C.markColor : C.denyColor);
  zone.material.opacity = C.markOpacity * pulse;

  rim.position.set(p.pos.x, 0.04, p.pos.z);
  rim.scale.setScalar((modules.strikeCast() * 2) / ZONE_FILL);
  rim.material.color.setHex(C.castColor);
  rim.material.opacity = C.castOpacity * pulse;
  zone.visible = rim.visible = true;
}

function launch(p) {
  const C = S();
  energy.spend(p, modules.strikeCost());
  drop();

  const away = Math.hypot(mark.x - p.pos.x, mark.z - p.pos.z);
  Object.assign(dive, { on: true, t: 0,
                        dur: Math.max(C.leastDive, away / C.diveSpeed),
                        fromY: p.fly.alt, x: p.pos.x, z: p.pos.z,
                        toX: mark.x, toZ: mark.z });
  p.fly.on = false;
  audio.playAt('jetDive', p.pos.x, p.pos.z);
}

// Straight in and steepening: the horizontal runs out early and the last of the
// height goes all at once, so it reads as a body being driven down rather than
// gliding to a stop.
function fall(p, dt) {
  dive.t += dt;
  const k = Math.min(1, dive.t / dive.dur);
  const across = 1 - Math.pow(1 - k, 2);

  p.pos.x = dive.x + (dive.toX - dive.x) * across;
  p.pos.z = dive.z + (dive.toZ - dive.z) * across;
  p.fly.alt = dive.fromY * (1 - k * k);
  p.held = Math.max(p.held, 0.2);
  p.fireLock = Math.max(p.fireLock, 0.2);

  if (k < 1) return;
  dive.on = false;
  p.fly.alt = 0;
  land(p);
}

function land(p) {
  const C = S();
  const reach = modules.strikeReach();

  Object.assign(wave, { on: true, x: p.pos.x, z: p.pos.z, max: reach,
                        damage: modules.strikeDamage() });
  wave.hit.clear();

  shockwave.open(p.pos.x, p.pos.z, reach);
  shake(C.shake);
  audio.playAt('jetStrike', p.pos.x, p.pos.z);
  p.invuln = Math.max(p.invuln, C.cover);
  kick(p);
}

// Handed to the item system's own `rate` effect rather than given a clock here:
// the readout, the aura and the wave clearing all already know what to do with
// one, and a drop landed on top of an Autoloader refreshes it the same way a
// second Autoloader would.
function kick(p) {
  if (!modules.hasKick()) return;
  const mult = modules.kickMult();
  effects.use(p, {
    effect: 'rate', mult, seconds: modules.kickSeconds(),
    name: 'Kickstart', color: S().kickColor,
    hint: () => `Fire rate +${Math.round((mult - 1) * 100)}%`,
  });
}

const _at = new THREE.Vector3();

// A shove is a speed that runs down at a known rate, so the ground it will cover
// is knock/decay. Cut to the room the body has left before the arena ring, that
// is what keeps the field from throwing anything through the wall.
function shove(bug, ux, uz, knock) {
  const room = arena.roomTo(bug.pos.x, bug.pos.z, ux, uz, bug.radius);
  bug.knock.set(ux, 0, uz).multiplyScalar(Math.min(knock, room * CFG.bugAnim.knockDecay));
}

// Everything the front has just reached, once each: a wave passes over a body
// one time. What it takes falls off with how far out it was caught, so the
// middle of the field is worth standing in and the rim is worth stepping to.
function sweep() {
  const C = S();
  const r = shockwave.front();

  for (const bug of world.bugs) {
    if (wave.hit.has(bug) || bug.hp <= 0) continue;
    const dx = bug.pos.x - wave.x, dz = bug.pos.z - wave.z;
    const d = Math.hypot(dx, dz);
    if (d > r + bug.radius) continue;

    wave.hit.add(bug);
    if (d > 1e-3) shove(bug, dx / d, dz / d, C.knock);
    const share = 1 - (1 - C.edge) * Math.min(1, d / wave.max);
    _at.set(bug.pos.x, bug.radius, bug.pos.z);
    combat.hurt(bug, Math.round(wave.damage * share), _at, 1, 'thunder drop', false);
  }

  if (r < wave.max) return;
  wave.on = false;
  wave.hit.clear();
}

export function update(p, dt) {
  if (wave.on) sweep();
  if (dive.on) { fall(p, dt); return; }

  // A tank that ran down while the mark was up takes the mark with it, and says
  // so: the burn is still running, so this can happen without another keypress.
  if (mark.on && !armable(p)) drop();
  else if (mark.on && !afford(p)) { drop(); deny(); }

  // Taken whether or not there is anything to do with it: nothing else reads the
  // key, and one left standing would fire the moment the mark became armable.
  const used = takeUse();
  if (mark.on || armable(p)) {
    if (used) {
      if (mark.on) drop();
      else if (!afford(p)) deny();
      else { mark.on = true; mark.beat = 0; audio.play('jetLock'); }
    }
  }
  if (!mark.on) { held = triggerDown(); return; }

  place(p);
  paint(p, dt);
  p.fireLock = Math.max(p.fireLock, 0.1);

  const pulled = triggerDown() && !held;
  held = triggerDown();
  if (pulled && mark.ok) launch(p);
  else if (pulled) audio.play('jetDeny');
}
