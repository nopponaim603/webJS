import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world, state } from '../core/world.js';
import { scene, focusZoom, releaseZoom, shakeAt } from '../engine/view.js';
import { audio } from '../engine/audio.js';
import { wrapPi } from '../core/geom2.js';
import * as model from '../allies/dronemodel.js';
import * as beam from '../allies/dronebeam.js';
import * as fx from '../fx/spatter.js';
import { makeGlow } from '../fx/glow.js';
import * as bubble from '../ui/bubble.js';
import * as sector from './sector.js';

const F = () => CFG.flyby;

const LINE = "REACH WAVE 15. I'LL BE WAITING.";

// The height a drone the player owns would hold, so the one they do not own
// arrives at the altitude they will see later.
const flyAt = () => CFG.walls.height * CFG.drone.overWall;

const _eye = new THREE.Vector3();
const _want = new THREE.Vector3();
const _mark = new THREE.Vector3();
const _dir = new THREE.Vector3();

let rig = null;
let run = null;
let over = false;

// A prop, not a machine on the roster: drone.add() would put this in the flight
// the HUD counts, the minimap draws and the bench unlocks against.
function build() {
  const parts = model.build();
  parts.object.scale.setScalar(F().scale);
  parts.object.visible = false;
  const glow = makeGlow(F().glow.color, F().glow.size, 0);
  parts.object.add(glow);
  scene.add(parts.object);
  return { ...parts, glow, pos: new THREE.Vector3() };
}

// Shown to a player who has never had one, and never again once one has been
// earned here.
export const due = () => state.wave === CFG.mission.waves
  && state.drones === 0
  && !sector.won(CFG.mission.horizon);

export const running = () => !!run;

// Latched rather than acted on: the scene finishes inside the simulation step,
// and what happens next is a screen the wave step has to put up in the right
// order. run.js clears it.
export const finished = () => over;

export function aim(fallback) { return run ? _eye : fallback; }

export function begin() {
  if (!rig) rig = build();
  const p = world.player.pos;
  const G = F();
  const side = Math.random() < 0.5 ? -1 : 1;

  // Held off on the far side of the player from the camera, so the machine is
  // between them and the horizon rather than behind their shoulder.
  const stand = new THREE.Vector3(p.x + side * G.stand * 0.4, flyAt(), p.z - G.stand);

  run = {
    phase: 'in', t: 0, side, stand,
    entry: new THREE.Vector3(stand.x - side * G.lead, flyAt() + G.high, stand.z - G.lead),
    exit: new THREE.Vector3(stand.x + side * G.lead, flyAt() + G.high, stand.z - G.lead * 1.6),
    shot: 0, next: 0, spoke: false,
  };

  over = false;
  rig.pos.copy(run.entry);
  rig.object.position.copy(run.entry);
  rig.object.rotation.set(0, Math.atan2(stand.x - run.entry.x, stand.z - run.entry.z), 0);
  rig.object.visible = true;
  audio.playAt('droneArrive', stand.x, stand.z);
}

export function clear() {
  run = null;
  over = false;
  if (!rig) return;
  rig.object.visible = false;
  rig.glow.material.opacity = 0;
  bubble.clear();
  releaseZoom();
}

const glide = (to, rate, dt) => rig.pos.lerp(to, 1 - Math.exp(-rate * dt));

const reached = (to, within) => rig.pos.distanceTo(to) < within;

function face(x, z, rate, dt) {
  const want = Math.atan2(x - rig.pos.x, z - rig.pos.z);
  const off = wrapPi(want - rig.object.rotation.y);
  const most = rate * dt;
  rig.object.rotation.y += Math.max(-most, Math.min(most, off));
}

function lamp(dt, cue) {
  const L = CFG.drone.led;
  if (cue) { rig.led.material.color.setHex(L.cues[cue].color); return; }
  run.pulse = (run.pulse || 0) + dt * L.rest.rate;
  const lit = L.rest.low + (1 - L.rest.low) * (0.5 + 0.5 * Math.sin(run.pulse)) * L.rest.lift;
  rig.led.material.color.setHex(L.rest.color).multiplyScalar(lit);
}

const step = (phase) => { run.phase = phase; run.t = 0; };

// Raked across the ground beside the player rather than at anything: there is
// nothing left alive on the floor by now, and a beam that ends on the dirt is
// one whose reach can be read off the ground it burns.
function rake(G) {
  const p = world.player.pos;
  const k = run.shot / Math.max(1, G.shots - 1);
  _mark.set(p.x + run.side * G.shotSpread * (0.6 + k * 0.8), 0,
            p.z - G.shotSpread * (0.9 - k * 0.7));
  _dir.copy(_mark).sub(rig.pos).normalize();

  beam.fire(rig.pos, _dir, { base: 0, range: G.shotRange, dry: true });
  audio.playAt('zapDrone', _mark.x, _mark.z, { rate: 1.45, gainScale: 0.9 });
  fx.dirt(_mark, 4, 0.9);
  shakeAt(_mark.x, _mark.z, G.shotShake, 16);
  run.shot += 1;
}

const PHASE = {
  in(G, dt) {
    glide(run.stand, G.ease, dt);
    face(run.stand.x, run.stand.z, G.turn, dt);
    rig.glow.material.opacity = Math.min(1, run.t / G.times.in);
    lamp(dt);
    if (reached(run.stand, G.arrive) || run.t > G.times.in) step('strafe');
  },

  strafe(G, dt) {
    glide(run.stand, G.ease, dt);
    lamp(dt, 'Attack');
    run.next -= dt;
    if (run.next <= 0 && run.shot < G.shots) { rake(G); run.next = G.shotGap; }
    face(_mark.x, _mark.z, G.turn * 2, dt);
    if (run.shot >= G.shots && run.t > G.times.strafe) step('hover');
  },

  hover(G, dt) {
    const p = world.player.pos;
    _want.set(p.x + run.side * G.eye, G.eye, p.z - G.eye * 1.4);
    glide(_want, G.ease, dt);
    face(p.x, p.z, G.turn, dt);
    lamp(dt, 'Switch');
    focusZoom(G.zoom);
    if (!run.spoke) {
      run.spoke = true;
      audio.playAt(`droneSwitch${1 + ((Math.random() * 3) | 0)}`, rig.pos.x, rig.pos.z);
      bubble.say(rig, LINE);
    }
    if (run.t > G.times.hover) step('out');
  },

  out(G, dt) {
    // Taken down with the machine that said it: the bubble outlives the scene by
    // seconds, and it does not tick down behind the screen that follows.
    bubble.clear();
    releaseZoom();
    glide(run.exit, G.ease * 0.8, dt);
    face(run.exit.x, run.exit.z, G.turn, dt);
    rig.glow.material.opacity = Math.max(0, 1 - run.t / G.times.out);
    lamp(dt);
    if (run.t > G.times.out) { rig.object.visible = false; step('back'); }
  },

  // The camera comes home before the scene lets go of it, so the handover back
  // to the player is a move rather than a cut.
  back(G) {
    if (run.t > G.times.back || _eye.distanceTo(world.player.pos) < G.arrive) {
      run = null;
      over = true;
    }
  },
};

function aimEye(G, dt) {
  const p = world.player.pos;
  // Framed on the middle of the two of them, so the machine can be watched
  // without losing the player it came for.
  if (run.phase === 'back') _want.copy(p);
  else _want.copy(rig.pos).add(p).multiplyScalar(0.5).setY(0);
  _eye.lerp(_want, 1 - Math.exp(-G.ease * dt));
}

export function update(dt) {
  if (!run) return;
  const G = F();
  const p = world.player;

  // Re-armed every frame, the way the boss's payout does it: the wave has not
  // cleared yet, so whatever the fight left burning is still on the floor.
  if (p && !p.dead) {
    p.held = Math.max(p.held || 0, G.hold);
    p.invuln = Math.max(p.invuln, G.hold);
  }

  run.t += dt;
  PHASE[run.phase](G, dt);
  if (run) {
    rig.object.position.copy(rig.pos);
    aimEye(G, dt);
  }
}
