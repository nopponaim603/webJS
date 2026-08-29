import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { scene, camera, renderer, focusZoom, releaseZoom } from '../engine/view.js';
import { world, state } from '../core/world.js';
import { audio } from '../engine/audio.js';
import { buildPad, DECK_Y, DOOR_OPEN } from './pad/build.js';
import * as walls from '../arena/walls.js';
import * as arena from '../arena/size.js';

const PAD = CFG.extraction;
const TAU = Math.PI * 2;

const pad = buildPad();
const { group } = pad;
scene.add(group);

const arrow = new THREE.Mesh(
  new THREE.ConeGeometry(0.42, 1.15, 4),
  new THREE.MeshBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.85 }),
);
arrow.rotation.order = 'YXZ';
arrow.visible = false;
arrow.renderOrder = 2;
scene.add(arrow);

const linear = (t) => t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

const runs = [];
const at = (delay, dur, ease, run, done) => runs.push({ t: -delay, dur, ease, run, done });

function tick(dt) {
  for (let i = runs.length - 1; i >= 0; i--) {
    const r = runs[i];
    r.t += dt;
    if (r.t < 0) continue;
    const k = Math.min(1, r.t / r.dur);
    r.run(r.ease(k));
    if (k < 1) continue;
    runs.splice(i, 1);
    if (r.done) r.done();
  }
}

// Every sound the pad makes is a recording, played where the pad is standing —
// and only while there is a round to hear it. The pad folds itself away after
// the wave ends, behind the upgrade screen, and a machine nobody can see is a
// machine nobody should be listening to.
function sfx(name, opts) {
  if (!name || state.mode !== 'playing') return;
  audio.playAt(name, group.position.x, group.position.z, opts);
}

let charge = 0;
let chargeVoice = null;
let clock = 0;
let phase = 'hidden';
let deck = 0;
let finished = false;
// The same machine runs both ways: it puts the player into the ground at the
// end of a wave and takes them back out of it at the start of the next.
let kind = 'extract';

// Only the outbound pad is one the loop can stand on and charge.
export const raised = () =>
  kind === 'extract' && phase !== 'hidden' && phase !== 'retracting';
export const progress = () => charge;
export const spot = () => group.position;

const START = { base: 0, plate: 0.133, stripe: 0.253, pod: 0.347,
                pylon: 0.453, trim: 0.533, door: 0.9 };
const STEP = { base: 0.033, plate: 0.033, stripe: 0.047, pod: 0.033,
               pylon: 0.04, trim: 0, door: 0.033 };
const LAMP = { at: 0.58, step: 0.03, time: 0.24, drop: 0.42 };

// What each kind of part sounds like going in and coming out. One entry a kind,
// used unpitched, so two of the same thing are two of the same sound — the
// variety is between kinds, not within them.
// `out` is its own pitch because the whole machine stows with one sound: left
// on the arrival pitch, a slab and a lamp pull back with the same voice.
const VOICE = {
  base:   { in: 'rigHeavy', rate: 1,    out: 0.82 },
  door:   { in: 'rigHeavy', rate: 1.10, out: 0.90 },
  plate:  { in: 'rigPiece', rate: 1,    out: 1.00 },
  stripe: { in: 'rigPiece', rate: 1.18, out: 1.08 },
  pod:    { in: 'rigSmall', rate: 1,    out: 1.18 },
  pylon:  { in: 'rigSmall', rate: 0.85, out: 1.26 },
  trim:   { in: 'rigSmall', rate: 0.75, out: 1.34 },
};
const LAMP_VOICE = { in: 'rigLamp', out: 'rigStowLamp', rate: 1.4, outRate: 1.45 };


// A part leaves with the weight it arrived with.
const STOW_OF = { rigHeavy: 'rigStowBig', rigPiece: 'rigStow', rigSmall: 'rigStowSmall' };
const stowOf = (grp) => STOW_OF[VOICE[grp].in];

// t=0 is the piece folded away, t=1 is locked down: every part telescopes
// straight up out of the one beneath it, and the retract is this run backwards.
function place(p, t) {
  p.obj.position.y = p.y - p.off * (1 - t);
}

export function warmup() {
  // Every piece has to be visible for this: compile() only walks what would be
  // drawn, and half the machine starts life switched off.
  const off = [];
  group.traverse((o) => { if (!o.visible) { off.push(o); o.visible = true; } });
  group.visible = true;
  group.position.set(0, 0, 0);

  for (const t of pad.textures) renderer.initTexture(t);
  renderer.compile(scene, camera);

  // A camera pointed at the pad, not the game's own: compile() builds programs
  // but uploads no geometry, and a render that never framed the machine would
  // cull every piece of it and upload nothing either. Fifty buffers land here
  // instead of on the frame it is first asked for.
  const eye = new THREE.PerspectiveCamera(70, 1, 0.1, 120);
  eye.position.set(0, 9, 12);
  eye.lookAt(0, 0.4, 0);

  // Straight to the canvas, not to a target: the buffer bindings a piece needs
  // are made per framebuffer, and warming a different one leaves the real frame
  // to do it again. The loading screen is still over the top of this.
  renderer.render(scene, eye);

  group.visible = false;
  renderer.compile(scene, camera);
  for (const o of off) o.visible = false;
}

// Walls and the taller rocks are all in the same box list, so one query covers
// both: the pad is four units across, and a spot is only its own if nothing is
// standing within that of the middle of it.
const roomAt = (x, z) => !walls.inside(x, z, PAD.outer);

// Inside the ring, with the whole machine clear of the fence.
function inArena(x, z) {
  const lim = arena.radius() - PAD.outer - 1;
  const d = Math.hypot(x, z);
  return d > lim ? { x: x * lim / d, z: z * lim / d } : { x, z };
}

// Where it was asked to land, or the nearest place it fits. Searched outward in
// rings, each turned off the one inside it so the candidates never line up.
function spotFor(x, z) {
  const asked = inArena(x, z);
  if (roomAt(asked.x, asked.z)) return asked;
  // Searched around the spot inside the ring, not around the one that was
  // asked for: a request from outside the fence clamps every candidate onto the
  // same point, and the search would never move at all.
  for (let r = 2; r <= 20; r += 2) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + r * 0.4;
      const spot = inArena(asked.x + Math.cos(a) * r, asked.z + Math.sin(a) * r);
      if (roomAt(spot.x, spot.z)) return spot;
    }
  }
  return asked;
}

function begin(pos) {
  const spot = spotFor(pos ? pos.x : 0, pos ? pos.z : 0);
  group.position.set(spot.x, 0, spot.z);
  group.visible = true;
  runs.length = 0;
  charge = 0;
  finished = false;
}

export function show(pos) {
  begin(pos);
  kind = 'extract';
  deck = DECK_Y;
  deploy(false, () => { phase = 'ready'; charge = 0; });
}

// The other direction: the pad builds itself open, hands the player up out of
// the ground, seals behind them and packs away while they walk off it.
export function deliver(pos) {
  begin(pos);
  kind = 'deliver';
  deck = -PAD.sinkDepth;
  focusZoom();
  // Put them under the pad rather than under where it was asked for: a blocked
  // middle moves the machine, and the player rides whichever spot it took.
  if (world.player) {
    world.player.pos.x = group.position.x;
    world.player.pos.z = group.position.z;
  }
  deploy(true, () => {});
  phase = 'arriving';

  at(0.45, 1.35, easeInOut, (t) => {
    deck = -PAD.sinkDepth + (DECK_Y + PAD.sinkDepth) * t;
  }, seal);
}

const SEAL = { step: 0.04, time: 0.4, fade: 0.4 };

function seal() {
  phase = 'sealing';
  releaseZoom();
  pad.doors.forEach((d, i) => {
    at(i * SEAL.step, SEAL.time, easeInOut, (t) => { d.rotation.z = (1 - t) * DOOR_OPEN; },
       () => sfx(VOICE.door.in, { rate: VOICE.door.rate }));
  });
  // The blanket is what the player came up out of, so the hatch has to be over
  // the top of it before it goes: pulled any earlier and the light is taken away
  // while there is still a gap to see it through.
  const shut = (pad.doors.length - 1) * SEAL.step + SEAL.time;
  at(shut, SEAL.fade, easeOut, (t) => glow(1 - t));
  at(shut + SEAL.fade, 0.001, linear, () => {}, retract);
}

export function hide() {
  if (phase === 'hidden' || phase === 'retracting') return;
  retract();
}

function park() {
  phase = 'hidden';
  finished = false;
  stopCharge(0.15);
  releaseZoom();
  group.visible = false;
  arrow.visible = false;
  runs.length = 0;
  charge = 0;
}

export function hideNow() {
  park();
  if (world.player) world.player.pos.y = 0;
}

// `open` builds the hatch with its doors already folded back, which is how the
// pad arrives when it is delivering: there is nothing to uncover, and the
// player comes up through the middle of it.
function deploy(open, then) {
  phase = 'deploying';
  pad.loadRing.visible = !open;
  for (let i = 0; i < pad.loadRing.count; i++) placeLamp(i, 0);
  glow(open ? 1 : 0);
  for (const d of pad.doors) d.rotation.z = open ? DOOR_OPEN : 0;
  for (const p of pad.parts) {
    p.obj.visible = false;
    place(p, 0);
  }
  // Nothing waits on anything buried any more, so the first piece lands almost
  // at once.
  const T0 = 0.12;
  // Delivering, the hatch rises already folded back and only shuts later, over
  // the player. A part is heard where it is seen to move, so its voice waits for
  // the seal rather than landing on a rise that shows nothing.
  for (const p of pad.parts) {
    const land = open && p.grp === 'door'
      ? undefined
      : () => sfx(VOICE[p.grp].in, { rate: VOICE[p.grp].rate });
    at(T0 + START[p.grp] + p.gi * STEP[p.grp], 0.24, easeInOut, (t) => {
      p.obj.visible = true;
      place(p, t);
    }, land);
  }
  // The timer belongs to the extract. A delivery has no charge to count, so the
  // ring is not raised — and a ring nobody is shown is a ring nobody should hear.
  if (pad.loadRing.visible) {
    for (let i = 0; i < pad.loadRing.count; i++) {
      at(T0 + LAMP.at + i * LAMP.step, LAMP.time, easeInOut, (t) => placeLamp(i, t),
         () => sfx(LAMP_VOICE.in, { rate: LAMP_VOICE.rate }));
    }
  }

  const total = T0 + START.door + 7 * STEP.door + 0.24;
  at(0, total, linear, () => {}, then);
}

const LIT = new THREE.Color(0x19f2ff);
const OFF = new THREE.Color(0x11333d);
const _c = new THREE.Color();

const _lm = new THREE.Matrix4();
const _lp = new THREE.Vector3();
const _lq = new THREE.Quaternion();
const _ls = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

// One lamp of the timer ring, driven up into its slot like every other piece.
// They are instances of one mesh, so a lamp that has not arrived is one with no
// size rather than one that is hidden.
function placeLamp(i, t) {
  const n = pad.loadRing.count;
  _lp.set(0, -LAMP.drop * (1 - t), 0);
  _lq.setFromAxisAngle(UP, -(i / n) * TAU);
  _ls.setScalar(t > 0 ? 1 : 0);
  pad.loadRing.setMatrixAt(i, _lm.compose(_lp, _lq, _ls));
  pad.loadRing.instanceMatrix.needsUpdate = true;
}

// Filled behind the head, dark ahead of it, and the head itself hot.
function paintRing() {
  if (!pad.loadRing.visible) return;
  const n = pad.loadRing.count;
  for (let i = 0; i < n; i++) {
    const at = i / n;
    const lead = Math.max(0, 1 - (charge - at) * n * 0.9);
    _c.copy(at < charge ? LIT : OFF).multiplyScalar(at < charge ? 0.55 + lead * 0.9 : 1);
    pad.loadRing.setColorAt(i, _c);
  }
  pad.loadRing.instanceColor.needsUpdate = true;
}

// How much blanket there is: black first so the ground goes, then the light on
// top of it.
let lit = 0;
function glow(k) {
  lit = k;
  pad.blanket.dark.material.opacity = Math.min(1, k * 1.8);
  pad.blanket.glow.material.opacity = k * 0.85;
  pad.blanket.wisps.material.opacity = k * 0.6;
}

function spin(dt) {
  if (pad.blanket.glow.material.opacity <= 0) return;
  pad.blanket.wisps.rotation.y += dt * 0.5;
  pad.blanket.glow.rotation.y -= dt * 0.22;
}

function stopCharge(fade, delay) {
  if (!chargeVoice) return;
  chargeVoice.stop(fade, delay);
  chargeVoice = null;
}

// Doubling the rate is an octave, so the climb is written as one: a charge that
// rose by a flat amount per second would keep flattening out in pitch towards
// the top, which is exactly where it has to still sound like it is going
// somewhere. Under an octave across the whole ring — the climb has to be heard
// as one steady rise, not as a slide.
const CHARGE_RATE = (k) => 0.82 * Math.pow(1.65, k);

// An octave above where the charge tops out, reached in a fraction of the time
// the climb to it took, and stopped at full level while it is still going up.
const RELEASE = { rate: CHARGE_RATE(2.4), ease: 0.05, after: 0.2 };

// The machine winding up under the player: it comes in as they step on, climbs
// most of an octave over the ring, and slides back down with the charge when
// they step off rather than cutting out from under them.
function hum(inside) {
  const wind = phase === 'ready' && state.mode === 'playing'
               && world.player && !world.player.dead && (inside || charge > 0);
  if (!wind) { stopCharge(0.3); return; }
  if (!chargeVoice) chargeVoice = audio.sustain('padCharge', { rate: CHARGE_RATE(0) });
  if (chargeVoice) {
    chargeVoice.set(inside ? 0.55 + 0.45 * charge : 0.4 * charge, CHARGE_RATE(charge));
  }
}

// The doors fold back and the blanket comes up through the gap they leave.
function openDoors() {
  phase = 'opening';
  // Let go rather than faded: the charge runs away upward at full level and is
  // gone, and the lock lands where it was.
  if (chargeVoice) chargeVoice.set(1, RELEASE.rate, RELEASE.ease);
  stopCharge(0, RELEASE.after);
  sfx('rigLock');
  focusZoom();
  pad.loadRing.visible = false;
  pad.doors.forEach((d, i) => {
    at(i * 0.053, 0.433, easeInOut, (t) => { d.rotation.z = t * DOOR_OPEN; },
       () => sfx('rigFold'));
  });
  at(0.2, 0.8, easeOut, glow);
  at(pad.doors.length * 0.053 + 0.167, 0.267, easeInOut,
     (t) => { deck = DECK_Y + (0.06 - DECK_Y) * t; }, descend);
}

// Into the blanket, and the floor closes over them: no hole to fall down, just
// light on the ground and a player who is no longer above it.
function descend() {
  phase = 'descending';
  at(0.1, 1.9, easeInOut, (t) => {
    deck = 0.06 - (PAD.sinkDepth + 0.06) * t * t * (3 - 2 * t);
  }, () => {
    phase = 'spent';
    // The demo holds a beat at the bottom before the screen arrives.
    at(0.233, 0.001, linear, () => {}, () => { finished = true; });
  });
}

// The reverse cascade: doors first, then the deck top-down, and the ring
// segments last as the ground slab comes back up over the shaft.
function retract() {
  phase = 'retracting';
  runs.length = 0;
  // Faded from wherever the blanket actually is. A delivery has already put it
  // out under the closed hatch, and starting this run at full would light it
  // back up to do it a second time.
  if (lit > 0) {
    const from = lit;
    at(0, 0.4, easeOut, (t) => glow(from * (1 - t)));
  }
  // Only a ring still standing has anything to pack away: the charge takes it
  // off screen when it fills, and a delivery never raised one.
  if (pad.loadRing.visible) {
    for (let i = 0; i < pad.loadRing.count; i++) {
      at(0.667 + (pad.loadRing.count - 1 - i) * 0.03, 0.2, easeInOut,
         (t) => placeLamp(i, 1 - t),
         () => sfx(LAMP_VOICE.out, { rate: LAMP_VOICE.outRate }));
    }
  }

  // Deeper than the drop they arrived on, so the hatch is under the floor by
  // the time it is switched off — and so a player still standing on it is set
  // down on the ground exactly as it goes, rather than left hanging.
  const T0 = 0.667;
  for (const p of pad.parts) {
    if (p.grp !== 'door') continue;
    at(T0 + p.gi * 0.033, 0.253, easeInOut,
       (t) => { p.obj.position.y = p.y - (p.y + STAND) * t; }, () => {
      p.obj.visible = false;
      sfx(stowOf(p.grp), { rate: VOICE[p.grp].out });
    });
  }

  const T1 = T0 + 0.333;
  const rStart = { trim: 0, pylon: 0.04, pod: 0.107, stripe: 0.173, plate: 0.253, base: 0.6 };
  const rStep = { trim: 0, pylon: 0.04, pod: 0.033, stripe: 0.047, plate: 0.027, base: 0.027 };
  for (const p of pad.parts) {
    if (p.grp === 'door') continue;
    const start = T1 + rStart[p.grp] + p.gi * rStep[p.grp];
    // Every piece is heard leaving, the same way every piece was heard arriving:
    // the machine took itself apart in near silence before this.
    const gone = () => {
      p.obj.visible = false;
      sfx(stowOf(p.grp), { rate: VOICE[p.grp].out });
    };
    at(start, 0.227, easeInOut, (t) => place(p, 1 - t), gone);
  }

  const T2 = T1 + 0.6 + 11 * 0.027 + 0.293;
  // Nothing to hear on the way out: the last piece has already stowed itself,
  // and a lock landing on an empty patch of ground is a sound with no machine
  // behind it.
  at(T2, 0.4, linear, () => {}, hideNow);
}

const on = () => {
  if (!world.player) return false;
  const p = world.player.pos;
  return Math.hypot(p.x - group.position.x, p.z - group.position.z) < PAD.radius;
};

// What the machine is offering to stand on right now, read off the hatch itself
// rather than off which phase it happens to be in. When the pad takes itself
// apart the doors go down with the player still on them, so they ride the deck
// out instead of dropping through it and standing in it.
const DOOR_HOME = 0.3;
const STAND = DECK_Y - DOOR_HOME;

function standHeight() {
  if (phase === 'hidden') return 0;
  // The highest leaf still there, not the first one: the hatch leaves in a
  // cascade, and you stand on whatever has not gone yet.
  let top = -Infinity;
  for (const d of pad.doors) if (d.visible) top = Math.max(top, d.position.y);
  return top === -Infinity ? 0 : Math.max(0, top + STAND);
}

// Standing on the pad puts you on the pad, and once the doors are open the
// elevator has you: no walking off it, and no walking away from it.
function carry(dt) {
  const p = world.player;
  if (!p || p.dead) return;
  if (phase === 'opening' || phase === 'descending' || phase === 'spent'
      || phase === 'arriving') {
    p.held = Math.max(p.held || 0, 0.2);
    p.invuln = Math.max(p.invuln, 0.2);
    const k = 1 - Math.exp(-6 * dt);
    p.pos.x += (group.position.x - p.pos.x) * k;
    p.pos.z += (group.position.z - p.pos.z) * k;
    p.pos.y = deck;
    return;
  }
  // Left underground while the pad packs away over the top of them: the round
  // is over by then, and hideNow() is what stands them back up.
  if (phase === 'retracting' && kind === 'extract') return;
  const near = Math.hypot(p.pos.x - group.position.x, p.pos.z - group.position.z) < PAD.outer;
  const want = near ? standHeight() : 0;
  p.pos.y += (want - p.pos.y) * (1 - Math.exp(-14 * dt));
}

const _to = new THREE.Vector3();

function updateArrow(inside) {
  if (phase !== 'ready' || inside || !world.player) { arrow.visible = false; return; }
  const p = world.player.pos;
  _to.set(group.position.x - p.x, 0, group.position.z - p.z);
  const d = _to.length();
  if (d < PAD.radius) { arrow.visible = false; return; }
  _to.divideScalar(d);
  arrow.visible = true;
  arrow.position.set(p.x + _to.x * PAD.arrowDist, 0.55 + Math.sin(clock * 4) * 0.08,
                     p.z + _to.z * PAD.arrowDist);

  arrow.rotation.set(Math.PI / 2, Math.atan2(_to.x, _to.z), 0);
  arrow.material.opacity = 0.55 + Math.sin(clock * 4) * 0.2;
}

export function update(dt) {
  clock += dt;
  if (phase === 'hidden') return false;

  tick(dt);
  pad.mat.red.emissiveIntensity = 1.1 + Math.sin(clock * 5) * 0.9;
  const lamp = 1.4 + Math.sin(clock * 3) * 0.4;
  for (const m of pad.cyans) m.emissiveIntensity = lamp;

  const inside = phase === 'ready' && on();
  if (phase === 'ready' && state.mode === 'playing' && !world.player.dead) {
    charge += (inside ? dt / PAD.hold : -dt * PAD.decay / PAD.hold);
    charge = Math.min(1, Math.max(0, charge));
    if (charge >= 1) openDoors();
  }
  hum(inside);
  paintRing();
  spin(dt);

  carry(dt);
  updateArrow(inside);

  // Latched, not consumed: the loop only acts on this inside a playing frame, so
  // a pad that finishes while the game is paused has to still be finished when
  // the player comes back. park() is what clears it.
  return finished;
}
