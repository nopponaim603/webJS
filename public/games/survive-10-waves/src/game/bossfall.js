import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world } from '../core/world.js';
import { audio } from '../engine/audio.js';
import * as arena from '../arena/size.js';
import * as roster from '../bug/roster.js';
import * as coins from './coins.js';

const _eye = new THREE.Vector3();
const _spot = new THREE.Vector3();

let run = null;

export const running = () => !!run;

export function clear() { run = null; }

// Everything the boss called up goes down with it: the holes were its doing, and
// nothing it left behind outlives it. Killed by identity, since each death
// swap-pops the roster out from under any index held across the loop.
function killBrood() {
  for (const bug of world.bugs.filter((b) => b.brood)) roster.kill(bug);
}

// Counted out rather than paid as a sum, and shuffled so the two denominations
// arrive mixed instead of in two runs.
function purse(F) {
  const q = [];
  for (let i = 0; i < F.ones; i++) q.push(1);
  for (let i = 0; i < F.tens; i++) q.push(10);
  for (let i = q.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const swap = q[i]; q[i] = q[j]; q[j] = swap;
  }
  return q;
}

export function begin(at) {
  const F = CFG.bossFall;
  killBrood();
  run = { phase: 'to', t: 0, at: new THREE.Vector3(at.x, 0, at.z),
          queue: purse(F), next: 0 };
  _eye.copy(world.player.pos);
}

// Wide, and never past the rim: a coin outside the arena is a coin nobody can
// walk to.
function scatter(F) {
  const a = Math.random() * Math.PI * 2;
  const d = Math.sqrt(Math.random()) * F.spread;
  _spot.set(run.at.x + Math.cos(a) * d, 0, run.at.z + Math.sin(a) * d);

  const lim = arena.radius() - F.inset;
  const r = Math.hypot(_spot.x, _spot.z);
  if (r > lim) { _spot.x *= lim / r; _spot.z *= lim / r; }
  return _spot;
}

function pour(F, dt) {
  run.next -= dt;
  const every = F.time / Math.max(1, F.ones + F.tens);
  while (run.next <= 0 && run.queue.length) {
    const value = run.queue.pop();
    coins.payOne(scatter(F), value);
    // A hundred and fifty coins over five seconds is faster than the chime can
    // ring, so the shower is heard on the same run the magnet uses rather than
    // one voice a coin.
    const H = CFG.coins.chime;
    const chime = audio.cascade('coin', H.stagger, H.lead);
    if (chime !== null) {
      audio.playAt('coin', _spot.x, _spot.z, {
        rate: (value > 1 ? 0.92 : 1) * (1 + (Math.random() * 2 - 1) * F.detune),
        delay: chime,
      });
    }
    run.next += every;
  }
}

// Where the camera should be looking. The eye is eased rather than cut so the
// trip out and back reads as a move, and it is handed the player again the
// moment the run is over.
export function aim(fallback) { return run ? _eye : fallback; }

export function update(dt) {
  if (!run) return;
  const F = CFG.bossFall;
  run.t += dt;

  const p = world.player;
  if (p && !p.dead) {
    p.held = Math.max(p.held || 0, F.hold);
    p.invuln = Math.max(p.invuln, F.hold);
  }

  const want = run.phase === 'back' ? world.player.pos : run.at;
  _eye.lerp(want, 1 - Math.exp(-F.ease * dt));
  const there = Math.hypot(_eye.x - want.x, _eye.z - want.z) < F.arrive;

  // Each change of phase costs its own frame: `there` is measured against the
  // mark the phase was heading for, so falling straight through into the next
  // one would end the trip home the instant the pour finished.
  if (run.phase === 'to') {
    if (!there && run.t < F.travel) return;
    run.phase = 'pour';
    run.t = 0;
    return;
  }

  if (run.phase === 'pour') {
    pour(F, dt);
    if (run.queue.length) return;
    run.phase = 'back';
    run.t = 0;
    return;
  }

  if (there || run.t > F.travel) run = null;
}
