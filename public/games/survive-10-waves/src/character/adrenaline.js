import * as THREE from 'three';
import { CFG } from '../config/index.js';
import { world, state } from '../core/world.js';
import * as modules from '../modules/index.js';
import * as effects from '../items/effects.js';
import * as firing from '../weapons/firing.js';
import * as grazering from '../fx/grazering.js';
import * as floaters from '../ui/floaters.js';
import { audio } from '../engine/audio.js';
import * as motes from '../fx/bankmotes.js';

const _at = new THREE.Vector3();

// One charge banked a near miss, each keeping its own clock. A hit landing
// between two does not break the run — only a charge going cold does.
const bank = [];

const cull = () => {
  const dead = state.time - modules.adrenalineWithin();
  while (bank.length && bank[0] <= dead) bank.shift();
};

// What is banked, each charge as the share of its own clock it has left. The
// readout wants every one of them: they go cold in the order they were banked,
// not together.
const lives = [];

export function held() {
  cull();
  const life = modules.adrenalineWithin();
  lives.length = 0;
  for (const at of bank) lives.push(1 - (state.time - at) / life);
  return lives;
}

// Answers how many were already banked when this one landed, which is what the
// near miss is paid a step for. Banked whether or not Adrenaline is owned: the
// run is worth something to Nerve and Reflex on its own, and only what the guns
// do with a full one is the module's.
export function scored() {
  cull();
  const streak = bank.length;
  bank.push(state.time);

  const A = CFG.adrenaline;
  // Climbing a step a charge, so the bank can be counted with the ears alone.
  audio.play('bank', { rate: A.bankRate[Math.min(bank.length, A.bankRate.length) - 1] });
  motes.pop(bank.length);

  if (modules.adrenalineOn() && bank.length >= modules.adrenalineChain()) {
    bank.length = 0;
    fire();
  }
  return streak;
}

// Handed to the item system's own `rate` effect rather than given a clock here:
// the readout, the aura and the wave clearing all already know what to do with
// one, and a second run of near misses refreshes it the way a second Autoloader
// would.
function fire() {
  const p = world.player;
  if (!p) return;
  const A = CFG.adrenaline;
  const mult = modules.adrenalineMult();
  const share = modules.adrenalineCharge();

  const hurt = modules.adrenalineDamage();
  const seconds = modules.adrenalineSeconds();

  firing.topUpGuns(p, share);
  effects.use(p, {
    effect: 'rate', mult, seconds, name: 'Adrenaline', color: A.color,
    hint: () => `Fire rate +${Math.round((mult - 1) * 100)}%`,
  });
  effects.use(p, {
    effect: 'damage', mult: hurt, seconds, name: 'Adrenaline', color: A.color,
    hint: () => `Damage +${Math.round((hurt - 1) * 100)}%`,
  });

  grazering.pulse(p.pos.x, p.pos.z, A.span, A.color);
  audio.playAt('charged', p.pos.x, p.pos.z, { rate: A.rate });
  _at.set(p.pos.x, CFG.player.height * 1.25, p.pos.z);
  floaters.charged(_at, Math.round(share * 100));
}

export function clear() { bank.length = 0; }
