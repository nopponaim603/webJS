import * as THREE from 'three';
import { CFG } from '../config/index.js';
import * as modules from '../modules/index.js';
import * as floaters from '../ui/floaters.js';
import * as drone from '../allies/drone.js';
import * as health from '../character/health.js';
import { state } from '../core/world.js';

const _at = new THREE.Vector3();

// An effect that does nothing but wait out its own clock: what it is worth is
// read off its state by whoever cares, so its step has only the seconds to keep.
const countdown = (p, s, dt) => (s.left -= dt) > 0;

// What every state carries whatever it does: the clock the bar draws, and what
// the readout calls it. `scaled` adds the one number its item is tuned by, read
// off the item rather than written beside it so the two cannot drift apart.
const timed = (item) => ({ left: item.seconds, span: item.seconds,
                           name: item.name, hint: item.hint(item),
                           color: item.color });
const scaled = (item) => ({ ...timed(item), mult: item.mult });

// A `step` that answers false is an effect that has run out, and the player is
// rid of it the same frame. `onDamage` is asked the same question by the one
// place that ever takes health off the player.
const EFFECTS = {
  regen: {
    // A share of the bar handed over across a stretch of seconds, rather than a
    // rate that runs until something stops it: what the item is worth is the
    // share, and the seconds are what make it a thing you have to survive.
    start: (item) => ({ ...timed(item), perSecond: item.share / item.seconds,
                        tick: 0, paid: 0 }),

    step(p, s, dt) {
      const span = Math.min(dt, s.left);
      // A full bar stops the healing, not the effect: the readout runs its full
      // span either way, so taking one at full health is plainly a thing that
      // happened rather than a pickup that vanished.
      s.paid += health.heal(p, modules.maxHealth() * s.perSecond * span);
      s.left -= span;
      s.tick += span;

      // Once a second rather than once a frame: sixty floats a second reads as
      // noise, and one reads as a pulse. The last of them is paid out as the
      // effect ends, so a run that stops mid-second still shows what it gave.
      const done = s.left <= 0;
      if (s.tick >= 1 || done) {
        if (s.paid >= 0.5) {
          _at.set(p.pos.x, CFG.player.height * 1.05, p.pos.z);
          floaters.heal(_at, Math.round(s.paid));
        }
        s.tick = done ? 0 : s.tick - 1;
        s.paid = 0;
      }
      return !done;
    },

    onDamage: () => false,
  },

  // A field carried on the player rather than a thing done to them: what it pays
  // out goes to the machines standing in it, a share of each one's own plating a
  // second. Taking a hit does not stop it — it is not the player being mended.
  mend: {
    start: (item) => ({ ...timed(item), perSecond: item.perSecond,
                        radius: item.radius, tick: 0, paid: new Map() }),

    step(p, s, dt) {
      const span = Math.min(dt, s.left);
      for (const d of drone.list()) {
        if (Math.hypot(d.pos.x - p.pos.x, d.pos.z - p.pos.z) > s.radius) continue;
        const gain = drone.mend(d, d.hpMax * s.perSecond * span);
        if (gain > 0) s.paid.set(d, (s.paid.get(d) || 0) + gain);
      }

      s.left -= span;
      s.tick += span;

      // Once a second a machine, the way the medkit pulses over the player: a
      // float a frame would be a smear rather than a number.
      const done = s.left <= 0;
      if (s.tick >= 1 || done) {
        for (const [d, paid] of s.paid) {
          if (paid >= 0.5) floaters.mend(d.pos, Math.round(paid));
        }
        s.tick = done ? 0 : s.tick - 1;
        s.paid.clear();
      }
      return !done;
    },

    onDamage: () => true,
  },

  // A flight called up for the length of its clock. Counted off the machines the
  // player owns rather than the ones still flying, so a flight shot to pieces is
  // answered in full — and the ones it calls keep no slot, so what happens to
  // them is written down nowhere and nothing of them is carried to the next wave.
  support: {
    start: (item) => ({ ...timed(item), keep: !!item.keep,
                        called: drone.callIn(item.count, !!item.entry) }),

    // Stacks rather than restarting: what the first beacon called up is still in
    // the air, so a second one is another machine and a fresh clock over both.
    again(p, s, item) {
      s.called.push(...drone.callIn(item.count, !!item.entry));
      s.left = item.seconds;
      s.span = item.seconds;
    },

    step(p, s, dt) {
      s.left -= dt;
      return s.left > 0;
    },

    // What was lent goes home when the clock does; what was given stays until
    // the round takes it, which is what `keep` is for.
    end: (p, s) => { if (!s.keep) drone.dismiss(s.called); },

    onDamage: () => true,
  },

  damage: { start: scaled, step: countdown, onDamage: () => true },
  speed: { start: scaled, step: countdown, onDamage: () => true },
  rate: { start: scaled, step: countdown, onDamage: () => true },
  pay: { start: scaled, step: countdown, onDamage: () => true },
  soak: { start: scaled, step: countdown, onDamage: () => true },
  invuln: { start: timed, step: countdown, onDamage: () => true },
  energy: { start: timed, step: countdown, onDamage: () => true },
  ammo: { start: timed, step: countdown, onDamage: () => true },
};

// One state an effect, so a second helping taken mid-effect refreshes the clock
// rather than squaring what the first one was already paying.
function multOf(p, name) {
  const s = p && p.effects.get(name);
  return s ? s.mult : 1;
}

// What everything the player's side deals is multiplied by.
export const damageMult = (p) => multOf(p, 'damage');

// The player's own movement, the dash it buys included.
export const speedMult = (p) => multOf(p, 'speed');

// How fast every gun in the rack cycles. The charges it burns through are not
// paid for by this — a faster gun empties the rack faster, and that is the whole
// of what the item costs.
export const rateMult = (p) => multOf(p, 'rate');

// What is left of a hit by the time it reaches the bar, after the plating the
// modules bought has already had its share.
export const takenMult = (p) => multOf(p, 'soak');

// What a kill is worth in coins. The one thing an item pays out that is still
// there once its clock has run down.
export const payMult = (p) => multOf(p, 'pay');

// How long an item has the player covered for, and zero when none has. The dash
// keeps its own clock on the player; this is the one a pickup bought, kept apart
// so the wave ending takes it away with everything else an item was paying for.
export function covered(p) {
  const s = p && p.effects.get('invuln');
  return s ? Math.max(0, s.left) : 0;
}

// Whether the tank behind the dash and the pack is being asked to pay at all.
export const unlimitedEnergy = (p) => !!(p && p.effects.has('energy'));

// The same question of the rack: whether a shot spends a charge at all.
export const unlimitedAmmo = (p) => !!(p && p.effects.has('ammo'));

// An effect that put something into the world has to be able to take it back
// out again, and every way one ends goes through here: run out, shrugged off by
// a hit, replaced by a second helping, or cleared with the wave.
const drop = (p, name, s) => {
  EFFECTS[name].end?.(p, s);
  p.effects.delete(name);
};

// Keyed by the behaviour rather than the item, so a second Medkit picked up
// mid-effect refreshes the one running instead of stacking a rival.
export function use(p, item) {
  const kind = EFFECTS[item.effect];
  if (!kind) return;
  const live = p.effects.get(item.effect);
  // An effect that stacks takes the second helping where it stands. Everything
  // else is torn down and rebuilt, so the clock restarts rather than squaring
  // what the first one was already paying.
  if (live && kind.again) { kind.again(p, live, item); return; }
  if (live) drop(p, item.effect, live);
  p.effects.set(item.effect, kind.start(item));
}

export function step(p, dt) {
  for (const [name, s] of p.effects) {
    if (!EFFECTS[name].step(p, s, dt)) drop(p, name, s);
  }
}

export function onDamage(p) {
  for (const [name, s] of p.effects) {
    if (!EFFECTS[name].onDamage(p, s)) drop(p, name, s);
  }
}

export function clear(p) {
  for (const [name, s] of p.effects) EFFECTS[name].end?.(p, s);
  p.effects.clear();
}

// Everything running on the player, for the readout to draw. A state carries
// `name`, `hint`, `color`, `left` and `span` for that: what an effect is called
// and how much of its time is left is the same question wherever it is asked.
export const active = (p) => p.effects;

// What the player should be wearing, if anything: an effect that carries a
// colour is one you can see running, and the aura paints the first it finds.
export function auraColor(p) {
  for (const s of p.effects.values()) if (s.color !== undefined) return s.color;
  return null;
}

export const healing = (p) => p.effects.has('regen');

// The ground a repair field has covered, for whatever has to draw it. Nothing
// running is nothing to draw.
export function mendField(p) {
  const s = p && p.effects.get('mend');
  return s ? { radius: s.radius, color: s.color } : null;
}
