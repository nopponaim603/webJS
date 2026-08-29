import * as THREE from 'three';
import { CFG } from '../config/index.js';
import * as flinch from './flinch.js';
import { world, state } from '../core/world.js';
import { audio } from '../engine/audio.js';
import { setFlash } from './model.js';
import { separate } from './separation.js';
import * as drone from '../allies/drone.js';
import * as graze from '../character/graze.js';
import * as dodge from '../character/dodge.js';
import { wrapPi } from '../core/geom2.js';
import { between } from '../core/rng.js';
import { voiceOf } from './voice.js';
import * as arena from '../arena/size.js';
import * as fx from '../fx/spatter.js';
import * as divelane from '../fx/divelane.js';
import * as evolve from './evolve.js';

const _sep = new THREE.Vector3();

const ease = (rate, dt) => Math.min(1, rate * dt);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Only so many may work the player at once. The rest take a circle of their own
// somewhere on the map and wait for a place to open up.
function circling(except) {
  let n = 0;
  for (const b of world.bugs) {
    if (b !== except && b.type.fly && b.alt !== undefined && !b.perch) n += 1;
  }
  return n;
}

function pickPerch(bug) {
  const lim = Math.max(bug.ring, arena.radius() - bug.ring - 2);
  const a = Math.random() * Math.PI * 2;
  const d = Math.sqrt(Math.random()) * lim;
  bug.perch = { x: Math.cos(a) * d, z: Math.sin(a) * d };
}

function claim(bug, p, dt) {
  bug.perchCd -= dt;
  if (bug.perchCd > 0) return;
  bug.perchCd = CFG.dive.perchCheck;
  if (!bug.perch || circling(bug) >= CFG.dive.onPlayer) return;
  bug.perch = null;
  bug.orbit = Math.atan2(bug.pos.z - p.pos.z, bug.pos.x - p.pos.x);
}

function init(bug, mark) {
  const D = CFG.dive;
  const p = mark.pos;

  bug.alt = 0.8;
  bug.ring = between(D.ring);
  bug.cruise = between(D.cruise);
  bug.orbit = Math.atan2(bug.pos.z - p.z, bug.pos.x - p.x);
  bug.spin = Math.random() < 0.5 ? -1 : 1;
  bug.wobble = Math.random() * 20;
  bug.phase = 'orbit';
  bug.diveCd = between(D.cooldown) * 0.7;
  bug.struck = false;
  bug.run = null;
  bug.lane = [];
  bug.pitch = 0;
  bug.bank = 0;
  bug.flap = Math.random() * Math.PI * 2;
  bug.perch = null;
  bug.perchCd = CFG.dive.perchCheck;
  if (circling(bug) >= CFG.dive.onPlayer) pickPerch(bug);
}

// Heading-based, never a straight line to the target: momentum is what lets a
// strike run on past the player and curve back into the circle by itself.
function fly(bug, wantYaw, speed, maxTurn, dt) {
  if (!bug.yawSet) { bug.yaw = wantYaw; bug.yawSet = true; }
  const turn = clamp(wrapPi(wantYaw - bug.yaw), -maxTurn * dt, maxTurn * dt);
  bug.yaw += turn;
  bug.pos.x += Math.sin(bug.yaw) * speed * dt;
  bug.pos.z += Math.cos(bug.yaw) * speed * dt;
  return turn / dt;
}

function speedOf(bug) {
  return bug.speed;
}

function orbit(bug, p, dt) {
  const D = CFG.dive;
  const speed = speedOf(bug);
  bug.wobble += dt;
  claim(bug, p, dt);

  const c = bug.perch || p.pos;
  const ring = bug.ring + Math.sin(bug.wobble * D.drift) * D.breathe;
  bug.orbit += bug.spin * D.spin * (speed / ring) * dt;

  const tx = c.x + Math.cos(bug.orbit) * ring - bug.pos.x;
  const tz = c.z + Math.sin(bug.orbit) * ring - bug.pos.z;
  const rate = fly(bug, Math.atan2(tx, tz), speed, D.turn, dt);

  const want = bug.cruise + Math.sin(bug.wobble * 1.7) * D.bob;
  const rise = want - bug.alt;
  bug.alt += rise * ease(D.climbRate, dt);
  bug.pitch += (clamp(-rise * D.tilt, -D.maxTilt, D.maxTilt) - bug.pitch) * ease(4, dt);
  bug.bank += (clamp(-rate * D.bankPer, -D.maxBank, D.maxBank) - bug.bank) * ease(5, dt);

  bug.diveCd -= dt;
  // Height and distance to run at you from: a stoop launched from close in
  // lands before you could ever answer it.
  const away = Math.hypot(p.pos.x - bug.pos.x, p.pos.z - bug.pos.z);
  if (!bug.perch && bug.diveCd <= 0 && bug.alt > bug.cruise - 1.5 && away >= D.launchMin) {
    const sweeps = bug.level >= D.sweep.at && Math.random() < D.sweep.chance;
    if (!(sweeps && curve(bug, p, away))) stoop(bug, p, away);
  }
}

// Where it leaves from and how it gets there is the same for both attacks: it
// carries on the way it was already flying, climbs, and rolls down onto the head
// of what it is about to fly, arriving on that heading rather than at that spot.
function entryTo(bug, ex, ez, tx, tz) {
  const D = CFG.dive;
  const hx = Math.sin(bug.yaw), hz = Math.cos(bug.yaw);
  const lead = D.entryRun * D.leadK, swoop = D.entryRun * D.swoopK;
  const entry = {
    sx: bug.pos.x, sy: bug.alt, sz: bug.pos.z,
    ax: bug.pos.x + hx * lead, ay: bug.alt + D.climb * 0.45, az: bug.pos.z + hz * lead,
    bx: ex - tx * swoop, by: bug.alt + D.climb, bz: ez - tz * swoop,
    ex, ey: D.strike, ez,
  };
  measure(entry);
  return entry;
}

// The ground a strike takes, which grows with the bird. The mark is drawn from
// the same number, so what is shown is what hurts rather than a width of its
// own — and the figures are sized off it, so a levelled bird draws a bigger one.
const reachOf = (bug) =>
  (bug.radius + CFG.player.radius + CFG.dive.hitPad) * evolve.laneMult(bug);

const markWide = (bug) => reachOf(bug) * 2 * CFG.dive.laneWide;

function begin(bug, run, lane) {
  bug.run = run;
  bug.lane = lane;
  bug.phase = 'dive';
  bug.struck = false;
  audio.playAt('bugAttack', bug.pos.x, bug.pos.z, voiceOf(bug.type));
}

// The line is drawn once, where you were standing, and flown as drawn — the
// lane on the ground is the promise, and it is kept.
function stoop(bug, p, away) {
  const D = CFG.dive;
  const ux = (p.pos.x - bug.pos.x) / away, uz = (p.pos.z - bug.pos.z) / away;

  // It climbs over the head of the lane and rolls down onto it, so the run
  // begins already lined up and at your height.
  const sx = bug.pos.x + ux * D.entryRun, sz = bug.pos.z + uz * D.entryRun;
  const over = D.over * evolve.laneMult(bug);
  const len = Math.max(over, away - D.entryRun) + over;

  begin(bug,
        { ux, uz, len, gone: 0, wait: D.telegraph, entry: entryTo(bug, sx, sz, ux, uz) },
        [divelane.take(sx, sz, sx + ux * len, sz + uz * len, markWide(bug))]);
}

const deg = (d) => d * Math.PI / 180;

const bend = (cx, cz, radius, from, span) =>
  ({ cx, cz, radius, from, way: Math.sign(span), len: Math.abs(span) * radius });

// Where a chain of bends is entered, and on what heading.
const headOf = (a) => ({
  x: a.cx + Math.cos(a.from) * a.radius, z: a.cz + Math.sin(a.from) * a.radius,
  tx: -Math.sin(a.from) * a.way, tz: Math.cos(a.from) * a.way,
});

// The ground actually flown, not the whole circle it is cut from: a bend that
// only clips the wall on the part it never reaches is a bend it can fly.
function flyable(bug, arcs) {
  const lim = arena.radius() - bug.radius;
  for (const a of arcs) {
    for (let i = 0; i <= 8; i++) {
      const at = a.from + a.way * (a.len / a.radius) * (i / 8);
      if (Math.hypot(a.cx + Math.cos(at) * a.radius,
                     a.cz + Math.sin(at) * a.radius) > lim) return false;
    }
  }
  return true;
}

// Part of a circle round where you are standing. Nothing on it is aimed at you:
// stand where it is drawn round and it passes you by, and the only way onto it
// is to walk there.
function ringArcs(bug, p, away) {
  const S = CFG.dive.sweep;
  const cx = p.pos.x, cz = p.pos.z;
  const grow = evolve.laneMult(bug);
  const radius = Math.min(between(S.radius) * grow,
                          Math.max(S.radius[0], away - S.gap));

  // It starts on its own bearing and carries on the way it was already circling,
  // so the arc closes round the far side rather than turning back over itself.
  const from = Math.atan2(bug.pos.z - cz, bug.pos.x - cx);
  return [bend(cx, cz, radius, from, bug.spin * deg(between(S.span)))];
}

// Two bends the other way from each other, meeting on the ground in front of
// you. The crossing is the only place either bend comes near, and it comes near
// by `pass` — so the S is flown round you rather than at you, and what it takes
// is the ground to both sides of where it brushes by.
function essArcs(bug, p) {
  const S = CFG.dive.sweep;
  // The whole figure grows together, crossing included: let the bends widen
  // without it and a levelled bird would brush past inside its own strike.
  const grow = evolve.laneMult(bug);
  const radius = between(S.essRadius) * grow;
  const at = Math.atan2(bug.pos.z - p.pos.z, bug.pos.x - p.pos.x);
  const out = { x: Math.cos(at), z: Math.sin(at) };

  const pass = between(S.pass) * grow;
  const jx = p.pos.x + out.x * pass, jz = p.pos.z + out.z * pass;
  const way = bug.spin;

  // One middle beyond the crossing and one short of it, so the two turn opposite
  // ways out of the same heading through it.
  const into = deg(between(S.essSpan)), out2 = deg(between(S.essSpan));
  return [
    bend(jx + out.x * radius, jz + out.z * radius, radius, at + Math.PI - way * into, way * into),
    bend(jx - out.x * radius, jz - out.z * radius, radius, at, -way * out2),
  ];
}

function curve(bug, p, away) {
  const D = CFG.dive, S = D.sweep;
  const ess = bug.level >= S.essAt && Math.random() < S.ess;
  const arcs = ess ? essArcs(bug, p) : ringArcs(bug, p, away);
  if (!flyable(bug, arcs)) return false;

  const head = headOf(arcs[0]);
  begin(bug,
        { arcs, len: arcs.reduce((t, a) => t + a.len, 0), gone: 0, wait: D.telegraph,
          entry: entryTo(bug, head.x, head.z, head.tx, head.tz) },
        arcs.map((a) => divelane.takeArc(a.cx, a.cz, a.radius, a.from,
                                         a.way * a.len / a.radius,
                                         markWide(bug))));
  return true;
}

const _at = new THREE.Vector3();
const _last = new THREE.Vector3();

function curveAt(e, t, out) {
  const k = 1 - t;
  const w0 = k * k * k, w1 = 3 * k * k * t, w2 = 3 * k * t * t, w3 = t * t * t;
  return out.set(w0 * e.sx + w1 * e.ax + w2 * e.bx + w3 * e.ex,
                 w0 * e.sy + w1 * e.ay + w2 * e.by + w3 * e.ey,
                 w0 * e.sz + w1 * e.az + w2 * e.bz + w3 * e.ez);
}

const ARC = 24;

// Walked by distance, not by parameter: a bend eats parameter far faster than
// it eats ground, and flying it raw makes the bird stall in the corner.
function measure(e) {
  const arc = new Float32Array(ARC + 1);
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  curveAt(e, 0, a);
  for (let i = 1; i <= ARC; i++) {
    curveAt(e, i / ARC, b);
    arc[i] = arc[i - 1] + a.distanceTo(b);
    a.copy(b);
  }
  e.arc = arc;
}

function entryAt(e, s, out) {
  const want = s * e.arc[ARC];
  let i = 1;
  while (i < ARC && e.arc[i] < want) i++;
  const span = e.arc[i] - e.arc[i - 1] || 1;
  return curveAt(e, (i - 1 + (want - e.arc[i - 1]) / span) / ARC, out);
}

function dive(bug, p, dt) {
  const D = CFG.dive;
  const r = bug.run;

  for (const mark of bug.lane) divelane.hold(mark);

  // Up and over first, then rolling down onto the head of the lane — the beat
  // you get to move is a whole wing-over, not a bird stopped in the air.
  if (r.wait > 0) {
    r.wait -= dt;
    // Eased in: it leaves the circle at the pace it was already flying and is
    // up to speed by the time it meets the lane.
    const k = Math.pow(1 - Math.max(0, r.wait) / D.telegraph, D.entryEase);
    entryAt(r.entry, k, _at);
    bug.pos.x = _at.x; bug.pos.z = _at.z; bug.alt = _at.y;

    // Steered off the curve ahead of it, and turned into it rather than onto it,
    // so leaving the circle is a bank and not a snap.
    entryAt(r.entry, Math.min(1, k + 0.05), _last);
    const dx = _last.x - _at.x, dy = _last.y - _at.y, dz = _last.z - _at.z;
    const flat = Math.hypot(dx, dz) || 1e-3;
    bug.yaw += clamp(wrapPi(Math.atan2(dx, dz) - bug.yaw), -D.entryTurn * dt, D.entryTurn * dt);
    bug.bank = bug.spin * Math.PI * 2 * k;
    bug.pitch += (clamp(-dy / flat, -1.2, 1.2) - bug.pitch) * ease(6, dt);
    return true;
  }

  const alive = r.arcs ? flyArc(bug, r, dt) : flyLine(bug, r, dt);
  if (!strike(bug, p)) return false;

  if (r.gone >= r.len) {
    graze.settle(bug.run);
    bug.phase = 'orbit';
    bug.lane = [];
    bug.diveCd = between(D.cooldown);
    bug.orbit = Math.atan2(bug.pos.z - p.pos.z, bug.pos.x - p.pos.x);
  }
  return alive;
}

// Head-high for the whole run, so standing anywhere on the lane is standing in
// front of it.
function flyLine(bug, r, dt) {
  const D = CFG.dive;
  const step = speedOf(bug) * D.speedMult * dt;
  r.gone = Math.min(r.len, r.gone + step);
  bug.pos.x += r.ux * step;
  bug.pos.z += r.uz * step;

  bug.alt = D.strike;
  bug.pitch += (0 - bug.pitch) * ease(9, dt);
  bug.bank += (0 - bug.bank) * ease(6, dt);
  return true;
}

// Walked round by ground covered rather than by angle, so a wide bend is flown
// at the same speed as a tight one and only takes longer — and a chain of them
// is walked the same way, one running into the next.
function flyArc(bug, r, dt) {
  const D = CFG.dive, S = D.sweep;
  r.gone = Math.min(r.len, r.gone + S.speed * dt);

  let left = r.gone;
  let a = r.arcs[0];
  for (const arc of r.arcs) {
    a = arc;
    if (left <= arc.len) break;
    left -= arc.len;
  }

  const at = a.from + a.way * (Math.min(left, a.len) / a.radius);
  bug.pos.x = a.cx + Math.cos(at) * a.radius;
  bug.pos.z = a.cz + Math.sin(at) * a.radius;

  bug.yaw = Math.atan2(-Math.sin(at) * a.way, Math.cos(at) * a.way);
  bug.alt = D.strike;
  bug.pitch += (0 - bug.pitch) * ease(9, dt);

  // Pinned over on one wing for as long as the bend lasts: the turn does not
  // change inside a bend, so neither does the bank, and the roll through level
  // is the only thing that says the next one goes the other way.
  const rate = a.way * S.speed / a.radius;
  bug.bank += (clamp(-rate * D.bankPer, -D.maxBank, D.maxBank) - bug.bank) * ease(5, dt);
  return true;
}

// It flies at head height by design, so what matters is the ground track.
function strike(bug, p) {
  if (bug.struck) return true;
  const ax = p.pos.x - bug.pos.x, az = p.pos.z - bug.pos.z;
  const hit = reachOf(bug);
  if (!p.drone) {
    graze.sweep(bug.run, Math.hypot(ax, az), hit, { from: bug });
    dodge.sweeping(bug.run, Math.hypot(ax, az), bug);
  }
  if (ax * ax + az * az >= hit * hit) return true;

  bug.struck = true;
  audio.playAt('bugAttack', bug.pos.x, bug.pos.z, voiceOf(bug.type));
  if (p.drone) drone.damage(p, bug.damage, true);
  else world.hooks.damagePlayer(bug.damage, { from: bug });
  fx.sparks(bug.model.object.position, 3);
  return state.mode === 'playing';
}

// Hand-posed: the primitive bird has no clips, so the flap is driven here.
function featherPose(bug, parts, diving, dt) {
  const D = CFG.dive;
  bug.flap += D.flap * (diving ? 0.35 : 1) * dt;
  const beat = Math.sin(bug.flap) * (diving ? 0.25 : 1);
  for (const w of parts.wings) {
    const s = w.userData.side;
    w.rotation.z = s * (D.dihedral + D.flapAmp * beat);
    w.rotation.y = s * (diving ? -D.tuck : 0.05 * beat);
    w.userData.elbow.rotation.z = s * (D.flapAmp * 0.6 * beat - (diving ? D.tuck : 0));
  }
  parts.tail.rotation.z = bug.bank * 0.5;
}

// Clip-driven: one clip a phase, crossfaded so a dive is entered rather than
// snapped into. The action is held on the model, which is what gets recycled.
function clipPose(parts, diving, dt) {
  const want = parts.actions[diving ? 'dive' : 'orbit'];
  if (want && want !== parts.playing) {
    if (parts.playing) parts.playing.fadeOut(CFG.dive.clipFade);
    want.reset().fadeIn(CFG.dive.clipFade).play();
    parts.playing = want;
  }
  parts.mixer.update(dt);
}

function animate(bug, dt) {
  const parts = bug.model.parts;
  const D = CFG.dive;
  const diving = bug.phase === 'dive';

  if (parts.mixer) clipPose(parts, diving, dt);
  else featherPose(bug, parts, diving, dt);

  const glow = parts.glow;
  if (!glow) return;
  const G = bug.type.glow;
  bug.pulse += dt * G.rate * (diving ? 2.2 : 1);
  const k = diving ? 1 : Math.sin(bug.pulse) ** 2;
  glow.material.opacity = G.min + (1 - G.min) * k;
  glow.scale.setScalar(parts.span * G.size * (0.82 + 0.5 * k));
}

// Put back on the circle after something else has owned its flight. Whatever it
// was diving at is over: the run it was on no longer exists.
export function toOrbit(bug) {
  const p = world.player;
  graze.forget(bug.run);
  bug.phase = 'orbit';
  bug.lane = [];
  bug.struck = false;
  bug.diveCd = between(CFG.dive.cooldown);
  bug.orbit = Math.atan2(bug.pos.z - p.pos.z, bug.pos.x - p.pos.x);
}

export function flyStep(bug, p, dt) {
  // Its circle, not its height, is what says a bird has been briefed: anything
  // that lifts a body off the ground sets `alt`, so one carried off before it
  // ever flew is put back down with a height and nothing else.
  if (bug.ring === undefined) init(bug, p);
  const obj = bug.model.object;

  if (bug.flash > 0) {
    bug.flash -= dt;
    if (bug.flash <= 0) setFlash(bug, false);
  }

  let alive = true;
  if (!world.debug.freezeBugs) {
    if (bug.phase === 'orbit') orbit(bug, p, dt);
    else alive = dive(bug, p, dt);

    separate(bug, _sep);
    bug.pos.addScaledVector(_sep, CFG.bugAnim.separationPush * dt);
    bug.pos.addScaledVector(bug.knock, dt);
    bug.knock.multiplyScalar(Math.exp(-CFG.bugAnim.knockDecay * dt));

    // Held inside the ring outright: it flies over the walls that hold everything
    // else in, so nothing else would stop it drifting out of the arena.
    const lim = arena.radius() - bug.radius;
    const r = Math.hypot(bug.pos.x, bug.pos.z);
    if (r > lim) { bug.pos.x *= lim / r; bug.pos.z *= lim / r; }
  }

  obj.position.set(bug.pos.x, bug.alt, bug.pos.z);
  obj.rotation.set(bug.pitch, bug.yaw, bug.bank);
  if (bug.shown) {
    flinch.apply(bug, obj, dt);
    animate(bug, dt);
  }
  return alive;
}
