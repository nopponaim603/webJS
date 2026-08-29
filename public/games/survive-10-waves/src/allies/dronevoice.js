import { CFG } from '../config/index.js';
import { audio } from '../engine/audio.js';
import { between } from '../core/rng.js';
import { wrapPi } from '../core/geom2.js';

// How a machine carries itself: what it says, what its lamp says with it, where
// it looks with nothing to shoot, and the way it leans on the way there. None of
// it decides anything — the flight is worked out next door, in drone.js.

// One of the turns of phrase it has for that cue, rolled fresh each time — and
// the same thing said in light, since the lamp and the voice are one utterance.
// A cue with no turns of phrase is said in light alone: turning to look is one
// machine's business, and a flight of them announcing it is just noise.
export function say(d, cue) {
  const n = CFG.drone.voice[cue];
  if (n) {
    audio.playAt(`drone${cue}${1 + ((Math.random() * n) | 0)}`, d.pos.x, d.pos.z,
                 { rate: 0.94 + Math.random() * 0.12 });
  }
  d.blink = { cue, t: 0 };
}

// The lamp: a pattern of on and off while it has something to say, and a slow
// breath the rest of the time so it never reads as dead.
export function lamp(d, D, dt) {
  const L = D.led;
  const cue = d.blink && L.cues[d.blink.cue];
  let lit = 0;
  let hue = L.rest.color;

  if (cue) {
    d.blink.t += dt;
    let t = d.blink.t;
    let on = true;
    for (const beat of cue.beats) {
      if (t < beat) break;
      t -= beat;
      on = !on;
    }
    if (d.blink.t >= cue.beats.reduce((a, c) => a + c, 0)) d.blink = null;
    else { lit = on ? 1 : L.off; hue = cue.color; }
  }

  if (!d.blink) {
    d.pulse = (d.pulse || 0) + dt * L.rest.rate;
    lit = L.rest.low + (1 - L.rest.low) * (0.5 + 0.5 * Math.sin(d.pulse)) * L.rest.lift;
  }
  d.led.material.color.setHex(hue).multiplyScalar(lit);
}

// Nothing to shoot: it turns to watch somewhere else every so often, and asks
// the horizon about it. Standing perfectly still is what a prop does.
export function guard(d, D, dt) {
  d.watch -= dt;
  if (d.watch <= 0) {
    d.watch = between(D.watch);
    d.look = Math.random() * Math.PI * 2;
    say(d, 'Lookout');
  }

  d.mutter -= dt;
  if (d.mutter <= 0) {
    d.mutter = between(D.voice.idleEvery);
    say(d, 'Idle');
  }

  face(d, d.look, D.watchTurn, dt);
}

// It turns at a rate, never instantly: an aim that snaps round is an aim that
// was never taken. Returns how far off it still is, which is what decides
// whether there is a shot to take.
export function face(d, want, rate, dt) {
  const off = wrapPi(want - d.object.rotation.y);
  const most = rate * dt;
  d.object.rotation.y += Math.max(-most, Math.min(most, off));
  return Math.abs(wrapPi(want - d.object.rotation.y));
}

// Nothing that hovers moves flat: it leans the way it is going, since leaning
// is how it goes there at all. Read off velocity in its own frame — nose down
// for forward, low wing into the turn — and scaled by how much of its speed it
// is using, so a drift is a lean and a dash is a dive.
export function bank(d, D, dt) {
  const T = D.tilt;
  const yaw = d.object.rotation.y;
  const fwd = d.vel.z * Math.cos(yaw) + d.vel.x * Math.sin(yaw);
  const side = d.vel.x * Math.cos(yaw) - d.vel.z * Math.sin(yaw);
  const k = 1 - Math.exp(-T.ease * dt);

  d.pitch += (T.most * (fwd / D.speed) - d.pitch) * k;
  d.roll += (-T.most * (side / D.speed) - d.roll) * k;
  d.object.rotation.x = d.pitch;
  d.object.rotation.z = d.roll;
}

